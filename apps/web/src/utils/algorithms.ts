import { Movie, RewatchPlan, BookingQuote } from '../types';

/**
 * Feature 1 Algorithm: Prerequisite-First Topological Sort & Cycle Detection
 * Uses DFS with 3-color node state tracking:
 * 0: Unvisited, 1: Visiting (in current recursion path), 2: Visited
 */
export function computeRewatchPlan(
  targetId: string,
  movies: Movie[],
): { plan: RewatchPlan | null; error?: string } {
  const movieMap = new Map<string, Movie>();
  for (const movie of movies) {
    movieMap.set(movie.id, movie);
  }

  const targetMovie = movieMap.get(targetId);
  if (!targetMovie) {
    return { plan: null, error: `Target movie not found: ${targetId}` };
  }

  const visitState = new Map<string, 0 | 1 | 2>();
  const orderedPrereqIds: string[] = [];
  let cycleDetected = false;

  function dfs(currentId: string): void {
    if (cycleDetected) return;
    const state = visitState.get(currentId) || 0;

    if (state === 1) {
      cycleDetected = true;
      return;
    }
    if (state === 2) {
      return;
    }

    visitState.set(currentId, 1);
    const movie = movieMap.get(currentId);

    if (movie) {
      for (const prereqId of movie.prerequisiteIds) {
        dfs(prereqId);
        if (cycleDetected) return;
      }
    }

    visitState.set(currentId, 2);
    // Exclude the requested target movie from the output list
    if (currentId !== targetId) {
      orderedPrereqIds.push(currentId);
    }
  }

  dfs(targetId);

  if (cycleDetected) {
    return { plan: null, error: 'CIRCULAR_DEPENDENCY: Circular dependency detected in movie prerequisites.' };
  }

  const orderedMovies = orderedPrereqIds
    .map((id) => movieMap.get(id))
    .filter((m): m is Movie => m !== undefined);

  const watchedCount = orderedMovies.filter((m) => m.watched).length;
  const unwatchedRuntimeMinutes = orderedMovies
    .filter((m) => !m.watched)
    .reduce((sum, m) => sum + m.runtimeMinutes, 0);

  return {
    plan: {
      target: {
        id: targetMovie.id,
        title: targetMovie.title,
        releaseYear: targetMovie.releaseYear,
        runtimeMinutes: targetMovie.runtimeMinutes,
      },
      movies: orderedMovies,
      watchedCount,
      totalCount: orderedMovies.length,
      unwatchedRuntimeMinutes,
    },
  };
}

/**
 * Validates whether adding or modifying prerequisites would introduce a cycle.
 */
export function checkCycle(
  movieId: string,
  proposedPrereqIds: string[],
  movies: Movie[],
): boolean {
  // Direct self-dependency check
  if (proposedPrereqIds.includes(movieId)) {
    return true;
  }

  const adj = new Map<string, string[]>();
  for (const m of movies) {
    if (m.id === movieId) {
      adj.set(m.id, proposedPrereqIds);
    } else {
      adj.set(m.id, [...m.prerequisiteIds]);
    }
  }
  if (!adj.has(movieId)) {
    adj.set(movieId, proposedPrereqIds);
  }

  const state = new Map<string, 0 | 1 | 2>();
  let hasCycle = false;

  function dfs(node: string) {
    if (hasCycle) return;
    const s = state.get(node) || 0;
    if (s === 1) {
      hasCycle = true;
      return;
    }
    if (s === 2) return;

    state.set(node, 1);
    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      dfs(neighbor);
      if (hasCycle) return;
    }
    state.set(node, 2);
  }

  for (const node of adj.keys()) {
    if ((state.get(node) || 0) === 0) {
      dfs(node);
      if (hasCycle) return true;
    }
  }

  return hasCycle;
}

/**
 * Feature 2 Algorithm: Unbounded Minimum Bundle Dynamic Programming
 * Finds the minimum number of ticket bundles to satisfy exact group size.
 * Time: O(groupSize * number of bundle sizes), Space: O(groupSize).
 */
export function computeBookingQuote(
  bundleSizes: number[],
  groupSize: number,
): BookingQuote {
  if (groupSize <= 0 || bundleSizes.length === 0) {
    return {
      possible: false,
      groupSize,
      totalBundles: null,
      bundles: [],
    };
  }

  const sortedSizes = Array.from(new Set(bundleSizes))
    .filter((s) => s > 0)
    .sort((a, b) => a - b);

  const dp: number[] = new Array(groupSize + 1).fill(Infinity);
  const choice: number[] = new Array(groupSize + 1).fill(-1);

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

  // Return bundles ordered by size descending for clean presentation
  const bundles = Array.from(countMap.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  return {
    possible: true,
    groupSize,
    totalBundles: dp[groupSize],
    bundles,
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

