/**
 * services/spend.service.ts
 * Aggregation logic for procurement spend analytics.
 */

import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../config/dynamo.js'
import { env } from '../config/env.js'
import type {
  PurchaseOrderItem,
  SupplierItem,
  AlertItem,
  SavingsRecommendationItem,
} from '../db/types.js'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface DateRangeFilter {
  startDate?: string
  endDate?: string
  organizationId?: string
  supplierId?: string
}

export interface PaginationParams {
  limit: number
  offset: number
}

// ── Response types (match frontend SpendSummary / SpendTrend) ─────────────────

export interface SpendTrend {
  date: string   // YYYY-MM-DD
  amount: number
}

export interface CategorySpend {
  category: string
  amount: number
  percentage: number
  changePercent: number
}

export interface MappedSupplier {
  id: string
  name: string
  category: string
  reliabilityScore: number
  competitivenessScore: number
  riskScore: number
  relationshipScore: number
  recommendation: string
  createdAt: string
  updatedAt: string
}

export interface SpendSummaryResponse {
  totalSpend: number
  previousPeriodSpend: number
  changePercent: number
  activeSuppliers: number
  openAlerts: number
  savingsIdentified: number
  trends: SpendTrend[]
  categoryBreakdown: CategorySpend[]
  topSuppliers: Array<{ supplier: MappedSupplier; totalSpend: number; percentage: number }>
}

// Legacy response types (used by trends/categories/suppliers sub-endpoints)
export interface MonthlyTrend {
  month: string
  totalSpend: number
  orderCount: number
  avgOrderValue: number
}

export interface SpendTrendsResponse {
  trends: MonthlyTrend[]
  currency: string
  period: { startDate: string; endDate: string }
}

export interface SpendCategoriesResponse {
  categories: Array<{
    category: string
    totalSpend: number
    orderCount: number
    lineItemCount: number
    percentage: number
  }>
  totalSpend: number
  currency: string
  period: { startDate: string; endDate: string }
}

export interface SupplierSpend {
  supplierId: string
  totalSpend: number
  orderCount: number
  avgOrderValue: number
  lastOrderDate: string
}

export interface SpendSuppliersResponse {
  suppliers: SupplierSpend[]
  pagination: { limit: number; offset: number; total: number }
  currency: string
  period: { startDate: string; endDate: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function toYearMonth(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function mapSupplier(s: SupplierItem): MappedSupplier {
  return {
    id: s.supplierId,
    name: s.name,
    category: s.category,
    reliabilityScore: s.reliabilityScore,
    competitivenessScore: s.competitivenessScore,
    riskScore: s.riskScore,
    relationshipScore: s.relationshipScore,
    recommendation: s.recommendation,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

// ── DynamoDB fetchers ─────────────────────────────────────────────────────────

async function fetchOrders(
  organizationId: string,
  startDate: string,
  endDate: string,
): Promise<PurchaseOrderItem[]> {
  const items: PurchaseOrderItem[] = []
  let lastKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_PURCHASE_ORDERS_TABLE,
        IndexName: 'organizationId-orderDate-index',
        KeyConditionExpression:
          'organizationId = :orgId AND orderDate BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':orgId': organizationId,
          ':start': startDate,
          ':end': endDate,
        },
        ExclusiveStartKey: lastKey,
      }),
    )
    for (const item of result.Items ?? []) items.push(item as PurchaseOrderItem)
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  return items
}

async function scanAllOrders(startDate: string, endDate: string): Promise<PurchaseOrderItem[]> {
  const items: PurchaseOrderItem[] = []
  let lastKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: env.DYNAMODB_PURCHASE_ORDERS_TABLE,
        FilterExpression: 'orderDate BETWEEN :start AND :end',
        ExpressionAttributeValues: { ':start': startDate, ':end': endDate },
        ExclusiveStartKey: lastKey,
      }),
    )
    for (const item of result.Items ?? []) items.push(item as PurchaseOrderItem)
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  return items
}

async function fetchSuppliers(organizationId: string): Promise<SupplierItem[]> {
  const items: SupplierItem[] = []
  let lastKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_SUPPLIERS_TABLE,
        IndexName: 'organizationId-index',
        KeyConditionExpression: 'organizationId = :orgId',
        ExpressionAttributeValues: { ':orgId': organizationId },
        ExclusiveStartKey: lastKey,
      }),
    )
    for (const item of result.Items ?? []) items.push(item as SupplierItem)
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  return items
}

async function fetchOpenAlertsCount(organizationId: string): Promise<number> {
  const items: AlertItem[] = []
  let lastKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_ALERTS_TABLE,
        IndexName: 'organizationId-createdAt-index',
        KeyConditionExpression: 'organizationId = :orgId',
        FilterExpression: '#s = :open OR #s = :ack',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':orgId': organizationId,
          ':open': 'OPEN',
          ':ack': 'ACKNOWLEDGED',
        },
        ExclusiveStartKey: lastKey,
      }),
    )
    for (const item of result.Items ?? []) items.push(item as AlertItem)
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  return items.length
}

