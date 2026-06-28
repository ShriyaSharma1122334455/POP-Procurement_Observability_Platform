'use client'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

interface SupplierFiltersProps {
  search: string
  category: string
  recommendation: string
  sortBy: string
  onSearchChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onRecommendationChange: (v: string) => void
  onSortChange: (v: string) => void
}

const SELECT_CLASS =
  'h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

export function SupplierFilters({
  search,
  category,
  recommendation,
  sortBy,
  onSearchChange,
  onCategoryChange,
  onRecommendationChange,
  onSortChange,
}: SupplierFiltersProps) {
  const [inputValue, setInputValue] = useState(search)
  const callbackRef = useRef(onSearchChange)

  useEffect(() => {
    callbackRef.current = onSearchChange
  }, [onSearchChange])

  // Sync if parent resets search externally
  useEffect(() => {
    setInputValue(search)
  }, [search])

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      callbackRef.current(inputValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [inputValue])

  const activeFilters = [category !== '', recommendation !== ''].filter(Boolean).length

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" aria-hidden />
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search suppliers..."
          className="h-9 w-56 sm:w-64 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Category */}
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        aria-label="Filter by category"
        className={SELECT_CLASS}
      >
        <option value="">All Categories</option>
        <option value="Proteins">Proteins</option>
        <option value="Produce">Produce</option>
        <option value="Dairy">Dairy</option>
        <option value="Beverages">Beverages</option>
        <option value="Dry Goods">Dry Goods</option>
        <option value="Other">Other</option>
      </select>

      {/* Recommendation */}
      <select
        value={recommendation}
        onChange={(e) => onRecommendationChange(e.target.value)}
        aria-label="Filter by recommendation"
        className={SELECT_CLASS}
      >
        <option value="">All Recommendations</option>
        <option value="RENEW">Renew</option>
        <option value="NEGOTIATE">Negotiate</option>
        <option value="DIVERSIFY">Diversify</option>
        <option value="REPLACE">Replace</option>
      </select>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Sort by"
        className={SELECT_CLASS}
      >
        <option value="reliability">Reliability Score</option>
        <option value="risk">Risk Score</option>
        <option value="name">Name</option>
        <option value="spend">Total Spend</option>
      </select>

      {/* Active filters badge */}
      {activeFilters > 0 && (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {activeFilters} active
        </span>
      )}
    </div>
  )
}
