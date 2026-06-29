'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { list } from '@/lib/api/suppliers'
import { MOCK_SUPPLIERS } from '@/lib/mockData'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SupplierFilters } from '@/components/suppliers/SupplierFilters'
import { SupplierGrid } from '@/components/suppliers/SupplierGrid'
import { SupplierListSkeleton } from '@/components/suppliers/SupplierListSkeleton'
import { AddSupplierSheet } from '@/components/suppliers/AddSupplierSheet'
import type { PaginatedResponse } from '@/types'

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [sortBy, setSortBy] = useState('reliability')
  const [page, setPage] = useState(1)

  const { data, isPending } = useQuery({
    queryKey: ['suppliers', search, category, recommendation, sortBy, page],
    queryFn: async (): Promise<PaginatedResponse<typeof MOCK_SUPPLIERS[number]>> => {
      try {
        return await list({ search: search || undefined, category: category || undefined, page })
      } catch {
        const filtered = MOCK_SUPPLIERS.filter((s) => {
          if (search) {
            const q = search.toLowerCase()
            if (!s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return false
          }
          if (category && s.category !== category) return false
          if (recommendation && s.recommendation !== recommendation) return false
          return true
        })
        return { data: filtered, total: filtered.length, page: 1, limit: 12, hasMore: false }
      }
    },
  })

  const rawSuppliers = data?.data ?? []
  const suppliers = recommendation
    ? rawSuppliers.filter((s) => s.recommendation === recommendation)
    : rawSuppliers
  const total = recommendation ? suppliers.length : (data?.total ?? 0)

  if (isPending) return <SupplierListSkeleton />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Intelligence"
        description={`${total} supplier${total !== 1 ? 's' : ''} monitored by AI`}
      />
      <AddSupplierSheet />
      <SupplierFilters
        search={search}
        category={category}
        recommendation={recommendation}
        sortBy={sortBy}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCategoryChange={(v) => { setCategory(v); setPage(1) }}
        onRecommendationChange={(v) => { setRecommendation(v); setPage(1) }}
        onSortChange={(v) => { setSortBy(v); setPage(1) }}
      />
      {suppliers.length === 0 && !isPending ? (
        <EmptyState
          icon={Building2}
          title="No suppliers found"
          description="Try adjusting your search or filters to find matching suppliers."
        />
      ) : (
        <SupplierGrid
          suppliers={suppliers}
          sortBy={sortBy}
          total={total}
          page={page}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
