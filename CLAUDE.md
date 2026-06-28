# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

POP (Procurement Observability Platform) is an AI-powered procurement intelligence platform — think Datadog for procurement. It provides spend observability, supplier intelligence, autonomous savings recommendations, and risk monitoring.

Read `CONTEXT.md` for full product context before making architecture decisions. Read `BUILD_TASK.md` for the team's assigned work breakdown (R = Frontend, S = Backend, Y = AI).

## Current State

| Area | Status |
|---|---|
| Frontend R1 — Foundation | Complete (App Router, Tailwind v4, shadcn v4, layout, shared components) |
| Frontend R2 — Auth | Complete (login/signup forms, Zustand persist store, proxy guard, demo login) |
| Backend S1 — Foundation | Complete (Express v5, TypeScript ESM, Prisma scaffold) |
| Frontend R3 — Spend Dashboard | Complete (SpendOverview, SpendChart, CategoryBreakdown, TopSupplierTable, PeriodSelector, skeleton, mock data fallback) |
| Frontend R4 — Supplier Intelligence | Complete (SupplierGrid, SupplierCard, SupplierFilters, ScoreGauge, RecommendationBadge, SupplierProfile, SupplierSpendChart, mock data fallback) |
| Frontend R6 — Savings Agent | Complete (SavingsAgentChat, AgentInput, AgentMessageBubble, SavingsResultsPanel, SavingsOpportunityCard, AnalysisProgress, AgentHistoryPanel, follow-up chips, mock data fallback) |
| Frontend R5 / Backend S2+ / AI | Not started |
| `ai-services/`, `infrastructure/`, `docs/` | Not yet created |

## Commands

### Backend (`cd backend` first)

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET
npm run dev                   # nodemon + ts-node, watches src/
npm run build                 # tsc → dist/
npm run prisma:generate       # regenerate Prisma client after schema changes
npm run prisma:migrate        # prisma migrate dev (creates migration + applies)
```

> **CI gap**: `npm run lint` and `npm test` are referenced by CI but not yet defined in `backend/package.json`. Add ESLint and a test runner (Jest or Vitest) before CI can pass.

### Frontend (`cd frontend` first)

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                        # Next.js dev server
npm run build                      # production build
npm run type-check                 # tsc --noEmit
npm run lint                       # eslint .
npm run test:e2e                   # Playwright (starts dev server automatically)
npm run test:e2e:ui                # Playwright UI mode
```

Stack: **Next.js 16.2.9** (App Router) + **React 19** + TypeScript + Tailwind CSS v4 + shadcn v4 + Zustand v5 + TanStack Query v5. Deploy target: Vercel.

**Breaking changes vs older docs / training data:**

- **Middleware renamed**: Next.js 16 uses `proxy.ts` (not `middleware.ts`); the exported function must be named `proxy` (not `middleware`). File lives at the project root.
- **shadcn v4 / @base-ui/react**: No `asChild` prop — triggers render as `<button>` directly. Use `npx shadcn@latest add <component>`.
- **Tailwind v4**: CSS-based config via `@theme` blocks in `globals.css`. No `tailwind.config.ts`.
- **`next lint` removed**: Use `eslint .` instead.
- **Zod v4**: `import { z } from 'zod'` — API unchanged but peer deps differ. `@hookform/resolvers` v5 required.
- **TanStack Query v5**: `isPending` not `isLoading`; wrap app in `<QueryClientProvider>`.
- **Zustand v5 persist**: Hydration is async even with synchronous storage. Use `useAuthStore.persist.hasHydrated()` with a `typeof window !== 'undefined'` SSR guard in lazy `useState` initialisers.

### AI Service (`cd ai-services` first — not yet created)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

CI expects: `ruff check .` for lint, `pytest` for tests, FastAPI app at `app.main:app`. Python 3.12. Env vars: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`.

## Architecture

```
Frontend (React/TS/Tailwind/Recharts)
    ↓
Backend API (Express v5 / Node.js / Prisma)
    ↓              ↓              ↓
