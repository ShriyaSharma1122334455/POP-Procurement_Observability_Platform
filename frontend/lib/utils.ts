import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AlertSeverity, SupplierRecommendation } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case "LOW":
      return "bg-slate-100 text-slate-700 border-slate-200"
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "HIGH":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "CRITICAL":
      return "bg-red-50 text-red-700 border-red-200"
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-red-600"
}

export function getRecommendationColor(rec: SupplierRecommendation): string {
  switch (rec) {
    case "RENEW":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "NEGOTIATE":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "DIVERSIFY":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "REPLACE":
      return "bg-red-50 text-red-700 border-red-200"
  }
}
