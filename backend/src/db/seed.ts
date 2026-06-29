/**
 * DynamoDB Seed Script
 * POP – Procurement Observability Platform
 *
 * Populates all 5 tables with 5 realistic sample records each.
 *
 * Usage:
 *   npx ts-node src/db/seed.ts
 *
 * Environment variables (or .env):
 *   AWS_REGION              – defaults to us-east-1
 *   AWS_ACCESS_KEY_ID       – local / CI credentials
 *   AWS_SECRET_ACCESS_KEY
 *   DYNAMODB_ENDPOINT       – optional; set to http://localhost:8000 for DynamoDB Local
 *   DYNAMODB_USERS_TABLE
 *   DYNAMODB_SUPPLIERS_TABLE
 *   DYNAMODB_PURCHASE_ORDERS_TABLE
 *   DYNAMODB_ALERTS_TABLE
 *   DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE
 */

import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

import type {
  UserItem,
  SupplierItem,
  PurchaseOrderItem,
  AlertItem,
  SavingsRecommendationItem,
} from './types.js';
import { TABLE_NAMES } from './types.js';

// ─── Client Setup ─────────────────────────────────────────────────────────────

const raw = new DynamoDBClient({
  region: process.env['AWS_REGION'] ?? 'us-east-1',
  ...(process.env['DYNAMODB_ENDPOINT']
    ? { endpoint: process.env['DYNAMODB_ENDPOINT'] }
    : {}),
});

