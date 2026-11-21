import { computeRewatchOrder, MovieNode } from './rewatch-order';

describe('computeRewatchOrder Algorithm (Pure Handwritten DFS)', () => {
  const sampleMovies: MovieNode[] = [
    {
      id: 'm-iron-man',
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
      watched: true,
      prerequisiteIds: [],
    },
    {
      id: 'm-first-avenger',
      title: 'Captain America: The First Avenger',
      releaseYear: 2011,
      runtimeMinutes: 124,
      watched: true,
      prerequisiteIds: [],
    },
    {
      id: 'm-the-avengers',
      title: 'The Avengers',
      releaseYear: 2012,
      runtimeMinutes: 143,
      watched: true,
      prerequisiteIds: ['m-iron-man', 'm-first-avenger'],
    },
    {
      id: 'm-civil-war',
      title: 'Captain America: Civil War',
      releaseYear: 2016,
      runtimeMinutes: 147,
      watched: false,
      prerequisiteIds: ['m-the-avengers'],
    },
    {
      id: 'm-ragnarok',
      title: 'Thor: Ragnarok',
      releaseYear: 2017,
      runtimeMinutes: 130,
      watched: true,
      prerequisiteIds: [],
    },
    {
      id: 'm-infinity-war',
      title: 'Avengers: Infinity War',
      releaseYear: 2018,
      runtimeMinutes: 149,
      watched: false,
      prerequisiteIds: ['m-civil-war', 'm-ragnarok'],
    },
    {
      id: 'm-endgame',
      title: 'Avengers: Endgame',
      releaseYear: 2019,
      runtimeMinutes: 181,
      watched: false,
      prerequisiteIds: ['m-infinity-war'],
    },
    {
      id: 'm-doomsday',
      title: 'Avengers: Doomsday',
      releaseYear: 2026,
      runtimeMinutes: 180,
      watched: false,
      prerequisiteIds: ['m-endgame'],
    },
  ];

  const movieMap = new Map(sampleMovies.map((m) => [m.id, m]));

  it('returns null for an unknown target ID', () => {
    expect(computeRewatchOrder('nonexistent-id', movieMap)).toBeNull();
  });

  it('returns empty list and zero metrics for target with no prerequisites (Thor: Ragnarok)', () => {
    const result = computeRewatchOrder('m-ragnarok', movieMap);
    expect(result).not.toBeNull();
    expect(result!.target.title).toBe('Thor: Ragnarok');
    expect(result!.movies).toEqual([]);
    expect(result!.totalCount).toBe(0);
    expect(result!.watchedCount).toBe(0);
    expect(result!.unwatchedRuntimeMinutes).toBe(0);
  });

  it('computes valid rewatch order for Captain America: Civil War (Iron Man and First Avenger before The Avengers)', () => {
    const result = computeRewatchOrder('m-civil-war', movieMap);
    expect(result).not.toBeNull();
    expect(result!.totalCount).toBe(3);

    const titles = result!.movies.map((m) => m.title);
    expect(titles).toContain('Iron Man');
    expect(titles).toContain('Captain America: The First Avenger');
    expect(titles).toContain('The Avengers');
    expect(titles).not.toContain('Captain America: Civil War'); // Target excluded

    // The Avengers must appear after Iron Man and First Avenger
    const avengersIdx = titles.indexOf('The Avengers');
    const ironManIdx = titles.indexOf('Iron Man');
    const firstAvengerIdx = titles.indexOf('Captain America: The First Avenger');
    expect(ironManIdx).toBeLessThan(avengersIdx);
    expect(firstAvengerIdx).toBeLessThan(avengersIdx);
  });

  it('computes complete rewatch plan for Avengers: Doomsday with all 7 prerequisites', () => {
    const result = computeRewatchOrder('m-doomsday', movieMap);
    expect(result).not.toBeNull();
    expect(result!.totalCount).toBe(7);
    expect(result!.movies.map((m) => m.id)).not.toContain('m-doomsday');

    const indices = new Map(result!.movies.map((m, i) => [m.id, i]));
    // Prerequisite ordering assertions
    expect(indices.get('m-iron-man')!).toBeLessThan(indices.get('m-the-avengers')!);
    expect(indices.get('m-first-avenger')!).toBeLessThan(indices.get('m-the-avengers')!);
    expect(indices.get('m-the-avengers')!).toBeLessThan(indices.get('m-civil-war')!);
    expect(indices.get('m-civil-war')!).toBeLessThan(indices.get('m-infinity-war')!);
    expect(indices.get('m-ragnarok')!).toBeLessThan(indices.get('m-infinity-war')!);
    expect(indices.get('m-infinity-war')!).toBeLessThan(indices.get('m-endgame')!);
  });

  it('accurately computes watchedCount and unwatchedRuntimeMinutes', () => {
    const result = computeRewatchOrder('m-doomsday', movieMap)!;

    // Watched in sample data: Iron Man (126), First Avenger (124), The Avengers (143), Ragnarok (130) -> 4 watched
    // Unwatched: Civil War (147), Infinity War (149), Endgame (181) -> 3 unwatched -> 147 + 149 + 181 = 477 min
    expect(result.watchedCount).toBe(4);
    expect(result.totalCount).toBe(7);
    expect(result.unwatchedRuntimeMinutes).toBe(477);
  });

  it('handles diamond dependency graph and includes shared ancestor exactly once', () => {
    // Diamond: D -> B, D -> C, B -> A, C -> A
    const diamondMovies: MovieNode[] = [
      { id: 'A', title: 'Movie A', releaseYear: 2000, runtimeMinutes: 90, watched: true, prerequisiteIds: [] },
      { id: 'B', title: 'Movie B', releaseYear: 2002, runtimeMinutes: 100, watched: true, prerequisiteIds: ['A'] },
      { id: 'C', title: 'Movie C', releaseYear: 2004, runtimeMinutes: 110, watched: true, prerequisiteIds: ['A'] },
      { id: 'D', title: 'Movie D', releaseYear: 2006, runtimeMinutes: 120, watched: false, prerequisiteIds: ['B', 'C'] },
    ];
    const diamondMap = new Map(diamondMovies.map((m) => [m.id, m]));
    const result = computeRewatchOrder('D', diamondMap)!;

    expect(result.totalCount).toBe(3);
    const ids = result.movies.map((m) => m.id);
    expect(ids.filter((id) => id === 'A')).toHaveLength(1); // Exactly once
    expect(ids[0]).toBe('A'); // A appears before B and C
  });
});

