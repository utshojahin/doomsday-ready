import React, { useState, useEffect, useCallback } from 'react';
import { Movie, Cinema, CreateMovieInput, UpdateMovieInput } from './types';
import { Navbar, ActiveTab } from './components/Navbar';
import { MoviesView } from './features/movies/MoviesView';
import { RewatchPlanView } from './features/rewatch/RewatchPlanView';
import { BookingView } from './features/booking/BookingView';
import { fetchMovies, fetchCinemas, createMovie, updateMovie, deleteMovie } from './api/client';

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

  const handleDeleteMovie = async (id: string) => {
    await deleteMovie(id);
    setMovies((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCinemaCreated = async () => {
    await loadCinemas();
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-[#E53935] selection:text-white">
      {/* Sleek Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        moviesCount={movies.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-8">
        {activeTab === 'movies' && (
          <MoviesView
            movies={movies}
            isLoading={isLoadingMovies}
            error={moviesError}
            onRetry={loadMovies}
            onToggleWatched={handleToggleWatched}
            onAddMovie={handleAddMovie}
            onUpdateMovie={handleUpdateMovie}
            onDeleteMovie={handleDeleteMovie}
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
      <footer className="border-t border-[#262A35] bg-[#09090B] py-6 mb-16 sm:mb-0 text-center text-xs text-[#A1A1AA]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#FAFAFA]">DOOMSDAY READY</span>
            <span>—</span>
            <span>MCU Rewatch & Opening Night Ticket Optimizer</span>
          </div>
          <span className="font-mono text-[11px] text-[#A1A1AA]/70">
            Handwritten Graph DFS & Unbounded Knapsack DP · Strict TypeScript · Tailwind CSS
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
