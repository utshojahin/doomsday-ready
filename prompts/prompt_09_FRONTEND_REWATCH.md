# Prompt 09 — Rewatch Plan Frontend Vertical Slice

Read all six context files and the master index. Review the API response type and Movies page patterns.

## Goal
Build the Rewatch Plan view using the real rewatch endpoint.

## Tasks
1. Add target movie selector populated from `GET /api/movies`.
2. Fetch `GET /api/movies/:id/rewatch-order` when target changes.
3. Display ordered prerequisite list with watched/unwatched indicators.
4. Display progress as `watchedCount of totalCount` and a percentage progress bar.
5. Display remaining unwatched runtime in readable hours/minutes.
6. Handle no target selected, no prerequisites, loading, API error and target deleted.
7. Ensure progress and runtime come from API response, not duplicated frontend graph logic.
8. Add accessible labels and mobile layout.

## Tests in this chunk
- Target selector options.
- Selecting target calls correct endpoint.
- Order is rendered as returned.
- Watched indicators correct.
- Progress count and bar correct.
- Remaining runtime formatting correct, including 0 minutes.
- Empty plan state.
- Loading and error states.
- Changing target refreshes plan.

## Acceptance gate
Manually choose Avengers: Doomsday and confirm all seven prerequisite movies appear in API order. Change a watched flag on Movies view and confirm plan metrics update. Tests pass. STOP.
