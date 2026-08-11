# AI Workflow Documentation
## Employee Salary Management Software — ACME Org
*Prepared for: Incubyte Take-Home Assessment*

---

## Overview

This document records how AI tools were used throughout the development of this project, what was generated vs. reviewed, and where AI output was corrected or overridden. It is intended to demonstrate intentional, critical use of AI — not passive acceptance of AI output.

---

## Tools Used

| Tool | Role |
|---|---|
| **Antigravity (Gemini)** | Primary AI pair-programming assistant used throughout all phases |

---

## Phase 1 — Assessment Understanding & Product Discovery

**AI role:** The AI analysed the Incubyte assessment document and facilitated a structured product discovery conversation — surfacing explicit requirements, gaps, ambiguities, and decisions that needed to be made before implementation.

**What AI did:**
- Identified the 15 explicit requirements from the assessment
- Identified 8 gaps/unspecified areas (salary history, auth, bulk import, etc.)
- Proposed options for each key product decision with trade-offs
- Recommended options for each decision

**What I (the engineer) decided:**
- Salary tracking: current only (no history)
- Employee fields: balanced 9-field model
- Currency: native only, no conversion
- Analytics: basic dashboard (headcount, avg by country/dept, employment type)
- Authentication: none
- Bulk import/export: none
- Employee table UX: pagination + search + filters
- Deployment: Vercel + Railway + Neon PostgreSQL

**AI accuracy:** High. The product framing was well-structured. No significant errors in this phase.

---

## Phase 2 — Requirements Document

**AI role:** Drafted `docs/requirements.md` based on the decisions agreed in Phase 1.

**What AI did:**
- Structured the one-page requirements document per the assessment's ask
- Distinguished between explicit Incubyte requirements, our product decisions, and assumptions
- Left two genuine open questions

**What I reviewed:**
- Verified all sections accurately reflected Phase 1 decisions — no invented requirements
- Salary unit was left as an unresolved open question (resolved in Phase 3 review)

**AI accuracy:** High. The document was correctly scoped and honest about what came from Incubyte vs. our decisions.

---

## Phase 3 — Architecture Discussion

**AI role:** Proposed architecture options for each layer — project structure, framework, ORM, API style, backend internals, frontend stack, testing, performance, deployment.

**What AI did:**
- Presented all realistic options with trade-offs for each decision
- Recommended options with justification

**What I decided:**
- Project structure: monorepo with independent `/frontend` and `/backend` (no shared packages)
- Backend framework: Fastify
- ORM: Prisma
- API style: REST
- Backend structure: layered (Routes → Services → Prisma)
- Frontend: Next.js App Router + TanStack Query + shadcn/ui
- Testing: Vitest + vitest-mock-extended + React Testing Library
- Performance: server-side pagination, indexed filters, aggregated SQL

**AI accuracy:** High. The architecture options were well-reasoned.

---

## Phase 3 Review — Architecture & Requirements Review

**AI role:** Acted as a senior architect reviewing the produced documents against the assessment for correctness, gaps, and defensibility.

**This phase is the most important for demonstrating intentional AI use.**

### Errors and Issues Found in AI-Generated Output

The following issues were identified during the review — they were in the AI-generated architecture document and were caught and corrected:

#### 1. False Index Claim (Significant Error)
**What the AI wrote:**
> `WHERE fullName ILIKE '%query%'` — server-side, indexed
> `@@index([fullName])`

**Why it was wrong:** A standard PostgreSQL B-tree index cannot accelerate a leading-wildcard search (`ILIKE '%query%'`). The index is unused in this case — PostgreSQL falls back to a sequential scan regardless.

**What we corrected:** Removed `@@index([fullName])` from the schema. Updated the performance docs to honestly state: "sequential scan over 10,000 rows is sufficient; trigram index (`pg_trgm`) is the correct approach at larger scale."

**Lesson:** AI can produce architecturally plausible but technically incorrect statements about database internals. This must be reviewed critically.

#### 2. Misleading Fastify Justification
**What the AI wrote:**
> "2–3× faster than Express"

**Why it was wrong:** While technically true in synthetic benchmarks, this is a poor justification for our use case. Our bottleneck is Neon/PostgreSQL latency, not HTTP framework overhead. Citing raw throughput benchmarks for a low-traffic internal HR tool looks like cargo-cult engineering.

