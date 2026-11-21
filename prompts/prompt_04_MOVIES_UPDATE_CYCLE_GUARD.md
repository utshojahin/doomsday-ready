# Prompt 04 — Movie Update and Circular Dependency Guard

Read all six context files and the master index. Review current movie endpoints and graph representation.

## Goal
Implement PATCH and robustly reject direct and indirect circular prerequisite relationships.

## Tasks
1. Implement `PATCH /api/movies/:id` for partial updates to title, releaseYear, runtimeMinutes, watched and prerequisiteIds.
2. Distinguish omitted prerequisiteIds (leave unchanged) from an empty array (remove all prerequisites).
3. Validate target movie exists and all proposed prerequisite IDs exist.
4. Implement a handwritten graph cycle detector in a pure function. Do not use a graph library.
5. Before writing, construct the proposed graph and validate it.
6. If the proposed graph contains a cycle, return HTTP 409 with code `CIRCULAR_DEPENDENCY`.
7. Persist scalar and relationship changes atomically in one Prisma transaction.
8. Ensure a failed request leaves all existing data unchanged.
9. Document the graph edge direction.

## Tests in this chunk
- Mark watched true and false.
- Update title/year/runtime.
- Replace prerequisites, clear prerequisites, omit prerequisites.
- Movie not found -> 404.
- Direct self-dependency -> 409 `CIRCULAR_DEPENDENCY`.
- Indirect cycle through multiple movies -> 409.
- Valid relationship update succeeds.
- Duplicate prerequisite IDs are safely deduplicated or rejected consistently.
- Failed cycle update does not change scalar fields or relations.
- Pure cycle detector tests cover acyclic graph, self-loop, longer cycle and disconnected components.

## Acceptance gate
All PATCH tests and cycle detector tests pass. Manually demonstrate the assessment's example: making Avengers: Endgame a prerequisite of Iron Man returns 409. Do not implement rewatch endpoint yet.

Report and STOP.
