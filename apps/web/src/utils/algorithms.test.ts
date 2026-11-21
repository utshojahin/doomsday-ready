import { describe, it, expect } from 'vitest';
import { computeRewatchPlan, computeBookingQuote, checkCycle } from './algorithms';
import { INITIAL_MOVIES } from '../data/sampleData';

describe('Handwritten Algorithms', () => {
  describe('computeRewatchPlan (Topological Sort & Prerequisite Order)', () => {
    it('orders prerequisites strictly before dependent movies for Avengers: Doomsday', () => {
      const result = computeRewatchPlan('m-doomsday', INITIAL_MOVIES);
      expect(result.error).toBeUndefined();
      expect(result.plan).not.toBeNull();

      const plan = result.plan!;
      expect(plan.target.title).toBe('Avengers: Doomsday');
      expect(plan.movies.map((m) => m.id)).not.toContain('m-doomsday');
      expect(plan.totalCount).toBe(7);

      const movieIndices = new Map(plan.movies.map((m, i) => [m.id, i]));

      // Verify prerequisite ordering
      expect(movieIndices.get('m-iron-man')!).toBeLessThan(movieIndices.get('m-the-avengers')!);
      expect(movieIndices.get('m-first-avenger')!).toBeLessThan(movieIndices.get('m-the-avengers')!);
      expect(movieIndices.get('m-the-avengers')!).toBeLessThan(movieIndices.get('m-civil-war')!);
      expect(movieIndices.get('m-civil-war')!).toBeLessThan(movieIndices.get('m-infinity-war')!);
      expect(movieIndices.get('m-ragnarok')!).toBeLessThan(movieIndices.get('m-infinity-war')!);
      expect(movieIndices.get('m-infinity-war')!).toBeLessThan(movieIndices.get('m-endgame')!);
    });

    it('returns empty list for movie with no prerequisites', () => {
      const result = computeRewatchPlan('m-iron-man', INITIAL_MOVIES);
      expect(result.plan).not.toBeNull();
      expect(result.plan!.totalCount).toBe(0);
      expect(result.plan!.movies).toEqual([]);
      expect(result.plan!.watchedCount).toBe(0);
      expect(result.plan!.unwatchedRuntimeMinutes).toBe(0);
    });

    it('accurately calculates watchedCount and unwatchedRuntimeMinutes', () => {
      const result = computeRewatchPlan('m-doomsday', INITIAL_MOVIES);
      const plan = result.plan!;

      const actualWatched = plan.movies.filter((m) => m.watched).length;
      expect(plan.watchedCount).toBe(actualWatched);

      const actualUnwatchedRuntime = plan.movies
        .filter((m) => !m.watched)
        .reduce((acc, m) => acc + m.runtimeMinutes, 0);
      expect(plan.unwatchedRuntimeMinutes).toBe(actualUnwatchedRuntime);
    });

    it('detects cycle in circular prerequisite graph', () => {
      const cyclicMovies = [
        { id: '1', title: 'A', releaseYear: 2020, runtimeMinutes: 100, watched: false, prerequisiteIds: ['2'] },
        { id: '2', title: 'B', releaseYear: 2021, runtimeMinutes: 100, watched: false, prerequisiteIds: ['3'] },
        { id: '3', title: 'C', releaseYear: 2022, runtimeMinutes: 100, watched: false, prerequisiteIds: ['1'] },
      ];
      const result = computeRewatchPlan('1', cyclicMovies);
      expect(result.plan).toBeNull();
      expect(result.error).toContain('CIRCULAR_DEPENDENCY');
    });
  });

  describe('checkCycle', () => {
    it('detects direct self-cycle', () => {
      expect(checkCycle('m-iron-man', ['m-iron-man'], INITIAL_MOVIES)).toBe(true);
    });

    it('detects indirect cycle', () => {
      // Adding Doomsday as prereq to Iron Man would create a cycle because Doomsday depends on Iron Man transitively
      expect(checkCycle('m-iron-man', ['m-doomsday'], INITIAL_MOVIES)).toBe(true);
    });

    it('allows valid acyclic additions', () => {
      expect(checkCycle('m-ragnarok', ['m-iron-man'], INITIAL_MOVIES)).toBe(false);
    });
  });

  describe('computeBookingQuote (Unbounded Knapsack / Minimum Bundle DP)', () => {
    it('solves [1, 3, 4] for group size 6 -> two bundles of 3 (greedy would pick 4+1+1=3 bundles)', () => {
      const quote = computeBookingQuote([1, 3, 4], 6);
      expect(quote.possible).toBe(true);
      expect(quote.totalBundles).toBe(2);
      expect(quote.bundles).toEqual([{ size: 3, count: 2 }]);
    });

    it('solves [2, 5] for group size 11 -> one 5 and three 2s', () => {
      const quote = computeBookingQuote([2, 5], 11);
      expect(quote.possible).toBe(true);
      expect(quote.totalBundles).toBe(4);
      expect(quote.bundles).toEqual([
        { size: 5, count: 1 },
        { size: 2, count: 3 },
      ]);
    });

    it('solves [6, 9, 20] for group size 44 -> one 20, two 9s, one 6', () => {
      const quote = computeBookingQuote([6, 9, 20], 44);
      expect(quote.possible).toBe(true);
      expect(quote.totalBundles).toBe(4);
      expect(quote.bundles).toEqual([
        { size: 20, count: 1 },
        { size: 9, count: 2 },
        { size: 6, count: 1 },
      ]);
    });

    it('handles impossible group sizes: [4, 6] for group size 7', () => {
      const quote = computeBookingQuote([4, 6], 7);
      expect(quote.possible).toBe(false);
      expect(quote.totalBundles).toBeNull();
      expect(quote.bundles).toEqual([]);
    });

    it('handles exact single bundle match', () => {
      const quote = computeBookingQuote([5, 10], 10);
      expect(quote.possible).toBe(true);
      expect(quote.totalBundles).toBe(1);
      expect(quote.bundles).toEqual([{ size: 10, count: 1 }]);
    });
  });
});

