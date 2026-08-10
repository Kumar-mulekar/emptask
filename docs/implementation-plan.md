# Implementation Plan
## Employee Salary Management Software — ACME Org
*Prepared for: Incubyte Take-Home Assessment*

> **Source of truth:** `requirements.md` (v1.3) and `architecture.md` (v1.3).
> No architectural or product decisions should be changed silently during implementation.
> If a conflict or gap is discovered, STOP and discuss before continuing.

---

## Dependency Overview

```
Phase A — Project Foundation
        ↓
Phase B — Database (Prisma + schema + migration + seed)
        ↓
Phase C — Backend Foundation (Fastify setup, Prisma integration)
        ↓
Phase D — Employee API (CRUD + pagination + search + filters + soft delete)
        ↓
Phase E — Analytics API (summary endpoint, 4 PostgreSQL queries)
        ↓
Phase F — Frontend Foundation (Next.js, Tailwind, shadcn, API client)
        ↓
Phase G — Employee Management UI
        ↓
Phase H — Analytics Dashboard
        ↓
Phase I — Testing
        ↓
Phase J — Final Validation and Delivery
```

**On parallelisation:** Frontend work (Phase F) could technically begin after Phase C since the API contract is documented. However, for this assessment, sequential development is preferred — it reduces context switching and ensures the API is validated before the frontend integrates it. Do not force parallelism.

---

## Phase A — Project Foundation

### Goal
Establish the repository structure, configure both backend and frontend packages, and validate that both build cleanly before any business logic or application code is added.

### Includes
- Root `.gitignore` — covers `node_modules/`, `.env`, `.env.local`, `.next/`, `dist/`, `prisma/generated/`
- Root `README.md` — project description, getting-started instructions, documentation index
- **Backend (`backend/`)**
  - `package.json` — runtime: `fastify`, `@prisma/client`, `dotenv`; dev: `typescript`, `tsx`, `vitest`, `vitest-mock-extended`, `@types/node`, `prisma`
  - `tsconfig.json` — strict mode, `ES2022`, `CommonJS`, `moduleResolution: node`, `outDir: dist`
  - `.env.example` — `DATABASE_URL=`, `PORT=3001`, `NODE_ENV=development` (placeholders only)
  - Empty directory stubs with `.gitkeep`: `src/routes/`, `src/services/`, `src/schemas/`, `tests/unit/`, `tests/integration/`
- **Frontend (`frontend/`)**
  - Next.js initialised with App Router, TypeScript, Tailwind CSS
  - shadcn/ui initialised (`npx shadcn@latest init`) — init step only, no components installed yet
  - `.env.local.example` — `NEXT_PUBLIC_API_URL=` (placeholder only)
  - No pages or components beyond the Next.js default scaffold

### Does NOT include
- Database connection, Prisma schema, migration, or seed (Phase B)
- Fastify server application code (`src/index.ts`) or Prisma client singleton (`src/db.ts`) (Phase C)
- Fastify routes or services (Phase C/D)
- UI pages or components (Phase G/H)
- Any environment variable values committed to source control
- Tests (introduced per phase)

### Dependencies
None — this is the starting point.

> **Note:** The following Phase A files were created early during planning and already exist on disk:
> `.gitignore`, `README.md`, `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`.
> These should be verified before Phase A is marked complete. Remaining items (frontend scaffold, directory stubs) still need to be created.

