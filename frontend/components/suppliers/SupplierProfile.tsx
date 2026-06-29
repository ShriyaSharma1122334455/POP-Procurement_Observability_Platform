'use client'

import {
  CheckCircle2, MessageSquare, GitBranch, AlertOctagon,
  Sparkles, type LucideIcon,
} from 'lucide-react'
import { cn, formatCategory } from '@/lib/utils'
import { ScoreGauge } from './ScoreGauge'
import { RecommendationBadge } from './RecommendationBadge'
import { SupplierSpendChart } from './SupplierSpendChart'
import type { Supplier, SpendTrend, SupplierRecommendation } from '@/types'
import type { SupplierSummary } from '@/lib/api/suppliers'

interface SupplierProfileProps {
  supplier: Supplier
  spendHistory: SpendTrend[]
  aiSummary: SupplierSummary | null
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

// ── Score interpretation helpers ──────────────────────────────────────────────

function getReliabilityText(score: number): string {
  if (score >= 85) return 'Strong delivery performance'
  if (score >= 60) return 'Acceptable delivery rate'
  return 'Delivery performance at risk'
}

function getCompetitivenessText(score: number): string {
  if (score >= 80) return 'Market-leading pricing'
  if (score >= 60) return 'Competitive pricing'
  return 'Pricing above market avg'
}

function getRiskText(score: number): string {
  if (score < 40) return 'Low supply chain risk'
  if (score <= 70) return 'Monitor risk closely'
  return 'High risk — action needed'
}

function getRelationshipText(score: number): string {
  if (score >= 80) return 'Strategic partner'
  if (score >= 60) return 'Reliable partner'
  return 'Relationship needs attention'
}

// ── AI Insights ───────────────────────────────────────────────────────────────

type InsightDot = 'green' | 'amber' | 'red'

interface Insight {
  text: string
  dot: InsightDot
}

const DOT_CLASSES: Record<InsightDot, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
}

function buildInsightsFromAI(summary: SupplierSummary): Insight[] {
  const insights: Insight[] = []
  for (const risk of summary.key_risks.slice(0, 2)) {
    insights.push({ text: risk, dot: 'red' })
  }
  for (const opp of summary.opportunities.slice(0, 3 - insights.length)) {
    insights.push({ text: opp, dot: 'green' })
  }
  return insights.slice(0, 3)
}

function buildInsightsFallback(s: Supplier): Insight[] {
  const insights: Insight[] = []
  if (s.reliabilityScore > 85) {
    insights.push({ text: `Strong delivery performance — ${s.reliabilityScore}% on-time rate over 90 days`, dot: 'green' })
  }
  if (s.competitivenessScore < 80) {
    insights.push({ text: `Pricing is approximately ${100 - s.competitivenessScore}% above market benchmarks`, dot: 'amber' })
  } else {
    insights.push({ text: 'Pricing is competitive relative to market benchmarks', dot: 'green' })
  }
  if (s.riskScore > 60) {
    insights.push({ text: 'High concentration risk detected — consider alternative suppliers', dot: 'red' })
  } else {
    insights.push({ text: 'Supply chain risk is well-controlled at current levels', dot: 'green' })
  }
  return insights.slice(0, 3)
}

// ── Recommendation action card ────────────────────────────────────────────────

interface RecConfig {
  bg: string
  border: string
  Icon: LucideIcon
  iconColor: string
  title: string
  description: string
}

const REC_CONFIG: Record<SupplierRecommendation, RecConfig> = {
  RENEW: {
    bg: 'bg-emerald-50', border: 'border-emerald-200',
    Icon: CheckCircle2, iconColor: 'text-emerald-600',
    title: 'Recommended: Renew Contract',
    description: 'This supplier demonstrates strong performance across key metrics. Renewing the contract maintains supply stability and favourable pricing.',
  },
  NEGOTIATE: {
    bg: 'bg-blue-50', border: 'border-blue-200',
    Icon: MessageSquare, iconColor: 'text-blue-600',
    title: 'Recommended: Negotiate Pricing',
    description: 'Competitive benchmarking indicates pricing optimisation opportunities. Targeted renegotiation could yield 5–15% cost reduction.',
  },
  DIVERSIFY: {
    bg: 'bg-yellow-50', border: 'border-yellow-200',
    Icon: GitBranch, iconColor: 'text-yellow-600',
    title: 'Recommended: Diversify Supply',
    description: 'Supply concentration risk is elevated. Onboarding alternative suppliers improves resilience without disrupting current volume.',
  },
  REPLACE: {
    bg: 'bg-red-50', border: 'border-red-200',
    Icon: AlertOctagon, iconColor: 'text-red-600',
    title: 'Recommended: Replace Supplier',
    description: 'Performance scores are below acceptable thresholds. Transitioning to a qualified alternative is recommended to protect supply continuity.',
  },
}

// ── Main component ────────────────────────────────────────────────────────────

export function SupplierProfile({ supplier, spendHistory, aiSummary }: SupplierProfileProps) {
  const insights = aiSummary ? buildInsightsFromAI(aiSummary) : buildInsightsFallback(supplier)
  const rec = REC_CONFIG[supplier.recommendation]
  const RecIcon = rec.Icon

  return (
    <div className="space-y-6">
      {/* Section A — Profile header */}
      <div className="rounded-xl border border-slate-200 shadow-sm bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white select-none">
              {getInitials(supplier.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{supplier.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {formatCategory(supplier.category)}
                </span>
                <RecommendationBadge recommendation={supplier.recommendation} size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section B — Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Reliability',    score: supplier.reliabilityScore,    text: getReliabilityText(supplier.reliabilityScore) },
          { label: 'Competitive',    score: supplier.competitivenessScore, text: getCompetitivenessText(supplier.competitivenessScore) },
          { label: 'Risk',           score: supplier.riskScore,           text: getRiskText(supplier.riskScore) },
          { label: 'Relationship',   score: supplier.relationshipScore,   text: getRelationshipText(supplier.relationshipScore) },
        ].map(({ label, score, text }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 shadow-sm bg-white p-5 flex flex-col items-center gap-2"
          >
            <ScoreGauge score={score} label={label} className="size-[100px]" />
            <p className="text-xs text-slate-500 text-center">{text}</p>
          </div>
        ))}
      </div>

      {/* Section C — Chart + AI Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupplierSpendChart data={spendHistory} />

        {/* AI Intelligence card */}
        <div className="rounded-xl border border-slate-200 shadow-sm bg-white p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-4 text-blue-500" aria-hidden />
            <h3 className="text-base font-semibold text-slate-900">AI Intelligence</h3>
          </div>

          {aiSummary?.scorecard_summary && (
            <p className="text-sm text-slate-600 leading-snug mb-3 pb-3 border-b border-slate-100">
              {aiSummary.scorecard_summary}
            </p>
          )}
          <ul className="space-y-3 flex-1">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className={cn('mt-1.5 size-2 rounded-full shrink-0', DOT_CLASSES[insight.dot])}
                  aria-hidden
                />
                <p className="text-sm text-slate-600 leading-snug">{insight.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              {aiSummary ? 'Powered by Gemini · Live analysis' : 'Powered by Gemini · Analysis updated daily'}
            </p>
          </div>
        </div>
      </div>

      {/* Section D — Recommendation action card */}
      <div className={cn('rounded-xl border p-6', rec.bg, rec.border)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <RecIcon className={cn('size-6 shrink-0 mt-0.5', rec.iconColor)} aria-hidden />
            <div>
              <p className="text-base font-semibold text-slate-900">{rec.title}</p>
              <p className="text-sm text-slate-600 mt-1 max-w-prose">{rec.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
