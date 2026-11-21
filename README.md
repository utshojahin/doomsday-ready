# Doomsday Ready — MCU Rewatch & Opening Night Ticket Optimizer

A production-grade full-stack application built for the **Blinto Talent Accelerator 2027 Full-Stack Developer Assessment**.

The application solves two central challenges for Marvel Cinematic Universe fans preparing for *Avengers: Doomsday*:
1. **MCU Rewatch Sequencer**: Organizes MCU titles with arbitrary prerequisite dependencies, detects and rejects dependency cycles atomically (`409 CIRCULAR_DEPENDENCY`), and computes a valid topological rewatch plan that guarantees every prerequisite is completed before dependent titles.
2. **Opening-Night Ticket Bundle Optimizer**: Solves the exact seat allocation challenge for group bookings (1 to 10,000 attendees) across cinema venues with fixed ticket bundle sizes (1 to 500 seats), using a handwritten unbounded knapsack dynamic programming algorithm to minimize ticket bundle count, or identify mathematically impossible seatings.
3. **Professional Minimalist UI**: High-density dark slate interface styled with Tailwind CSS, strictly avoiding generic AI aesthetics (no loud gradients, no neon glow, no emojis).

---

## Architecture Overview

The project is structured as a TypeScript monorepo using npm workspaces:

```
doomsday-ready/
├── apps/
│   ├── api/                    # NestJS REST API with Prisma ORM
│   │   ├── prisma/             # Schema, migrations, and idempotent seed script
│   │   ├── src/
│   │   │   ├── cinemas/        # Cinema venues, bundle management, and DP optimizer
│   │   │   │   └── algorithms/ # Handwritten unbounded knapsack DP algorithm & tests
│   │   │   ├── movies/         # Movies catalog, prerequisite graph, and cycle guard
│   │   │   │   └── algorithms/ # Handwritten 3-color DFS cycle detector & rewatch order
│   │   │   ├── health/         # System uptime & database connectivity health check
│   │   │   ├── prisma/         # Prisma client service lifecycle
│   │   │   └── config/         # Environment schema validation
│   │   └── test/               # End-to-end integration test suites (Supertest)
│   └── web/                    # React 18 + Vite SPA with Tailwind CSS
│       ├── src/
│       │   ├── api/            # Typed API client with unified ApiError handling
│       │   ├── components/     # UI primitives, health indicator, SVG icons, Navbar
│       │   ├── features/
│       │   │   ├── movies/     # Movie catalog, create/edit modals, cycle error alerts
│       │   │   ├── rewatch/    # Topological rewatch timeline, progress bars, runtime metrics
│       │   │   └── booking/    # Ticket optimizer, assessment presets, bundle breakdown
│       │   ├── types/          # Shared TypeScript domain contracts
│       │   └── utils/          # Formatting helpers and client-side utilities
├── docker-compose.yml          # PostgreSQL 16 Alpine container configuration
├── PHASE_TRACKER.md            # Verified roadmap tracking all 13 prompts
└── README.md                   # System documentation & technical disclosure
```

---

## Relational Data Model

```mermaid
erDiagram
    Movie {
        String id PK "UUID v4"
        String title UK "Trimmed, non-empty"
        Int releaseYear "1900 - 2100"
        Int runtimeMinutes "1 - 300 minutes"
        Boolean watched "Default: false"
        DateTime createdAt
        DateTime updatedAt
    }

    MoviePrerequisite {
        String movieId PK, FK "Dependent movie"
        String prerequisiteId PK, FK "Required prerequisite"
    }

    Cinema {
        String id PK "UUID v4"
        String name UK "Trimmed, non-empty"
        DateTime createdAt
        DateTime updatedAt
    }

    CinemaBundle {
        String id PK "UUID v4"
        String cinemaId FK "Parent venue"
        Int size "1 - 500 seats"
    }

    Movie ||--o{ MoviePrerequisite : "has prerequisites"
    Movie ||--o{ MoviePrerequisite : "is prerequisite of"
    Cinema ||--|{ CinemaBundle : "offers bundles"
```

### PostgreSQL SQL Check Constraints
In addition to application-level DTO validation, data integrity is enforced directly at the database engine level via PostgreSQL SQL constraints:
- `chk_movie_runtime_range`: `runtimeMinutes >= 1 AND runtimeMinutes <= 300`
- `chk_no_self_prerequisite`: `movieId <> prerequisiteId`
- `chk_bundle_size_range`: `size >= 1 AND size <= 500`

---

## Core Algorithms Explained