### Implementation approach
1. Verify/finalise the five existing Phase A files listed above
2. Initialise Next.js frontend: `npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
3. Run `npx shadcn@latest init` inside `frontend/`
4. Create `frontend/.env.local.example`
5. Create backend directory stubs (`.gitkeep` files in `src/routes/`, `src/services/`, `src/schemas/`, `tests/unit/`, `tests/integration/`)
6. Run `npm install` in `backend/`

### Definition of Done
| Check | Criterion |
|---|---|
| Backend compiles | `cd backend && npx tsc --noEmit` exits 0 |
| Frontend starts | `cd frontend && npm run dev` serves on port 3000 with no errors |
| No secrets committed | `.env`, `.env.local` absent from Git; only `.example` files present |
| `.gitignore` effective | `node_modules/`, `.env`, `.next/` not tracked |
| Directory structure matches | All directories from `architecture.md` §3 exist |

---

## Phase B — Database

### Goal
Define the approved Prisma schema, apply the first migration, and populate the database with a deterministic, reproducible dataset of approximately 10,000 employees.

### Includes
- `backend/prisma/schema.prisma` — exact schema from `architecture.md` §4:
  - 11 fields: `id`, `fullName`, `department`, `jobTitle`, `employmentType`, `hireDate`, `country`, `currency`, `salary` (`Decimal(12,2)`), `isActive`, `createdAt`, `updatedAt`
  - 4 indexes: `country`, `department`, `employmentType`, `isActive`
  - **No index on `fullName`** — B-tree cannot accelerate leading-wildcard searches
- `prisma migrate dev --name init` — generates and applies the first migration
- `backend/prisma/seed.ts` — deterministic seed script (see approach below)

**Seed script approach:**
- **PRNG:** Mulberry32 — a single pure function seeded with a fixed integer constant (e.g. `42`). No external dependency required. Same constant always produces identical output.
- **Workflow:** `deleteMany()` → `createMany()` in batches of 500 (20 batches for 10,000 records)
- **Labelled** in source as a development/assessment seed utility, not a production data-reset mechanism

**Country/currency distribution:**

| Country | Currency | Weight |
|---|---|---|
| India | INR | 28% |
| USA | USD | 25% |
| UK | GBP | 12% |
| Germany | EUR | 10% |
| Canada | CAD | 8% |
| Australia | AUD | 7% |
| Singapore | SGD | 5% |
| UAE | AED | 5% |

**Employment types:** Full-time ~82%, Contract ~11%, Part-time ~7%
**Active/inactive:** `isActive = true` ~95%, `false` ~5%

**Salary ranges (annual, native currency):**

| Country | Currency | Min | Max |
|---|---|---|---|
| India | INR | 4,00,000 | 35,00,000 |
| USA | USD | 45,000 | 2,80,000 |
| UK | GBP | 28,000 | 1,90,000 |
| Germany | EUR | 35,000 | 1,50,000 |
| Canada | CAD | 50,000 | 2,00,000 |
| Australia | AUD | 55,000 | 2,20,000 |
| Singapore | SGD | 45,000 | 1,80,000 |
| UAE | AED | 80,000 | 4,00,000 |

Salaries rounded to nearest 1,000. No cross-currency values on a single employee.

**Departments (8 fixed):** Engineering, Product, Sales, Marketing, HR, Finance, Operations, Design — each with 4 fixed job title options.
**Names:** Small hardcoded arrays (~40 first names, ~40 last names) selected via PRNG. Duplicates acceptable and realistic.
**Hire dates:** Distributed across 2015–2025 using PRNG. Implementation choice only — not a business requirement.

### Does NOT include
- Fastify server application setup (`src/index.ts`) or Prisma client singleton (`src/db.ts`) (Phase C)
- Fastify routes or services (Phase C/D)
- API endpoints (Phase D/E)
- Frontend (Phase F)
- Application tests (Phase I)
- Any real database credentials committed

### Dependencies
- Phase A complete (package.json installed, directory structure in place)
- User has provisioned a PostgreSQL database and placed `DATABASE_URL` in `backend/.env`

### Definition of Done
| Check | Criterion |
|---|---|
| Migration succeeds | `prisma migrate dev` exits 0 |
| Schema matches architecture | All 11 fields with correct types confirmed |
| `salary` is `NUMERIC(12,2)` | Confirmed via migration SQL or database console |
| 4 indexes exist | `country`, `department`, `employmentType`, `isActive` confirmed |
| No `fullName` index | Absent from schema and database |
| Seed completes | `tsx prisma/seed.ts` exits 0 |
| Total row count | 10,000 rows |
| Active/inactive split | ~9,500 active / ~500 inactive |
| Country coverage | All 8 countries present |
| Employment types | All 3 types present |
| Determinism verified | Re-seeding a fresh database with the same seed constant produces identical non-database-generated employee attributes across all rows (verified via attribute comparison or hash over deterministic fields, excluding DB-generated `id`, `createdAt`, `updatedAt`) |
| No credentials committed | `.env` gitignored; only `.env.example` in Git |

### Risks / Mitigations
| Risk | Mitigation |
|---|---|
| Neon cold-start timeout during bulk insert | Batch size 500; 20 batches rather than 10,000 individual inserts |
| `Decimal` TypeScript type mismatch | Generate salaries as integers (number); Prisma converts to `NUMERIC(12,2)` — verified post-migration |
| Non-determinism | Mulberry32 with fixed constant; no `Date.now()`, `Math.random()`, or `crypto` in generator path |
| Prisma client not generated before seed | `prisma generate` must precede seed; documented in README |

---

## Phase C — Backend Foundation

### Goal
Establish a production-ready Fastify application: startup, environment handling, Prisma client integration, global error handling, and validation infrastructure. No business routes yet.

### Includes
- `backend/src/index.ts` — full Fastify application:
  - `dotenv/config` loaded first
  - Pino logger (Fastify built-in, structured logging)
  - Global error handler registered
  - Graceful shutdown on `SIGTERM`/`SIGINT`
  - `PORT` from env (default 3001), `HOST` `0.0.0.0` for Railway compatibility
- `backend/src/db.ts` — Prisma client singleton shared across route handlers and services
- CORS configured (permissive in development; tighten for production via env)
- `/health` route returns `{ "status": "ok", "timestamp": "..." }`
- Route registration via Fastify plugin pattern — Phase D/E add routes without modifying `index.ts`
- Fastify JSON schema validation infrastructure confirmed working (`schemas/` directory wired)

### Does NOT include
- Employee routes (Phase D)
- Analytics routes (Phase E)
- Business logic services (Phase D/E)
- Frontend (Phase F)
- Tests (Phase I)

### Dependencies
- Phase B complete (Prisma schema migrated, seed complete, DB connection confirmed working)

### Definition of Done
| Check | Criterion |
|---|---|
| Server starts | `npm run dev` starts cleanly; Pino logs confirm port and host |
| `/health` responds | `GET /health` returns 200 `{ "status": "ok" }` |
| Prisma connects | `backend/src/db.ts` connects successfully; no connection errors on startup |
| Error handler works | Invalid route returns `{ "error": "...", "statusCode": 404 }` |
| Graceful shutdown | `SIGTERM` closes server and Prisma connection without hanging |
| TypeScript clean | `tsc --noEmit` passes with 0 errors |

---

## Phase D — Employee API

### Goal
Implement all employee CRUD endpoints as specified in `architecture.md` §5, with correct pagination, search, filtering, validation, and soft-delete behaviour.

### Includes

**Endpoints (exactly from `architecture.md`):**
```
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
PATCH  /api/employees/:id/deactivate   ← soft delete; sets isActive = false
```

> **Note:** The deactivate endpoint is `PATCH /api/employees/:id/deactivate`, NOT `DELETE /api/employees/:id`. This is required by the approved architecture to implement soft-delete semantics. Hard delete must not be implemented.

**`GET /api/employees` behaviour:**
- Always filters `isActive = true` — inactive employees never appear in listings
- Query params: `page` (default 1), `limit` (default 20), `search`, `country`, `department`, `employmentType`
- Search: `WHERE fullName ILIKE '%{search}%'` — sequential scan, no index (correct by design)
- Response: `{ data: [...], pagination: { page, limit, total, totalPages } }` — from `architecture.md` §5
- `salary` serialised as string to preserve `Decimal` precision

**Validation (POST and PUT):**
- Required: `fullName`, `department`, `jobTitle`, `employmentType`, `hireDate`, `country`, `currency`, `salary`
- `employmentType` must be one of: `Full-time`, `Part-time`, `Contract`
- `salary` must be a positive number
- `hireDate` must be a valid date

**Deactivate behaviour:**
- Sets `isActive = false`; data is retained
- Returns 404 if employee not found
- Returns 409 if employee already inactive

**Error responses:** `{ "error": "...", "statusCode": N }` for all errors — matches `architecture.md` §5

**Layer separation:**
- `src/routes/employees.ts` — HTTP parsing, validation, response only
- `src/services/employeeService.ts` — all business logic and Prisma queries

### Does NOT include
- Analytics (Phase E)
- Frontend (Phase G)
- Bulk import/export (out of scope)
- Hard delete (soft delete only)

### Dependencies
- Phase C complete (Fastify running, Prisma connected, plugin pattern established)

### Definition of Done
| Check | Criterion |
|---|---|
| `GET /api/employees` | Returns paginated active employees; correct envelope |
| Pagination | `page=2&limit=10` returns correct slice with correct `total` |
| Search | `?search=ali` returns case-insensitive name matches |
| Country/dept/type filters | Each filter works independently and combined |
| Inactive excluded | Deactivated employees absent from list |
| `POST /api/employees` | Creates and returns 201 with full record |
| Missing field validation | Returns 400 with descriptive error |
| `GET /api/employees/:id` | Returns correct employee |
| 404 on missing id | Returns `{ "error": "Employee not found", "statusCode": 404 }` |
| `PUT /api/employees/:id` | Updates and returns updated record |
| `PATCH /:id/deactivate` | Sets `isActive = false`; employee disappears from list |
| `salary` as string | Response `salary` field is `"120000.00"` not `120000` |
| TypeScript clean | `tsc --noEmit` passes |

### Risks / Mitigations
| Risk | Mitigation |
|---|---|
| `Decimal` → JSON number | Explicitly `String(employee.salary)` in service response mapping |
| Empty `search` param | Guard: if `search` is undefined or empty string, omit the WHERE clause |
| Page/limit out of bounds | Clamp `page` ≥1; clamp `limit` to 1–100 |

---

## Phase E — Analytics API

### Goal
Implement `GET /api/analytics/summary` using the approved analytics scope. All aggregation in PostgreSQL; no in-memory computation.

### Includes

**Endpoint:**
```
GET /api/analytics/summary
```

**Response shape (exactly from `architecture.md` §5):**
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
    { "department": "Engineering", "count": 1800 }
  ],
  "byEmploymentType": [
    { "employmentType": "Full-time", "count": 8200 }
  ]
}
```

