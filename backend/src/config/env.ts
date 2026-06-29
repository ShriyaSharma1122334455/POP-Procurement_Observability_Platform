/**
 * config/env.ts
 * Centralised, validated environment config.
 * Throws at startup if required vars are missing so failures are loud and early.
 */

function require(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required environment variable: ${name}`)
  return val
}

export const env = {
  // Server
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  PORT: Number(process.env['PORT'] ?? 3000),

  // JWT
  JWT_SECRET: require('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '8h',

  // AWS / DynamoDB
  AWS_REGION: process.env['AWS_REGION'] ?? 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env['AWS_ACCESS_KEY_ID'],
  AWS_SECRET_ACCESS_KEY: process.env['AWS_SECRET_ACCESS_KEY'],
  DYNAMODB_ENDPOINT: process.env['DYNAMODB_ENDPOINT'],

  // Table names
  DYNAMODB_USERS_TABLE:
    process.env['DYNAMODB_USERS_TABLE'] ?? 'pop-dev-users',
  DYNAMODB_PURCHASE_ORDERS_TABLE:
    process.env['DYNAMODB_PURCHASE_ORDERS_TABLE'] ?? 'pop-dev-purchase-orders',
  DYNAMODB_SUPPLIERS_TABLE:
    process.env['DYNAMODB_SUPPLIERS_TABLE'] ?? 'pop-dev-suppliers',
  DYNAMODB_ALERTS_TABLE:
    process.env['DYNAMODB_ALERTS_TABLE'] ?? 'pop-dev-alerts',
  DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE:
    process.env['DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE'] ?? 'pop-dev-savings-recommendations',

  // AI Services
  AI_SERVICE_URL: process.env['AI_SERVICE_URL'] ?? 'http://localhost:8000',
} as const
