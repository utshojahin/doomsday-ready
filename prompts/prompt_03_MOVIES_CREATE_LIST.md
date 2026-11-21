# Prompt 03 — Movie Create and List Vertical Slice

Read all six context files and the master index. Inspect the database schema and existing tests.

## Goal
Implement only movie creation and listing, end to end at the API layer.

## Tasks
1. Create `MoviesModule`, controller, service and DTOs.
2. Implement `POST /api/movies`.
3. Implement `GET /api/movies`.
4. Validate title (required, trim, unique), releaseYear (integer, positive and documented upper policy), runtimeMinutes (integer 1–300), optional prerequisiteIds array and watched default false.
5. Verify all prerequisite IDs exist before creating the movie.
6. Return a consistent response shape and documented errors.
7. Add Swagger decorators/documentation for these endpoints.

## Tests in this chunk
- Unit tests for DTO/service validation.
- Integration tests for valid create and list.
- Duplicate title -> 409 or a documented conflict response.
- Blank title -> 400.
- Runtime 0 and 301 -> 400.
- Fractional year/runtime -> 400.
- Nonexistent prerequisite -> documented 400/404.
- Omitted watched defaults false.
- Duplicate prerequisite IDs do not create duplicate join rows.

## Acceptance gate
Use an HTTP client or API tests to create and list movies from PostgreSQL. All tests pass. Do not implement PATCH or rewatch calculation yet.

Report and STOP.