**SQL aggregation strategy (from `architecture.md` §9):**
Four queries executed concurrently via `Promise.all`:

```
Query 1: COUNT(*) WHERE isActive = true
         → headcount

Query 2: GROUP BY country, currency
         SELECT country, currency, AVG(salary), MIN(salary), MAX(salary), COUNT(*)
         WHERE isActive = true
         → byCountry

Query 3: GROUP BY department
         SELECT department, COUNT(*) WHERE isActive = true
         → byDepartment (headcount only — no salary fields)

Query 4: GROUP BY employmentType
         SELECT employmentType, COUNT(*) WHERE isActive = true
         → byEmploymentType
```

Key rules:
- All 4 queries filter `WHERE isActive = true`
- `byCountry` groups by `country + currency` — currencies never mixed
- `byDepartment` is **headcount only** — no salary fields, no currency fields
- `avgSalary`, `minSalary`, `maxSalary` serialised as strings (same rule as employee salary)
- No in-memory aggregation

**Layer separation:**
- `src/routes/analytics.ts` — route handler only
- `src/services/analyticsService.ts` — all 4 queries, `Promise.all`, response assembly

### Does NOT include
- Department salary analytics (removed per requirements v1.2)
- Exchange-rate conversion (out of scope)
- Drill-down filters on analytics endpoint
- Caching layer (explicitly avoided per `architecture.md` §11)
- Frontend dashboard (Phase H)

