import type { Alert, SpendSummary, SpendTrend, Supplier } from '@/types'

export function generateDailyTrends(days: number): SpendTrend[] {
  const trends: SpendTrend[] = []
  const base = 8000
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const parts = date.toISOString().split('T')
    trends.push({
      date: parts[0] ?? date.toISOString(),
      amount: base + Math.random() * 3000 - 1000,
    })
  }
  return trends
}

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Pacific Proteins Co.', category: 'Proteins', reliabilityScore: 94, competitivenessScore: 72, riskScore: 28, relationshipScore: 88, recommendation: 'NEGOTIATE', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
  { id: '2', name: 'Green Valley Produce', category: 'Produce', reliabilityScore: 87, competitivenessScore: 91, riskScore: 18, relationshipScore: 92, recommendation: 'RENEW', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
  { id: '3', name: 'Metro Dairy Distributors', category: 'Dairy', reliabilityScore: 61, competitivenessScore: 58, riskScore: 67, relationshipScore: 55, recommendation: 'DIVERSIFY', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
  { id: '4', name: 'Coastal Beverage Group', category: 'Beverages', reliabilityScore: 45, competitivenessScore: 44, riskScore: 78, relationshipScore: 38, recommendation: 'REPLACE', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
  { id: '5', name: 'Summit Dry Goods', category: 'Dry Goods', reliabilityScore: 82, competitivenessScore: 79, riskScore: 22, relationshipScore: 85, recommendation: 'RENEW', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
  { id: '6', name: 'Harvest Organics', category: 'Produce', reliabilityScore: 76, competitivenessScore: 68, riskScore: 35, relationshipScore: 71, recommendation: 'NEGOTIATE', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
]

export const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'PRICE_SPIKE',
    severity: 'CRITICAL',
    status: 'OPEN',
    title: 'Chicken Prices Spiked 18% — Pacific Proteins Co.',
    description: 'Pacific Proteins Co. increased prices across 6 SKUs by 18%. At current volumes this adds $27,000/year in food costs.',
    recommendation: 'Request justification call. Get quotes from 3 alternative suppliers. Consider emergency bulk purchase before price change in 14 days.',
    estimatedImpact: 27000,
    supplierId: '1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'SPEND_CONCENTRATION',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Spend Concentration Risk — Dairy Category',
    description: 'Metro Dairy Distributors represents 68% of your dairy spend. Concentration above 40% creates significant supply chain risk.',
    recommendation: 'Identify 2 alternative dairy suppliers. Target 40/30/30 split. Begin outreach within 14 days.',
    estimatedImpact: 38100,
    supplierId: '3',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'CONTRACT_EXPIRATION',
    severity: 'MEDIUM',
    status: 'ACKNOWLEDGED',
    title: 'Contract Expiring in 45 Days — Green Valley Produce',
    description: 'Your contract with Green Valley Produce expires in 45 days with no renewal initiated.',
    recommendation: 'Schedule contract renewal call. Benchmark pricing against 2 alternatives before negotiation.',
    estimatedImpact: undefined,
    supplierId: '2',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    type: 'MARKET_ANOMALY',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Produce Prices Diverging from Market Benchmarks',
    description: 'Your produce category spend is 14% above current market benchmarks for comparable operations.',
    recommendation: 'Request updated pricing from Green Valley Produce. Evaluate spot market alternatives.',
    estimatedImpact: 7600,
    supplierId: '2',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    type: 'SUPPLIER_RISK',
    severity: 'LOW',
    status: 'RESOLVED',
    title: 'Coastal Beverage Group Risk Score Degraded',
    description: 'Coastal Beverage Group risk score dropped from 55 to 78 over the past 30 days due to 3 late deliveries.',
    recommendation: 'Initiate performance review call with Coastal Beverage Group account manager.',
    estimatedImpact: undefined,
    supplierId: '4',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const MOCK_SPEND_SUMMARY: SpendSummary = {
  totalSpend: 245820,
  previousPeriodSpend: 253890,
  changePercent: -3.2,
  activeSuppliers: 47,
  openAlerts: 12,
  savingsIdentified: 43200,
  trends: generateDailyTrends(30),
  categoryBreakdown: [
    { category: 'Proteins', amount: 89400, percentage: 36.4, changePercent: 12.5 },
    { category: 'Produce', amount: 54200, percentage: 22.1, changePercent: -2.1 },
    { category: 'Dairy', amount: 38100, percentage: 15.5, changePercent: 4.8 },
    { category: 'Beverages', amount: 31500, percentage: 12.8, changePercent: -1.3 },
    { category: 'Dry Goods', amount: 21400, percentage: 8.7, changePercent: 0.5 },
    { category: 'Other', amount: 11220, percentage: 4.5, changePercent: 2.1 },
  ],
  topSuppliers: [],
}