const client = DynamoDBDocumentClient.from(raw, {
  marshallOptions: { removeUndefinedValues: true },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const unixEpochDaysFromNow = (n: number) =>
  Math.floor((Date.now() + n * 86_400_000) / 1000);

// ─── Sample Data ──────────────────────────────────────────────────────────────

const ORG_ID = 'default';

/** 1. Users */
const users: UserItem[] = [
  {
    userId: 'user-001',
    email: 'alice.chen@acme.com',
    name: 'Alice Chen',
    role: 'PROCUREMENT_MANAGER',
    organizationId: ORG_ID,
    passwordHash: '$2b$12$exampleHashForSeedingPurposesOnly1',
    isActive: true,
    lastLoginAt: daysAgo(0),
    createdAt: daysAgo(180),
    updatedAt: daysAgo(0),
  },
  {
    userId: 'user-002',
    email: 'bob.martinez@acme.com',
    name: 'Bob Martinez',
    role: 'CFO',
    organizationId: ORG_ID,
    passwordHash: '$2b$12$exampleHashForSeedingPurposesOnly2',
    isActive: true,
    lastLoginAt: daysAgo(1),
    createdAt: daysAgo(365),
    updatedAt: daysAgo(1),
  },
  {
    userId: 'user-003',
    email: 'carol.wright@acme.com',
    name: 'Carol Wright',
    role: 'OPERATIONS_MANAGER',
    organizationId: ORG_ID,
    passwordHash: '$2b$12$exampleHashForSeedingPurposesOnly3',
    isActive: true,
    lastLoginAt: daysAgo(3),
    createdAt: daysAgo(200),
    updatedAt: daysAgo(3),
  },
  {
    userId: 'user-004',
    email: 'david.kim@acme.com',
    name: 'David Kim',
    role: 'ADMIN',
    organizationId: ORG_ID,
    passwordHash: '$2b$12$exampleHashForSeedingPurposesOnly4',
    isActive: true,
    lastLoginAt: daysAgo(0),
    createdAt: daysAgo(400),
    updatedAt: daysAgo(0),
  },
  {
    userId: 'user-005',
    email: 'eva.roberts@acme.com',
    name: 'Eva Roberts',
    role: 'VIEWER',
    organizationId: ORG_ID,
    passwordHash: '$2b$12$exampleHashForSeedingPurposesOnly5',
    isActive: false,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(30),
  },
];

/** 2. Suppliers */
const suppliers: SupplierItem[] = [
  {
    supplierId: 'sup-001',
    category: 'FOOD_BEVERAGE',
    name: 'FreshFarm Produce Co.',
    organizationId: ORG_ID,
    contactEmail: 'orders@freshfarm.com',
    contactPhone: '+1-800-555-0101',
    website: 'https://freshfarm.example.com',
    country: 'US',
    reliabilityScore: 88,
    competitivenessScore: 72,
    riskScore: 18,
    relationshipScore: 91,
    recommendation: 'RENEW',
    contractExpiry: daysAgo(-90),
    totalSpendYTD: 480_000,
    currency: 'USD',
    tags: ['organic', 'local', 'certified'],
    createdAt: daysAgo(730),
    updatedAt: daysAgo(5),
  },
  {
    supplierId: 'sup-002',
    category: 'FOOD_BEVERAGE',
    name: 'MeatMasters International',
    organizationId: ORG_ID,
    contactEmail: 'sales@meatmasters.com',
    contactPhone: '+1-800-555-0202',
    country: 'US',
    reliabilityScore: 61,
    competitivenessScore: 45,
    riskScore: 67,
    relationshipScore: 53,
    recommendation: 'NEGOTIATE',
    contractExpiry: daysAgo(-14),
    totalSpendYTD: 920_000,
    currency: 'USD',
    tags: ['protein', 'bulk'],
    createdAt: daysAgo(500),
    updatedAt: daysAgo(2),
  },
  {
    supplierId: 'sup-003',
    category: 'LOGISTICS',
    name: 'SwiftRoute Logistics',
    organizationId: ORG_ID,
    contactEmail: 'ops@swiftroute.com',
    country: 'US',
    reliabilityScore: 79,
    competitivenessScore: 68,
    riskScore: 24,
    relationshipScore: 74,
    recommendation: 'RENEW',
    totalSpendYTD: 145_000,
    currency: 'USD',
    tags: ['cold-chain', 'overnight'],
    createdAt: daysAgo(400),
    updatedAt: daysAgo(10),
  },
  {
    supplierId: 'sup-004',
    category: 'TECHNOLOGY',
    name: 'CloudPOS Solutions',
    organizationId: ORG_ID,
    contactEmail: 'enterprise@cloudpos.com',
    website: 'https://cloudpos.example.com',
    country: 'US',
    reliabilityScore: 95,
    competitivenessScore: 55,
    riskScore: 10,
    relationshipScore: 88,
    recommendation: 'RENEW',
    contractExpiry: daysAgo(-200),
    totalSpendYTD: 72_000,
    currency: 'USD',
    tags: ['saas', 'pos', 'analytics'],
    createdAt: daysAgo(600),
    updatedAt: daysAgo(1),
  },
  {
    supplierId: 'sup-005',
    category: 'RAW_MATERIALS',
    name: 'GlobalGrain Importers',
    organizationId: ORG_ID,
    contactEmail: 'trade@globalgrain.com',
    country: 'CA',
    reliabilityScore: 70,
    competitivenessScore: 82,
    riskScore: 38,
    relationshipScore: 66,
    recommendation: 'DIVERSIFY',
    totalSpendYTD: 315_000,
    currency: 'USD',
    tags: ['grains', 'bulk', 'import'],
    createdAt: daysAgo(300),
    updatedAt: daysAgo(7),
  },
];

/** 3. Purchase Orders */
const purchaseOrders: PurchaseOrderItem[] = [
  {
    orderId: 'po-2024-001',
    orderDate: daysAgo(30),
    supplierId: 'sup-001',
    organizationId: ORG_ID,
    requestedBy: 'user-003',
    approvedBy: 'user-001',
    status: 'FULFILLED',
    totalAmount: 24_500,
    currency: 'USD',
    lineItems: [
      { lineItemId: 'li-001-1', description: 'Organic Romaine Lettuce (case)', quantity: 200, unitPrice: 45, totalPrice: 9_000, category: 'PRODUCE' },
      { lineItemId: 'li-001-2', description: 'Cherry Tomatoes (flat)', quantity: 150, unitPrice: 32, totalPrice: 4_800, category: 'PRODUCE' },
      { lineItemId: 'li-001-3', description: 'Avocados (box)', quantity: 100, unitPrice: 107, totalPrice: 10_700, category: 'PRODUCE' },
    ],
    invoiceNumber: 'FF-INV-20240530',
    deliveryDate: daysAgo(27),
    createdAt: daysAgo(32),
    updatedAt: daysAgo(27),
  },
  {
    orderId: 'po-2024-002',
    orderDate: daysAgo(14),
    supplierId: 'sup-002',
    organizationId: ORG_ID,
    requestedBy: 'user-003',
    approvedBy: 'user-001',
    status: 'FULFILLED',
    totalAmount: 58_750,
    currency: 'USD',
    lineItems: [
      { lineItemId: 'li-002-1', description: 'Prime Beef Tenderloin (lb)', quantity: 500, unitPrice: 78.5, totalPrice: 39_250, category: 'PROTEIN' },
      { lineItemId: 'li-002-2', description: 'Free-Range Chicken Breast (lb)', quantity: 1000, unitPrice: 19.5, totalPrice: 19_500, category: 'PROTEIN' },
    ],
    invoiceNumber: 'MM-INV-20240613',
    deliveryDate: daysAgo(12),
    createdAt: daysAgo(16),
    updatedAt: daysAgo(12),
  },
  {
    orderId: 'po-2024-003',
    orderDate: daysAgo(7),
    supplierId: 'sup-005',
    organizationId: ORG_ID,
    requestedBy: 'user-003',
    status: 'PENDING',
    totalAmount: 33_200,
    currency: 'USD',
    lineItems: [
      { lineItemId: 'li-003-1', description: 'All-Purpose Flour (50 lb sack)', quantity: 400, unitPrice: 48, totalPrice: 19_200, category: 'GRAINS' },
      { lineItemId: 'li-003-2', description: 'Long-Grain White Rice (50 lb sack)', quantity: 200, unitPrice: 70, totalPrice: 14_000, category: 'GRAINS' },
    ],
    createdAt: daysAgo(8),
    updatedAt: daysAgo(7),
  },
  {
    orderId: 'po-2024-004',
    orderDate: daysAgo(3),
    supplierId: 'sup-003',
    organizationId: ORG_ID,
    requestedBy: 'user-001',
    approvedBy: 'user-002',
    status: 'APPROVED',
    totalAmount: 8_900,
    currency: 'USD',
    lineItems: [
      { lineItemId: 'li-004-1', description: 'Overnight Cold-Chain Delivery – June batch', quantity: 1, unitPrice: 8_900, totalPrice: 8_900, category: 'LOGISTICS' },
    ],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(3),
  },
  {
    orderId: 'po-2024-005',
    orderDate: daysAgo(1),
    supplierId: 'sup-001',
    organizationId: ORG_ID,
    requestedBy: 'user-003',
    status: 'DRAFT',
    totalAmount: 11_280,
    currency: 'USD',
    lineItems: [
      { lineItemId: 'li-005-1', description: 'Seasonal Herbs Bundle', quantity: 120, unitPrice: 22, totalPrice: 2_640, category: 'PRODUCE' },
      { lineItemId: 'li-005-2', description: 'Baby Spinach (case)', quantity: 240, unitPrice: 36, totalPrice: 8_640, category: 'PRODUCE' },
    ],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

/** 4. Alerts */
const alerts: AlertItem[] = [
  {
    alertId: 'alert-001',
    createdAt: daysAgo(2),
    status: 'OPEN',
    severity: 'CRITICAL',
    type: 'PRICE_SPIKE',
    organizationId: ORG_ID,
    title: 'Beef Prices Surged 18% – MeatMasters International',
    description:
      'Prime beef tenderloin unit price increased from $66.50 to $78.50/lb (+18%) over the last 30 days. Annualised impact: ~$144,000.',
    affectedEntityId: 'sup-002',
    affectedEntityType: 'SUPPLIER',
    estimatedImpact: 144_000,
    currency: 'USD',
    expiresAt: unixEpochDaysFromNow(30),
    updatedAt: daysAgo(2),
  },
  {
    alertId: 'alert-002',
    createdAt: daysAgo(10),
    status: 'ACKNOWLEDGED',
    severity: 'HIGH',
    type: 'CONTRACT_EXPIRY',
    organizationId: ORG_ID,
    title: 'MeatMasters Contract Expires in 14 Days',
    description:
      'The master supply agreement with MeatMasters International expires on ' +
      new Date(Date.now() - 0 * 86_400_000).toLocaleDateString() +
      '. Renewal or replacement action required.',
    affectedEntityId: 'sup-002',
    affectedEntityType: 'SUPPLIER',
    acknowledgements: ['user-001'],
    expiresAt: unixEpochDaysFromNow(15),
    updatedAt: daysAgo(8),
  },
  {
    alertId: 'alert-003',
    createdAt: daysAgo(5),
    status: 'OPEN',
    severity: 'MEDIUM',
    type: 'SPEND_CONCENTRATION',
    organizationId: ORG_ID,
    title: 'High Spend Concentration – Food & Beverage Category',
    description:
      '73% of total YTD procurement spend is concentrated in the FOOD_BEVERAGE category across 2 suppliers. Diversification recommended.',
    estimatedImpact: 250_000,
    currency: 'USD',
    expiresAt: unixEpochDaysFromNow(60),
    updatedAt: daysAgo(5),
  },
  {
    alertId: 'alert-004',
    createdAt: daysAgo(20),
    status: 'RESOLVED',
    severity: 'LOW',
    type: 'SUPPLIER_RISK',
    organizationId: ORG_ID,
    title: 'GlobalGrain Risk Score Elevated After Supply Delay',
    description:
      'GlobalGrain Importers missed a 5-day delivery window in May. Risk score increased from 28 → 38.',
    affectedEntityId: 'sup-005',
    affectedEntityType: 'SUPPLIER',
    resolvedAt: daysAgo(15),
    resolvedBy: 'user-001',
    expiresAt: unixEpochDaysFromNow(7),
    updatedAt: daysAgo(15),
  },
  {
    alertId: 'alert-005',
    createdAt: daysAgo(1),
    status: 'OPEN',
    severity: 'HIGH',
    type: 'BUDGET_OVERRUN',
    organizationId: ORG_ID,
    title: 'Q2 Protein Budget Exceeded by 12%',
    description:
      'Protein category spend for Q2 has reached $1,032,000 against an approved budget of $920,000 (+12.2%). Immediate review required.',
    estimatedImpact: 112_000,
    currency: 'USD',
    expiresAt: unixEpochDaysFromNow(14),
    updatedAt: daysAgo(1),
  },
];

/** 5. Savings Recommendations */
const savingsRecommendations: SavingsRecommendationItem[] = [
  {
    recommendationId: 'rec-001',
    createdAt: daysAgo(15),
    organizationId: ORG_ID,
    title: 'Switch 30% of Beef Volume to Alternative Protein Supplier',
    description:
      'Benchmark analysis found RegionalBeef Co. offering comparable Grade A beef at $67/lb. Redirecting 30% of volume could yield $43,200 in annual savings.',
    category: 'SUPPLIER_SWITCH',
    status: 'UNDER_REVIEW',
    estimatedAnnualSavings: 43_200,
    estimatedImplementationCost: 2_500,
    currency: 'USD',
    paybackPeriodMonths: 1,
    confidenceScore: 87,
    affectedSupplierIds: ['sup-002'],
    affectedCategories: ['FOOD_BEVERAGE'],
    aiGenerated: true,
    generatedBy: 'AI_AGENT',
    updatedAt: daysAgo(10),
  },
  {
    recommendationId: 'rec-002',
    createdAt: daysAgo(8),
    organizationId: ORG_ID,
    title: 'Consolidate Produce Orders to Unlock Volume Discount Tier',
    description:
      'FreshFarm Produce offers a 7% volume discount on orders exceeding $30,000/month. Consolidating bi-weekly orders into monthly batches could save $33,600 annually.',
    category: 'VOLUME_DISCOUNT',
    status: 'APPROVED',
    estimatedAnnualSavings: 33_600,
    currency: 'USD',
    paybackPeriodMonths: 0,
    confidenceScore: 92,
    affectedSupplierIds: ['sup-001'],
    affectedCategories: ['FOOD_BEVERAGE'],
    aiGenerated: true,
    generatedBy: 'AI_AGENT',
    updatedAt: daysAgo(3),
  },
  {
    recommendationId: 'rec-003',
    createdAt: daysAgo(45),
    organizationId: ORG_ID,
    title: 'Renegotiate CloudPOS SaaS Contract at Renewal',
    description:
      'CloudPOS pricing has increased 22% YoY while usage metrics show only 68% feature utilisation. Renegotiating at renewal for a lower tier or better rate could save $14,400/year.',
    category: 'CONTRACT_RENEGOTIATION',
    status: 'IMPLEMENTED',
    estimatedAnnualSavings: 14_400,
    currency: 'USD',
    paybackPeriodMonths: 2,
    confidenceScore: 78,
    affectedSupplierIds: ['sup-004'],
    affectedCategories: ['TECHNOLOGY'],
    aiGenerated: false,
    generatedBy: 'user-001',
    implementedAt: daysAgo(10),
    implementedBy: 'user-002',
    actualSavingsRealized: 12_000,
    updatedAt: daysAgo(10),
  },
  {
    recommendationId: 'rec-004',
    createdAt: daysAgo(20),
    organizationId: ORG_ID,
    title: 'Introduce Second Grain Supplier to Reduce Concentration Risk',
    description:
      'Procuring grains from a secondary domestic supplier alongside GlobalGrain could reduce supply disruption risk and improve negotiation leverage, estimated at $18,900 in savings.',
    category: 'CONSOLIDATION',
    status: 'PENDING',
    estimatedAnnualSavings: 18_900,
    estimatedImplementationCost: 5_000,
    currency: 'USD',
    paybackPeriodMonths: 4,
    confidenceScore: 65,
    affectedSupplierIds: ['sup-005'],
    affectedCategories: ['RAW_MATERIALS'],
    aiGenerated: true,
    generatedBy: 'AI_AGENT',
    updatedAt: daysAgo(20),
  },
  {
    recommendationId: 'rec-005',
    createdAt: daysAgo(3),
    organizationId: ORG_ID,
    title: 'Optimise Logistics Route Frequency to Cut Cold-Chain Costs',
    description:
      'Route analysis shows SwiftRoute deliveries can be consolidated from 3× to 2× per week without stock-out risk (based on 90-day inventory data). Projected savings: $26,280/year.',
    category: 'PROCESS_OPTIMIZATION',
    status: 'PENDING',
    estimatedAnnualSavings: 26_280,
    currency: 'USD',
    paybackPeriodMonths: 0,
    confidenceScore: 81,
    affectedSupplierIds: ['sup-003'],
    affectedCategories: ['LOGISTICS'],
    aiGenerated: true,
    generatedBy: 'AI_AGENT',
    updatedAt: daysAgo(3),
  },
];

// ─── Seed Functions ───────────────────────────────────────────────────────────

/**
 * Writes a batch of items to a DynamoDB table using BatchWriteCommand.
 * Handles up to 25 items per request (DynamoDB limit).
 */
async function batchWrite<T extends Record<string, unknown>>(
  tableName: string,
  items: T[],
): Promise<void> {
  const CHUNK = 25;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    await client.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((item) => ({ PutRequest: { Item: item } })),
        },
      }),
    );
  }
}