### Dependencies
- Phase D complete (confirms Prisma integration, service pattern, and route plugin pattern working)

### Definition of Done
| Check | Criterion |
|---|---|
| `GET /api/analytics/summary` | Returns 200 with correct shape |
| `headcount` correct | Matches `SELECT COUNT(*) WHERE isActive = true` |
| `byCountry` — 8 entries | One per country for seed data |
| `avgSalary`/`minSalary`/`maxSalary` | Correct for each country |
| Currencies not mixed | No `byCountry` row spans multiple currencies |
| `byDepartment` | 8 entries; no `salary`, `currency`, or `avgSalary` fields present |
| `byEmploymentType` | 3 entries; counts sum to `headcount` |
| Inactive excluded | Deactivating an employee reduces headcount by 1 |
| Salary as string | All salary fields are strings, not JSON numbers |
| Concurrent queries | Implemented with `Promise.all` |

### Risks / Mitigations
| Risk | Mitigation |
|---|---|
| Prisma `groupBy` without native `AVG`/`MIN`/`MAX` support | Use `prisma.$queryRaw` for Query 2; explicit TypeScript interface for result type |
| `Decimal` from raw query untyped | Cast fields explicitly; serialise with `.toString()` |

---

## Phase F — Frontend Foundation

### Goal
Establish the Next.js application shell: routing, layout, API client, TanStack Query, and reusable UI primitives. No employee or dashboard features yet.

