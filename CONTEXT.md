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
| Frontend | Next.js 16.2.9 + React 19 + TypeScript + Tailwind v4 + shadcn + Zustand v5 + TanStack Query v5 + pdf.js | 3000 |
| Backend | Node.js + Express v5 + TypeScript (strict ESM) + AWS SDK v3 + Zod | 3001 |
| AI Services | Python 3.11+ + FastAPI + uvicorn + NVIDIA NIM (OpenAI-compatible) | 8002 |
| Database | AWS DynamoDB — region `us-east-2`, 5 tables, PAY_PER_REQUEST | — |
| Infra | AWS ECS Fargate + ECR + Secrets Manager | — |
| CI/CD | GitHub Actions → ECR → ECS | — |

**AI Models (NVIDIA NIM):**
- `meta/llama-3.1-8b-instruct` — all text tasks (supplier scorecard, savings agent, risk explanation, PDF text extraction)
- `meta/llama-3.2-11b-vision-instruct` — vision/multimodal (scanned invoice/image extraction)

> The architecture docs and early task files mention PostgreSQL/Prisma and Google Gemini — ignore those. DynamoDB is the actual database and NVIDIA NIM is the AI provider.

---

# Repository Structure

```
POP-Procurement_Observability_Platform/
├── CONTEXT.md                  ← you are here
├── frontend/                   # Next.js app
│   ├── app/
│   │   ├── (auth)/             # login, signup pages
│   │   └── (dashboard)/        # dashboard, suppliers, alerts, agent pages
│   ├── components/
│   │   ├── suppliers/          # SupplierProfile, AddSupplierSheet, SupplierFilters
│   │   ├── agent/              # SavingsAgentChat, SavingsResultsPanel, SavingsOpportunityCard
│   │   └── layout/             # Sidebar (real alert badge count), topbar
│   ├── lib/
│   │   ├── api/                # API clients (spend, suppliers, alerts, agent, auth)
│   │   ├── stores/             # Zustand auth store
│   │   ├── pdf-extract.ts      # Client-side PDF → text or stitched JPEG
│   │   └── utils.ts            # formatCategory() and other helpers
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
        ├── clients/            # nvidia.py (LLM + vision), dynamo.py
        ├── engines/            # savings_engine, supplier_engine, risk_engine
        ├── prompts/            # prompt templates (supplier, savings, risk, extract)
        ├── repositories/       # DynamoDB read layer
        ├── routers/            # ai.py, health.py
        ├── schemas/            # Pydantic request/response models
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
POST   /api/suppliers                       # create supplier
GET    /api/suppliers/:id
GET    /api/suppliers/:id/spend?period=90d
GET    /api/suppliers/:id/summary           # AI-generated scorecard
POST   /api/suppliers/extract               # vision extraction from image (JPG/PNG/WebP)
POST   /api/suppliers/extract-text          # text extraction from PDF text

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
POST   /ai/extract-supplier-doc             # vision extraction (base64 image)
POST   /ai/extract-supplier-text            # text extraction (raw PDF text)
GET    /health
```

**Field mappings applied in controllers:**
- `supplierId` → `id`
- `alertId` → `id`
- `userId` → `id`
- Savings recommendations: AI returns camelCase (`estimatedAnnualSavings`, `confidenceScore`, `affectedSupplierIds`)

---

# Document Extraction Flow (Add Supplier)

The "Add Supplier" floating button opens a sheet with AI-powered auto-fill:

| Input | Client-side processing | AI path |
|---|---|---|
| Digital PDF | pdf.js extracts text from all pages | `POST /ai/extract-supplier-text` → llama-3.1-8b |
| Scanned PDF | pdf.js renders all pages → stitched JPEG (max 10 pages, scale 1.2, quality 0.82) | `POST /ai/extract-supplier-doc` → llama-3.2-11b-vision |
| JPG / PNG / WebP | FileReader base64 encode | `POST /ai/extract-supplier-doc` → llama-3.2-11b-vision |

Body size limits: Express `20mb`, FastAPI `30mb`.

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
AI_SERVICE_PORT=8000
ENVIRONMENT=development
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
NVIDIA_API_KEY=<your-nvidia-nim-key>
DYNAMODB_SUPPLIERS_TABLE=pop-dev-suppliers
DYNAMODB_PURCHASE_ORDERS_TABLE=pop-dev-purchase-orders
DYNAMODB_ALERTS_TABLE=pop-dev-alerts
DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE=pop-dev-savings-recommendations
```

Get a free NVIDIA NIM API key at https://build.nvidia.com — free tier includes 40 rpm.

---

# Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- AWS credentials with access to the DynamoDB tables in `us-east-2`
- NVIDIA NIM API key (free at build.nvidia.com)

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
cd backend && npx tsx src/db/seed.ts
```

Writes 5 suppliers, purchase orders, alerts, and savings recommendations scoped to `organizationId: "default"`.

### Step 4 — Start all three services

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — AI Services
cd ai-services && python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload

# Terminal 3 — Frontend
cd frontend && npm run dev
```

> On Windows, port 8001 may be blocked by firewall. Use 8002 and set `AI_SERVICE_URL=http://localhost:8002` in `backend/.env`.

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
- **Express body limit:** set to `20mb` to handle base64-encoded images from document extraction.
- **Savings agent response shape:** AI returns camelCase field names (`estimatedAnnualSavings`, not `estimated_annual_savings`). The backend `transformSavingsResponse` in `ai.controller.ts` maps these to the frontend `AgentResponse` type.
- **PDF extraction strategy:** try text first (all pages); fall back to stitched JPEG only for scanned/image-only PDFs.

---

# Multi-Tenant Notes

When a user registers, they are assigned `organizationId: "default"` unless specified otherwise. All seeded data uses `organizationId: "default"`. In production, each organization gets a unique ID and data is fully isolated.

---

End of Context Document.
