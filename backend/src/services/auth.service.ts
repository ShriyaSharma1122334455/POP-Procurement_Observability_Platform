/**
 * services/auth.service.ts
 * Business logic for registration, login, and user lookup.
 * Keeps all DynamoDB access in one place — controllers stay thin.
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { docClient } from '../config/dynamo.js'
import { env } from '../config/env.js'
import type { UserItem, UserRole } from '../db/types.js'

// ── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string
  password: string
  name: string
  role?: UserRole
  organizationId?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface JwtPayload {
  sub: string        // userId
  email: string
  role: UserRole
  organizationId: string
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  user: Omit<UserItem, 'passwordHash'>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12

/** Strips the password hash before returning user data to callers. */
function sanitizeUser(user: UserItem): Omit<UserItem, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safe } = user
  return safe
}

function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

// ── DynamoDB helpers ──────────────────────────────────────────────────────────

/**
 * Look up a user by email via the GSI (email-index).
 * Assumes the Users table has a GSI on `email` (partition key).
 */
async function getUserByEmail(email: string): Promise<UserItem | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
      Limit: 1,
    }),
  )
  return (result.Items?.[0] as UserItem) ?? null
}

async function getUserById(userId: string): Promise<UserItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      Key: { userId },
    }),
  )
  return (result.Item as UserItem) ?? null
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function register(input: RegisterInput): Promise<AuthTokens> {
  const email = input.email.toLowerCase().trim()

  // 1. Check uniqueness
  const existing = await getUserByEmail(email)
  if (existing) {
    const err = new Error('Email already registered') as Error & { statusCode: number }
    err.statusCode = 409
    throw err
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

  // 3. Build user item
  const now = new Date().toISOString()
  const user: UserItem = {
    userId: randomUUID(),
    email,
    name: input.name.trim(),
    role: input.role ?? 'VIEWER',
    organizationId: input.organizationId ?? 'default',
    passwordHash,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }

  // 4. Persist
  await docClient.send(
    new PutCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      Item: user,
      // Prevent overwriting if a race created the same userId (UUID collision ~impossible but safe)
      ConditionExpression: 'attribute_not_exists(userId)',
    }),
  )

  // 5. Return token + sanitized user
  const accessToken = signToken({
    sub: user.userId,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  })

  return { accessToken, user: sanitizeUser(user) }
}

export async function login(input: LoginInput): Promise<AuthTokens> {
  const email = input.email.toLowerCase().trim()

  // 1. Fetch user
  const user = await getUserByEmail(email)
  if (!user) {
    const err = new Error('Invalid email or password') as Error & { statusCode: number }
    err.statusCode = 401
    throw err
  }

  // 2. Verify active
  if (!user.isActive) {
    const err = new Error('Account is disabled') as Error & { statusCode: number }
    err.statusCode = 403
    throw err
  }

  // 3. Compare password (constant-time via bcrypt)
  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) {
    const err = new Error('Invalid email or password') as Error & { statusCode: number }
    err.statusCode = 401
    throw err
  }

  // 4. Update lastLoginAt (fire-and-forget — don't block the response)
  docClient.send(
    new PutCommand({
      TableName: env.DYNAMODB_USERS_TABLE,
      Item: { ...user, lastLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    }),
  ).catch(() => { /* non-critical */ })

  const accessToken = signToken({
    sub: user.userId,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  })

  return { accessToken, user: sanitizeUser(user) }
}

export async function getProfile(userId: string): Promise<Omit<UserItem, 'passwordHash'>> {
  const user = await getUserById(userId)
  if (!user) {
    const err = new Error('User not found') as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }
  return sanitizeUser(user)
}
