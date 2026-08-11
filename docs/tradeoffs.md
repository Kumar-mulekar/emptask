# Architecture & Implementation Trade-Offs

## Employee Salary Management Software — ACME Org
*Prepared for: Incubyte Take-Home Assessment*

---

## Overview

This document records the architectural trade-offs, technical decisions, and design choices made during the development of the ACME Employee Salary Management system.

---

## 1. Single Table vs. Normalised Schema

- **Decision:** Use a single `Employee` table in PostgreSQL rather than normalising `Country`, `Currency`, `Department`, and `JobTitle` into lookup tables.
- **Rationale:**
  - The requirement specified tracking current annual base salary only — no salary history or multi-currency conversions.
  - At 10,000 records, single-table reads (`SELECT ... FROM "Employee"`) and aggregations (`GROUP BY country, currency`) execute in ~1–5ms on PostgreSQL without requiring SQL `JOIN` overhead.
  - Reduces Prisma query complexity and schema migrations for the MVP scope.
- **Trade-off:** Data duplication for string values (`department`, `jobTitle`). A future multi-tenant or enterprise expansion could normalise these lookup domains.

---

## 2. PostgreSQL `DECIMAL(12, 2)` for Salary Data

- **Decision:** Store annual base salary as `DECIMAL(12, 2)` in PostgreSQL and serialize as 2-decimal formatted strings in API responses (`"120000.00"`).
- **Rationale:**
  - Prevents IEEE 754 floating-point rounding errors inherent to `FLOAT` or `DOUBLE PRECISION` types when performing financial calculations.
  - JSON does not natively distinguish arbitrary-precision decimals; returning formatted strings guarantees exact precision across API consumers.
- **Trade-off:** Frontend must parse salary strings to numbers (`parseFloat`) for arithmetic while preserving string formatting for display.

---

## 3. Currency Isolation vs. Cross-Currency Conversion

- **Decision:** Aggregations (`byCountry`) group strictly by `country + currency`. No cross-currency exchange rate conversions or unified global currency averages are applied.
- **Rationale:**
  - Applying static or live exchange rates introduces rate staleness and financial inaccuracy (e.g. `USD 100,000` $\neq$ `EUR 100,000` $\neq$ `INR 100,000`).
  - Scoping salary analytics per country in native currency avoids currency distortion while keeping backend aggregations deterministic.
- **Trade-off:** The executive dashboard does not display a single global average salary across all international hubs.

---

## 4. Soft Delete (`isActive = false`) vs. Hard Delete

- **Decision:** Deactivating an employee sets `isActive = false`. Deactivated records are retained in PostgreSQL for audit compliance but excluded from active listings and analytics.
- **Rationale:**
  - Preserves historical organizational data for compliance and reporting.
  - Avoids cascade deletion risks.
- **Trade-off:** Database size grows over time as records are retained. B-Tree index on `isActive` ensures queries filtering `WHERE "isActive" = true` maintain $O(\log N)$ performance.

---

## 5. Server-Side Pagination, Filtering, and Search

- **Decision:** All employee listing queries perform server-side `skip`/`take` pagination, PostgreSQL `WHERE` clause filtering, and `ILIKE` substring search.
- **Rationale:**
  - Fetching 10,000 records to the client browser on every request would degrade network performance and DOM rendering.
  - 20 records per page keeps payload sizes under 5KB and page load under 50ms.
- **Trade-off:** Search requires network round-trips to the backend API, mitigated via a ~300ms frontend input debounce.

---

## 6. Authoritative Fastify/Ajv Backend Validation

- **Decision:** Enforce canonical full English country names (`United States`, `India`, `United Kingdom`, etc.) and ISO 4217 currency codes (`USD`, `INR`, `GBP`, etc.) via Fastify Ajv JSON Schema `enum` validation.
- **Rationale:**
  - Prevents database group fragmentation (e.g., separate analytics rows for `USA`, `US`, `United States`).
  - Ensures the backend serves as the single authoritative validation layer, rejecting invalid payloads with standard `400 Bad Request` responses before database execution.
- **Trade-off:** Non-standard abbreviations (`USA`, `UK`, `UAE`) are rejected by the backend schema.

---

## 7. Deterministic PRNG Seeding (Mulberry32)

- **Decision:** Seed script uses Mulberry32 PRNG seeded with a fixed constant (`42`) rather than `Math.random()`.
- **Rationale:**
  - Guarantees 100% identical 10,000 employee dataset generation across fresh database initializations.
  - Ensures automated unit and integration tests remain fast, deterministic, and repeatable.
- **Trade-off:** Synthetic seed data distribution is fixed to seed constant `42`.

---

*Document version: 1.0 | Date: August 2026 | Prepared for Incubyte Assessment Review*
