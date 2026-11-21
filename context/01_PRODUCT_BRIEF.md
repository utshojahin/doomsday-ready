# 01 — Product Brief

## Product

**Doomsday Ready** is a small full-stack app for MCU fans preparing for Avengers: Doomsday. It manages movies and prerequisite relationships, calculates a prerequisite-first rewatch list, and calculates exact opening-night cinema bundle combinations.

## Required frontend views

### A. Movies
- List movies.
- Create a movie with title, release year, runtime and optional prerequisite movies.
- Edit movie details and prerequisites.
- Mark a movie watched or unwatched.
- Show validation and API errors.

### B. Rewatch Plan
- Select a target movie.
- Fetch all transitive prerequisites from the API.
- Display each prerequisite exactly once in valid prerequisite-first order.
- Never include the target movie itself.
- Show watched count / prerequisite count.
- Show total runtime of unwatched prerequisite movies.

### C. Booking
- List cinemas.
- Create a cinema with a name and 1–10 distinct bundle sizes.
- Select a cinema and enter a group size from 1 to 10,000.
- Display a minimum-count exact bundle combination.
- Display “Not possible” if exact group size cannot be formed.

## Required API

All endpoints under `/api`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/movies` | Create movie |
| GET | `/movies` | List movies |
| PATCH | `/movies/:id` | Update movie, watched and prerequisites |
| GET | `/movies/:id/rewatch-order` | Rewatch order and summary |
| POST | `/cinemas` | Create cinema |
| GET | `/cinemas` | List cinemas |
| GET | `/cinemas/:id/booking?groupSize=6` | Exact minimum-bundle quote |

Additional health/docs endpoints are allowed.

## Movie rules

- Title: required, trimmed, unique.
- Release year: integer, positive; document any upper-bound policy.
- Runtime: integer from 1 through 300 minutes.
- Watched: boolean, defaults to `false`.
- Prerequisites: optional list of existing movie IDs.
- A movie cannot depend on itself directly or transitively.
- Any create/update that creates a cycle returns HTTP `409`, code `CIRCULAR_DEPENDENCY`.
- Invalid/nonexistent prerequisite IDs return a clear `400` or `404` response, consistently documented.
- A failed update must not partially modify the movie or its relations.

## Rewatch result

Return an ordered list of prerequisite movies only, with each movie once. Every prerequisite must appear after its own prerequisites. Also return:
- `watchedCount`
- `totalCount`
- `unwatchedRuntimeMinutes`

If there are no prerequisites, return an empty list and zero counts/runtime.

## Cinema rules

- Name: required, trimmed, unique.
- Bundle sizes: array with 1–10 distinct integers.
- Each size: integer 1–500.
- A bundle can be purchased repeatedly without limit.
- Group size: integer 1–10,000.
- Seats must add up exactly to group size.
- Return a combination with the fewest bundles; return impossible if no exact sum exists.

## Sample data

The following prerequisite links are challenge sample data, not an official watch guide.

| Movie | Watch these first |
|---|---|
| Iron Man | None |
| Captain America: The First Avenger | None |
| The Avengers | Iron Man, Captain America: The First Avenger |
| Captain America: Civil War | The Avengers |
| Thor: Ragnarok | None |
| Avengers: Infinity War | Civil War, Ragnarok |
| Avengers: Endgame | Infinity War |
| Avengers: Doomsday | Endgame |

Sample release years/runtimes may be chosen by the developer and should be labelled sample data.

## Out of scope

No authentication, payment, real seat inventory, real cinema reservation, external movie metadata integration or email system is required. This is a quote calculator, not a ticketing platform.

## Definition of done

All three UI views must use the real API. All required endpoints, validation rules and both algorithms must work. Each feature must have automated tests, and README must explain setup, architecture, tests, deployment, AI use and limitations.
