# Blinto Doomsday Ready — MCU Rewatch & Booking Planner

A full-stack application for MCU fans preparing for *Avengers: Doomsday*. It manages movies and prerequisite relationships, calculates a prerequisite-first rewatch list, and calculates exact opening-night cinema bundle combinations.

## Tech Stack
- **Monorepo**: npm workspaces (`apps/api`, `apps/web`)
- **API**: NestJS (TypeScript), Express, `@nestjs/config`
- **Web**: React 18, Vite, TypeScript, Tailwind CSS
- **Database**: PostgreSQL 16 (via Docker Compose), Prisma (prepared)
- **Testing**: Jest (API unit & e2e), Vitest & React Testing Library (Web)

## Quick Start / Setup

### 1. Prerequisites
- Node.js 18+ (tested on Node 26)
- Docker & Docker Compose (for local PostgreSQL)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Default variables:
- `API_PORT=3000`
- `FRONTEND_ORIGIN=http://localhost:5173`
- `VITE_API_BASE_URL=http://localhost:3000/api`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doomsday_ready?schema=public`

### 4. Start Local Database
```bash
docker compose up -d
```

### 5. Run Development Servers
To run both API and Web concurrently:
```bash
npm run dev
```
Or individually:
```bash
npm run dev:api  # Runs API at http://localhost:3000/api
npm run dev:web  # Runs Web at http://localhost:5173
```

### 6. Run Quality Checks & Tests
```bash
npm run build      # Build both applications
npm run lint       # Lint both applications
npm run typecheck  # Typecheck both applications
npm run test       # Run all unit tests
npm run test:e2e   # Run backend e2e tests
```

---

## Agent Development Kit

This kit is designed for **small, testable development chunks**. Implement one vertical slice at a time: write the smallest production code for that slice, add automated tests, run the tests, manually verify the behavior, then commit. Do not generate the whole application in one pass.

### Start here

1. Put `context/` and `prompts/` in your project root.
2. Open your coding agent in that root.
3. Read `prompts/prompt_00_INDEX.md` and follow its rules.
4. Run exactly one prompt at a time, in order.
5. At the start of every prompt, require the agent to reread all six context files.
6. At the end of every prompt, require a test report and a clear STOP. Do not begin the next prompt until you have reviewed the diff and accepted the phase.
7. Commit each accepted phase.

### Six persistent context files

| File | What it controls |
|---|---|
| `context/01_PRODUCT_BRIEF.md` | Exact assessment requirements and scope |
| `context/02_STACK_AND_STANDARDS.md` | Stack, conventions, scripts and repository layout |
| `context/03_ARCHITECTURE.md` | Module boundaries and request flow |
| `context/04_DATA_MODEL.md` | Relational schema and data integrity |
| `context/05_API_AND_ALGORITHMS.md` | API contracts and handwritten algorithm requirements |
| `context/06_TESTING_DEPLOYMENT_SUBMISSION.md` | Feature gates, free deployment and submission |

### Prompt sequence

- `prompt_00_INDEX.md` — operating rules and phase tracker
- `prompt_01_REPO_FOUNDATION.md` — repo skeleton, tooling, local database and health endpoint
- `prompt_02_DATABASE_SEED.md` — schema, migrations and sample data
- `prompt_03_MOVIES_CREATE_LIST.md` — first movie vertical slice, tests included
- `prompt_04_MOVIES_UPDATE_CYCLE_GUARD.md` — update, prerequisite validation and cycle rejection
- `prompt_05_REWATCH_PLAN.md` — dependency traversal, ordering and runtime summary
- `prompt_06_CINEMAS_CREATE_LIST.md` — cinema and bundle-size management
- `prompt_07_BOOKING_QUOTE.md` — minimum-bundle dynamic programming
- `prompt_08_FRONTEND_MOVIES.md` — Movies UI connected to real API
- `prompt_09_FRONTEND_REWATCH.md` — Rewatch Plan UI connected to real API
- `prompt_10_FRONTEND_BOOKING.md` — Booking UI connected to real API
- `prompt_11_INTEGRATION_QA.md` — end-to-end checks, edge cases, security and cleanup
- `prompt_12_FREE_DEPLOYMENT.md` — free-tier deployment with provider verification
- `prompt_13_README_SUBMISSION.md` — final docs, AI disclosure and GitHub handoff

### Non-negotiable rules

- Features 1 and 2 algorithms must be implemented by the candidate. Do not use a package that performs graph cycle detection/topological sorting or coin-change/minimum-bundle optimization.
- Use AI for scaffolding, UI assistance, code review and test ideas, but understand and personally verify the two algorithms. Disclose actual AI use in README.
- Never proceed to the next phase with failing tests.
- Do not silently skip a test. If a test cannot be run, state why and give a manual verification alternative.
- Keep commits small and meaningful.
- Do not commit `.env`, tokens, passwords, private keys or deployment credentials.
- Free hosting quotas and policies change. Verify current free plan eligibility before choosing providers. Do not promise that a free tier is permanent.
