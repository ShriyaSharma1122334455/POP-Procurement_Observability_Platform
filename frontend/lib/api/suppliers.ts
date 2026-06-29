import { get, post } from "./client"
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

export interface ExtractedSupplierData {
  name: string | null
  category: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  country: string | null
  contractExpiry: string | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export async function extractFromDoc(file: File): Promise<ExtractedSupplierData> {
  const file_base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return post<ExtractedSupplierData>('/suppliers/extract', {
    file_base64,
    mime_type: file.type,
  })
}

export async function extractFromText(text: string): Promise<ExtractedSupplierData> {
  return post<ExtractedSupplierData>('/suppliers/extract-text', { text })
}

export interface CreateSupplierInput {
  name: string
  category: string
  contactEmail: string
  contactPhone?: string
  website?: string
  country?: string
  contractExpiry?: string
}

export async function create(data: CreateSupplierInput): Promise<Supplier> {
  return post<Supplier>('/suppliers', data)
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
