# Prompt 10 — Booking Frontend Vertical Slice

Read all six context files and the master index. Review cinema and booking API response contracts.

## Goal
Build Booking view using real cinema and quote endpoints.

## Tasks
1. Populate cinema selector from `GET /api/cinemas`.
2. Add group-size input constrained to 1–10,000.
3. Call booking quote endpoint when user submits or explicitly requests a quote.
4. Display exact bundle counts, total seats and total bundle count.
5. Display a clear impossible state.
6. Handle no cinemas, no selected cinema, invalid input, loading and API error.
7. Do not imply seats are reserved or tickets purchased. Label output as a quote/calculation.
8. Add a small cinema creation form if it fits the UX; the API endpoint remains required regardless.
9. Ensure responsive and accessible design.

## Tests in this chunk
- Cinema selector loading and options.
- Invalid group size blocked.
- Correct request query parameter.
- Possible quote displays counts.
- Impossible quote displays clear message.
- Loading/error/empty states.
- Switching cinema recalculates using selected cinema.

## Acceptance gate
Manually reproduce all four assessment booking examples using seeded or created cinemas. Tests pass. STOP.
