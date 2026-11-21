# Phase Tracker

Tick only after you personally review the diff and the test evidence.

- [x] 01 Repository foundation
- [x] 02 Database schema and seed
- [x] 03 Movie create/list
- [x] 04 Movie update and cycle guard
- [ ] 05 Rewatch plan algorithm/API
- [ ] 06 Cinema create/list
- [ ] 07 Booking DP/API
- [ ] 08 Movies frontend
- [ ] 09 Rewatch frontend
- [ ] 10 Booking frontend
- [ ] 11 Integration QA
- [ ] 12 Free-tier deployment
- [ ] 13 README and submission

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
