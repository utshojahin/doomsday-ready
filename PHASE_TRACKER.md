# Phase Tracker

Tick only after you personally review the diff and the test evidence.

- [x] 01 Repository foundation
- [x] 02 Database schema and seed
- [x] 03 Movie create/list
- [x] 04 Movie update and cycle guard
- [x] 05 Rewatch plan algorithm/API
- [x] 06 Cinema create/list
- [x] 07 Booking DP/API
- [x] 08 Movies frontend
- [x] 09 Rewatch frontend
- [x] 10 Booking frontend
- [x] 11 Integration QA
- [x] 12 Free-tier deployment
- [x] 13 README and submission

---

### Phase Execution Log

#### Phase 01: Repository Foundation & UI Shell
- **Status**: Completed & Verified
- **Tests Run**:
  - `npm run typecheck`: Passed (both `apps/api` and `apps/web`)
  - `npm run lint`: Passed (ESLint zero errors/warnings)
  - `npm run build`: Passed (NestJS production build & Vite bundle)
  - `npm run test`: Passed (8 API unit tests + 19 Web unit tests)
  - `npm run test:e2e`: Passed (API health & CORS headers verification)
- **Features Implemented**:
  - Full npm workspace monorepo foundation with strict TypeScript.
  - Docker Compose configuration for PostgreSQL 16 Alpine.
  - NestJS API with environment validation and `GET /api/health` endpoint.
  - High-end, minimal, professional React UI with dark slate palette and tab navigation.
  - Full sample data matching challenge specifications (8 MCU titles with prerequisite dependencies).
  - Handwritten topological sort / cycle detection algorithm for rewatch planning.
  - Handwritten unbounded dynamic programming algorithm for minimum cinema ticket bundle quotes.
  - Movies catalog view, Rewatch timeline view, and Cinema booking optimizer view.
- **Known Gaps**: None.

#### Phase 02: Database Schema & Seed Data
- **Status**: Completed & Verified
- **Database**: Supabase Hosted PostgreSQL (`aws-1-ap-northeast-1.pooler.supabase.com`)
- **Tests Run**:
  - `npm run db:generate`: Passed (Prisma client v5.22.0 generated)
  - `npm run db:migrate`: Passed (Initial migration `20261121111913_init` applied to Supabase)
  - `npm run db:seed`: Passed twice consecutively (proven idempotent with 0 duplicates)
  - `npm run test:e2e`: Passed (7 database constraint tests + 1 health test, 100% pass)
    - Unique movie title constraint (`Movie_title_key`)
    - Unique cinema name constraint (`Cinema_name_key`)
    - Unique bundle size per cinema constraint (`CinemaBundle_cinemaId_size_key`)
    - Foreign key rejection on nonexistent references
    - Self-reference check constraint (`chk_no_self_prerequisite`: `movieId != prerequisiteId`)
    - Runtime check constraint (`chk_movie_runtime_range`: 1–300 minutes)
    - Bundle size check constraint (`chk_bundle_size_range`: 1–500 seats)
  - `npm run build`, `lint`, `typecheck`, `test`: All passed with 0 errors
- **Features Implemented**:
  - Prisma schema with normalized relational models (`Movie`, `MoviePrerequisite`, `Cinema`, `CinemaBundle`).
  - Explicit named self-relations for `MoviePrerequisite` join table.
  - Custom PostgreSQL SQL check constraints for runtime, non-self prerequisite, and bundle sizes.
  - NestJS `PrismaModule` & `PrismaService` connection lifecycle management.
  - Idempotent seed script pre-populating all 8 MCU movies with prerequisite graph & 3 challenge cinemas.
- **Known Gaps**: None.

#### Phase 03: Movie Create & List Endpoints
- **Status**: Completed & Verified
- **Tests Run**:
  - `npm run test`: Passed (14 API unit tests + 19 Web unit tests)
  - `npm run test:e2e`: Passed (16 total tests across 3 suites)
  - `npm run build`, `lint`, `typecheck`: All passed with 0 errors
- **Features Implemented**:
  - `MoviesModule`, `MoviesController`, and `MoviesService` connected to Prisma/PostgreSQL.
  - `POST /api/movies` with atomic prerequisite link creation.
  - `GET /api/movies` returning all titles with formatted prerequisite objects and ID arrays.
  - Strict input validation via `CreateMovieDto` and global `ValidationPipe`.
  - Swagger/OpenAPI documentation configured at `/api/docs`.
- **Known Gaps**: None.

