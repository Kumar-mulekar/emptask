# Requirements Document
## Employee Salary Management Software — ACME Org
*Prepared for: Incubyte Take-Home Assessment*

---

## 1. Goal

Build a web-based employee salary management system that replaces ACME's spreadsheet-based process, giving the HR Manager a structured, queryable interface to manage salary records for 10,000 employees across multiple countries and answer key organisational pay questions.

---

## 2. User Persona

**HR Manager — ACME Organisation**

The HR Manager maintains employee salary records across multiple countries and departments. They currently work out of Excel spreadsheets, which is error-prone and difficult to query at scale. They need a clean, efficient web UI that lets them manage records and quickly answer pay-related questions without requiring any technical knowledge.

---

## 3. Problem Statement

ACME's HR team manages salary data for 10,000 employees across multiple countries entirely in Excel. This approach is:

- **Error-prone** — manual edits, formula drift, and no validation
- **Unqueryable** — answering "what is the average salary in India?" requires manual filtering
- **Unscalable** — Excel breaks down at 10,000 rows with complex multi-country data
- **Inconsistent** — no single source of truth for salary information

The goal is to replace this with structured, web-based software that is accurate, queryable, and easy to use.

---

## 4. MVP Scope

The MVP will deliver the following capabilities:

| Capability | Details |
|---|---|
| Employee management | Create, read, update, and deactivate (soft delete) employee salary records |
| Employee listing | Paginated table with server-side search by name and filters by country, department, and employment type |
| Analytics dashboard | Summary cards covering active headcount; salary analytics by country (average, minimum, and maximum annual salary in native currency); headcount by department; and employment type breakdown |
| Data seeding | Seed script to populate 10,000 realistic employee records |
| Deployment | Publicly accessible: Next.js on Vercel, Node.js API on Railway, PostgreSQL on Neon |

---

## 5. Functional Requirements

The system must allow the HR Manager to:

1. **View** a paginated list of all active employees with their salary details
2. **Search** employees by name
3. **Filter** employees by country, department, and employment type
4. **Add** a new employee with all required fields
5. **Edit** an existing employee's information, including their current annual salary
6. **Deactivate** an employee record (soft delete — sets `is_active = false`; employee is not physically deleted, data is retained, and employee is excluded from active listings and analytics)
7. **View a dashboard** that answers:
   - Total active headcount
   - Average, minimum, and maximum annual salary by country, displayed in the country's native currency (salaries in different currencies are never mixed or averaged)
   - Headcount by department
   - Headcount by employment type (Full-time / Part-time / Contract)

### Employee Record Fields

| Field | Notes |
|---|---|
| `id` | System-generated unique identifier |
| `full_name` | Employee's full name |
| `department` | Department they belong to |
| `job_title` | Their role/designation |
| `employment_type` | Full-time, Part-time, or Contract |
| `hire_date` | Date they joined the organisation |
| `country` | Country of employment |
| `currency` | Currency code (e.g. INR, USD, GBP) — native to their country |
| `salary` | Current **annual** base salary in native currency |
| `is_active` | Boolean — `true` for active employees, `false` for deactivated (soft-deleted) |

---

## 6. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Performance** | Employee list queries must be server-side paginated. The system must remain responsive with 10,000 records. |
| **Correctness** | Salary figures must be stored and displayed accurately. Currency values must never be mixed or converted incorrectly. |
| **Usability** | The UI must be navigable by a non-technical HR Manager. Forms must validate inputs before submission. |
| **Maintainability** | Code must be modular, clearly structured, and easy to extend. Separation of concerns between API and UI layers. |
| **Testability** | Core backend logic (CRUD operations, filtering, aggregations) must be covered by unit tests that are fast, deterministic, and independently runnable. |

---

## 7. Deliberately Out of Scope

| Exclusion | Reason |
|---|---|
| **Salary history / raise tracking** | Adds significant schema and query complexity. Current salary is sufficient for the stated user need. Explicitly a product decision. |
| **Authentication & access control** | The assessment describes a single HR Manager persona. Multi-user auth is out of scope for this MVP. |
| **Bulk CSV import/export** | Not stated in the assessment. CRUD via UI is sufficient for MVP; migration is a one-time operational concern. |
| **Cross-currency salary comparison** | Requires live or static exchange rates. Analytics scoped per country in native currency avoids stale-rate errors. |
| **Payroll processing & disbursement** | Outside the scope of salary management software. |
| **Tax calculations & compliance** | Jurisdiction-specific, requires legal accuracy. Out of scope. |
| **Benefits, leave, and attendance** | Different product domain entirely. |
| **External integrations (Workday, ADP)** | No integration requirement stated. |
| **Audit logs** | Not required for MVP; can be added later. |

---

## 8. Assumptions

The following were not explicitly stated by Incubyte and represent our own product decisions:

1. **"Manage salary data"** is interpreted as Create, Read, Update, and soft-delete (deactivate) on employee records. Deactivated employees are excluded from listings and analytics but are not permanently deleted.
2. **Only current salary is stored** — no salary history or effective date tracking.
3. **Salary is stored as an annual base salary** — the numeric value represents the yearly gross base pay in the employee's native currency.
4. **Salaries are stored in native currency** — one `currency` field per employee. Salaries in different currencies are never mixed or averaged. Country salary analytics (avg, min, max) are computed independently per `country + currency` grouping. Department analytics show headcount only — no salary aggregation across currencies.
5. **A single fixed set of employment types** is used: Full-time, Part-time, Contract.
6. **No authentication** is required — the system is assumed to be accessed only by a trusted HR Manager.
7. **Server-side pagination, search, and filtering** are implemented for performance at 10,000 records.
8. **The seed script generates realistic but synthetic data** across a representative set of countries, departments, and currencies.

---

*Document version: 1.3 | Date: August 2026 | SDD consistency pass — explicit soft-delete deactivation wording, finalized analytics scope*
