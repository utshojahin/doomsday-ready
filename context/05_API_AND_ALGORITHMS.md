# 05 — API Contracts and Handwritten Algorithms

## API endpoints

All routes use `/api`.

### Movies

`POST /api/movies`

Example body:
```json
{
  "title": "Iron Man",
  "releaseYear": 2008,
  "runtimeMinutes": 126,
  "prerequisiteIds": []
}
```

Return 201 and the created movie including prerequisite IDs or a clearly documented nested representation.

`GET /api/movies`

Return a list suitable for the Movies and Rewatch selectors. Keep response shape consistent.

`PATCH /api/movies/:id`

Allow partial updates of `title`, `releaseYear`, `runtimeMinutes`, `watched`, and/or `prerequisiteIds`. Omitted fields remain unchanged. Validate the complete proposed state. A cycle must return:
```json
{
  "statusCode": 409,
  "code": "CIRCULAR_DEPENDENCY",
  "message": "The prerequisite change would create a cycle."
}
```

`GET /api/movies/:id/rewatch-order`

Suggested response:
```json
{
  "target": { "id": "...", "title": "Avengers: Doomsday" },
  "movies": [
    { "id": "...", "title": "Iron Man", "runtimeMinutes": 126, "watched": true }
  ],
  "watchedCount": 1,
  "totalCount": 7,
  "unwatchedRuntimeMinutes": 500
}
```
Exact property names may be improved, but document them and keep frontend types aligned. Do not include the target in `movies`.

### Cinemas

`POST /api/cinemas`

Example:
```json
{ "name": "Cinemax", "bundleSizes": [2, 5] }
```

`GET /api/cinemas`

Return each cinema and its bundle sizes.

`GET /api/cinemas/:id/booking?groupSize=11`

Suggested possible response:
```json
{
  "possible": true,
  "groupSize": 11,
  "totalBundles": 4,
  "bundles": [
    { "size": 5, "count": 1 },
    { "size": 2, "count": 3 }
  ]
}
```

Suggested impossible response:
```json
{
  "possible": false,
  "groupSize": 7,
  "totalBundles": null,
  "bundles": []
}
```

## Feature 1 algorithm: graph traversal and cycle detection

Implement the graph logic yourself. Do not use a graph library.

Requirements:
- A movie cannot depend on itself, directly or indirectly.
- Detect a cycle for every proposed create/update relationship set.
- Return 409 with code `CIRCULAR_DEPENDENCY`.
- Rewatch plan includes every transitive prerequisite exactly once.
- Exclude the target.
- Every prerequisite must appear before the movie that depends on it.

Recommended approach:
- Represent adjacency as `Map<MovieId, MovieId[]>`.
- Use DFS with three states: unvisited, visiting, visited (or an equivalent explicit color map).
- Encountering a `visiting` node indicates a cycle.
- Use DFS post-order for prerequisite-first ordering when following edges from dependent movie to prerequisite.
- A visited set ensures each prerequisite appears once.
- Keep algorithm pure and test it without a database.

Important: carefully verify edge direction. With `movie -> prerequisites`, recursively visit prerequisites first, then append the current prerequisite to output. Do not append the requested target.

Required tests:
- no prerequisites -> empty result
- one prerequisite
- multi-level chain
- diamond graph -> shared ancestor exactly once
- independent branches
- target excluded
- watched count and unwatched runtime
- direct self-cycle
- indirect cycle
- update that would create cycle
- duplicate prerequisite IDs handled safely
- nonexistent IDs rejected

## Feature 2 algorithm: unbounded minimum coin change

Implement the optimization yourself. Do not use a coin-change/optimization library.

Input:
- bundle sizes: 1–10 distinct integers in range 1–500
- group size: integer 1–10,000

Goal: find an exact sum using the fewest bundles, with unlimited reuse of each size.

Recommended dynamic programming:
- `dp[0] = 0`
- initialize other values to infinity
- for each amount from 1 to group size, inspect every bundle size `b <= amount`
- if `dp[amount - b]` is reachable, consider `dp[amount - b] + 1`
- store the chosen bundle size for reconstruction
- if `dp[groupSize]` remains infinity, return impossible
- reconstruct counts by repeatedly subtracting the stored size

Complexity: `O(groupSize × numberOfBundleSizes)` time and `O(groupSize)` space.

Do not use greedy selection: it is not optimal for arbitrary bundle sets.

Required tests:
- `[1,3,4]`, 6 -> two bundles of 3
- `[2,5]`, 11 -> one 5 and three 2s
- `[6,9,20]`, 44 -> one 20, two 9s and one 6
- `[4,6]`, 7 -> impossible
- one bundle size exactly equal to group size
- group size smaller than every bundle
- bundle size 1
- repeated use of one size
- order-independent result for input sizes
- invalid inputs rejected before algorithm invocation
- verify optimality against brute force for a bounded set of small test inputs if practical