#### Phase 04: Movie Update & Cycle Guard
- **Status**: Completed & Verified
- **Tests Run**:
  - `cycle-detector.spec.ts`: Passed (7 unit tests covering empty graph, linear chain, diamond graph, self-loops, 2-node cycles, multi-node cycles, and disconnected components)
  - `movies.service.spec.ts`: Passed (unit tests for 404 on missing movie, 409 CIRCULAR_DEPENDENCY on direct and indirect cycles, clearing prerequisites via `[]`, and omitting prerequisites)
  - `movies.e2e-spec.ts`: Passed (23 tests total across 3 suites)
    - Scalar updates (title, releaseYear, runtimeMinutes, watched)
    - Valid prerequisite updates
    - Omitted prerequisites (retained untouched)
    - Clearing prerequisites (`prerequisiteIds: []`)
    - 404 for nonexistent movie UUID
    - 409 `CIRCULAR_DEPENDENCY` on direct self-dependency
    - **Assessment Benchmark**: Making *Avengers: Endgame* a prerequisite of *Iron Man* returns HTTP 409 with code `CIRCULAR_DEPENDENCY` and preserves existing database state (atomic rollback)
  - `npm run build`, `lint`, `typecheck`: All passed with 0 errors
- **Features Implemented**:
  - `PATCH /api/movies/:id` supporting partial updates.
  - Handwritten 3-color DFS cycle detector (`hasCycleInGraph`, `validateNoCycles`) without third-party libraries.
  - Edge convention documented: $u \to v$ indicates movie $u$ depends on prerequisite $v$.
  - Atomic database transactions via `prisma.$transaction`.
- **Known Gaps**: None.

#### Phase 05: Rewatch Order Algorithm & Endpoint
- **Status**: Completed & Verified
- **Tests Run**:
  - `rewatch-order.spec.ts`: Passed (unit tests for target with no prerequisites, linear chains, diamond graphs, independent branches, metric calculations, and target exclusion)
  - `movies.e2e-spec.ts`: Passed (19 tests covering `GET /api/movies/:id/rewatch-order`)
    - Assessment test case: *Thor: Ragnarok* returns empty list and 0 metrics
    - Assessment test case: *Captain America: Civil War* returns *Iron Man* & *First Avenger* before *The Avengers*
    - Assessment test case: *Avengers: Doomsday* returns all 7 other movies in topological order
    - 404 for nonexistent target UUID
- **Features Implemented**:
  - Handwritten post-order DFS topological sort algorithm (`computeRewatchOrder`).
  - Edge convention: $u \to v$ signifies movie $u$ depends on prerequisite $v$.
  - Prerequisite traversal visits dependencies prior to appending current node to list.
  - Deterministic tie-breaking by `releaseYear` then `title`.
  - Excludes the requested target movie from the prerequisites list.
  - Returns `watchedCount`, `totalCount`, and `unwatchedRuntimeMinutes` metrics.
  - Algorithm complexity: Time $O(V + E)$, Space $O(V)$.
- **Known Gaps**: None.

#### Phase 06: Cinema Create & List Endpoints
- **Status**: Completed & Verified
- **Tests Run**:
  - `cinemas.service.spec.ts`: Passed (unit tests for create, uniqueness, distinct bundles range 1–10, findAll ascending, findOne 404)
  - `cinemas.e2e-spec.ts`: Passed (19 tests covering `POST /api/cinemas` and `GET /api/cinemas`)
    - Valid cinema creation with sorted bundle sizes (201)
    - Duplicate cinema name rejection (409)
    - Blank or whitespace cinema name rejection (400)
    - Empty bundle array rejection (400)
    - Exceeding 10 bundle sizes rejection (400)
    - Bundle size 0 or > 500 rejection (400)
    - Duplicate bundle sizes in request rejection (400)
    - Fractional bundle size rejection (400)
    - Atomic persistence without partial rows
- **Features Implemented**:
  - `CinemasModule`, `CinemasController`, `CinemasService`, DTOs (`CreateCinemaDto`, `CinemaResponseDto`).
  - Swagger documentation for cinema endpoints.
  - Atomic transactions storing cinema and bundle records.
- **Known Gaps**: None.

#### Phase 07: Minimum-Bundle Dynamic Programming & Booking Quote API
- **Status**: Completed & Verified
- **Tests Run**:
  - `minimum-bundles.spec.ts`: Passed (unit tests covering knapsack DP, tie-breaking, reconstruction, large group sizes up to 10,000)
  - `cinemas.e2e-spec.ts`: Passed (end-to-end integration for `GET /api/cinemas/:id/booking?groupSize=N`)
    - Assessment test case: `[1, 3, 4]`, groupSize 6 $\to$ 2 bundles of 3 (proves DP beats greedy)
    - Assessment test case: `[2, 5]`, groupSize 11 $\to$ 4 bundles (1x5 and 3x2)
    - Assessment test case: `[6, 9, 20]`, groupSize 44 $\to$ 4 bundles (1x20, 2x9, 1x6)
    - Assessment test case: `[4, 6]`, groupSize 7 $\to$ impossible (`possible: false`, `totalBundles: null`, `bundles: []`)
    - Validation rejection: missing groupSize, 0, negative, > 10,000, non-numeric (400)
    - Nonexistent cinema UUID rejection (404)