**What we corrected:** Replaced with honest justification: native TypeScript support, built-in JSON schema validation, structured Pino logging.

#### 3. Mathematically Incorrect Department Analytics
**What the AI wrote:**
> "Average salary by department"

**Why it was wrong:** A department can contain employees from multiple countries with different currencies (USD, INR, GBP). Averaging them together produces a meaningless number — it mixes INR and USD into a single figure, contradicting our earlier decision that "currencies are never mixed."

**What we corrected:** Changed to `GROUP BY department, currency` — department averages shown per currency, never mixed.

#### 4. Unresolved Salary Unit
**What the AI produced:** Left salary unit as an open question.

**What we resolved:** Annual base salary, explicitly documented. UI labels it "Annual Salary".

#### 5. Hard Delete vs Soft Delete
**What the AI initially proposed:** Hard `DELETE` endpoint.

**What we changed to:** Soft delete (`PATCH /deactivate` sets `isActive = false`). Rationale: HR data integrity — hard deleting an employee retroactively distorts historical analytics.

#### 6. Missing API Response Contract
**What the AI initially produced:** Request params documented, response shape not defined.

**What we added:** Explicit JSON response contracts for all endpoints, including the critical note that `salary` must be returned as a string (not a number) to preserve `Decimal(12,2)` precision.

#### 7. Insufficient Test Coverage
**What the AI initially proposed:** Mocked Prisma only — no real DB tests.

**What we added:** A small integration test suite (4–6 tests) against real PostgreSQL to catch: Decimal precision, soft delete filtering, GROUP BY analytics shape, ILIKE search results.

---

## Implementation & Validation Phases (Phases B – J)

**AI role:** Implemented the approved phases incrementally (Phase B seed generator through Phase J final delivery).

### Key Implementation AI Corrections & Refinements:

1. **Phase B (Seed Generator):**
   - Implemented 100% deterministic Mulberry32 PRNG generator (`seedDatabase(42, 10000)`).
   - Generated 10,000 realistic records in 500-record batches to avoid Neon serverless timeout.

2. **Phase C – E (Backend API & Services):**
   - Implemented layered Fastify architecture (`Routes -> Services -> Prisma`).
   - Managed Prisma 5 type compatibility (`NormalizedProcedure`, `EmployeeGroupByArgs`, `Decimal` serialization).
   - Used raw SQL (`$queryRaw`) for `GROUP BY country, currency` to ensure native multi-currency aggregation without in-memory JS processing.

3. **Phase F – H (Frontend & Analytics UI):**
   - Implemented Next.js App Router, TanStack Query client with automatic cache invalidation on mutations (`useCreateEmployee`, `useUpdateEmployee`, `useDeactivateEmployee`).
   - **UI Language Correction:** Refactored developer jargon (e.g. `isActive = false`, `PostgreSQL aggregation`) into clean, professional business language for HR users.

4. **Authoritative Country & Currency Validation Correction:**
   - **User Feedback:** Identified freeform currency text box and fixed 8-country frontend dropdown discrepancies.
   - **Architectural Solution:** Enforced **canonical full English country names** (e.g. `United States`, `United Kingdom`, `United Arab Emirates`, `India`) and **ISO 4217 currency codes** authoritatively via Fastify/Ajv schema `enum` validation. Rejected abbreviations (`USA`, `UK`, `UAE`) and invalid codes with standard `400 Bad Request`.

5. **Phase I – J (Testing & Validation):**
   - Built 41 total unit and integration tests across backend (Vitest + Prisma mock + real PostgreSQL) and frontend (Vitest + React Testing Library + JSDOM).
   - Verified clean production builds (`npm run build`) and zero TypeScript errors (`tsc --noEmit`).

---

## Key Principle Demonstrated

> AI is a capable first-draft generator and option generator — but architectural and technical claims must be reviewed critically by the engineer. The review phase caught 7 significant issues in AI-generated output, all of which were corrected before implementation began.

This is what intentional AI use looks like: use AI to accelerate, review AI output as you would a junior engineer's PR, and own the decisions.

---

*Document version: 1.1 | Date: August 2026 | Updated upon Phase J completion*
