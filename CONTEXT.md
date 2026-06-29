# POP - Procurement Observability Platform

## Project Context Document

### Purpose

This document provides the complete context of the POP platform for developers, AI agents, and LLMs.

Before generating code, architecture decisions, APIs, UI components, database schemas, or AI workflows, read this document first.

---

# Project Overview

POP (Procurement Observability Platform) is an AI-powered procurement intelligence platform that provides:

* Real-time procurement observability
* Supplier intelligence
* Autonomous savings recommendations
* Procurement risk monitoring

The platform applies observability concepts used by Datadog, Splunk, and CloudWatch to procurement operations.

---

# Business Problem

Organizations spend millions on suppliers but lack:

1. Real-time price visibility
2. Supplier performance analytics
3. Cost optimization intelligence
4. Procurement risk monitoring

Most procurement decisions are currently reactive and spreadsheet-driven.

POP converts procurement into an observable system.

---

# Core Product Vision

POP continuously ingests procurement data and generates actionable intelligence.

The platform should answer:

* Where is money being spent?
* Why did spend increase?
* Which suppliers are underperforming?
* What savings opportunities exist?
* What risks require immediate attention?

---

# Core Modules

## Module 1: Spend Observability

Purpose:
Provide complete visibility into procurement spending.

Features:

* Spend dashboard
* Spend trends
* Category breakdowns
* Price change tracking
* Forecasting
* Executive reports

Example Insight:

"Chicken supplier increased pricing by 15%, creating $144,000 annualized impact."

---

## Module 2: Supplier Intelligence

Purpose:
Continuously evaluate suppliers.

Metrics:

* Reliability Score
* Price Competitiveness
* Risk Rating
* Relationship Score

Output:

Supplier recommendations:

* Renew
* Negotiate
* Diversify
* Replace

---

## Module 3: Autonomous Savings Agent

Purpose:
Allow users to request savings opportunities using natural language.

Example:

User Prompt:

"Reduce my food cost by 5%"

Agent Actions:

* Benchmark suppliers
* Analyze historical spend
* Detect volume discounts
* Forecast demand
* Generate recommendations

Output:

Structured savings opportunities with estimated impact.

---

## Module 4: Risk Monitoring

Purpose:
Detect procurement risks before financial damage occurs.

Alert Types:

* Price Spike
* Supplier Risk Escalation
* Contract Expiration
* Spend Concentration
* Market Anomaly

Output:

Actionable alerts with recommendations.

---

# Users

Primary:

* Procurement Managers
* CFOs
* Operations Managers
* Restaurant Owners

Secondary:

* Supply Chain Teams
* Finance Teams

---

# Phase 1 Scope (MVP)

Only build:

### Authentication

* Login
* Signup
* JWT Authentication

### Spend Observability

* Spend Dashboard
* Category Analysis
* Price Change Alerts

### Supplier Intelligence

* Supplier Profiles
* Supplier Scores

### Risk Monitoring

* Basic Alert System

### AI

* Savings Recommendation Engine
* Supplier Summary Generation

---

# Architecture

Frontend:

* React
* TypeScript
* Tailwind
* Recharts

Backend:

* Node.js
* Express
* PostgreSQL
* Prisma ORM

AI Services:

* Python FastAPI
* Google Gemini API

Infrastructure:

* AWS

Deployment:

* Docker
* ECS Fargate

---

# High-Level Architecture

Frontend
↓
Backend API
↓
PostgreSQL

Backend API
↓
AI Service

Backend API
↓
AWS SQS
↓
Background Workers

---

# Key Entities

## User

* id
* name
* email
* role

## Supplier

* id
* name
* category
* reliabilityScore
* competitivenessScore
* riskScore

## PurchaseOrder

* id
* supplierId
* amount
* category
* orderDate

## SpendRecord

* id
* category
* supplierId
* amount

## Alert

* id
* type
* severity
* status

## SavingsOpportunity

* id
* title
* description
* estimatedSavings

---

# AI Responsibilities

The AI system should:

1. Generate supplier insights
2. Detect anomalies
3. Recommend savings
4. Summarize procurement trends
5. Explain risk alerts

The AI should never directly modify procurement data.

AI outputs should be recommendation-only.

---

# Non-Functional Requirements

Performance:

* Dashboard < 2 sec load
* API < 500ms average

Security:

* JWT Authentication
* RBAC
* HTTPS
* Encrypted Secrets

Scalability:

* Multi-tenant architecture
* Event-driven processing

---

# Success Criteria

A user should be able to:

1. Upload procurement data
2. View spend trends
3. Monitor suppliers
4. Receive alerts
5. Ask AI for savings opportunities

All within a single platform.

End of Context Document.
