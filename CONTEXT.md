# POP - Procurement Observability Platform

## Project Context Document

Before generating code, architecture decisions, APIs, UI components, database schemas, or AI workflows, read this document first.

---

# Project Overview

POP (Procurement Observability Platform) is an AI-powered procurement intelligence platform — "Datadog for procurement". It gives organizations real-time spend visibility, supplier analytics, and AI-generated cost optimization recommendations.

The platform answers:
- Where is money being spent?
- Which suppliers are underperforming?
- What savings opportunities exist?
- What risks require immediate attention?

---

# Tech Stack

| Layer | Technology | Port |
|---|---|---|
| Frontend | Next.js 16.2.9 + React 19 + TypeScript + Tailwind v4 + shadcn + Zustand v5 + TanStack Query v5 | 3000 |
| Backend | Node.js + Express v5 + TypeScript (strict ESM) + AWS SDK v3 | 3001 |
| AI Services | Python 3.11+ + FastAPI + uvicorn + Google Gemini 2.0 Flash | 8002 |
| Database | AWS DynamoDB — region `us-east-2`, 5 tables, PAY_PER_REQUEST | — |
| Infra | AWS ECS Fargate + ECR + Secrets Manager + Terraform | — |
| CI/CD | GitHub Actions → ECR → ECS | — |

> The architecture docs and early task files mention PostgreSQL/Prisma — ignore those. DynamoDB is the actual database.

---

# Repository Structure

```
POP-Procurement_Observability_Platform/
├── CONTEXT.md                  ← you are here
├── frontend/                   # Next.js app
│   ├── app/
│   │   ├── (auth)/             # login, signup pages
│   │   └── (dashboard)/        # dashboard, suppliers, alerts, agent pages
│   ├── components/             # UI components
│   ├── lib/
│   │   ├── api/                # API clients (spend, suppliers, alerts, agent, auth)
│   │   ├── stores/             # Zustand auth store
│   │   └── mockData.ts         # fallback mock data (used only when API fails)
│   ├── types/index.ts          # shared TypeScript types
│   └── proxy.ts                # Next.js 16 route protection middleware
├── backend/
│   └── src/
│       ├── controllers/        # auth, spend, supplier, alert, ai
│       ├── services/           # business logic + DynamoDB queries
│       ├── routes/             # Express route registration
│       ├── middleware/         # JWT auth, error handling
│       ├── db/
│       │   ├── types.ts        # DynamoDB item interfaces
│       │   └── seed.ts         # seed script for local dev
│       └── config/             # env.ts, dynamo.ts
└── ai-services/
    └── app/
        ├── clients/            # gemini.py, dynamo.py
        ├── engines/            # savings_engine, supplier_engine, risk_engine
        ├── prompts/            # prompt templates
        ├── repositories/       # DynamoDB access layer
        ├── routers/            # ai.py, health.py
        ├── schemas/            # Pydantic models
        └── config/             # settings.py, secrets.py
```

---

# DynamoDB Tables

All tables are in `us-east-2` with prefix `pop-dev-`.

| Table | PK | SK | Key GSIs |
|---|---|---|---|
| `pop-dev-users` | `userId` | — | `email-index`, `organizationId-index` |
| `pop-dev-suppliers` | `supplierId` | — | `category-index`, `organizationId-index` |
| `pop-dev-purchase-orders` | `orderId` | `orderDate` | `supplierId-orderDate-index`, `organizationId-orderDate-index` |
| `pop-dev-alerts` | `alertId` | `createdAt` | `status-severity-index`, `organizationId-createdAt-index` |
| `pop-dev-savings-recommendations` | `recommendationId` | `createdAt` | `organizationId-createdAt-index`, `status-createdAt-index` |

**Important:** Always query via GSI — never full table scans in production. When updating an item, use the GSI to look up the full key first (PK + SK both required for `UpdateCommand`).

---

# API Contracts

**Response envelope:** every endpoint returns `{ success: true, data: T }`

**Paginated lists:** `{ data: T[], total, page, limit, hasMore }`

**Auth responses:** `{ user: { id, name, email, role }, token, expiresIn }`
- Field is `token` not `accessToken`
- `id` not `userId`
- role is lowercase in JWT, uppercase in DB

**Backend routes** (all prefixed `/api`, all require `Authorization: Bearer <token>` except auth):
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/spend/summary?period=30d        # 7d | 30d | 90d
GET    /api/spend/trends?period=30d
GET    /api/spend/categories?period=30d
GET    /api/spend/suppliers?period=30d

