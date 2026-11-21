import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthStatus } from './HealthStatus';
import * as client from '../api/client';

vi.mock('../api/client', () => ({
  fetchHealth: vi.fn(),
}));

describe('HealthStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    vi.mocked(client.fetchHealth).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<HealthStatus />);
    expect(screen.getByTestId('health-loading')).toBeInTheDocument();
    expect(screen.getByText(/Checking API health.../i)).toBeInTheDocument();
  });

  it('renders success state when API responds successfully', async () => {
    vi.mocked(client.fetchHealth).mockResolvedValueOnce({
      status: 'ok',
      timestamp: '2026-11-21T10:00:00.000Z',
      uptime: 42.5,
    });

    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('health-success')).toBeInTheDocument();
    });

    expect(screen.getByText(/Status: ok/i)).toBeInTheDocument();
    expect(screen.getByText(/Uptime: 42.5s/i)).toBeInTheDocument();
  });

  it('renders error state and allows retry on failure', async () => {
    vi.mocked(client.fetchHealth).mockRejectedValueOnce(new Error('Network error'));

    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('health-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to connect: Network error/i)).toBeInTheDocument();

    // Now mock success on retry
    vi.mocked(client.fetchHealth).mockResolvedValueOnce({
      status: 'ok',
      timestamp: '2026-11-21T10:00:01.000Z',
      uptime: 43,
    });

    const retryButton = screen.getByRole('button', { name: /Retry Connection/i });
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByTestId('health-success')).toBeInTheDocument();
    });
  });
});

