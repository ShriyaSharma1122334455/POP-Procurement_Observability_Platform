/**
 * config/dynamo.ts
 * Singleton DynamoDB DocumentClient shared across services.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { env } from './env.js'

const rawClient = new DynamoDBClient({
  region: env.AWS_REGION,
  ...(env.DYNAMODB_ENDPOINT ? { endpoint: env.DYNAMODB_ENDPOINT } : {}),
})

export const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
})
