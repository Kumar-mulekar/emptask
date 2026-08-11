# Architecture Document
## Employee Salary Management Software — ACME Org
*Prepared for: Incubyte Take-Home Assessment*

---

## 1. Overview

The system is a full-stack web application with a clear separation between the frontend (Next.js) and backend (Fastify + Node.js/TypeScript). Both live in a single Git repository as independent packages. The database is PostgreSQL hosted on Neon (serverless).

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (HR Manager)                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│              Frontend — Next.js (Vercel)                     │
│   App Router  │  TanStack Query  │  shadcn/ui + Tailwind     │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API (HTTPS)
┌─────────────────────────▼───────────────────────────────────┐
│              Backend — Fastify (Railway)                     │
│        Routes  │  Services  │  Prisma Client                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ TCP (Prisma)
┌─────────────────────────▼───────────────────────────────────┐
│              PostgreSQL — Neon (Serverless)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend framework | Next.js (App Router) | Required by assessment; modern React with SSR support |
| UI components | shadcn/ui + Tailwind CSS | Accessible, fully customisable, in-repo components |
| Client state/fetching | TanStack Query | Server state management, caching, pagination, cache invalidation |
| Backend framework | Fastify | Native TypeScript support, built-in JSON schema validation (no separate validation library needed), structured logging via Pino |
| ORM | Prisma | Schema-first, auto-generated TypeScript types, built-in migrations |
| Database | PostgreSQL on Neon | Serverless PostgreSQL, free tier, production-grade |
| Testing (backend) | Vitest + vitest-mock-extended | Fast, TypeScript-native, auto-mocked Prisma client |
| Testing (frontend) | Vitest + React Testing Library | Component testing without a real browser |
| Frontend hosting | Vercel | Native Next.js hosting, free tier |
| Backend hosting | Railway | Simple Node.js deployment, free tier |

---

## 3. Repository Structure

```
/                              ← Git root
├── frontend/                  ← Next.js application (independent)
│   ├── src/
│   │   ├── app/               ← Next.js App Router pages
│   │   │   ├── page.tsx           ← Dashboard / analytics
│   │   │   └── employees/
│   │   │       └── page.tsx       ← Employee list
│   │   ├── components/        ← Reusable UI components
│   │   ├── lib/               ← API client, utilities
│   │   └── types/             ← TypeScript interfaces (local copy)
│   ├── package.json
│   └── next.config.ts
│
├── backend/                   ← Fastify API (independent)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── employees.ts       ← HTTP request/response only
│   │   │   └── analytics.ts
│   │   ├── services/
│   │   │   ├── employeeService.ts     ← Business logic + DB access
│   │   │   └── analyticsService.ts
│   │   ├── schemas/               ← Fastify JSON schema validation
│   │   ├── db.ts                  ← Prisma client singleton
│   │   └── index.ts               ← Server entry point
│   ├── tests/
│   │   ├── unit/                  ← Unit tests (mocked Prisma)
│   │   │   ├── employeeService.test.ts
│   │   │   └── analyticsService.test.ts
│   │   └── integration/           ← Integration tests (real PostgreSQL)
│   │       ├── employees.test.ts
│   │       └── analytics.test.ts
│   ├── prisma/
│   │   ├── schema.prisma          ← Data model
│   │   └── seed.ts                ← 10,000 employee seed script
│   ├── package.json
│   └── tsconfig.json
│
└── docs/                      ← Assessment artifacts
    ├── requirements.md
    ├── architecture.md
    ├── tradeoffs.md           ← Created after implementation
    ├── ai-workflow.md
    └── prompts/
        ├── phase1-planning.md
        ├── phase3-backend.md
        └── phase4-frontend.md
```

---

## 4. Data Model

Defined in `backend/prisma/schema.prisma`:

```prisma
model Employee {
  id              String   @id @default(cuid())
  fullName        String
  department      String
  jobTitle        String
  employmentType  String   // "Full-time" | "Part-time" | "Contract"
  hireDate        DateTime
  country         String
  currency        String   // ISO 4217 code e.g. "INR", "USD", "GBP"
  salary          Decimal  @db.Decimal(12, 2)  // Annual base salary
  isActive        Boolean  @default(true)       // false = soft-deleted
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([country])
  @@index([department])
  @@index([employmentType])
  @@index([isActive])
}
```

