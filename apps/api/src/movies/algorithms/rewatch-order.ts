export interface MovieNode {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
  prerequisiteIds: string[];
}

export interface RewatchOrderItem {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

export interface RewatchOrderResult {
  target: {
    id: string;
    title: string;
    releaseYear: number;
    runtimeMinutes: number;
  };
  movies: RewatchOrderItem[];
  watchedCount: number;
  totalCount: number;
  unwatchedRuntimeMinutes: number;
}

/**
 * Pure Handwritten Post-Order DFS for Prerequisite-First Topological Rewatch Order
 *
 * Algorithm Explanation & Trace:
 * 1. Edges represent dependent -> prerequisite (e.g. The Avengers -> Iron Man).
 * 2. To ensure all prerequisites appear before any movie depending on them,
 *    we use post-order Depth-First Search (DFS):
 *    - For the current movie, recursively visit all its prerequisites first.
 *    - Once all prerequisites of the current movie are processed, append the current movie.
 * 3. A `visited` Set ensures every transitive prerequisite is visited and included exactly once.
 * 4. The requested target movie is excluded from the returned prerequisite list.
 * 5. Deterministic tie-breaking: when a movie has multiple prerequisites, they are traversed
 *    in ascending order of releaseYear, then alphabetically by title.
 *
 * Complexity:
 * - Time: O(V + E) where V is the number of reachable prerequisite movies and E is the number of prerequisite relations.
 * - Space: O(V) for the visited set, recursion stack (at most depth V), and result array.
 */
export function computeRewatchOrder(
  targetId: string,
  movieMap: Map<string, MovieNode>,
): RewatchOrderResult | null {
  const targetMovie = movieMap.get(targetId);
  if (!targetMovie) {
    return null;
  }

  const visited = new Set<string>();
  const orderedPrerequisites: RewatchOrderItem[] = [];

  function dfs(currentId: string): void {
    if (visited.has(currentId)) {
      return;
    }
    visited.add(currentId);

    const movie = movieMap.get(currentId);
    if (movie) {
      // Deterministic tie-breaking: sort prerequisites by releaseYear asc, then title asc
      const sortedPrereqIds = [...movie.prerequisiteIds].sort((a, b) => {
        const ma = movieMap.get(a);
        const mb = movieMap.get(b);
        if (!ma || !mb) return 0;
        if (ma.releaseYear !== mb.releaseYear) {
          return ma.releaseYear - mb.releaseYear;
        }
        return ma.title.localeCompare(mb.title);
      });

      for (const prereqId of sortedPrereqIds) {
        dfs(prereqId);
      }

      // Post-order append: add to result only if it is not the requested target movie itself
      if (currentId !== targetId) {
        orderedPrerequisites.push({
          id: movie.id,
          title: movie.title,
          releaseYear: movie.releaseYear,
          runtimeMinutes: movie.runtimeMinutes,
          watched: movie.watched,
        });
      }
    }
  }

  dfs(targetId);

  const watchedCount = orderedPrerequisites.filter((m) => m.watched).length;
  const unwatchedRuntimeMinutes = orderedPrerequisites
    .filter((m) => !m.watched)
    .reduce((sum, m) => sum + m.runtimeMinutes, 0);

  return {
    target: {
      id: targetMovie.id,
      title: targetMovie.title,
      releaseYear: targetMovie.releaseYear,
      runtimeMinutes: targetMovie.runtimeMinutes,
    },
    movies: orderedPrerequisites,
    watchedCount,
    totalCount: orderedPrerequisites.length,
    unwatchedRuntimeMinutes,
  };
}