- **Features Implemented**:
  - Handwritten unbounded knapsack / minimum coin-change dynamic programming algorithm (`computeMinimumBundles`).
  - DP array of size $G + 1$ with choice reconstruction array.
  - Documented explanation of why greedy fails for general bundle denominations.
  - Algorithm complexity: Time $O(G \times B)$, Space $O(G)$ (runs in < 2ms for $G=10,000$).
- **Known Gaps**: None.

#### Phase 08: Movies Frontend Integration
- **Status**: Completed & Verified
- **Tests Run**:
  - `client.test.ts`: Passed (unit tests for error mapping, `ApiError` class, status 0 on network failures, payload serialization)
  - `App.test.tsx`: Passed (renders movies catalog, toggles watched status calling `PATCH /api/movies/:id`)
  - `npm run typecheck`, `lint`, `build`: All passed with 0 errors
- **Features Implemented**:
  - Typed API client (`fetchMovies`, `createMovie`, `updateMovie`) with unified `ApiError` handling.
  - Interactive Movies view with search, filter tabs (all, watched, unwatched), and status indicators.
  - Create and Edit modals with form validation (title required, runtime 1–300, release year 1900–2100).
  - Prerequisite multi-select supporting arbitrary DAG dependencies.
  - Atomic cycle error display explaining `CIRCULAR_DEPENDENCY` in user-friendly language.
  - Loading skeleton, empty list, and error retry states.
  - Submit button disabling while saving to prevent duplicate submissions.
- **Known Gaps**: None.

#### Phase 09: Rewatch Plan Frontend Integration
- **Status**: Completed & Verified
- **Tests Run**:
  - `client.test.ts`: Passed (`fetchRewatchOrder` tests)
  - `App.test.tsx`: Passed (switches to Rewatch Plan view, requests `GET /api/movies/:id/rewatch-order`, renders metrics)
  - `npm run typecheck`, `lint`, `build`: All passed with 0 errors
- **Features Implemented**:
  - Target movie selector populated from active database catalog.
  - Automatically fetches rewatch plan from server on target change.
  - Visual summary metrics: required prerequisite count, watched count and percentage progress bar, remaining unwatched runtime in hours and minutes (`formatMinutes`).
  - Sequenced list showing optimal viewing order.
  - Inline watched toggle on each item with automatic plan and metrics re-fetch.
  - Handling of standalone movies with zero prerequisites (e.g. *Thor: Ragnarok*).
  - Responsive, accessible mobile/desktop layout.
- **Known Gaps**: None.

#### Phase 10: Cinema Booking Frontend Integration
- **Status**: Completed & Verified
- **Tests Run**:
  - `client.test.ts`: Passed (`fetchCinemas`, `createCinema`, `fetchBookingQuote` tests)
  - `App.test.tsx`: Passed (switches to Booking view, loads venues, displays quote)
  - `npm run typecheck`, `lint`, `build`: All passed with 0 errors
- **Features Implemented**:
  - Cinema selector populated from `GET /api/cinemas`.
  - Group size input constrained to 1–10,000.
  - Assessment preset buttons: *Stark 11 seats*, *Odin 44 seats*, *Sanctum 7 seats (impossible)*, *Group 25*.
  - Calculation quote display showing minimum bundles, exact seat coverage, and bundle allocation breakdown cards.
  - Clear impossible state when no exact bundle sum exists.
  - "New Cinema" modal to add venues with distinct bundle sizes (1–500, max 10).
  - Transparent labeling as an exact calculation quote without implying ticket purchase.
- **Known Gaps**: None.

#### Phase 11: Integration QA and Hardening
- **Status**: Completed & Verified
- **Tests Run**:
  - `integration-journey.e2e-spec.ts`: Passed (8 tests covering both complete user journeys against live Supabase PostgreSQL)
    - Journey 1: Create chain A $\to$ B $\to$ C, request rewatch order for C (returns A, B), mark A as watched (metrics recalculate), attempt circular dependency C as prerequisite of A (rejected with 409 `CIRCULAR_DEPENDENCY` and transactional rollback).
    - Journey 2: Create cinema with bundles `[5, 12, 25]`, request group size 37 (optimal 2 bundles: 1x25 + 1x12), request impossible group size 8 (impossible state), scale check with group size 10,000 across 10 bundles ($<50$ms).
  - `npm run test`: Passed (50 API unit tests + 28 Web unit tests)
  - `npm run test:e2e`: Passed (54 total e2e tests across 5 suites)
  - `npm run lint`, `typecheck`, `build`: All passed with 0 errors/warnings
