/**
 * services/ai.service.ts
 * HTTP client for the POP AI Services (Python FastAPI).
 * The backend is the auth boundary — it authenticates the JWT and passes
 * organizationId to the AI service in the request body.
 */

import { env } from '../config/env.js'

const AI_BASE_URL = env.AI_SERVICE_URL

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${AI_BASE_URL}${path}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000), // 30-second timeout for LLM calls
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => 'no body')
    throw new Error(`AI service error ${resp.status}: ${text}`)
  }

  return resp.json() as Promise<T>
}

export async function getSupplierSummary(
  supplierId: string,
  organizationId: string
): Promise<unknown> {
  return post('/ai/supplier-summary', {
    supplier_id: supplierId,
    organization_id: organizationId,
  })
}

export async function runSavingsAgent(
  prompt: string,
  organizationId: string
): Promise<unknown> {
  return post('/ai/savings-agent', {
    prompt,
    organization_id: organizationId,
  })
}

export async function explainAlert(
  alertId: string,
  organizationId: string
): Promise<unknown> {
  return post('/ai/risk-explain', {
    alert_id: alertId,
    organization_id: organizationId,
  })
}
