import { get, put } from "./client"
import type { Alert, AlertSeverity, AlertStatus, AlertType, PaginatedResponse } from "@/types"

interface AlertListParams {
  severity?: AlertSeverity
  status?: AlertStatus
  type?: AlertType
  page?: number
  limit?: number
}

export async function list(
  params?: AlertListParams
): Promise<PaginatedResponse<Alert>> {
  return get<PaginatedResponse<Alert>>("/alerts", params as Record<string, unknown>)
}

export async function getById(id: string): Promise<Alert> {
  return get<Alert>(`/alerts/${id}`)
}

export async function acknowledge(id: string): Promise<Alert> {
  return put<Alert>(`/alerts/${id}/acknowledge`)
}

export async function resolve(id: string): Promise<Alert> {
  return put<Alert>(`/alerts/${id}/resolve`)
}
