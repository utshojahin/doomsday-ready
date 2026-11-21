# Prompt 05 — Rewatch Order Vertical Slice

Read all six context files and the master index. Review cycle detection implementation; reuse it only where appropriate, not a third-party algorithm.

## Goal
Implement `GET /api/movies/:id/rewatch-order` with transitive prerequisite traversal, valid ordering and summary metrics.

## Tasks
1. Implement a pure, handwritten DFS traversal that returns each transitive prerequisite exactly once.
2. With edges represented as `movie -> prerequisites`, recursively visit prerequisites before appending each prerequisite to output.
3. Exclude the requested target movie.
4. Preserve a deterministic order (for example, sort prerequisite IDs or titles before traversal); document tie-breaking.
5. Return movie details needed by UI: id, title, releaseYear if useful, runtimeMinutes and watched.
6. Calculate watchedCount, totalCount and unwatchedRuntimeMinutes from the returned prerequisite set.
7. Return 404 for unknown target ID.
8. Document algorithm complexity.

## Tests in this chunk
- Target with no prerequisites returns empty list and zero metrics.
- One prerequisite.
- Multi-level chain is prerequisite-first.
- Diamond graph includes shared ancestor once.
- Independent branches all included.
- Target is never included.
- Watched count and unwatched runtime are correct.
- Changing watched status changes metrics.
- Unknown target returns 404.
- Test all three sample expectations: Doomsday includes seven other movies; Civil War includes Iron Man and First Avenger then Avengers; Ragnarok returns empty.

## Acceptance gate
All algorithm, service and endpoint tests pass. Provide a concise trace of the DFS logic so the candidate can explain it. STOP.
