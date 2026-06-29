import { get } from "./client"
import type { Supplier, SpendTrend, PaginatedResponse } from "@/types"

export interface SupplierSummary {
  supplierId: string
  supplierName: string
  scorecard_summary: string
  recommendation: string
  recommendation_rationale: string
  key_risks: string[]
  opportunities: string[]
}

interface SupplierListParams {
  category?: string
  page?: number
  limit?: number
  search?: string
}

export async function list(
  params?: SupplierListParams
): Promise<PaginatedResponse<Supplier>> {
  return get<PaginatedResponse<Supplier>>("/suppliers", params as Record<string, unknown>)
}

export async function getById(id: string): Promise<Supplier> {
  return get<Supplier>(`/suppliers/${id}`)
}

export async function getSummary(id: string): Promise<SupplierSummary> {
  return get<SupplierSummary>(`/suppliers/${id}/summary`)
}

export async function getSpend(
  id: string,
  period?: string
): Promise<SpendTrend[]> {
  return get<SpendTrend[]>(`/suppliers/${id}/spend`, period ? { period } : undefined)
}