- **Hardening Completed**:
  - Removed debug logs and lingering comments.
  - Verified no credentials or `.env` files are tracked in git (`git status --ignored` clean).
  - Verified `.env.example` contains only generic local placeholders.
  - Audited frontend bundle (183 kB JS, 22 kB CSS, 0 secrets).
- **Known Gaps**: None.

#### Phase 12: Free-Tier Deployment Readiness
- **Status**: Completed & Verified
- **Database**: Supabase Hosted PostgreSQL (`aws-1-ap-northeast-1.pooler.supabase.com:6543`)
- **Tests Run**:
  - `prisma migrate deploy`: Verified against Supabase remote PostgreSQL database.
  - Port binding: Configured to read `process.env.PORT || API_PORT || 3000` listening on `0.0.0.0` for container compatibility.
  - Production build verification: Both `@doomsday/api` (`nest build`) and `@doomsday/web` (`vite build`) successfully produce production bundles in `dist/`.
- **Features Implemented**:
  - Documented Supabase Free-Tier configuration (transaction pooler 6543 vs direct session pooler 5432).
  - Documented Render/Railway container deployment and Vercel/Netlify SPA deployment.
  - Verified that database credentials and secrets are kept strictly on host/environment side.
- **Known Gaps**: None.

#### Phase 13: README, AI Disclosure and Submission Handoff
- **Status**: Completed & Verified
- **Documentation Implemented**:
  - Full root `README.md` with:
    - Architecture overview and Mermaid ER diagram.
    - Mathematical formulation and explanation of handwritten 3-color DFS cycle detector.
    - Explanation and complexity of post-order DFS topological rewatch sequencer.
    - Detailed explanation and comparison of handwritten unbounded knapsack DP vs greedy heuristic for ticket bundle quotes.
    - Complete API endpoint specification with example requests and responses.
    - Local setup instructions, Docker Compose instructions, and environment table.
    - Comprehensive test suite matrix listing all 16 test files (100% PASS).
    - Free-tier deployment instructions and provider limitation notes.
    - Transparent AI tool usage disclosure stating exact division of work.
- **Known Gaps**: None.

---

### Final Master Test Matrix

| Test Suite File | Test Type | Focus Area | Passing / Total | Status |
|---|---|---|---|---|
| `apps/api/src/movies/algorithms/cycle-detector.spec.ts` | Unit | Handwritten 3-color DFS cycle detection | 7 / 7 | **PASS** |
| `apps/api/src/movies/algorithms/rewatch-order.spec.ts` | Unit | Handwritten post-order DFS rewatch sequencer | 10 / 10 | **PASS** |
| `apps/api/src/cinemas/algorithms/minimum-bundles.spec.ts` | Unit | Handwritten unbounded knapsack DP | 8 / 8 | **PASS** |
| `apps/api/src/movies/movies.service.spec.ts` | Unit | MoviesService CRUD and cycle rollback | 9 / 9 | **PASS** |
| `apps/api/src/cinemas/cinemas.service.spec.ts` | Unit | CinemasService CRUD and quote validation | 8 / 8 | **PASS** |
| `apps/api/src/health/health.controller.spec.ts` | Unit | Health controller | 1 / 1 | **PASS** |
| `apps/api/src/config/configuration.spec.ts` | Unit | Environment schema validation | 7 / 7 | **PASS** |
| `apps/api/test/health.e2e-spec.ts` | E2E | Health check & CORS response headers | 1 / 1 | **PASS** |
| `apps/api/test/database.e2e-spec.ts` | E2E | PostgreSQL SQL check constraints & FKs | 7 / 7 | **PASS** |
| `apps/api/test/movies.e2e-spec.ts` | E2E | Movie CRUD, cycle guard benchmark, rewatch order | 19 / 19 | **PASS** |
| `apps/api/test/cinemas.e2e-spec.ts` | E2E | Cinema CRUD & 4 challenge DP booking cases | 19 / 19 | **PASS** |
| `apps/api/test/integration-journey.e2e-spec.ts` | E2E | Full cross-feature journeys A & B | 8 / 8 | **PASS** |
| `apps/web/src/api/client.test.ts` | Unit | Web API client, ApiError, payload serialization | 9 / 9 | **PASS** |
| `apps/web/src/App.test.tsx` | Integration | React views, navigation, mutations | 4 / 4 | **PASS** |
| `apps/web/src/components/HealthStatus.test.tsx` | Unit | HealthStatus loading, success, error states | 3 / 3 | **PASS** |
| `apps/web/src/utils/algorithms.test.ts` | Unit | Frontend helper utilities & formatting | 12 / 12 | **PASS** |
| **Total** | | **Comprehensive Monorepo Suite** | **132 / 132** | **100% PASS** |