GET    /api/suppliers?category=&search=
GET    /api/suppliers/:id
GET    /api/suppliers/:id/spend?period=90d
GET    /api/suppliers/:id/summary           # AI-generated

GET    /api/alerts?status=&severity=&type=
GET    /api/alerts/:id
PUT    /api/alerts/:id/acknowledge
PUT    /api/alerts/:id/resolve

POST   /api/ai/supplier-summary
POST   /api/ai/savings-agent
POST   /api/ai/risk-explain

POST   /api/agent/query
GET    /api/agent/history
```

**AI service routes** (internal — backend proxies, no auth):
```
POST   /ai/supplier-summary
POST   /ai/savings-agent
POST   /ai/risk-explain
GET    /health
```

**Field mappings applied in controllers:**
- `supplierId` → `id`
- `alertId` → `id`
- `userId` → `id`
- `CONTRACT_EXPIRY` (DB) → `CONTRACT_EXPIRATION` (frontend)

---

# Environment Variables

**`backend/.env`** (gitignored — create manually):
```
PORT=3001
NODE_ENV=development
JWT_SECRET=pop-dev-secret-2024-change-in-prod
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
DYNAMODB_USERS_TABLE=pop-dev-users
DYNAMODB_SUPPLIERS_TABLE=pop-dev-suppliers
DYNAMODB_PURCHASE_ORDERS_TABLE=pop-dev-purchase-orders
DYNAMODB_ALERTS_TABLE=pop-dev-alerts
DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE=pop-dev-savings-recommendations
AI_SERVICE_URL=http://localhost:8002
```

**`ai-services/.env`** (gitignored — create manually):
```
ENVIRONMENT=development
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
GEMINI_API_KEY=<your-gemini-key>
DYNAMODB_SUPPLIERS_TABLE=pop-dev-suppliers
DYNAMODB_PURCHASE_ORDERS_TABLE=pop-dev-purchase-orders
DYNAMODB_ALERTS_TABLE=pop-dev-alerts
DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE=pop-dev-savings-recommendations
```

Get a Gemini API key at https://aistudio.google.com/apikey — free tier has a daily limit; enable billing on your Google Cloud project for sustained use.

---

# Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- AWS credentials with access to the DynamoDB tables in `us-east-2`
- Gemini API key

### Step 1 — Install dependencies

```bash
cd backend && npm install
cd frontend && npm install
cd ai-services && pip install -r requirements.txt
```

### Step 2 — Create env files

Create `backend/.env` and `ai-services/.env` using the templates above.

### Step 3 — Seed the database (first time only)

```bash
cd backend
npx tsx src/db/seed.ts
```

This writes 25 records across all 5 tables (5 users, 5 suppliers, 5 purchase orders, 5 alerts, 5 savings recommendations) all scoped to `organizationId: "default"`.

### Step 4 — Start all three services

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 — AI Services**
```bash
cd ai-services
python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

> On Windows, port 8001 may be blocked by firewall. Use 8002 and set `AI_SERVICE_URL=http://localhost:8002` in `backend/.env`.

**Terminal 3 — Frontend**
```bash
cd frontend
npm run dev
```

### Step 5 — Open the app

Go to http://localhost:3000 and register a new account.

---

# Key Design Decisions

- **Multi-tenancy:** all tables scoped by `organizationId`. Passed via JWT — no client override in production.
- **GSI-first queries:** no full table scans. All list operations go through GSIs.
- **Auth:** backend handles JWT. AI service is internal-only with no auth layer.
- **AI writes:** only the `savings-recommendations` table. All other AI access is read-only.
- **Secrets:** AWS Secrets Manager in prod, `.env` file in dev.
- **DynamoDB from Python:** use `Decimal` not `float` when writing numeric values.
- **Next.js 16 middleware:** file must be named `proxy.ts` and export `function proxy(...)` — not `middleware.ts`.
- **Alert updates:** use the `organizationId-createdAt-index` GSI to look up the full key (`alertId` + `createdAt`) before calling `UpdateCommand`. Base table queries with `FilterExpression` + `Limit` drop results silently.

---

# Multi-Tenant Notes

When a user registers, they are assigned `organizationId: "default"` unless specified otherwise. All seeded data uses `organizationId: "default"`. In production, each organization gets a unique ID and data is fully isolated.

---

End of Context Document.
