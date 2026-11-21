import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchHealth,
  fetchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  fetchRewatchOrder,
  fetchCinemas,
  createCinema,
  fetchBookingQuote,
  ApiError,
} from './client';

describe('API Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchHealth returns data on 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', timestamp: '2026-11-21', uptime: 42 }),
    });

    const res = await fetchHealth();
    expect(res.status).toBe('ok');
    expect(res.uptime).toBe(42);
  });

  it('fetchMovies returns movie list on 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 'm1', title: 'Iron Man', releaseYear: 2008, runtimeMinutes: 126, watched: true, prerequisiteIds: [] }],
    });

    const movies = await fetchMovies();
    expect(movies).toHaveLength(1);
    expect(movies[0].title).toBe('Iron Man');
  });

  it('createMovie sends POST request with correct payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'm-new', title: 'Thor', releaseYear: 2011, runtimeMinutes: 115, watched: false, prerequisiteIds: [] }),
    });
    global.fetch = fetchMock;

    const res = await createMovie({
      title: 'Thor',
      releaseYear: 2011,
      runtimeMinutes: 115,
      prerequisiteIds: [],
    });

    expect(res.id).toBe('m-new');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/movies'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Thor',
          releaseYear: 2011,
          runtimeMinutes: 115,
          prerequisiteIds: [],
        }),
      }),
    );
  });

  it('updateMovie maps CIRCULAR_DEPENDENCY 409 error properly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        statusCode: 409,
        code: 'CIRCULAR_DEPENDENCY',
        message: 'Adding prerequisite creates a circular dependency',
      }),
    });

    await expect(updateMovie('m1', { prerequisiteIds: ['m2'] })).rejects.toThrow(ApiError);

    try {
      await updateMovie('m1', { prerequisiteIds: ['m2'] });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(409);
      expect(apiErr.code).toBe('CIRCULAR_DEPENDENCY');
      expect(apiErr.message).toBe('Adding prerequisite creates a circular dependency');
    }
  });

  it('fetchRewatchOrder calls GET /movies/:id/rewatch-order', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        target: { id: 'm-doomsday', title: 'Avengers: Doomsday', releaseYear: 2026, runtimeMinutes: 180 },
        movies: [],
        watchedCount: 0,
        totalCount: 0,
        unwatchedRuntimeMinutes: 0,
      }),
    });

    const plan = await fetchRewatchOrder('m-doomsday');
    expect(plan.target.title).toBe('Avengers: Doomsday');
  });

  it('fetchBookingQuote calls GET /cinemas/:id/booking?groupSize=N', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        possible: true,
        groupSize: 11,
        totalBundles: 4,
        bundles: [
          { size: 5, count: 1 },
          { size: 2, count: 3 },
        ],
      }),
    });
    global.fetch = fetchMock;

    const quote = await fetchBookingQuote('c1', 11);
    expect(quote.possible).toBe(true);
    expect(quote.totalBundles).toBe(4);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/cinemas/c1/booking?groupSize=11'), expect.anything());
  });

  it('fetchCinemas calls GET /cinemas', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 'c1', name: 'Cinema 1', bundleSizes: [2, 5] }],
    });

    const cinemas = await fetchCinemas();
    expect(cinemas).toHaveLength(1);
    expect(cinemas[0].name).toBe('Cinema 1');
  });

  it('createCinema calls POST /cinemas with payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'c2', name: 'Cinema 2', bundleSizes: [3, 6] }),
    });
    global.fetch = fetchMock;

    const cinema = await createCinema({ name: 'Cinema 2', bundleSizes: [3, 6] });
    expect(cinema.id).toBe('c2');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/cinemas'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Cinema 2', bundleSizes: [3, 6] }),
      }),
    );
  });

  it('deleteMovie calls DELETE /movies/:id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => null,
    });
    global.fetch = fetchMock;

    await deleteMovie('m1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/movies/m1'),
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });

  it('handles network failure with ApiError status 0', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(fetchMovies()).rejects.toThrow(ApiError);
    try {
      await fetchMovies();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.code).toBe('NETWORK_ERROR');
    }
  });
});