### Includes
- `frontend/app/layout.tsx` — root layout with font, TanStack Query provider, navigation bar, basic shell
- `frontend/app/page.tsx` — placeholder dashboard home page
- `frontend/app/employees/page.tsx` — placeholder employees page
- `frontend/lib/api.ts` — typed fetch wrapper:
  - Base URL from `NEXT_PUBLIC_API_URL`
  - Generic `get<T>`, `post<T>`, `put<T>`, `patch<T>` helpers
  - Consistent error handling — throws typed error on non-2xx
- `frontend/lib/queryClient.ts` — TanStack Query client configuration
- `frontend/types/employee.ts` — TypeScript interfaces matching API response contracts from `architecture.md` §5
- Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- Install shadcn components needed for layout only: `button`, `card` (on-demand, not all at once)
- Shared `LoadingSpinner` and `ErrorMessage` component stubs
- Navigation bar: app name, links to `/` (Dashboard) and `/employees`

### Does NOT include
- Employee list, table, forms (Phase G)
- Analytics dashboard content (Phase H)
- Authentication
- End-to-end tests

### Dependencies
- Phase E complete (API endpoints responding correctly; contract finalised and validated)

### Definition of Done
| Check | Criterion |
|---|---|
| Frontend starts | `npm run dev` on port 3000 without errors |
| Routing works | `/` and `/employees` render placeholder pages |
| API client works | `api.get('/health')` returns `{ "status": "ok" }` |
| TanStack Query wired | `useQuery` usable in components without error |
| TypeScript clean | `npx tsc --noEmit` passes in frontend |
| `NEXT_PUBLIC_API_URL` respected | Dev API client points to `localhost:3001` |

---

## Phase G — Employee Management UI

### Goal
Implement the full employee management interface: paginated list with search and filters, create and edit forms, and deactivate confirmation. All functionality from FR 1–6 of `requirements.md`.

### Includes
- `frontend/app/employees/page.tsx` — full employee list page:
  - Paginated table (shadcn `Table`)
  - Columns: Name, Department, Job Title, Employment Type, Country, Currency, Annual Salary, Hire Date, Actions
  - Server-side pagination controls
  - Search input — debounced (~300ms), drives `?search=` param
  - Filter dropdowns: Country, Department, Employment Type
  - "Add Employee" button → Create modal
  - "Edit" and "Deactivate" actions per row
- TanStack Query hooks: `useEmployees`, `useEmployee`, `useCreateEmployee`, `useUpdateEmployee`, `useDeactivateEmployee`
- Create/Edit modal — shadcn `Dialog` with all employee fields and validation
- Deactivate confirmation — shadcn `AlertDialog`
- Loading, error, and empty states
- Cache invalidation after all mutations (invalidates `employees` query key)

**Salary display:** Always show currency code alongside salary (e.g. `USD 120,000.00`). Never imply cross-currency comparison.

### Does NOT include
- Analytics (Phase H)
- Bulk import/export (out of scope)
- Reactivation of inactive employees (not in requirements)
- Hard delete

### Dependencies
- Phase F complete (API client, TanStack Query, routing, layout confirmed working)

### Definition of Done
| Check | Criterion |
|---|---|
| List renders | 20 active employees shown by default |
| Pagination | Next/prev and page controls work correctly |
| Search | Name search filters correctly within ~300ms debounce |
| Filters | Country, department, employment type filters work independently and combined |
| Create | Form submits; new employee appears in list |
| Validation | Missing required field shows inline error before submit |
| Edit | Salary update reflects in list immediately after mutation |
| Deactivate | Employee disappears from list after confirmation |
| Loading state | Spinner shown during API calls |
| Error state | Network error shows user-friendly message |
| Salary display | Currency code visible next to every salary value |

---

## Phase H — Analytics Dashboard

### Goal
Implement the analytics dashboard home page showing the four approved metrics. Simple and focused — aligned with the assessment scope.

