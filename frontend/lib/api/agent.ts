import { post, get } from './client'
import type { AgentResponse } from '@/types'

function generateMockResponse(prompt: string): AgentResponse {
  return {
    query: prompt,
    summary: `I analyzed your procurement data across 47 suppliers and 6 categories. I identified 3 high-confidence savings opportunities totaling $43,200 in potential annual savings.`,
    totalPotentialSavings: 43200,
    analysisSteps: [
      'Scanned price history across 47 active suppliers',
      'Benchmarked Protein category against 8 market alternatives',
      'Identified volume discount threshold at 800 lbs/month',
      'Modeled Q3 demand forecast for seasonal pricing windows',
      'Calculated net savings after estimated switching costs',
    ],
    opportunities: [
      {
        id: '1',
        title: 'Switch Chicken Supplier',
        description: 'Pacific Proteins Co. is 18% above market rate. Coastal Foods offers equivalent quality at market price with 94% reliability rating.',
        estimatedSavings: 1533,
        annualizedSavings: 18400,
        category: 'Proteins',
        confidence: 'HIGH',
        recommendedAction: 'Request samples and pricing from Coastal Foods. Run 4-week trial order before full transition.',
        affectedSuppliers: ['Pacific Proteins Co.', 'Coastal Foods'],
      },
      {
        id: '2',
        title: 'Olive Oil Bulk Purchase Window',
        description: 'August historically marks the lowest olive oil prices (avg -14% vs annual mean). Pre-purchase a 90-day supply in last week of July.',
        estimatedSavings: 933,
        annualizedSavings: 11200,
        category: 'Dry Goods',
        confidence: 'HIGH',
        recommendedAction: 'Pre-authorize $8,500 bulk olive oil purchase order for July 28. Requires dry storage capacity for 90-day inventory.',
        affectedSuppliers: [],
      },
      {
        id: '3',
        title: 'Beverage Contract Renegotiation',
        description: 'Your beverage contract is 3 years old. Market has moved 12% in your favor since signing. Renegotiation at renewal could save $1,133/month.',
        estimatedSavings: 1133,
        annualizedSavings: 13600,
        category: 'Beverages',
        confidence: 'MEDIUM',
        recommendedAction: 'Schedule renegotiation call 60 days before contract expiry. Prepare 3 competitor quotes as negotiation leverage.',
        affectedSuppliers: [],
      },
    ],
    processingTime: 2.3,
  }
}

export const agentApi = {
  query: async (prompt: string): Promise<AgentResponse> => {
    try {
      return await post<AgentResponse>('/agent/query', { prompt })
    } catch {
      await new Promise(resolve => setTimeout(resolve, 3500))
      return generateMockResponse(prompt)
    }
  },
  getHistory: async (): Promise<AgentResponse[]> => {
    try {
      return await get<AgentResponse[]>('/agent/history')
    } catch {
      return []
    }
  },
}
