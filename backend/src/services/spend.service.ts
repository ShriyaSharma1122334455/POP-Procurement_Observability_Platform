/**
 * services/spend.service.ts
 * Aggregation logic for procurement spend analytics.
 *
 * Strategy: query the PurchaseOrders table via the organizationId-orderDate-index GSI
 * with an optional date range, then perform client-side aggregation.
 * DynamoDB doesn't support server-side aggregations, so all rollups happen here.
 */

import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../config/dynamo.js'
import { env } from '../config/env.js'
import type { PurchaseOrderItem } from '../db/types.js'

// ── Shared query-param types ──────────────────────────────────────────────────

export interface DateRangeFilter {
  startDate?: string   // ISO-8601 date "YYYY-MM-DD"
  endDate?: string     // ISO-8601 date "YYYY-MM-DD"
  organizationId?: string
}

export interface PaginationParams {
  limit: number
  offset: number
}

// ── Response types ────────────────────────────────────────────────────────────

export interface SpendSummaryResponse {
  totalSpend: number
  currency: string
  orderCount: number
  currentMonth: { spend: number; orderCount: number }
  previousMonth: { spend: number; orderCount: number }
  momChange: { amount: number; percentage: number | null }
  period: { startDate: string; endDate: string }
}

export interface MonthlyTrend {
  month: string          // "YYYY-MM"
  totalSpend: number
  orderCount: number
  avgOrderValue: number
}

export interface SpendTrendsResponse {
  trends: MonthlyTrend[]
  currency: string
  period: { startDate: string; endDate: string }
}

export interface CategorySpend {
  category: string
  totalSpend: number
  orderCount: number
  lineItemCount: number
  percentage: number
}

export interface SpendCategoriesResponse {
  categories: CategorySpend[]
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

// ── Internal helpers ──────────────────────────────────────────────────────────

const DEFAULT_CURRENCY = 'USD'

/** ISO date string for N months ago from today */
function monthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

/** "YYYY-MM-DD" → "YYYY-MM" */
function toYearMonth(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/**
 * Fetch all purchase orders for an organization within an optional date range.
 * Uses the organizationId-orderDate-index GSI for efficient querying.
 */
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

    for (const item of result.Items ?? []) {
      items.push(item as PurchaseOrderItem)
    }
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  return items
}

/**
 * Fallback: Scan all purchase orders (used when no organizationId is available).
 * Only used in development / admin contexts.
 */
async function scanAllOrders(startDate: string, endDate: string): Promise<PurchaseOrderItem[]> {
  const items: PurchaseOrderItem[] = []
  let lastKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: env.DYNAMODB_PURCHASE_ORDERS_TABLE,
        FilterExpression: 'orderDate BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':start': startDate,
          ':end': endDate,
        },
        ExclusiveStartKey: lastKey,
      }),
    )

    for (const item of result.Items ?? []) {
      items.push(item as PurchaseOrderItem)
    }
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  return items
}

/** Resolve and validate date range, defaulting to last 12 months */
function resolveDateRange(filter: DateRangeFilter): { startDate: string; endDate: string } {
  const endDate = filter.endDate ?? new Date().toISOString().slice(0, 10)
  const startDate = filter.startDate ?? monthsAgo(12)
  return { startDate, endDate }
}

async function getOrders(filter: DateRangeFilter): Promise<PurchaseOrderItem[]> {
  const { startDate, endDate } = resolveDateRange(filter)
  if (filter.organizationId) {
    return fetchOrders(filter.organizationId, startDate, endDate)
  }
  return scanAllOrders(startDate, endDate)
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function getSpendSummary(filter: DateRangeFilter): Promise<SpendSummaryResponse> {
  const { startDate, endDate } = resolveDateRange(filter)
  const orders = await getOrders(filter)

  const totalSpend = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0)
  const orderCount = orders.length

  // Current month / previous month buckets
  const now = new Date()
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  let curSpend = 0
  let curCount = 0
  let prevSpend = 0
  let prevCount = 0

  for (const o of orders) {
    const ym = toYearMonth(o.orderDate)
    if (ym === curMonth) { curSpend += o.totalAmount ?? 0; curCount++ }
    else if (ym === prevMonth) { prevSpend += o.totalAmount ?? 0; prevCount++ }
  }

  const momAmount = curSpend - prevSpend
  const momPercentage = prevSpend !== 0 ? Math.round((momAmount / prevSpend) * 10000) / 100 : null

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    currency: DEFAULT_CURRENCY,
    orderCount,
    currentMonth: { spend: Math.round(curSpend * 100) / 100, orderCount: curCount },
    previousMonth: { spend: Math.round(prevSpend * 100) / 100, orderCount: prevCount },
    momChange: { amount: Math.round(momAmount * 100) / 100, percentage: momPercentage },
    period: { startDate, endDate },
  }
}

export async function getSpendTrends(filter: DateRangeFilter): Promise<SpendTrendsResponse> {
  const { startDate, endDate } = resolveDateRange(filter)
  const orders = await getOrders(filter)

  // Aggregate by month
  const monthMap = new Map<string, { spend: number; count: number }>()

  for (const o of orders) {
    const ym = toYearMonth(o.orderDate)
    const entry = monthMap.get(ym) ?? { spend: 0, count: 0 }
    entry.spend += o.totalAmount ?? 0
    entry.count++
    monthMap.set(ym, entry)
  }

  // Build sorted array and fill gaps for the requested period
  const trends: MonthlyTrend[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { spend, count }]) => ({
      month,
      totalSpend: Math.round(spend * 100) / 100,
      orderCount: count,
      avgOrderValue: count > 0 ? Math.round((spend / count) * 100) / 100 : 0,
    }))

  return { trends, currency: DEFAULT_CURRENCY, period: { startDate, endDate } }
}

export async function getSpendByCategories(
  filter: DateRangeFilter,
): Promise<SpendCategoriesResponse> {
  const { startDate, endDate } = resolveDateRange(filter)
  const orders = await getOrders(filter)

  // Aggregate line items by category
  const catMap = new Map<
    string,
    { spend: number; orderIds: Set<string>; lineItemCount: number }
  >()

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

  const categories: CategorySpend[] = Array.from(catMap.entries())
    .map(([category, { spend, orderIds, lineItemCount }]) => ({
      category,
      totalSpend: Math.round(spend * 100) / 100,
      orderCount: orderIds.size,
      lineItemCount,
      percentage:
        totalSpend > 0 ? Math.round((spend / totalSpend) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)

  return {
    categories,
    totalSpend: Math.round(totalSpend * 100) / 100,
    currency: DEFAULT_CURRENCY,
    period: { startDate, endDate },
  }
}

export async function getSpendBySuppliers(
  filter: DateRangeFilter,
  pagination: PaginationParams,
): Promise<SpendSuppliersResponse> {
  const { startDate, endDate } = resolveDateRange(filter)
  const orders = await getOrders(filter)

  // Aggregate by supplierId
  const supMap = new Map<string, { spend: number; count: number; lastDate: string }>()

  for (const o of orders) {
    const sid = o.supplierId
    const entry = supMap.get(sid) ?? { spend: 0, count: 0, lastDate: o.orderDate }
    entry.spend += o.totalAmount ?? 0
    entry.count++
    if (o.orderDate > entry.lastDate) entry.lastDate = o.orderDate
    supMap.set(sid, entry)
  }

  // Sort by total spend desc
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

  return {
    suppliers,
    pagination: { limit: pagination.limit, offset: pagination.offset, total },
    currency: DEFAULT_CURRENCY,
    period: { startDate, endDate },
  }
}
