import { hasCycleInGraph, validateNoCycles } from './cycle-detector';

describe('Cycle Detector Algorithm (Handwritten)', () => {
  describe('hasCycleInGraph', () => {
    it('returns false for an empty graph', () => {
      expect(hasCycleInGraph(new Map())).toBe(false);
    });

    it('returns false for a simple linear acyclic chain: A -> B -> C', () => {
      const adj = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['C']],
        ['C', []],
      ]);
      expect(hasCycleInGraph(adj)).toBe(false);
    });

    it('returns false for a diamond acyclic graph: A -> [B, C], B -> D, C -> D', () => {
      const adj = new Map<string, string[]>([
        ['A', ['B', 'C']],
        ['B', ['D']],
        ['C', ['D']],
        ['D', []],
      ]);
      expect(hasCycleInGraph(adj)).toBe(false);
    });

    it('detects a direct self-loop: A -> A', () => {
      const adj = new Map<string, string[]>([['A', ['A']]]);
      expect(hasCycleInGraph(adj)).toBe(true);
    });

    it('detects a 2-node cycle: A -> B -> A', () => {
      const adj = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['A']],
      ]);
      expect(hasCycleInGraph(adj)).toBe(true);
    });

    it('detects a multi-node cycle: A -> B -> C -> D -> B', () => {
      const adj = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['C']],
        ['C', ['D']],
        ['D', ['B']],
      ]);
      expect(hasCycleInGraph(adj)).toBe(true);
    });

    it('detects cycle in disconnected components: X -> Y (acyclic), but P -> Q -> P (cyclic)', () => {
      const adj = new Map<string, string[]>([
        ['X', ['Y']],
        ['Y', []],
        ['P', ['Q']],
        ['Q', ['P']],
      ]);
      expect(hasCycleInGraph(adj)).toBe(true);
    });
  });

  describe('validateNoCycles', () => {
    const existingEdges = [
      { movieId: 'm-avengers', prerequisiteId: 'm-iron-man' },
      { movieId: 'm-civil-war', prerequisiteId: 'm-avengers' },
      { movieId: 'm-infinity-war', prerequisiteId: 'm-civil-war' },
      { movieId: 'm-endgame', prerequisiteId: 'm-infinity-war' },
    ];

    it('rejects direct self-prerequisite: Iron Man -> Iron Man', () => {
      const valid = validateNoCycles('m-iron-man', ['m-iron-man'], existingEdges);
      expect(valid).toBe(false);
    });

    it('rejects indirect circular dependency: Iron Man -> Endgame', () => {
      // Endgame depends on Infinity War -> Civil War -> Avengers -> Iron Man.
      // Making Endgame a prerequisite of Iron Man would create a cycle!
      const valid = validateNoCycles('m-iron-man', ['m-endgame'], existingEdges);
      expect(valid).toBe(false);
    });

    it('allows valid acyclic prerequisite updates: Avengers -> [Iron Man, First Avenger]', () => {
      const valid = validateNoCycles(
        'm-avengers',
        ['m-iron-man', 'm-first-avenger'],
        existingEdges,
      );
      expect(valid).toBe(true);
    });

    it('allows clearing all prerequisites to empty array []', () => {
      const valid = validateNoCycles('m-avengers', [], existingEdges);
      expect(valid).toBe(true);
    });
  });
});

