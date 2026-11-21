export interface BundleCount {
  size: number;
  count: number;
}

export interface BookingQuoteResult {
  possible: boolean;
  groupSize: number;
  totalBundles: number | null;
  bundles: BundleCount[];
}

/**
 * Handwritten Unbounded Knapsack / Minimum Coin-Change Dynamic Programming Algorithm
 *
 * Why Greedy is Not Optimal:
 * A greedy approach that repeatedly takes the largest possible bundle fails for arbitrary
 * bundle denominations. For example, with bundle sizes [1, 3, 4] and group size 6:
 * - Greedy picks 4 + 1 + 1 = 3 bundles.
 * - Optimal DP picks 3 + 3 = 2 bundles.
 *
 * Algorithm Explanation:
 * 1. Define dp[amount] as the minimum number of bundles required to seat exactly `amount` attendees.
 * 2. Base case: dp[0] = 0 (0 bundles needed for 0 attendees).
 *    Initialize dp[1...groupSize] = Infinity.
 * 3. Choice array choice[amount] records the bundle size chosen to achieve dp[amount].
 * 4. Transition:
 *    For each amount from 1 to groupSize:
 *      For each bundle size s in sortedSizes (where s <= amount):
 *        if dp[amount - s] + 1 < dp[amount]:
 *          dp[amount] = dp[amount - s] + 1
 *          choice[amount] = s
 * 5. If dp[groupSize] is Infinity, return possible = false.
 * 6. Reconstruction:
 *    Starting from rem = groupSize, iteratively follow choice[rem], increment count for that bundle,
 *    and subtract choice[rem] from rem until rem reaches 0.
 *
 * Complexity:
 * - Time: O(G * B) where G = groupSize (up to 10,000) and B = number of bundle sizes (up to 10).
 *   Max operations: 10,000 * 10 = 100,000 (executes in < 2ms).
 * - Space: O(G) for the dp and choice arrays.
 */
export function computeMinimumBundles(
  bundleSizes: number[],
  groupSize: number,
): BookingQuoteResult {
  if (groupSize <= 0 || bundleSizes.length === 0) {
    return {
      possible: false,
      groupSize,
      totalBundles: null,
      bundles: [],
    };
  }

  // Deduplicate and filter positive sizes, sort ascending
  const sortedSizes = Array.from(new Set(bundleSizes))
    .filter((s) => s > 0)
    .sort((a, b) => a - b);

  const dp = new Array<number>(groupSize + 1).fill(Infinity);
  const choice = new Array<number>(groupSize + 1).fill(-1);

  dp[0] = 0;

  for (let amount = 1; amount <= groupSize; amount++) {
    for (const size of sortedSizes) {
      if (size <= amount) {
        if (dp[amount - size] !== Infinity && dp[amount - size] + 1 < dp[amount]) {
          dp[amount] = dp[amount - size] + 1;
          choice[amount] = size;
        }
      }
    }
  }

  if (dp[groupSize] === Infinity) {
    return {
      possible: false,
      groupSize,
      totalBundles: null,
      bundles: [],
    };
  }

  // Reconstruct the bundle counts
  const countMap = new Map<number, number>();
  let rem = groupSize;
  while (rem > 0) {
    const size = choice[rem];
    countMap.set(size, (countMap.get(size) || 0) + 1);
    rem -= size;
  }

  // Sort returned bundles in descending order of size for clean presentation
  const bundles: BundleCount[] = Array.from(countMap.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  return {
    possible: true,
    groupSize,
    totalBundles: dp[groupSize],
    bundles,
  };
}
