/**
 * DynamoDB Table Type Definitions
 * POP - Procurement Observability Platform
 *
 * All table item interfaces mirror the DynamoDB schema defined in Terraform.
 */

// ─── Users ───────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'PROCUREMENT_MANAGER' | 'CFO' | 'OPERATIONS_MANAGER' | 'VIEWER';

export interface UserItem {
  /** Partition key */
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt?: string; // ISO 8601
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export type SupplierCategory =
  | 'FOOD_BEVERAGE'
  | 'RAW_MATERIALS'
  | 'LOGISTICS'
  | 'TECHNOLOGY'
  | 'PROFESSIONAL_SERVICES'
  | 'UTILITIES'
  | 'OTHER';

export type SupplierRecommendation = 'RENEW' | 'NEGOTIATE' | 'DIVERSIFY' | 'REPLACE';

export interface SupplierItem {
  /** Partition key */
  supplierId: string;
  /** GSI partition key: category */
  category: SupplierCategory;
  name: string;
  organizationId: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  country: string;
  /** 0–100 */
  reliabilityScore: number;
  /** 0–100 */
  competitivenessScore: number;
  /** 0–100, higher = riskier */
  riskScore: number;
  /** 0–100 */
  relationshipScore: number;
  recommendation: SupplierRecommendation;
  contractExpiry?: string; // ISO 8601
  totalSpendYTD: number;
  currency: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export type OrderStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'FULFILLED' | 'CANCELLED';

export interface LineItem {
  lineItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface PurchaseOrderItem {
  /** Partition key */
  orderId: string;
  /** Sort key */
  orderDate: string; // ISO 8601 date
  /** GSI partition key: supplierId */
  supplierId: string;
  organizationId: string;
  requestedBy: string; // userId
  approvedBy?: string; // userId
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  lineItems: LineItem[];
  invoiceNumber?: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertType =
  | 'PRICE_SPIKE'
  | 'SUPPLIER_RISK'
  | 'CONTRACT_EXPIRY'
  | 'SPEND_CONCENTRATION'
  | 'MARKET_ANOMALY'
  | 'BUDGET_OVERRUN';

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertItem {
  /** Partition key */
  alertId: string;
  /** Sort key */
  createdAt: string; // ISO 8601
  /** GSI partition key: status */
  status: AlertStatus;
  /** GSI sort key: severity */
  severity: AlertSeverity;
  type: AlertType;
  organizationId: string;
  title: string;
  description: string;
  affectedEntityId?: string;  // supplierId, orderId, etc.
  affectedEntityType?: string;
  estimatedImpact?: number;
  currency?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  acknowledgements?: string[];
  /** TTL attribute – Unix epoch seconds */
  expiresAt?: number;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

// ─── Savings Recommendations ──────────────────────────────────────────────────

export type RecommendationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'IMPLEMENTED' | 'REJECTED';
export type RecommendationCategory =
  | 'SUPPLIER_SWITCH'
  | 'VOLUME_DISCOUNT'
  | 'CONSOLIDATION'
  | 'CONTRACT_RENEGOTIATION'
  | 'DEMAND_REDUCTION'
  | 'PROCESS_OPTIMIZATION';

export interface SavingsRecommendationItem {
  /** Partition key */
  recommendationId: string;
  /** Sort key */
  createdAt: string; // ISO 8601
  organizationId: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  status: RecommendationStatus;
  estimatedAnnualSavings: number;
  estimatedImplementationCost?: number;
  currency: string;
  paybackPeriodMonths?: number;
  /** 0–100 */
  confidenceScore: number;
  affectedSupplierIds?: string[];
  affectedCategories?: string[];
  aiGenerated: boolean;
  generatedBy?: string; // userId or 'AI_AGENT'
  implementedAt?: string;
  implementedBy?: string;
  actualSavingsRealized?: number;
  notes?: string;
  updatedAt: string;
}

// ─── Table name constants ─────────────────────────────────────────────────────

export const TABLE_NAMES = {
  USERS: process.env['DYNAMODB_USERS_TABLE'] ?? 'pop-users',
  SUPPLIERS: process.env['DYNAMODB_SUPPLIERS_TABLE'] ?? 'pop-suppliers',
  PURCHASE_ORDERS: process.env['DYNAMODB_PURCHASE_ORDERS_TABLE'] ?? 'pop-purchase-orders',
  ALERTS: process.env['DYNAMODB_ALERTS_TABLE'] ?? 'pop-alerts',
  SAVINGS_RECOMMENDATIONS:
    process.env['DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE'] ?? 'pop-savings-recommendations',
} as const;

export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES];
