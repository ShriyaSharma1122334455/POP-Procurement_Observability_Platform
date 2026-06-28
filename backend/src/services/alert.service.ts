/**
 * services/alert.service.ts
 * Business logic for alert management.
 */

import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { docClient } from '../config/dynamo.js'
import { env } from '../config/env.js'
import type { AlertItem, AlertSeverity, AlertStatus, AlertType } from '../db/types.js'

export interface CreateAlertInput {
  type: AlertType
  severity: AlertSeverity
  message: string
  supplierId?: string
  organizationId: string
  title?: string
}

export async function listAlerts(
  organizationId: string,
  status?: AlertStatus,
  severity?: AlertSeverity
): Promise<AlertItem[]> {
  const items: AlertItem[] = []
  let lastKey: Record<string, unknown> | undefined

  // Build filter expression if status or severity are specified
  let filterExpression: string | undefined
  const expressionAttributeValues: Record<string, unknown> = {
    ':orgId': organizationId,
  }

  const filters: string[] = []
  if (status) {
    filters.push('#status = :status')
    expressionAttributeValues[':status'] = status.toUpperCase()
  }
  if (severity) {
    filters.push('severity = :severity')
    expressionAttributeValues[':severity'] = severity.toUpperCase()
  }

  if (filters.length > 0) {
    filterExpression = filters.join(' AND ')
  }

  const expressionAttributeNames: Record<string, string> = {}
  if (status) {
    expressionAttributeNames['#status'] = 'status'
  }

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_ALERTS_TABLE,
        IndexName: 'organizationId-createdAt-index',
        KeyConditionExpression: 'organizationId = :orgId',
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExclusiveStartKey: lastKey,
      })
    )

    for (const item of result.Items ?? []) {
      items.push(item as AlertItem)
    }
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  // Sort descending by createdAt since organizationId-createdAt-index default is ascending
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createAlert(input: CreateAlertInput): Promise<AlertItem> {
  const now = new Date().toISOString()
  const title = input.title ?? `${input.type.replace(/_/g, ' ')} Alert`

  const alertItem: AlertItem = {
    alertId: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'OPEN',
    severity: input.severity.toUpperCase() as AlertSeverity,
    type: input.type.toUpperCase() as AlertType,
    organizationId: input.organizationId,
    title: title.charAt(0).toUpperCase() + title.slice(1).toLowerCase(),
    description: input.message,
    affectedEntityId: input.supplierId,
    affectedEntityType: input.supplierId ? 'SUPPLIER' : undefined,
  }

  await docClient.send(
    new PutCommand({
      TableName: env.DYNAMODB_ALERTS_TABLE,
      Item: alertItem,
    })
  )

  return alertItem
}