PostgreSQL    AI Service      AWS SQS
              (FastAPI)     (background workers)
```

Backend is the single source of truth. The AI service is consumed by the backend — it never touches the DB directly. AI outputs are recommendation-only; they never mutate procurement data.

### Frontend Structure

```
app/
  (auth)/login|signup          — public auth pages (AuthCard wrapper + form)
  (dashboard)/dashboard/       — spend dashboard (R3)
  (dashboard)/suppliers/       — supplier intelligence (R4)
  (dashboard)/alerts/          — stub (R5)
  (dashboard)/agent/           — Savings Agent page (R6)
  globals.css                  — OKLCH color tokens via @theme; Tailwind v4 config lives here
components/
  agent/                       — SavingsAgentChat, AgentInput, AgentMessageBubble, SavingsResultsPanel,
                                  SavingsOpportunityCard, AnalysisProgress, AgentHistoryPanel (all R6)
  auth/                        — AuthCard, LoginForm, SignupForm
  dashboard/                   — SpendOverview, SpendChart, CategoryBreakdown, TopSupplierTable,
                                  PeriodSelector, SpendDashboardSkeleton (all R3)
  layout/                      — Sidebar, Header, MobileSidebar
  providers/                   — AuthProvider (session restore on mount), QueryProvider
  shared/                      — StatCard, LoadingSpinner, PageHeader, EmptyState, ErrorBoundary
  ui/                          — shadcn primitives (button, card, badge, sheet, …)
lib/
  api/                         — axios client + typed modules (auth, spend, suppliers, alerts, agent)
  hooks/useAuth.ts             — router-integrated login/signup/logout; calls authApi then updates store
  mockData.ts                  — MOCK_SPEND_SUMMARY + generateDailyTrends(); demo fallback when backend offline
  stores/authStore.ts          — Zustand persist store (key: "pop-auth"); sets pop_token cookie + localStorage
