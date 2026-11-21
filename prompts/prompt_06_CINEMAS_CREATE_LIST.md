# Prompt 06 — Cinema Create and List Vertical Slice

Read all six context files and the master index. Inspect Prisma schema and API conventions.

## Goal
Implement cinema creation and listing only.

## Tasks
1. Create `CinemasModule`, controller, service and DTOs.
2. Implement `POST /api/cinemas`.
3. Implement `GET /api/cinemas`.
4. Validate trimmed non-empty unique name.
5. Validate bundleSizes has 1–10 distinct integer values, each from 1 through 500.
6. Persist cinema and bundle rows atomically.
7. Return cinema with bundle sizes in a stable, documented order.
8. Add Swagger docs.

## Tests in this chunk
- Valid cinema create/list.
- Duplicate name -> 409.
- Empty name -> 400.
- Empty bundle array -> 400.
- 11 bundle sizes -> 400.
- Bundle size 0 and 501 -> 400.
- Fractional bundle size -> 400.
- Duplicate bundle size -> 400.
- Cinema creation failure leaves no partial cinema or bundle rows.

## Acceptance gate
Cinema CRUD endpoints and tests pass against PostgreSQL. Do not implement booking quote yet. STOP.
