import React, { useState, useEffect, useCallback } from 'react';
import { Movie, Cinema, CreateMovieInput, UpdateMovieInput } from './types';
import { Navbar, ActiveTab } from './components/Navbar';
import { MoviesView } from './features/movies/MoviesView';
import { RewatchPlanView } from './features/rewatch/RewatchPlanView';
import { BookingView } from './features/booking/BookingView';
import { fetchMovies, fetchCinemas, createMovie, updateMovie } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('movies');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState<boolean>(true);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [isLoadingCinemas, setIsLoadingCinemas] = useState<boolean>(true);

  const loadMovies = useCallback(async () => {
    setIsLoadingMovies(true);
    setMoviesError(null);
    try {
      const data = await fetchMovies();
      setMovies(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load movies.';
      setMoviesError(message);
    } finally {
      setIsLoadingMovies(false);
    }
  }, []);

  const loadCinemas = useCallback(async () => {
    setIsLoadingCinemas(true);
    try {
      const data = await fetchCinemas();
      setCinemas(data);
    } catch {
      // Non-fatal on startup
    } finally {
      setIsLoadingCinemas(false);
    }
  }, []);

  useEffect(() => {
    loadMovies();
    loadCinemas();
  }, [loadMovies, loadCinemas]);

  const handleToggleWatched = async (movieId: string) => {
    const movie = movies.find((m) => m.id === movieId);
    if (!movie) return;

    const nextWatched = !movie.watched;
    const updated = await updateMovie(movieId, { watched: nextWatched });
    setMovies((prev) => prev.map((m) => (m.id === movieId ? updated : m)));
  };

  const handleAddMovie = async (newMovie: CreateMovieInput) => {
    const created = await createMovie(newMovie);
    setMovies((prev) => [...prev, created]);
  };

  const handleUpdateMovie = async (id: string, updatedFields: UpdateMovieInput) => {
    const updated = await updateMovie(id, updatedFields);
    setMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleCinemaCreated = async () => {
    await loadCinemas();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sleek Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        moviesCount={movies.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-4 py-5 sm:py-8">
        {activeTab === 'movies' && (
          <MoviesView
            movies={movies}
            isLoading={isLoadingMovies}
            error={moviesError}
            onRetry={loadMovies}
            onToggleWatched={handleToggleWatched}
            onAddMovie={handleAddMovie}
            onUpdateMovie={handleUpdateMovie}
          />
        )}

        {activeTab === 'rewatch' && (
          <RewatchPlanView
            movies={movies}
            onToggleWatched={handleToggleWatched}
          />
        )}

        {activeTab === 'booking' && (
          <BookingView
            cinemas={cinemas}
            isLoading={isLoadingCinemas}
            onCinemaCreated={handleCinemaCreated}
          />
        )}
      </main>

      {/* Footer (with extra bottom spacing on mobile for navigation bar) */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 mb-16 sm:mb-0 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Doomsday Ready — MCU Rewatch & Opening Night Ticket Optimizer</span>
          <span className="font-mono text-[11px] text-slate-600">
            Handwritten Graph DFS & Unbounded Knapsack DP · Strict TypeScript · Tailwind CSS
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
