import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as client from './api/client';

vi.mock('./api/client', () => ({
  fetchHealth: vi.fn(),
}));

describe('App Component and Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(client.fetchHealth).mockResolvedValue({
      status: 'ok',
      timestamp: '2026-11-21T10:00:00.000Z',
      uptime: 100,
    });
  });

  it('renders Movies view by default and lists initial MCU movies', () => {
    render(<App />);
    expect(screen.getByText(/MCU Movie Catalog/i)).toBeInTheDocument();
    const ironManTitles = screen.getAllByText('Iron Man');
    expect(ironManTitles.length).toBeGreaterThan(0);
    expect(screen.getByText('Avengers: Doomsday')).toBeInTheDocument();
  });

  it('switches to Rewatch Plan view and calculates prerequisite order', () => {
    render(<App />);

    const rewatchTab = screen.getByRole('button', { name: /Rewatch Plan/i });
    fireEvent.click(rewatchTab);

    expect(screen.getByText(/Rewatch Road to Doomsday/i)).toBeInTheDocument();
    expect(screen.getByText(/Required Titles/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready for:/i)).toBeInTheDocument();
  });

  it('switches to Cinema Booking view and displays bundle calculation', () => {
    render(<App />);

    const bookingTab = screen.getByRole('button', { name: /Cinema Booking/i });
    fireEvent.click(bookingTab);

    expect(screen.getByText(/Opening Night Group Ticket Optimizer/i)).toBeInTheDocument();
    expect(screen.getAllByText('Stark IMAX Theatre').length).toBeGreaterThan(0);
    expect(screen.getByText(/Exact Allocation Found/i)).toBeInTheDocument();
  });

  it('allows toggling watched status in movie list', () => {
    render(<App />);

    // Toggle Iron Man watched button
    const ironManTitles = screen.getAllByText('Iron Man');
    const ironManRow = ironManTitles[0].closest('tr')!;
    const toggleButton = ironManRow.querySelector('button')!;
    fireEvent.click(toggleButton);

    // Iron Man was initially watched (line-through), now it is unwatched
    expect(ironManTitles[0]).not.toHaveClass('line-through');
  });
});