### Includes
- `frontend/app/page.tsx` — analytics dashboard:
  - **Section 1: Active Headcount** — prominent single-number card
  - **Section 2: Salary by Country** — table: Country, Currency, Avg Annual Salary, Min, Max, Employees
  - **Section 3: Headcount by Department** — table or simple bar: Department, Count
  - **Section 4: Headcount by Employment Type** — table or summary: Type, Count
- TanStack Query hook: `useAnalytics()` — `GET /api/analytics/summary`
- Currency code always shown explicitly alongside salary values
- Loading and error states
- Navigation link to `/employees`

**Constraints:**
- Do not add drill-downs, date filters, exchange rates, or additional analytics
- Do not add a chart library without prior discussion and approval — it was not in the approved stack
- Department section shows headcount only — no salary values

### Does NOT include
- Department salary analytics (removed per requirements v1.2)
- Exchange-rate display or conversion
- Drill-down or filter capabilities on dashboard

### Dependencies
- Phase G complete (confirms all frontend patterns, shared components, and API integration working)

### Definition of Done
| Check | Criterion |
|---|---|
| Dashboard loads | `/` renders without error |
| Headcount correct | Displayed count matches database `COUNT(*)` |
| Salary by country | All 8 countries shown with avg, min, max, count |
| Currency explicit | Currency code visible next to every salary value |
| No currency mixing | No row combines salaries from multiple currencies |
| Dept headcount | All 8 departments with correct counts |
| Employment type | All 3 types shown with counts |
| Loading/error states | Handled correctly |

---

## Phase I — Testing

### Goal
Implement the testing suite as defined in `architecture.md` §8: unit tests (mocked Prisma), backend route tests, targeted database integration tests, and frontend component tests.

### Test structure
```
backend/tests/
  unit/
    employeeService.test.ts     ← Vitest + vitest-mock-extended
    analyticsService.test.ts
  integration/
    employees.test.ts           ← Vitest + real PostgreSQL
    analytics.test.ts
```

### Backend Unit Tests (`tests/unit/`)

**`employeeService.test.ts`:**
- List returns only active employees (`isActive: true` filter verified)
- Pagination: skip/take calculated correctly for page 2
- Search filter present in Prisma args when `search` provided
- Country, department, employment type filters applied
- Multiple filters combined (ANDed)
- Create returns new employee with all fields
- Update returns updated record
- Deactivate sets `isActive = false`
- Deactivate throws 409 if already inactive
- findById returns null-safe 404 behaviour

**`analyticsService.test.ts`:**
- Response has correct 4-key shape
- `byCountry` entries have all required fields including `minSalary`/`maxSalary`
- `byDepartment` entries have no salary fields
- `byEmploymentType` has 3 entries

### Backend Route Tests (using Fastify `inject()`)
- `GET /api/employees` returns 200 with pagination envelope
- `GET /api/employees` with invalid `page` returns 400
- `POST /api/employees` with missing field returns 400
- `GET /api/employees/:id` not found returns 404
- `PATCH /:id/deactivate` returns 200
- `GET /api/analytics/summary` returns 200 with correct shape

### Database Integration Tests (`tests/integration/`)
4–6 focused tests against a real PostgreSQL instance:

| Test | What is verified |
|---|---|
| Create + retrieve round-trip | All fields persisted; `salary` is `NUMERIC(12,2)` with exact value |
| Soft delete — list exclusion | After `PATCH /deactivate`, employee absent from `GET /api/employees` |
| Soft delete — analytics exclusion | Deactivated employee not counted in analytics headcount |
| Analytics — country aggregation | `AVG`/`MIN`/`MAX` correct for known small dataset; currencies not mixed |
| ILIKE search | `?search=ali` returns correct case-insensitive matches |

> **Test database:** Integration tests require `TEST_DATABASE_URL` in environment pointing to a separate database or branch. Must not run against the development/production database. Each test cleans up its own records in `afterEach`.

### Frontend Component Tests (Vitest + React Testing Library)
- Employee table renders rows from mocked data
- Pagination controls present
- Search input triggers callback on change
- Create form shows validation error on missing required field before submit
- Salary shown with currency code alongside value
- Dashboard headcount card renders correct number from mocked response

