/**
 * services/supplier.service.ts
 * Business logic for supplier management.
 */

import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../config/dynamo.js'
import { env } from '../config/env.js'
import type { SupplierItem, SupplierCategory } from '../db/types.js'

export async function listSuppliers(
  organizationId: string,
  category?: SupplierCategory
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

  if (category) {
    return items.filter(
      (item) => item.category?.toUpperCase() === category.toUpperCase()
    )
  }

  return items
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
