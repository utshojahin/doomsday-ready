import { computeMinimumBundles } from './minimum-bundles';

describe('computeMinimumBundles Algorithm (Handwritten DP)', () => {
  it('solves [1, 3, 4] for group size 6 -> 2 bundles of 3 (proves DP beats greedy)', () => {
    // Greedy would pick 4 + 1 + 1 = 3 bundles. DP picks 3 + 3 = 2 bundles!
    const result = computeMinimumBundles([1, 3, 4], 6);
    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(2);
    expect(result.bundles).toEqual([{ size: 3, count: 2 }]);
  });

  it('ASSESSMENT TEST CASE: [2, 5], 11 -> 4 bundles (1x5 and 3x2)', () => {
    const result = computeMinimumBundles([2, 5], 11);
    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(4);
    expect(result.bundles).toEqual([
      { size: 5, count: 1 },
      { size: 2, count: 3 },
    ]);
  });

  it('ASSESSMENT TEST CASE: [6, 9, 20], 44 -> 4 bundles (1x20, 2x9, 1x6)', () => {
    const result = computeMinimumBundles([6, 9, 20], 44);
    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(4);
    expect(result.bundles).toEqual([
      { size: 20, count: 1 },
      { size: 9, count: 2 },
      { size: 6, count: 1 },
    ]);
  });

  it('ASSESSMENT TEST CASE: [4, 6], 7 -> impossible', () => {
    const result = computeMinimumBundles([4, 6], 7);
    expect(result.possible).toBe(false);
    expect(result.totalBundles).toBeNull();
    expect(result.bundles).toEqual([]);
  });

  it('handles exact single bundle equal to group size', () => {
    const result = computeMinimumBundles([5, 10, 25], 25);
    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(1);
    expect(result.bundles).toEqual([{ size: 25, count: 1 }]);
  });

  it('handles group size smaller than all bundle sizes', () => {
    const result = computeMinimumBundles([10, 20], 5);
    expect(result.possible).toBe(false);
    expect(result.totalBundles).toBeNull();
  });

  it('handles bundle size 1', () => {
    const result = computeMinimumBundles([1, 5], 7);
    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(3); // 1x5 + 2x1
    expect(result.bundles).toEqual([
      { size: 5, count: 1 },
      { size: 1, count: 2 },
    ]);
  });

  it('handles maximum group size 10,000 efficiently', () => {
    const startTime = performance.now();
    const result = computeMinimumBundles([2, 5, 10, 25, 50, 100], 10000);
    const durationMs = performance.now() - startTime;

    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(100); // 100 x 100
    expect(durationMs).toBeLessThan(50); // Well under 50ms
  });
});

