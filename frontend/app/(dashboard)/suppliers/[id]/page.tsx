'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { getById, getSpend } from '@/lib/api/suppliers'
import { MOCK_SUPPLIERS, generateDailyTrends } from '@/lib/mockData'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SupplierProfile } from '@/components/suppliers/SupplierProfile'

export default function SupplierDetailPage() {
  const params = useParams()
  const rawId = params['id']
  const id = Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '')

  const { data: supplier, isPending: supplierPending } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      try {
        return await getById(id)
      } catch {
        return MOCK_SUPPLIERS.find((s) => s.id === id) ?? null
      }
    },
    enabled: id !== '',
  })

  const { data: spendData, isPending: spendPending } = useQuery({
    queryKey: ['supplier-spend', id],
    queryFn: async () => {
      try {
        return await getSpend(id, '90d')
      } catch {
        return generateDailyTrends(90)
      }
    },
    enabled: id !== '',
  })

  const isLoading = supplierPending || spendPending

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="space-y-4">
        <Link
          href="/suppliers"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to Suppliers
        </Link>
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
          <p className="text-base font-semibold text-slate-900">Supplier not found</p>
          <p className="text-sm text-slate-500">
            The supplier you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/suppliers"
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all suppliers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to Suppliers
      </Link>
      <SupplierProfile
        supplier={supplier}
        spendHistory={spendData ?? []}
      />
    </div>
  )
}
