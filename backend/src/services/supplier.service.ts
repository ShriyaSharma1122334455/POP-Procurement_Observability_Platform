/**
 * services/supplier.service.ts
 * Business logic for supplier management.
 */

import { QueryCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { docClient } from '../config/dynamo.js'
import { env } from '../config/env.js'
import type { SupplierItem, SupplierCategory } from '../db/types.js'

export interface CreateSupplierInput {
  name: string
  category: SupplierCategory
  contactEmail: string
  contactPhone?: string
  website?: string
  country?: string
  contractExpiry?: string
  organizationId: string
}

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierItem> {
  const now = new Date().toISOString()
  const item: SupplierItem = {
    supplierId: randomUUID(),
    name: input.name,
    category: input.category,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    website: input.website || undefined,
    country: input.country ?? 'US',
    contractExpiry: input.contractExpiry || undefined,
    organizationId: input.organizationId,
    reliabilityScore: 50,
    competitivenessScore: 50,
    riskScore: 50,
    relationshipScore: 50,
    recommendation: 'NEGOTIATE',
    totalSpendYTD: 0,
    currency: 'USD',
    tags: [],
    createdAt: now,
    updatedAt: now,
  }

  await docClient.send(new PutCommand({
    TableName: env.DYNAMODB_SUPPLIERS_TABLE,
    Item: item,
  }))

  return item
}

export async function listSuppliers(
  organizationId: string,
  category?: SupplierCategory,
  search?: string
): Promise<SupplierItem[]> {
  const items: SupplierItem[] = []
  let lastKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_SUPPLIERS_TABLE,
        IndexName: 'organizationId-index',
        KeyConditionExpression: 'organizationId = :orgId',
        ExpressionAttributeValues: {
          ':orgId': organizationId,
        },
        ExclusiveStartKey: lastKey,
      })
    )

    for (const item of result.Items ?? []) {
      items.push(item as SupplierItem)
    }
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  let result = items
  if (category) {
    result = result.filter((s) => s.category?.toUpperCase() === category.toUpperCase())
  }
  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)
    )
  }

  return result
}

export async function getSupplierById(
  supplierId: string,
  organizationId: string
): Promise<SupplierItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: env.DYNAMODB_SUPPLIERS_TABLE,
      Key: { supplierId },
    })
  )

  const supplier = result.Item as SupplierItem | undefined
  if (!supplier) {
    return null
  }

  // Multi-tenant check
  if (supplier.organizationId !== organizationId) {
    const err = new Error('Forbidden: Access denied to this supplier') as Error & {
      statusCode: number
    }
    err.statusCode = 403
    throw err
  }

  return supplier
}
