# Phase 1 — Planning Prompts
## Assessment Understanding & Product Discovery

*These are the actual prompts used with the AI assistant (Antigravity/Gemini) during the planning and architecture phases of this project.*

---

## Prompt 1 — Phase 1: Assessment Understanding & Product Discovery

```
# Phase 1 — Assessment Understanding & Product Discovery

You already have access to the Incubyte take-home assessment document provided for this project.

Do NOT write application code yet.
Do NOT create the requirements document yet.

First, act as a senior product engineer helping me understand the assessment and define
the product correctly before implementation.

## Your objectives
Analyze the assessment document and discuss the following with me:
1. What are the explicit requirements stated by Incubyte?
2. What is the actual user problem we are solving?
3. Who is the primary user/persona?
4. What functionality is explicitly required?
5. What functionality is left unspecified?
6. What assumptions would we need to make?
7. What potential ambiguities should we clarify with Incubyte?
8. What would be a reasonable MVP?
9. What functionality should deliberately remain out of scope?
10. What product decisions could affect the architecture or database design?

## Important rules
Do NOT silently invent requirements.
Clearly distinguish between "Explicitly required", "Not specified", "Our proposed decision",
"Question for Incubyte".

## Discussion-first approach
After your initial analysis, discuss the important decisions with me one by one.
For each decision: explain the problem, give options, explain trade-offs, recommend one,
ask for my decision. Do not make major decisions without discussing them with me.

The goal is to define a small, coherent, defensible MVP that demonstrates good engineering judgment.
Only after I explicitly approve the final product scope should we move to creating requirements.md.
```

**Decisions made via this prompt:** All 8 Phase 1 product decisions (salary tracking, employee fields, currency, analytics, auth, bulk import, table UX, deployment).

---

## Prompt 2 — Phase 2: Requirements Document

```
# Phase 2 — Create the Requirements Document

We have now discussed and agreed on the product scope.

Use ONLY:
1. The Incubyte assessment document
2. The decisions we made during our discussion
3. Clearly identified assumptions

Do not introduce new features or requirements at this stage.

Create: docs/requirements.md

The document must be concise and approximately one page, as requested by the assessment.

Include: Goal, User Persona, Problem Statement, MVP Scope, Functional Requirements,
Non-Functional Requirements, Deliberately Out of Scope, Assumptions, Open Questions.

Do not claim that our decisions were explicitly required by Incubyte when they were actually
our own product decisions.
```

---

## Prompt 3 — Phase 3: Architecture Discussion

```
# Phase 3 — Architecture Discussion

The requirements document has now been agreed upon.

Do NOT implement the application yet.

Act as a senior backend/full-stack architect.

Based on the approved requirements, propose an architecture for the system.
Discuss: Frontend architecture, Backend architecture, Module/domain boundaries,
Database approach, API boundaries, Data flow, Deployment approach, Testing architecture,
Performance considerations for 10,000 employees.

Prefer the simplest architecture that satisfies the requirements.
Do not introduce microservices or distributed infrastructure unless there is a concrete
requirement that justifies them.

For every significant architectural decision:
- Explain the problem
- Give reasonable alternatives
- Explain the trade-off
- Recommend one
- Ask me for approval

Do not implement code yet.
After we agree on the architecture, create: docs/architecture.md
```

**Decisions made via this prompt:** All Phase 3 architecture decisions (monorepo structure, Fastify, Prisma, REST, layered backend, Next.js App Router + TanStack Query + shadcn/ui, Vitest, performance strategy, Neon + Vercel + Railway).

---

## Prompt 4 — Phase 3 Review: Architecture & Requirements Review

```
# Review Existing Requirements & Architecture — Discussion Only

This is a discussion and review phase only.

DO NOT modify requirements.md, architecture.md, create new files, write application code,
or automatically apply any recommendation.

Act as a senior product engineer / architect reviewing our current solution.

Review points included:
1. Salary Unit — resolve the open question
2. Currency and Department Analytics — is cross-currency dept average meaningful?
3. Delete Employee — hard delete vs soft delete vs no deletion
4. Fastify justification — is "2-3x faster" a good reason for this app?
5. Name Search and Indexing — does B-tree index help ILIKE '%query%'?
6. Database Integration Tests — mocked only vs real DB tests
7. API Pagination Contract — define explicit response shape
8. Documentation Strategy — what documents to create and when

For each issue: show what the current documents say, explain the concern, give options,
recommend, ask me to decide. One issue at a time. STOP and wait for my response.
```

**Issues found and corrected:** 7 significant issues in AI-generated output (documented in `ai-workflow.md`).

---

*These prompts are recorded as submitted. They represent the actual instructions used — not reconstructed after the fact.*