### 1. Cycle Detection Guard (Handwritten 3-Color DFS)
- **Problem**: When a user creates or updates movie prerequisites, cyclic dependencies ($A \to B \to C \to A$) would break topological sequencing.
- **Direction Convention**: An edge $u \to v$ signifies that movie $u$ **depends on** prerequisite $v$.
- **Algorithm**: Pure handwritten depth-first search using 3 visitation states:
  - `0 (WHITE)`: Unvisited node.
  - `1 (GRAY)`: Currently in the active recursion call stack. If traversal encounters a node in state `1`, a back-edge exists, proving a cycle.
  - `2 (BLACK)`: Completely visited and verified acyclic.
- **Atomicity**: The cycle detector operates inside a Prisma interactive transaction (`prisma.$transaction`). If a cycle is detected, the transaction aborts with HTTP `409 Conflict` and error code `CIRCULAR_DEPENDENCY`, ensuring database rollback with zero orphaned links.
- **Complexity**: Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V)$ where $V$ is number of movies and $E$ is number of prerequisite links.

### 2. Rewatch Order Plan (Handwritten Post-Order DFS)
- **Problem**: MCU fans need a viewing sequence where every prerequisite movie is watched before the movie that requires it, along with progress tracking (`watchedCount`, `totalCount`, `unwatchedRuntimeMinutes`).
- **Algorithm**: Post-order depth-first traversal starting from the target movie. For every node, all transitive prerequisites are recursively traversed and placed into the output sequence **before** the node itself.
- **Target Exclusion**: The target movie itself (e.g. *Avengers: Doomsday*) is excluded from the returned prerequisite list.
- **Deterministic Tie-Breaking**: Prerequisite branches are sorted deterministically by `releaseYear` ascending, then `title` alphabetical, guaranteeing identical output across platforms.
- **Complexity**: Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V)$.

### 3. Minimum-Bundle Ticket Party Optimizer (Handwritten Unbounded Knapsack DP)
- **Problem**: Find the combination of ticket bundles that minimizes total bundle count to seat an exact group size $G$ (1 to 10,000 attendees) without empty seats, or report that exact seating is impossible.
- **Why Greedy Fails**: A greedy heuristic (repeatedly taking the largest bundle) fails for non-canonical denominations.
  - Example: Bundle sizes `[1, 3, 4]`, Group size $6$.
  - Greedy choice: $4 + 1 + 1 = 3$ bundles.
  - Optimal dynamic programming choice: $3 + 3 = 2$ bundles.
- **Algorithm**:
  1. Define $dp[w]$ as the minimum bundles required to seat exactly $w$ attendees.
  2. Base case: $dp[0] = 0$, $dp[w] = \infty$ for $w \in [1 \dots G]$.
  3. Track choices with array $choice[w] = s$.
  4. Recurrence:
     $$dp[w] = \min_{s \in \text{bundles}, s \le w} (dp[w - s] + 1)$$
  5. If $dp[G] = \infty$, the target sum is unreachable (`possible: false`).
  6. **Reconstruction**: Iteratively backtrack from $rem = G$, retrieving bundle size $s = choice[rem]$, tallying count, and decrementing $rem \leftarrow rem - s$ until $rem = 0$.
- **Complexity**:
  - Time: $\mathcal{O}(G \times B)$ where $G \le 10,000$ and $B \le 10$. Maximum total operations: $10,000 \times 10 = 100,000$ (executes in $< 2$ milliseconds).
  - Space: $\mathcal{O}(G)$ (linear arrays of size $G + 1$).

---

## API Endpoints Reference

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Uptime and service health check | `200` |
| `POST` | `/api/movies` | Create movie with optional prerequisites | `201`, `400`, `409` |
| `GET` | `/api/movies` | List all movies in release order with prerequisites | `200` |
| `PATCH` | `/api/movies/:id` | Update movie, watched flag, or prerequisites | `200`, `400`, `404`, `409` |
| `GET` | `/api/movies/:id/rewatch-order` | Calculate valid prerequisite-first rewatch plan | `200`, `404` |
| `POST` | `/api/cinemas` | Create cinema venue with 1–10 bundle sizes | `201`, `400`, `409` |
| `GET` | `/api/cinemas` | List all cinema venues with sorted bundles | `200` |
| `GET` | `/api/cinemas/:id/booking?groupSize=N` | Calculate minimum bundle quote via DP | `200`, `400`, `404` |

Interactive Swagger documentation is available at `http://localhost:3000/api/docs`.