### Does NOT include
- End-to-end browser tests (Playwright/Cypress — out of scope)
- Tests for Prisma itself
- Load or performance testing

### Dependencies
- Phase H complete (all features implemented)

### Definition of Done
| Check | Criterion |
|---|---|
| Unit tests pass | `npm run test:run` exits 0 in backend |
| No real DB in unit tests | Confirmed via mock verification |
| Integration tests pass | Against real PostgreSQL with `TEST_DATABASE_URL` |
| Integration tests isolated | Never touch development/production DB |
| Frontend tests pass | Component tests pass |
| All tests pass together | `npm run test:run` in both packages exits 0 |

### Risks / Mitigations
| Risk | Mitigation |
|---|---|
| `vitest-mock-extended` mock setup boilerplate | Shared `test/setup.ts` with Prisma mock factory; referenced by each test file |
| Integration tests polluting dev DB | `TEST_DATABASE_URL` mandatory; tests fail immediately if not set |
| Flaky integration tests | Each test inserts and deletes its own records in `afterEach` |

---

## Phase J — Final Validation and Delivery

### Goal
Verify the complete application against the approved requirements and architecture. Prepare for Incubyte review.

### Includes
- Full test suite (`npm run test:run` in both `backend/` and `frontend/`)
- TypeScript build check (`tsc --noEmit` in both packages)
- Linting if configured (ESLint — must pass cleanly if present)
- Seed verification on a fresh database (wipe, re-seed, verify counts)
- API smoke test — manual check of each endpoint against live seeded database
- Analytics spot-check — verify avg/min/max for a known country against raw SQL
- Frontend walkthrough: employee list → create → edit → deactivate → dashboard
- **Deployment:**
  - Frontend deployed to Vercel (auto-deploy from `frontend/`)
  - Backend deployed to Railway (auto-deploy from `backend/`)
  - `NEXT_PUBLIC_API_URL` set in Vercel environment to Railway URL
  - `DATABASE_URL` set in Railway environment
- **Documentation review:**
  - `README.md` — getting-started instructions verified accurate
  - `docs/requirements.md` — re-read against implementation; note any deviations
  - `docs/architecture.md` — re-read against implementation; note any deviations
  - `docs/ai-workflow.md` — update with implementation-phase AI decisions
  - Create `docs/tradeoffs.md` — document trade-offs or deviations discovered during implementation

### Does NOT include
- New features or analytics beyond approved scope
- Docker (explicitly out of scope per `architecture.md` §11)
- Authentication (explicitly out of scope)

### Dependencies
- All Phases A–I complete

### Definition of Done
| Check | Criterion |
|---|---|
| All tests pass | `test:run` exits 0 in both packages |
| TypeScript clean | `tsc --noEmit` passes in both |
| Seed verified | 10,000 rows, correct distribution, deterministic |
| All 6 endpoints verified | Respond correctly to manual requests |
| Analytics verified | Counts and salary values match database |
| Frontend verified | All CRUD flows complete in browser |
| Dashboard verified | All 4 analytics sections display correct data |
| Deployed | Live Vercel and Railway URLs accessible |
| ENV configured | No hardcoded URLs or credentials in source |
| Documentation current | README accurate; deviations noted |

---

## AI / Antigravity Development Workflow

```
Approved implementation plan
          ↓
Select one bounded phase
          ↓
Antigravity implements only that phase
          ↓
Human reviews all changed files
          ↓
Human runs validation commands
          ↓
Human approves
          ↓
Next phase
```

**Antigravity MUST NOT:**
- Jump ahead to future phases
- Silently modify `requirements.md` or `architecture.md`
- Add dependencies not in the approved tech stack without discussion
- Introduce infrastructure not in the approved architecture (caching, queues, Docker, etc.)
- Refactor unrelated code while implementing a phase
- Make a product or architecture decision without discussion

**If Antigravity discovers a conflict or missing decision during implementation:**
```
STOP
↓
Explain the issue clearly
↓
Present options
↓
Wait for human approval
↓
Continue only after explicit approval
```

---

## Implementation Risks

