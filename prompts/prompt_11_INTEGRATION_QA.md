# Prompt 11 — Integration QA and Hardening

Read all six context files and the master index. Review the full implementation and current test coverage.

## Goal
Verify the complete application from clean startup through all required user journeys. Fix defects, not scope-expand.

## Tasks
1. Run install from lockfile and clean build.
2. Run format/lint/typecheck and all unit/integration tests.
3. Add or run API integration tests for every required endpoint and status code.
4. Add end-to-end tests for:
   - Create movie → add prerequisites → mark watched → request rewatch plan.
   - Attempt circular prerequisite update → receive 409 and preserve data.
   - Create cinema → request possible quote → request impossible quote.
5. Check validation boundaries and malformed payloads.
6. Check frontend loading, empty and error states.
7. Check CORS, environment validation, safe error responses and absence of secrets.
8. Check responsive layout and browser console.
9. Check performance for maximum groupSize 10,000 and 10 bundle sizes.
10. Remove dead code, debug logs and unexplained TODOs.
11. Update Swagger docs and ensure actual response shapes match frontend types.

## Required final test matrix
Create a concise table of required behavior, test location, command and pass/fail. Do not claim coverage that does not exist.

## Acceptance gate
All required assessment behavior works from a clean local setup. List any remaining known limitations honestly. STOP.