**Design decisions:**
- Single table, no joins — current salary only, no history
- `salary` stores the **annual base salary** as `Decimal` (not `Float`) to avoid floating-point precision errors on financial data
- `isActive` enables soft delete — deactivated employees are never hard-deleted; all queries filter on `isActive = true`
- Indexes on `country`, `department`, `employmentType`, and `isActive` — the columns used in WHERE clauses
- No index on `fullName` — a B-tree index cannot accelerate leading-wildcard searches (`ILIKE '%query%'`). At 10,000 rows a sequential scan is sufficient (~1–5ms). A trigram index (`pg_trgm`) would be the correct approach if the dataset grows significantly.
- `currency` stored alongside `salary` — values are never mixed or converted across currencies
- `country` validation uses canonical full English country names (e.g. `United States`, `United Kingdom`, `United Arab Emirates`, `India`) validated authoritatively on the backend via Fastify/Ajv schema `enum`. Abbreviations like `USA`, `UK`, `UAE` are not accepted. `currency` is authoritatively validated against the ISO 4217 currency list.

---

## 5. API Endpoints

Base URL: `https://api.railway.app` (Railway deployment)

### Employee Resource

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | List active employees (paginated, filtered, searchable) |
| `POST` | `/api/employees` | Create a new employee |
| `GET` | `/api/employees/:id` | Get a single employee |
| `PUT` | `/api/employees/:id` | Update an employee |
| `PATCH` | `/api/employees/:id/deactivate` | Soft-delete — sets `isActive = false` |

**Query parameters for `GET /api/employees`:**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Records per page (default: 20) |
| `search` | string | Name search — `ILIKE '%query%'` substring match |
| `country` | string | Filter by country |
| `department` | string | Filter by department |
| `employmentType` | string | Filter by employment type |

**Response contract for `GET /api/employees`:**
```json
{
  "data": [
    {
      "id": "clx...",
      "fullName": "Alice Johnson",
      "department": "Engineering",
      "jobTitle": "Senior Engineer",
      "employmentType": "Full-time",
      "hireDate": "2021-03-15",
      "country": "USA",
      "currency": "USD",
      "salary": "120000.00",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10000,
    "totalPages": 500
  }
}
```
> Note: `salary` is returned as a string to preserve `Decimal` precision. JSON numbers cannot represent all `Decimal(12,2)` values accurately.

### Analytics Resource

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | Dashboard data: active headcount, salary analytics by country (avg/min/max in native currency), headcount by department, headcount by employment type |

**Response contract for `GET /api/analytics/summary`:**
```json
{
  "headcount": 10000,
  "byCountry": [
    {
      "country": "USA",
      "currency": "USD",
      "avgSalary": "112000.00",
      "minSalary": "45000.00",
      "maxSalary": "280000.00",
      "count": 3200
    }
  ],
  "byDepartment": [
    { "department": "Engineering", "count": 1800 },
    { "department": "Product", "count": 900 }
  ],
  "byEmploymentType": [
    { "employmentType": "Full-time", "count": 8200 },
    { "employmentType": "Part-time", "count": 1100 },
    { "employmentType": "Contract", "count": 700 }
  ]
}
```
> Note: `byCountry` groups by `country + currency` — salaries in different currencies are never averaged together. `MIN()` and `MAX()` are calculated as part of the existing country aggregation query, avoiding additional database round trips. `byDepartment` returns headcount only — no salary aggregation across currencies.

**Error response contract (all endpoints):**
```json
{ "error": "Employee not found", "statusCode": 404 }
```

---

## 6. Backend Layer Responsibilities

```
┌──────────────────────────────────┐
│           Route Handler          │  ← Parses request, validates input,
│    employees.ts / analytics.ts   │    returns HTTP response
└──────────────────┬───────────────┘
                   │ calls
┌──────────────────▼───────────────┐
│            Service Layer         │  ← Contains all business logic,
│  employeeService / analytics     │    constructs DB queries, transforms data
└──────────────────┬───────────────┘
                   │ uses
┌──────────────────▼───────────────┐
│          Prisma Client           │  ← DB access, query execution
│             db.ts                │
└──────────────────┬───────────────┘
                   │
┌──────────────────▼───────────────┐
│        PostgreSQL on Neon        │
└──────────────────────────────────┘
```

---

## 7. Frontend Data Flow

```
Page Component (App Router)
      │
      ▼
TanStack Query hook (useEmployees / useAnalytics)
      │  ← Handles caching, loading, error states, refetching
      ▼
API client (fetch wrapper in lib/api.ts)
      │
      ▼
Backend REST API (Railway)
      │
      ▼
PostgreSQL (Neon)
```

