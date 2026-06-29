export type UserRole = 'admin' | 'procurement_manager' | 'cfo' | 'operations_manager'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export type SupplierRecommendation = 'RENEW' | 'NEGOTIATE' | 'DIVERSIFY' | 'REPLACE'

export interface Supplier {
  id: string
  name: string
  category: string
  reliabilityScore: number
  competitivenessScore: number
  riskScore: number
  relationshipScore: number
  recommendation: SupplierRecommendation
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  supplier?: Supplier
  amount: number
  category: string
  orderDate: string
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED'
}

export interface SpendRecord {
  id: string
  category: string
  supplierId: string
  supplier?: Supplier
  amount: number
  recordDate: string
}

export interface SpendTrend {
  date: string
  amount: number
  category?: string
}

export interface CategorySpend {
  category: string
  amount: number
  percentage: number
  changePercent: number
}

export interface SpendSummary {
  totalSpend: number
  previousPeriodSpend: number
  changePercent: number
  activeSuppliers: number
  openAlerts: number
  savingsIdentified: number
  trends: SpendTrend[]
  categoryBreakdown: CategorySpend[]
  topSuppliers: Array<{ supplier: Supplier; totalSpend: number; percentage: number }>
}

export type AlertType =
  | 'PRICE_SPIKE'
  | 'SUPPLIER_RISK'
  | 'CONTRACT_EXPIRATION'
  | 'SPEND_CONCENTRATION'
  | 'MARKET_ANOMALY'
  | 'BUDGET_OVERRUN'

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  description: string
  recommendation?: string
  estimatedImpact?: number
  supplierId?: string
  supplier?: Supplier
  createdAt: string
  updatedAt: string
}

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface SavingsOpportunity {
  id: string
  title: string
  description: string
  estimatedSavings: number
  annualizedSavings: number
  category: string
  recommendedAction: string
  confidence: ConfidenceLevel
  affectedSuppliers?: string[]
}

export interface AgentResponse {
  query: string
  summary: string
  totalPotentialSavings: number
  opportunities: SavingsOpportunity[]
  analysisSteps: string[]
  processingTime: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