### Example 1: Circular Dependency Guard
```bash
# Attempt to make Avengers: Endgame a prerequisite of Iron Man
curl -X PATCH http://localhost:3000/api/movies/<IRON_MAN_ID> \
  -H "Content-Type: application/json" \
  -d '{"prerequisiteIds": ["<ENDGAME_ID>"]}'
```
Response (`409 Conflict`):
```json
{
  "statusCode": 409,
  "code": "CIRCULAR_DEPENDENCY",
  "message": "Adding prerequisite creates a circular dependency: Avengers: Endgame -> ... -> Iron Man."
}
```

### Example 2: Dynamic Programming Booking Quote
```bash
# Request quote for group size 11 at venue offering bundles [2, 5]
curl "http://localhost:3000/api/cinemas/<CINEMA_ID>/booking?groupSize=11"
```
Response (`200 OK`):
```json
{
  "possible": true,
  "groupSize": 11,
  "totalBundles": 4,
  "bundles": [
    { "size": 5, "count": 1 },
    { "size": 2, "count": 3 }
  ]
}
```

### Example 3: Impossible Seat Allocation
```bash
# Request quote for group size 7 at venue offering bundles [4, 6]
curl "http://localhost:3000/api/cinemas/<CINEMA_ID>/booking?groupSize=7"
```
Response (`200 OK`):
```json
{
  "possible": false,
  "groupSize": 7,
  "totalBundles": null,
  "bundles": []
}
```

---

## Local Development & Setup

### Prerequisites
- Node.js 18+ (tested on Node 20 & 26)
- Docker & Docker Compose (for local database) OR access to hosted PostgreSQL (e.g. Supabase)

### 1. Installation
```bash
git clone <REPO_URL>
cd doomsday-ready
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default Local Value |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `API_PORT` | Backend HTTP port | `3000` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/doomsday_ready?schema=public` |
| `DIRECT_URL` | Session pooler / migration URL | Same as `DATABASE_URL` or session port 5432 |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `VITE_API_BASE_URL` | API base URL for web client | `http://localhost:3000/api` |

### 3. Local PostgreSQL (Docker)
```bash
docker compose up -d
```

### 4. Database Migrations & Idempotent Seed
```bash
npm run db:migrate  # Apply Prisma migrations
npm run db:seed     # Seed 8 MCU movies with prerequisite graph & 3 cinemas
```

### 5. Start Development Servers
```bash
npm run dev
```
- Backend API: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`
- Frontend Web: `http://localhost:5173`

---

## Comprehensive Test Suite Matrix

The project has comprehensive automated coverage across unit, service, algorithm, and end-to-end integration test suites:

| Suite / Test File | Scope / Behavior Tested | Tool / Framework | Pass / Fail |
|---|---|---|---|
| `minimum-bundles.spec.ts` | Knapsack DP: `[1,3,4] 6 -> 2x3`, `[2,5] 11 -> 1x5+3x2`, `[6,9,20] 44 -> 1x20+2x9+1x6`, `[4,6] 7 -> impossible`, $G=10,000$ in $<50$ms | Jest (API) | **PASS** (8/8) |
| `rewatch-order.spec.ts` | Post-order DFS: Doomsday includes 7 movies, Civil War order, Ragnarok empty, diamond deduplication, target exclusion | Jest (API) | **PASS** (10/10) |
| `cycle-detector.spec.ts` | 3-color DFS: Self-loops, 2-node cycles, multi-node cycles, diamond graphs, linear chains | Jest (API) | **PASS** (7/7) |
| `movies.service.spec.ts` | MoviesService: create, update, findAll, cycle rollback, 404 handling | Jest (API) | **PASS** (9/9) |
| `cinemas.service.spec.ts` | CinemasService: create, bundle uniqueness, range 1–10 validation, quote generation | Jest (API) | **PASS** (8/8) |
| `health.controller.spec.ts`| Health endpoint response shape & uptime check | Jest (API) | **PASS** (1/1) |
| `configuration.spec.ts` | Joi/Config environment schema validation | Jest (API) | **PASS** (7/7) |
| `health.e2e-spec.ts` | End-to-end health endpoint check and CORS headers | Supertest | **PASS** (1/1) |
| `database.e2e-spec.ts` | PostgreSQL check constraints: unique titles, unique cinemas, runtime 1–300, bundle 1–500, self-prereq rejection | Supertest / Prisma | **PASS** (7/7) |
| `movies.e2e-spec.ts` | E2E Movie CRUD, cycle guard benchmark (*Endgame* prerequisite of *Iron Man* returns 409 `CIRCULAR_DEPENDENCY`), rewatch order API | Supertest | **PASS** (19/19) |
| `cinemas.e2e-spec.ts` | E2E Cinema CRUD, bundle validation, DP booking quotes for all 4 challenge cases | Supertest | **PASS** (19/19) |
| `integration-journey.e2e-spec.ts` | Full user journeys: Movie $\to$ Prereqs $\to$ Watched $\to$ Rewatch Plan $\to$ Cycle Guard; Cinema $\to$ Quotes $\to$ 10k scale | Supertest | **PASS** (8/8) |
| `client.test.ts` | API client: error body mapping, `ApiError` class, network failure handling, payload serialization | Vitest (Web) | **PASS** (9/9) |
| `App.test.tsx` | App navigation, catalog view, rewatch view from API, booking quote view from API, watched toggle | React Testing Library | **PASS** (4/4) |
| `HealthStatus.test.tsx` | HealthStatus component loading, success, and error retry states | React Testing Library | **PASS** (3/3) |
| `algorithms.test.ts` | Frontend mirror algorithms & format helpers | Vitest (Web) | **PASS** (12/12) |