**Cache invalidation:** After any CRUD operation (create/update/delete), TanStack Query automatically invalidates the `employees` query key, triggering a background refetch of the list. No manual state management needed.

---

## 8. Testing Architecture

### Backend Unit Tests (Services) — Primary
- **Tool:** Vitest + vitest-mock-extended
- **Approach:** Mock the Prisma client entirely. Test service functions directly.
- **What's tested:** Pagination logic, filter composition, analytics aggregations, CRUD + soft-delete operations
- **Speed:** No DB connection, no HTTP — milliseconds per test

### Backend Route Tests
- **Tool:** Vitest + Fastify's built-in `inject()`
- **Approach:** Call routes via in-process HTTP simulation. Services use mocked Prisma.
- **What's tested:** HTTP status codes, request validation, error responses

### Database Integration Tests — Targeted
- **Tool:** Vitest against a real PostgreSQL instance (Neon test branch or local Postgres)
- **Approach:** Focused integration tests that run against a real database to verify real PostgreSQL behavior without turning every test into an integration test.
- **What's tested:**
  - Prisma schema definition & migrations execution
  - Employee CRUD persistence and `Decimal(12,2)` precision round-trip
  - Soft deletion — confirm `isActive = false` excludes employee from list queries and analytics
  - Server-side pagination and query filter composition against real DB indexes
  - Analytics SQL aggregation — verify computed `avgSalary`, `minSalary`, `maxSalary`, and counts match actual database aggregations without currency mixing
  - Substring name search — verify `ILIKE '%query%'` behavior against real PostgreSQL
- **Rationale:** Mocked tests cannot verify Prisma migration SQL, `Decimal` precision loss, or SQL `GROUP BY` aggregation behavior against real PostgreSQL. Real DB integration tests cover these edge cases while keeping the overall testing pyramid sensible.

### Frontend Component Tests
- **Tool:** Vitest + React Testing Library + jsdom
- **What's tested:** Employee table renders correct data, form validation, dashboard summary cards display values correctly

### What is NOT tested
- Prisma itself (tested by Prisma team)
- End-to-end browser flows (out of scope for MVP)

---

## 9. Performance Strategy

| Concern | Solution |
|---|---|
| 10,000 employee records | Server-side pagination — never fetch all rows |
| Name search | `WHERE fullName ILIKE '%query%'` — sequential scan; no B-tree index (leading wildcard cannot use one). At 10K rows this is ~1–5ms. Trigram index (`pg_trgm`) is the correct next step at larger scale. |
| Filtering | `WHERE country = ? AND department = ? AND isActive = true` — indexed columns, compound DB query |
| Analytics | Four concurrent PostgreSQL aggregation queries executed via `Promise.all`: (1) active headcount, (2) salary by country — `AVG`, `MIN`, `MAX`, `COUNT` grouped by `country + currency`, (3) headcount by department, (4) headcount by employment type. `MIN()` and `MAX()` are calculated as part of the existing country aggregation query, avoiding additional database round trips. No in-memory aggregation. |
| DB indexes | Defined on `country`, `department`, `employmentType`, `isActive` — all columns used in WHERE clauses |
| Connection pooling | Neon handles serverless connection pooling natively |

---

## 10. Deployment Architecture

```
Developer → Git push → GitHub
                          │
             ┌────────────┴────────────┐
             │                         │
       Vercel (auto-deploy)      Railway (auto-deploy)
       frontend/ → Next.js       backend/ → Fastify
       NEXT_PUBLIC_API_URL env   DATABASE_URL env
             │                         │
             └──────────┬──────────────┘
                        │
                  Neon PostgreSQL
                  (connection via DATABASE_URL)
```

**Environment variables:**

| Service | Variable | Value |
|---|---|---|
| Frontend (Vercel) | `NEXT_PUBLIC_API_URL` | Railway backend URL |
| Backend (Railway) | `DATABASE_URL` | Neon PostgreSQL connection string |

---

## 11. Deliberately Simple Choices

This architecture deliberately avoids:
- **Microservices** — one backend service is sufficient for this scale
- **Message queues / event buses** — no async processing needed
- **Redis caching** — PostgreSQL with indexes is fast enough at 10K records
- **GraphQL** — REST is simpler and sufficient for this data model
- **Turborepo / monorepo tooling** — two independent packages need no build orchestration
- **Docker** — Railway and Vercel handle containerisation internally

> Good engineering judgment is knowing what *not* to build.

---

*Document version: 1.3 | Date: August 2026 | SDD consistency pass — explicit soft-delete deactivation wording, testing strategy alignment, finalized analytics scope*