types/index.ts                 — User, Supplier, PurchaseOrder, SpendRecord, Alert, SavingsOpportunity
proxy.ts                       — Next.js route protection (cookie-based); redirects unauthenticated users
```

**Auth flow:** `proxy.ts` guards routes via cookie → `DashboardLayout` hydrates Zustand store → `AuthProvider` validates session against `/auth/me` on mount.

**Demo login** bypasses the API entirely: writes a mock user directly to `useAuthStore.getState().login(...)` so it works without a running backend.

**R3 Dashboard data flow:** `dashboard/page.tsx` (client) → two `useQuery` calls keyed on `period` → `getSummary(period)` / `getTrends(period)` → try/catch falls back to `MOCK_SPEND_SUMMARY` / `generateDailyTrends()` if backend is offline. Period selector updates both queries simultaneously.

**R6 Agent data flow:** `agent/page.tsx` (client) → `SavingsAgentChat` → TanStack Query `useMutation` → `POST /api/agent/query` → `onMutate` adds loading bubble synchronously → `onSuccess` replaces it with `AgentMessageBubble` + `SavingsResultsPanel` (cards + follow-up chips). History is persisted to `localStorage` under `pop-agent-history` (not the API). Mock fallback: route throws → `catch` in `mutationFn` returns `MOCK_AGENT_RESPONSE`.

### Testing (Frontend)

Playwright e2e only. Tests live in `frontend/tests/e2e/`. Config: `frontend/playwright.config.ts` (chromium only; `webServer` starts `npm run dev` automatically).

**Mocking auth in tests** — four things are required for protected routes to render:

1. **`addInitScript` to set Zustand persist store** — must run before React hydrates (not `page.evaluate` after `goto`). `DashboardLayout` reads `pop-auth` on first render:

```typescript
await page.addInitScript((user) => {
  window.localStorage.setItem('pop-auth', JSON.stringify({
    state: { user, token: 'mock-test-token', isAuthenticated: true },
    version: 0,
  }))
}, MOCK_USER)
```

2. **Set the `pop_token` cookie** — `proxy.ts` middleware checks this to allow the route through:

```typescript
await page.context().addCookies([{
  name: 'pop_token', value: 'mock-test-token',
  domain: 'localhost', path: '/', sameSite: 'Lax',
}])
```

3. **Route-intercept `/auth/me`** — `AuthProvider` calls this on mount; without a mock it throws and `logout()` fires, redirecting to `/login`. Register routes BEFORE `goto`:

```typescript
await page.route('**/api/auth/me', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, data: MOCK_USER }) })
)
```

4. **Catch-all API mock** — prevents unmocked endpoints reaching `localhost:3001`. A 401 from the real backend triggers the axios interceptor → `window.location.href = '/login'` → navigation. Register BEFORE the specific mocks (Playwright uses LIFO order, so specific mocks registered last are checked first):

```typescript
await page.route('**/api/**', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, data: null }) })
)
// More-specific routes registered after are checked first (LIFO):
await page.route('**/api/auth/me', ...)
await page.route('**/api/agent/query', ...)
```

**`locale: 'en-US'` in playwright.config.ts** — required so `Number.toLocaleString()` formats consistently (e.g. `18400` → `'18,400'`). Add to the `use:` block.

**Submit button pattern** — React 19 concurrent mode detaches button children during re-renders; direct `locator.click()` hits the detached element. Use a two-phase approach:

```typescript
// Phase 1: wait for button enabled (state propagated from fill())
await page.waitForFunction(() => {
  const btn = document.querySelector('button[aria-label="Send message"]')
  return btn !== null && !(btn as HTMLButtonElement).disabled
})
// Phase 2: find+click in one microtask to avoid detachment
await page.evaluate(() => {
  (document.querySelector('button[aria-label="Send message"]') as HTMLButtonElement)?.click()
})
```

**Playwright selector gotcha** — `page.locator('text=A, text=B')` is NOT an OR. It matches the literal string "A, text=B". Use `.or()` for alternatives: `page.locator('text=A').or(page.locator('text=B'))`, or use `:has-text()` CSS pseudo-selectors which do support comma-OR.

**Animation opacity gotcha** — components with `style={{ opacity: 0 }}` + `animate-fade-in-up` CSS class are invisible to Playwright's `toBeVisible` until the animation runs (opacity > 0). `bodyContains` / `textContent` checks bypass this. Use `toBeVisible` for content that's stable-visible; use `page.evaluate(() => document.body.textContent)` for content that may still be animating.

### Backend TypeScript Config

Strict ESM (`"type": "module"`, `module: NodeNext`, `moduleResolution: NodeNext`). Full strict mode including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`. All imports must use `.js` extensions (NodeNext requirement). Target: ES2022, output to `dist/`.

### Prisma

Schema at `backend/prisma/schema.prisma` (PostgreSQL, no models defined yet). After editing the schema: run `npm run prisma:generate` then `npm run prisma:migrate`. CI runs `prisma migrate deploy` against a real `postgres:16` test DB — no mocking.

## Core Data Model (planned)

| Entity | Key fields |
|---|---|
| User | id, name, email, role |
| Supplier | id, name, category, reliabilityScore, competitivenessScore, riskScore |
| PurchaseOrder | id, supplierId, amount, category, orderDate |
| SpendRecord | id, category, supplierId, amount |
| Alert | id, type, severity, status |
| SavingsOpportunity | id, title, description, estimatedSavings |

## MVP Phase 1 Scope

Authentication (JWT), Spend Dashboard, Supplier Profiles + Scores, Basic Risk Alerts, AI Savings Recommendations. Do not build Phase 2+ features (ERP integrations, autonomous agents, marketplace).

## Performance Targets

- API responses < 500ms average
- Dashboard load < 2 seconds

## Infrastructure

Target: AWS ECS Fargate (containers), RDS PostgreSQL, SQS (async jobs), CloudWatch (observability), Secrets Manager. Dockerfiles for all three services are expected by CI but do not yet exist.
