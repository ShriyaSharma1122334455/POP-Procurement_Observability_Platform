import { get } from "./client"
import type { SpendSummary, SpendTrend, CategorySpend } from "@/types"

export type Period = "7d" | "30d" | "90d"

export async function getSummary(period: Period): Promise<SpendSummary> {
  return get<SpendSummary>("/spend/summary", { period })
}

export async function getTrends(
  period: Period,
  category?: string
): Promise<SpendTrend[]> {
  return get<SpendTrend[]>("/spend/trends", { period, category })
}

export async function getCategories(period: Period): Promise<CategorySpend[]> {
  return get<CategorySpend[]>("/spend/categories", { period })
}
