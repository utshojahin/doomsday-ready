# Prompt 08 — Movies Frontend Vertical Slice

Read all six context files and the master index. Inspect API contracts and frontend foundation.

## Goal
Build the Movies view and connect it to the real API. Do not build Rewatch or Booking UI yet.

## Tasks
1. Create shared typed API client and typed movie DTOs.
2. Create responsive Movies page with movie list and create form.
3. Include title, release year, runtime and prerequisite multi-select.
4. Add edit flow for prerequisites and movie fields.
5. Add watched/unwatched control.
6. Show loading, empty, success and error states.
7. Disable submit while saving and prevent duplicate requests.
8. Refresh list after successful mutation.
9. Display backend validation and `CIRCULAR_DEPENDENCY` errors in understandable language.
10. Keep visual style clean, coherent and responsive; avoid spending time on decorative animation.

## Tests in this chunk
- API client maps errors consistently.
- Form required/range validation.
- List loading, empty, populated and error states.
- Create submits correct payload.
- Watched toggle calls PATCH and updates UI.
- Prerequisite edit sends intended IDs.
- Cycle error appears to user.
- No hardcoded sample movie list after API integration.

## Acceptance gate
Manually create a movie, edit prerequisites, toggle watched, refresh and confirm persistence. Focused frontend tests and typecheck pass. STOP.