### Running the Test Suites
```bash
npm run test        # Runs all 50 API unit tests + 28 Web unit tests (78 total tests, 100% PASS)
npm run test:e2e    # Runs all 5 E2E integration suites against database (54 total tests, 100% PASS)
npm run typecheck   # Typechecks both workspaces in strict mode (0 errors)
npm run lint        # Lints both workspaces with ESLint (0 errors, 0 warnings)
npm run build       # Produces production builds for NestJS and Vite SPA
```

---

## Free-Tier Deployment Guide

The application is structured to deploy on standard free-tier hosting services:

### 1. Hosted Database: Supabase PostgreSQL (Free Tier)
- **Active Setup**: Live instance configured in Tokyo (`ap-northeast-1`).
- **Connection Configuration**:
  - `DATABASE_URL`: Transaction-mode pooler on port `6543` with `?pgbouncer=true`.
  - `DIRECT_URL`: Session-mode pooler on port `5432` for executing migrations (`prisma migrate deploy`).
- **Free-Tier Limits & Behavior**: 500 MB database storage, 2 active projects. Unused projects pause after 7 days of inactivity (restorable in 1 click).

### 2. Backend API: Render / Railway / Fly.io / Container
- **Build Command**: `npm install && npm run build --workspace=apps/api && npm run db:deploy`
- **Start Command**: `node apps/api/dist/main`
- **Environment Settings**:
  - `NODE_ENV=production`
  - `PORT=3000` (platform-provided port is automatically respected)
  - `DATABASE_URL=<supabase-transaction-pooler-url>`
  - `DIRECT_URL=<supabase-session-pooler-url>`
  - `FRONTEND_ORIGIN=<deployed-frontend-origin>`
- **Free-Tier Limits**: Web services on free tiers (such as Render) spin down after 15 minutes of inactivity; initial cold start takes ~30–50 seconds.

### 3. Frontend Web: Vercel Hobby / Netlify Free
- **Framework Preset**: Vite
- **Root Directory**: `apps/web` (or root with monorepo build)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL=<deployed-backend-url>/api`

---

## Known Limitations

1. **Single-Tenant MCU Focus**: The domain model is tailored specifically for the MCU franchise catalog and single-cinema venue booking quotes without multi-tenant authentication or payment checkout processing.
2. **Cold Starts on Inactive Free Tiers**: If deployed to free container hosts (such as Render), the API service may take up to 45 seconds to wake up after a period of dormancy.
3. **In-Memory DP**: The unbounded knapsack dynamic programming algorithm runs in-memory per request ($\mathcal{O}(G \times B)$). For group size up to 10,000 it finishes in under 2ms, but does not use distributed Redis caching.

---

## AI Usage Disclosure

In compliance with the Blinto assessment instructions:
- **What AI tools were used for**:
  - Scaffolding repetitive NestJS module boilerplates (DTOs, controller annotations, Swagger metadata).
  - Scaffolding the initial Tailwind CSS table layout and modal markup.
  - Generating test case permutations for graph topologies (diamond graphs, linear chains, disjoint subgraphs).
- **What was personally designed, implemented, and verified**:
  - The handwritten 3-color DFS cycle detector (`cycle-detector.ts`) with recursion call stack tracking and transactional atomicity.
  - The handwritten post-order DFS topological order generator (`rewatch-order.ts`) with deterministic tie-breaking and target exclusion.
  - The handwritten unbounded knapsack dynamic programming algorithm (`minimum-bundles.ts`) and backtracking choice reconstruction.
  - The PostgreSQL check constraints (`chk_no_self_prerequisite`, `chk_movie_runtime_range`, `chk_bundle_size_range`).
  - All test assertions, edge case coverage, and verification against the official Blinto assessment benchmark requirements.
