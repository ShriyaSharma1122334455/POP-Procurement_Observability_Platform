# POP - Procurement Observability Platform

AI-powered procurement intelligence and autonomous cost optimization.

---

## Overview

POP provides procurement observability similar to how Datadog provides application observability.

The platform continuously analyzes purchasing data to help organizations:

* Monitor spend
* Evaluate suppliers
* Detect procurement risks
* Discover savings opportunities

---

## Features

### Spend Observability

* Real-time spend dashboard
* Category analysis
* Price change monitoring
* Spend forecasting

### Supplier Intelligence

* Supplier scorecards
* Reliability metrics
* Competitiveness analysis
* Risk scoring

### Autonomous Savings Agent

Natural language prompts such as:

> Reduce my procurement costs by 5%

The AI agent analyzes purchasing data and produces actionable recommendations.

### Risk Monitoring

* Price spike alerts
* Supplier risk alerts
* Contract expiration alerts
* Spend concentration warnings

---

## Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* Recharts

### Backend

* Node.js
* Express
* PostgreSQL
* Prisma

### AI Layer

* Python FastAPI
* Google Gemini API

### Infrastructure

* AWS ECS Fargate
* AWS RDS PostgreSQL
* AWS SQS
* AWS CloudWatch
* AWS Secrets Manager

---

## Project Structure

```text
frontend/
backend/
ai-services/
infrastructure/
docs/

README.md
CONTEXT.md
BUILD_TASKS.md
```

---

## Local Setup

### Clone Repository

```bash
git clone <repo-url>
cd pop
```

### Backend

```bash
cd backend

npm install

cp .env.example .env

npm run dev
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

### AI Service

```bash
cd ai-services

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Environment Variables

Backend

```env
DATABASE_URL=
JWT_SECRET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
OPENAI_API_KEY=
```

Frontend

```env
VITE_API_URL=
```

AI Service

```env
GEMINI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-2
```

---

## MVP Deliverables

### Phase 1

* Authentication
* Spend Dashboard
* Supplier Profiles
* Risk Alerts
* Savings Recommendations

---

## Team

### R

Full Stack Developer

Responsibilities:

* Frontend
* API Integration
* Authentication
* Dashboard Development

### S

Backend Developer + PR Reviewer

Responsibilities:

* Backend APIs
* Database Design
* Infrastructure
* Code Reviews

### Y

AI Engineer

Responsibilities:

* AI Services
* LLM Integration
* Savings Agent
* Supplier Intelligence

---

## Future Roadmap

Phase 2

* ERP Integrations
* Toast POS Integration
* QuickBooks Integration

Phase 3

* Autonomous Procurement Agent
* Contract Negotiation Agent

Phase 4

* Multi-Industry Expansion
* Marketplace Integrations

---

## License

Private/Internal Project
