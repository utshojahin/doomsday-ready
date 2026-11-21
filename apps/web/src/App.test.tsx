import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as client from './api/client';
import { INITIAL_MOVIES, INITIAL_CINEMAS } from './data/sampleData';

vi.mock('./api/client', () => ({
  fetchHealth: vi.fn(),
  fetchMovies: vi.fn(),
  fetchCinemas: vi.fn(),
  createMovie: vi.fn(),
  updateMovie: vi.fn(),
  fetchRewatchOrder: vi.fn(),
  createCinema: vi.fn(),
  fetchBookingQuote: vi.fn(),
}));

describe('App Component and Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(client.fetchHealth).mockResolvedValue({
      status: 'ok',
      timestamp: '2026-11-21T10:00:00.000Z',
      uptime: 100,
    });

    vi.mocked(client.fetchMovies).mockResolvedValue([...INITIAL_MOVIES]);
    vi.mocked(client.fetchCinemas).mockResolvedValue([...INITIAL_CINEMAS]);

    vi.mocked(client.fetchRewatchOrder).mockResolvedValue({
      target: {
        id: 'm-doomsday',
        title: 'Avengers: Doomsday',
        releaseYear: 2026,
        runtimeMinutes: 180,
      },
      movies: INITIAL_MOVIES.slice(0, 7),
      watchedCount: 4,
      totalCount: 7,
      unwatchedRuntimeMinutes: 512,
    });

    vi.mocked(client.fetchBookingQuote).mockResolvedValue({
      possible: true,
      groupSize: 11,
      totalBundles: 4,
      bundles: [
        { size: 5, count: 1 },
        { size: 2, count: 3 },
      ],
    });
  });

  it('renders Movies view by default and lists initial MCU movies', async () => {
    render(<App />);

    expect(screen.getByText(/MCU Catalog/i)).toBeInTheDocument();

    await waitFor(() => {
      const ironManTitles = screen.getAllByText('Iron Man');
      expect(ironManTitles.length).toBeGreaterThan(0);
      expect(screen.getAllByText('Avengers: Doomsday').length).toBeGreaterThan(0);
    });
  });

  it('switches to Rewatch Plan view and calculates prerequisite order from API', async () => {
    render(<App />);

    const rewatchTabs = screen.getAllByRole('button', { name: /Rewatch Plan/i });
    fireEvent.click(rewatchTabs[0]);

    expect(screen.getByText(/Topological Rewatch Sequencer/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Required Prerequisite Titles/i)).toBeInTheDocument();
      expect(screen.getByText(/Preparation Progress/i)).toBeInTheDocument();
      expect(client.fetchRewatchOrder).toHaveBeenCalled();
    });
  });

  it('switches to Cinema Booking view and displays bundle calculation from API', async () => {
    render(<App />);

    const bookingTabs = screen.getAllByRole('button', { name: /Cinema Booking/i });
    fireEvent.click(bookingTabs[0]);

    expect(screen.getByText(/Opening Night Ticket Bundle Optimizer/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/Stark IMAX Theatre/i).length).toBeGreaterThan(0);
      expect(client.fetchBookingQuote).toHaveBeenCalled();
    });
  });

  it('allows toggling watched status in movie list calling updateMovie', async () => {
    const updatedIronMan = {
      ...INITIAL_MOVIES[0],
      watched: false,
    };
    vi.mocked(client.updateMovie).mockResolvedValue(updatedIronMan);

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Iron Man').length).toBeGreaterThan(0);
    });

    // Toggle button in table or card
    const toggleButtons = screen.getAllByTitle(/Mark as unwatched|Mark as watched/i);
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(client.updateMovie).toHaveBeenCalledWith('m-iron-man', { watched: false });
    });
  });
});
