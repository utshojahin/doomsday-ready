# 03 — Architecture

## Architecture choice

Use a modular monolith: one NestJS API, one React SPA and one PostgreSQL database. This is easy to reason about, test and deploy for an internship assessment.

## Request flow

```text
React page / feature
      |
      | HTTP JSON
      v
NestJS controller
      |
      v
DTO parsing and validation
      |
      v
Application service
      |                  \
      v                   v
Prisma / PostgreSQL    Pure domain algorithm
```

## Backend modules

### MoviesModule
- Controller handles POST/GET/PATCH and rewatch-order route.
- Service coordinates persistence and domain validation.
- Dependency graph logic is isolated in pure functions.
- Cycle validation happens before committing relationship changes.
- Update of movie and prerequisites must be atomic.

### CinemasModule
- Controller handles POST/GET and booking quote route.
- Service validates cinema and loads bundle sizes.
- Minimum-bundle algorithm is isolated in a pure function.

### Common
- Global validation pipe.
- Consistent exception mapping.
- Config validation.
- Health endpoint.
- Swagger setup.

## Frontend features

- Movies feature: list, create, edit prerequisites and watched toggle.
- Rewatch feature: target selector, ordered plan, progress and remaining runtime.
- Booking feature: cinema selector, group-size input, quote result and impossible state.
- Shared API client: base URL from `VITE_API_BASE_URL`, typed methods, consistent error handling.
- Shared components: form fields, loading indicator, error message, empty state and page shell.

## Transaction and consistency requirements

When changing prerequisites:
1. Load the existing graph or the relevant adjacency data.
2. Construct the proposed graph in memory.
3. Validate referenced IDs and detect cycles.
4. If invalid, return the correct error without writing.
5. If valid, persist the movie update and relation changes in one database transaction.

Avoid race-condition claims that cannot be guaranteed by the chosen design. Explain any residual concurrency limitation in README if relevant.

## Frontend behavior

- Always show loading, empty, success and error states where applicable.
- Disable submit buttons while a request is in flight.
- Prevent duplicate submissions.
- Refresh affected data after successful mutations.
- Use API-returned values as the source of truth.
- Keep forms usable on mobile and desktop.
