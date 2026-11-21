import {
  Movie,
  Cinema,
  RewatchPlan,
  BookingQuote,
  CreateMovieInput,
  UpdateMovieInput,
  CreateCinemaInput,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string,
  ) {
    super(message || `API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(0, 'NETWORK_ERROR', `Unable to connect to API server: ${errorMsg}`);
  }

  if (!response.ok) {
    let errorBody: { statusCode?: number; code?: string; message?: string | string[] } = {};
    try {
      errorBody = await response.json();
    } catch {
      // Body was not json
    }

    const message = Array.isArray(errorBody.message)
      ? errorBody.message.join(', ')
      : errorBody.message || `Request failed with status ${response.status}`;

    throw new ApiError(response.status, errorBody.code, message);
  }

  // Handle empty responses (204 No Content, etc.)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

// Movies Endpoints
export async function fetchMovies(): Promise<Movie[]> {
  return request<Movie[]>('/movies');
}

export async function createMovie(data: CreateMovieInput): Promise<Movie> {
  return request<Movie>('/movies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMovie(id: string, data: UpdateMovieInput): Promise<Movie> {
  return request<Movie>(`/movies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchRewatchOrder(movieId: string): Promise<RewatchPlan> {
  return request<RewatchPlan>(`/movies/${movieId}/rewatch-order`);
}

// Cinemas & Booking Endpoints
export async function fetchCinemas(): Promise<Cinema[]> {
  return request<Cinema[]>('/cinemas');
}

export async function createCinema(data: CreateCinemaInput): Promise<Cinema> {
  return request<Cinema>('/cinemas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchBookingQuote(cinemaId: string, groupSize: number): Promise<BookingQuote> {
  return request<BookingQuote>(`/cinemas/${cinemaId}/booking?groupSize=${encodeURIComponent(groupSize)}`);
}
