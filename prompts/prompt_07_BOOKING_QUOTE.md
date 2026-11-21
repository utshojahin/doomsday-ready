# Prompt 07 — Minimum-Bundle Booking Quote

Read all six context files and the master index. Review cinema validation.

## Goal
Implement `GET /api/cinemas/:id/booking?groupSize=N` using handwritten unbounded minimum-coin dynamic programming.

## Tasks
1. Implement a pure function that accepts validated bundle sizes and group size.
2. Use DP to minimize number of bundles for an exact seat sum.
3. Store predecessor/selected bundle information and reconstruct counts.
4. Return possible=false when exact sum is unreachable.
5. Validate groupSize as integer 1–10,000.
6. Return 404 for unknown cinema.
7. Return stable response shape, sorted bundle sizes and totalBundles.
8. Document time O(G × B) and space O(G).
9. Do not use greedy or a coin-change package.

## Tests in this chunk
- `[1,3,4]`, 6 -> two bundles of 3.
- `[2,5]`, 11 -> one 5 and three 2s.
- `[6,9,20]`, 44 -> one 20, two 9s and one 6.
- `[4,6]`, 7 -> impossible.
- Exact single bundle.
- Group smaller than all bundle sizes.
- Bundle size 1.
- Repeated bundle use.
- Verify returned bundle counts sum exactly to group size.
- Verify returned bundle count is minimal; compare against brute force for a bounded matrix of small cases if practical.
- Invalid group sizes: missing, zero, negative, fractional, >10,000, non-numeric.
- Unknown cinema -> 404.

## Acceptance gate
Every supplied assessment example passes. Explain why greedy is not generally correct and trace the DP reconstruction. STOP.
