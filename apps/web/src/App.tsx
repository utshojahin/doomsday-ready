import React, { useState } from 'react';
import { Movie, Cinema } from './types';
import { INITIAL_MOVIES, INITIAL_CINEMAS } from './data/sampleData';
import { Navbar, ActiveTab } from './components/Navbar';
import { MoviesView } from './features/movies/MoviesView';
import { RewatchPlanView } from './features/rewatch/RewatchPlanView';
import { BookingView } from './features/booking/BookingView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('movies');
  const [movies, setMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [cinemas, setCinemas] = useState<Cinema[]>(INITIAL_CINEMAS);

  const handleToggleWatched = (movieId: string) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === movieId ? { ...m, watched: !m.watched } : m)),
    );
  };

  const handleAddMovie = (newMovie: Omit<Movie, 'id'>) => {
    const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMovies((prev) => [...prev, { ...newMovie, id }]);
  };

  const handleUpdateMovie = (updatedMovie: Movie) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === updatedMovie.id ? updatedMovie : m)),
    );
  };

  const handleAddCinema = (newCinema: Omit<Cinema, 'id'>) => {
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCinemas((prev) => [...prev, { ...newCinema, id }]);
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {activeTab === 'movies' && (
          <MoviesView
            movies={movies}
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
            onAddCinema={handleAddCinema}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Doomsday Ready — MCU Rewatch & Opening Night Ticket Optimizer</span>
          <span className="font-mono text-[11px] text-slate-600">
            Handwritten Algorithms · Strict TypeScript · Tailwind CSS
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