| Risk | Phase | Mitigation |
|---|---|---|
| `Decimal` serialised as JSON number | D, E | Explicitly `String(value)` in service response mapping; integration test verifies round-trip |
| Prisma `groupBy` no native `AVG`/`MIN`/`MAX` | E | Use `prisma.$queryRaw` for country aggregation; explicit TypeScript interface for result |
| Non-deterministic seed | B | Mulberry32 with fixed constant; no `Date.now()`, `Math.random()` in generator path |
| Seed timeout on Neon | B | Batch size 500; 20 batches of `createMany()` |
| Integration tests hitting dev DB | I | `TEST_DATABASE_URL` required; fail immediately if not set |
| Frontend/API contract mismatch | G, H | TypeScript interfaces in `frontend/types/employee.ts` mirror `architecture.md` §5 shapes exactly |
| CORS blocking frontend | C | Permissive in dev; specific Vercel URL in production |
| `ILIKE` on leading wildcard | D | Documented design decision — sequential scan at 10K rows acceptable (~1–5ms) |
| shadcn component install | F, G | Install on-demand (`npx shadcn add {component}`); not all at once |
| Neon serverless pooling | B, D, E | Neon handles pooling natively; Prisma singleton prevents connection exhaustion |

---

## Implementation Completion Checklist

Use this checklist at Phase J to verify the implemented system against the approved specification.

### Functional Requirements (`requirements.md`)
- [ ] Employee list is paginated and server-side (FR 1)
- [ ] Name search works (FR 2)
- [ ] Country, department, employment type filters work (FR 3)
- [ ] Create employee with all required fields (FR 4)
- [ ] Edit employee including annual salary (FR 5)
- [ ] Deactivate — data retained, excluded from listings and analytics (FR 6)
- [ ] Dashboard — active headcount (FR 7a)
- [ ] Dashboard — avg/min/max salary by country in native currency, currencies not mixed (FR 7b)
- [ ] Dashboard — headcount by department (FR 7c)
- [ ] Dashboard — headcount by employment type (FR 7d)

### Out-of-scope confirmed absent
- [ ] No salary history or raise tracking
- [ ] No authentication
- [ ] No bulk CSV import/export
- [ ] No cross-currency salary comparison or conversion
- [ ] No payroll, tax, benefits, or attendance features

### Database
- [ ] Schema matches `architecture.md` §4 exactly (11 fields, correct types, 4 indexes)
- [ ] `salary` is `NUMERIC(12,2)` in PostgreSQL
- [ ] No `fullName` index
- [ ] Soft delete implemented; no hard delete
- [ ] Seed generates 10,000 employees deterministically
- [ ] Seed distribution matches approved plan

### Backend
- [ ] All 5 employee endpoints implemented and responding correctly
- [ ] `PATCH /:id/deactivate` used (not `DELETE`)
- [ ] Analytics endpoint returns correct 4-metric structure
- [ ] Route / Service / Prisma layer separation maintained
- [ ] `salary` returned as string in all API responses
- [ ] Currencies never mixed in analytics
- [ ] All queries filter `isActive = true` where required
- [ ] Error responses use `{ "error": "...", "statusCode": N }` shape

### Frontend
- [ ] Employee list page at `/employees`
- [ ] Dashboard page at `/`
- [ ] Pagination, search, filters functional
- [ ] Create, edit, deactivate flows complete
- [ ] Currency code visible alongside every salary value
- [ ] Loading and error states handled
- [ ] TanStack Query cache invalidated after mutations

### Testing
- [ ] Unit tests for `employeeService` covering key behaviours
- [ ] Unit tests for `analyticsService`
- [ ] Route tests for HTTP status codes and validation
- [ ] Integration tests (4–6) against real PostgreSQL
- [ ] Frontend component tests
- [ ] All tests pass with `npm run test:run`

### Deployment and Delivery
- [ ] Frontend deployed to Vercel and publicly accessible
- [ ] Backend deployed to Railway and publicly accessible
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel environment
- [ ] `DATABASE_URL` set in Railway environment
- [ ] No credentials in source code or committed files
- [ ] `README.md` getting-started instructions accurate
- [ ] `docs/requirements.md` consistent with implementation
- [ ] `docs/architecture.md` consistent with implementation
- [ ] `docs/ai-workflow.md` updated with implementation-phase notes
- [ ] `docs/tradeoffs.md` created

---

*Implementation plan version: 1.1 | Date: August 2026 | SDD consistency pass — aligned with requirements v1.3 and architecture v1.3*
