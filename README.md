# ACME Employee Salary Management

A web-based employee salary management system built for the Incubyte take-home assessment.

## Architecture

- **Frontend**: Next.js (App Router) + shadcn/ui + TanStack Query — deployed on Vercel
- **Backend**: Fastify + Node.js/TypeScript + Prisma — deployed on Railway
- **Database**: PostgreSQL on Neon

See [`docs/architecture.md`](docs/architecture.md) for full architectural details and [`docs/requirements.md`](docs/requirements.md) for product requirements.

## Project Structure

```
├── frontend/          # Next.js application
├── backend/           # Fastify API
└── docs/              # Requirements, architecture, and decision records
```

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add your DATABASE_URL (PostgreSQL connection string from Neon)

npm install
npm run db:generate    # Generate Prisma client from schema
npm run db:migrate     # Run migrations against the database
npm run db:seed        # Seed 10,000 deterministic employee records
npm run dev            # Start dev server on port 3001
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local — add NEXT_PUBLIC_API_URL pointing to backend

npm install
npm run dev            # Start dev server on port 3000
```

## Documentation

| Document | Purpose |
|---|---|
| [`docs/requirements.md`](docs/requirements.md) | Product requirements and scope |
| [`docs/architecture.md`](docs/architecture.md) | Technical architecture decisions |
| [`docs/implementation-plan.md`](docs/implementation-plan.md) | Step-by-step implementation plan |
| [`docs/ai-workflow.md`](docs/ai-workflow.md) | AI tool usage and review process |