async function seedTable<T extends Record<string, unknown>>(
  label: string,
  tableName: string,
  items: T[],
): Promise<void> {
  console.log(`\n⏳  Seeding "${label}" (${items.length} items) → ${tableName}`);
  await batchWrite(tableName, items);
  console.log(`✅  "${label}" seeded successfully`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱  POP DynamoDB Seed Script');
  console.log(`    Region  : ${process.env['AWS_REGION'] ?? 'us-east-1'}`);
  console.log(`    Endpoint: ${process.env['DYNAMODB_ENDPOINT'] ?? 'AWS (production endpoint)'}`);
  console.log('─'.repeat(60));

  await seedTable('Users', TABLE_NAMES.USERS, users as unknown as Record<string, unknown>[]);
  await seedTable('Suppliers', TABLE_NAMES.SUPPLIERS, suppliers as unknown as Record<string, unknown>[]);
  await seedTable('Purchase Orders', TABLE_NAMES.PURCHASE_ORDERS, purchaseOrders as unknown as Record<string, unknown>[]);
  await seedTable('Alerts', TABLE_NAMES.ALERTS, alerts as unknown as Record<string, unknown>[]);
  await seedTable('Savings Recommendations', TABLE_NAMES.SAVINGS_RECOMMENDATIONS, savingsRecommendations as unknown as Record<string, unknown>[]);

  console.log('\n─'.repeat(60));
  console.log('🎉  All tables seeded successfully!');
  console.log(`\nTotal records written: ${
    users.length + suppliers.length + purchaseOrders.length + alerts.length + savingsRecommendations.length
  }`);
}

main().catch((err) => {
  console.error('❌  Seed script failed:', err);
  process.exit(1);
});
