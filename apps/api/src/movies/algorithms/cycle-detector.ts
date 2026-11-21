/**
 * Handwritten Cycle Detector for Directed Graphs
 *
 * Edge Direction Convention:
 * A directed edge u -> v means movie u depends on movie v (v must be watched before u).
 * A circular dependency exists if following prerequisite edges leads back to an active
 * ancestor in the current DFS path.
 *
 * Node States:
 * 0: UNVISITED (White)
 * 1: VISITING (Gray - active in current recursion stack)
 * 2: VISITED (Black - fully explored and acyclic)
 */
export function hasCycleInGraph(adjacency: Map<string, string[]>): boolean {
  const state = new Map<string, 0 | 1 | 2>();

  function dfs(node: string): boolean {
    const s = state.get(node) || 0;
    if (s === 1) {
      // Encountered an ancestor currently on the recursion stack -> Cycle detected
      return true;
    }
    if (s === 2) {
      // Already fully explored and known acyclic
      return false;
    }

    state.set(node, 1); // Mark visiting
    const prerequisites = adjacency.get(node) || [];
    for (const prereq of prerequisites) {
      if (dfs(prereq)) {
        return true;
      }
    }

    state.set(node, 2); // Mark visited
    return false;
  }

  // Iterate over all nodes to cover disconnected components
  for (const node of adjacency.keys()) {
    if ((state.get(node) || 0) === 0) {
      if (dfs(node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates whether updating `movieId` to have prerequisites `proposedPrereqIds`
 * would introduce a circular dependency in the graph.
 */
export function validateNoCycles(
  movieId: string,
  proposedPrereqIds: string[],
  existingEdges: { movieId: string; prerequisiteId: string }[],
): boolean {
  // Direct self-dependency check: a movie cannot depend on itself
  if (proposedPrereqIds.includes(movieId)) {
    return false; // Invalid (contains direct cycle)
  }

  // Construct proposed graph in memory
  const adjacency = new Map<string, string[]>();

  // Populate from existing edges, excluding any existing edges originating from movieId
  for (const edge of existingEdges) {
    if (edge.movieId !== movieId) {
      const list = adjacency.get(edge.movieId) || [];
      list.push(edge.prerequisiteId);
      adjacency.set(edge.movieId, list);
    }
  }

  // Assign the proposed prerequisite edges for movieId
  adjacency.set(movieId, [...proposedPrereqIds]);

  // Ensure all referenced prerequisite target nodes exist in the adjacency map keys
  for (const prereqId of proposedPrereqIds) {
    if (!adjacency.has(prereqId)) {
      adjacency.set(prereqId, []);
    }
  }

  return !hasCycleInGraph(adjacency);
}