async function fetchSavingsIdentified(organizationId: string): Promise<number> {
  const items: SavingsRecommendationItem[] = []
  let lastKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE,
        IndexName: 'organizationId-createdAt-index',
        KeyConditionExpression: 'organizationId = :orgId',
        FilterExpression: '#s <> :rejected',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':orgId': organizationId,
          ':rejected': 'REJECTED',
        },
        ExclusiveStartKey: lastKey,
      }),
    )
    for (const item of result.Items ?? []) items.push(item as SavingsRecommendationItem)
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  return items.reduce((sum, r) => sum + (r.estimatedAnnualSavings ?? 0), 0)
}

function resolveDateRange(filter: DateRangeFilter): { startDate: string; endDate: string } {
  return {
    endDate: filter.endDate ?? new Date().toISOString().slice(0, 10),
    startDate: filter.startDate ?? monthsAgo(12),
  }
}

async function getOrders(filter: DateRangeFilter): Promise<PurchaseOrderItem[]> {
  const { startDate, endDate } = resolveDateRange(filter)
  if (filter.organizationId) return fetchOrders(filter.organizationId, startDate, endDate)
  return scanAllOrders(startDate, endDate)
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function getSpendSummary(filter: DateRangeFilter): Promise<SpendSummaryResponse> {
  const { startDate, endDate } = resolveDateRange(filter)

  // Compute previous period (same duration, immediately before startDate)
  const periodMs = new Date(endDate).getTime() - new Date(startDate).getTime()
  const prevEnd = new Date(new Date(startDate).getTime() - 86_400_000).toISOString().slice(0, 10)
  const prevStart = new Date(new Date(startDate).getTime() - periodMs - 86_400_000).toISOString().slice(0, 10)

  const orgId = filter.organizationId ?? ''

  // Parallel fetch
  const [orders, prevOrders, suppliers, openAlerts, savingsIdentified] = await Promise.all([
    getOrders(filter),
    orgId ? fetchOrders(orgId, prevStart, prevEnd) : Promise.resolve([]),
    orgId ? fetchSuppliers(orgId) : Promise.resolve([]),
    orgId ? fetchOpenAlertsCount(orgId) : Promise.resolve(0),
    orgId ? fetchSavingsIdentified(orgId) : Promise.resolve(0),
  ])

  // Build supplier map for joins
  const supplierMap = new Map(suppliers.map((s) => [s.supplierId, s]))

  // Current period aggregations
  const totalSpend = Math.round(orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0) * 100) / 100
  const previousPeriodSpend = Math.round(prevOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0) * 100) / 100
  const changePercent = previousPeriodSpend !== 0
    ? Math.round(((totalSpend - previousPeriodSpend) / previousPeriodSpend) * 10000) / 100
    : 0

  // Active suppliers (unique supplierIds with orders in period)
  const activeSupplierIds = new Set(orders.map((o) => o.supplierId))
  const activeSuppliers = activeSupplierIds.size

  // Daily trends (fill every day in range with spend or 0)
  const dailyMap = new Map<string, number>()
  for (const o of orders) {
    const day = o.orderDate.slice(0, 10)
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + (o.totalAmount ?? 0))
  }
  // Fill all days in range
  const trends: SpendTrend[] = []
  const cursor = new Date(startDate)
  const endD = new Date(endDate)
  while (cursor <= endD) {
    const day = cursor.toISOString().slice(0, 10)
    trends.push({ date: day, amount: Math.round((dailyMap.get(day) ?? 0) * 100) / 100 })
    cursor.setDate(cursor.getDate() + 1)
  }

  // Category breakdown (from line items)
  const catMap = new Map<string, { current: number; prev: number }>()
  for (const o of orders) {
    for (const li of o.lineItems ?? []) {
      const cat = li.category || 'OTHER'
      const entry = catMap.get(cat) ?? { current: 0, prev: 0 }
      entry.current += li.totalPrice ?? 0
      catMap.set(cat, entry)
    }
  }
  // Previous period categories for changePercent
  for (const o of prevOrders) {
    for (const li of o.lineItems ?? []) {
      const cat = li.category || 'OTHER'
      const entry = catMap.get(cat) ?? { current: 0, prev: 0 }
      entry.prev += li.totalPrice ?? 0
      catMap.set(cat, entry)
    }
  }
  const categoryBreakdown: CategorySpend[] = Array.from(catMap.entries())
    .map(([category, { current, prev }]) => ({
      category,
      amount: Math.round(current * 100) / 100,
      percentage: totalSpend > 0 ? Math.round((current / totalSpend) * 10000) / 100 : 0,
      changePercent: prev !== 0 ? Math.round(((current - prev) / prev) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Top suppliers (by spend in period, joined with supplier data)
  const supSpendMap = new Map<string, number>()
  for (const o of orders) {
    supSpendMap.set(o.supplierId, (supSpendMap.get(o.supplierId) ?? 0) + (o.totalAmount ?? 0))
  }
  const topSuppliers = Array.from(supSpendMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([supplierId, spend]) => {
      const s = supplierMap.get(supplierId)
      const supplier: MappedSupplier = s
        ? mapSupplier(s)
        : {
            id: supplierId,
            name: supplierId,
            category: 'OTHER',
            reliabilityScore: 0,
            competitivenessScore: 0,
            riskScore: 0,
            relationshipScore: 0,
            recommendation: 'RENEW',
            createdAt: '',
            updatedAt: '',
          }
      return {
        supplier,
        totalSpend: Math.round(spend * 100) / 100,
        percentage: totalSpend > 0 ? Math.round((spend / totalSpend) * 10000) / 100 : 0,
      }
    })

  return {
    totalSpend,
    previousPeriodSpend,
    changePercent,
    activeSuppliers,
    openAlerts,
    savingsIdentified: Math.round(savingsIdentified * 100) / 100,
    trends,
    categoryBreakdown,
    topSuppliers,
  }
}

export async function getSpendTrends(filter: DateRangeFilter): Promise<SpendTrend[]> {
  const { startDate, endDate } = resolveDateRange(filter)
  let orders = await getOrders(filter)

  if (filter.supplierId) {
    orders = orders.filter((o) => o.supplierId === filter.supplierId)
  }

  const dailyMap = new Map<string, number>()
  for (const o of orders) {
    const day = o.orderDate.slice(0, 10)
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + (o.totalAmount ?? 0))
  }

  const trends: SpendTrend[] = []
  const cursor = new Date(startDate)
  const endD = new Date(endDate)
  while (cursor <= endD) {
    const day = cursor.toISOString().slice(0, 10)
    trends.push({ date: day, amount: Math.round((dailyMap.get(day) ?? 0) * 100) / 100 })
    cursor.setDate(cursor.getDate() + 1)
  }

  return trends
}

export async function getSpendByCategories(
  filter: DateRangeFilter,
): Promise<SpendCategoriesResponse> {
  const { startDate, endDate } = resolveDateRange(filter)
  const orders = await getOrders(filter)

  const catMap = new Map<string, { spend: number; orderIds: Set<string>; lineItemCount: number }>()
  for (const o of orders) {
    for (const li of o.lineItems ?? []) {
      const cat = li.category || 'Uncategorized'
      const entry = catMap.get(cat) ?? { spend: 0, orderIds: new Set(), lineItemCount: 0 }
      entry.spend += li.totalPrice ?? 0
      entry.orderIds.add(o.orderId)
      entry.lineItemCount++
      catMap.set(cat, entry)
    }
  }

  const totalSpend = Array.from(catMap.values()).reduce((s, e) => s + e.spend, 0)
  const categories = Array.from(catMap.entries())
    .map(([category, { spend, orderIds, lineItemCount }]) => ({
      category,
      totalSpend: Math.round(spend * 100) / 100,
      orderCount: orderIds.size,
      lineItemCount,
      percentage: totalSpend > 0 ? Math.round((spend / totalSpend) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)

  return { categories, totalSpend: Math.round(totalSpend * 100) / 100, currency: 'USD', period: { startDate, endDate } }
}

export async function getSpendBySuppliers(
  filter: DateRangeFilter,
  pagination: PaginationParams,
): Promise<SpendSuppliersResponse> {
  const { startDate, endDate } = resolveDateRange(filter)
  const orders = await getOrders(filter)

  const supMap = new Map<string, { spend: number; count: number; lastDate: string }>()
  for (const o of orders) {
    const entry = supMap.get(o.supplierId) ?? { spend: 0, count: 0, lastDate: o.orderDate }
    entry.spend += o.totalAmount ?? 0
    entry.count++
    if (o.orderDate > entry.lastDate) entry.lastDate = o.orderDate
    supMap.set(o.supplierId, entry)
  }

  const allSuppliers: SupplierSpend[] = Array.from(supMap.entries())
    .map(([supplierId, { spend, count, lastDate }]) => ({
      supplierId,
      totalSpend: Math.round(spend * 100) / 100,
      orderCount: count,
      avgOrderValue: count > 0 ? Math.round((spend / count) * 100) / 100 : 0,
      lastOrderDate: lastDate,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)

  const total = allSuppliers.length
  const suppliers = allSuppliers.slice(pagination.offset, pagination.offset + pagination.limit)

  return { suppliers, pagination: { limit: pagination.limit, offset: pagination.offset, total }, currency: 'USD', period: { startDate, endDate } }
}
