import React, { useState } from 'react';
import { Movie, CreateMovieInput, UpdateMovieInput } from '../../types';
import { formatMinutes } from '../../utils/algorithms';
import { IconCheck, IconPlus, IconAlertCircle, IconX } from '../../components/Icons';
import { ApiError } from '../../api/client';

interface MoviesViewProps {
  movies: Movie[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onToggleWatched: (movieId: string) => Promise<void>;
  onAddMovie: (movie: CreateMovieInput) => Promise<void>;
  onUpdateMovie: (id: string, movie: UpdateMovieInput) => Promise<void>;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  movies,
  isLoading = false,
  error = null,
  onRetry,
  onToggleWatched,
  onAddMovie,
  onUpdateMovie,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState<number>(new Date().getFullYear());
  const [runtimeMinutes, setRuntimeMinutes] = useState<number>(120);
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const movieMap = new Map(movies.map((m) => [m.id, m]));

  const openAddModal = () => {
    setEditingMovie(null);
    setTitle('');
    setReleaseYear(2026);
    setRuntimeMinutes(120);
    setSelectedPrereqIds([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Movie) => {
    setEditingMovie(m);
    setTitle(m.title);
    setReleaseYear(m.releaseYear);
    setRuntimeMinutes(m.runtimeMinutes);
    setSelectedPrereqIds([...m.prerequisiteIds]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handlePrereqToggle = (candidateId: string) => {
    const isCurrentlySelected = selectedPrereqIds.includes(candidateId);
    const nextPrereqs = isCurrentlySelected
      ? selectedPrereqIds.filter((id) => id !== candidateId)
      : [...selectedPrereqIds, candidateId];

    setFormError(null);
    setSelectedPrereqIds(nextPrereqs);
  };

  const handleToggle = async (movieId: string) => {
    setActionError(null);
    try {
      await onToggleWatched(movieId);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError('Failed to toggle watched status.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Movie title is required.');
      return;
    }

    if (runtimeMinutes < 1 || runtimeMinutes > 300) {
      setFormError('Runtime must be between 1 and 300 minutes.');
      return;
    }

    if (releaseYear < 1900 || releaseYear > 2100) {
      setFormError('Release year must be between 1900 and 2100.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingMovie) {
        await onUpdateMovie(editingMovie.id, {
          title: trimmedTitle,
          releaseYear,
          runtimeMinutes,
          prerequisiteIds: selectedPrereqIds,
        });
      } else {
        await onAddMovie({
          title: trimmedTitle,
          releaseYear,
          runtimeMinutes,
          watched: false,
          prerequisiteIds: selectedPrereqIds,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'CIRCULAR_DEPENDENCY' || err.status === 409) {
          setFormError(`Circular dependency detected: ${err.message}. The update was rejected.`);
        } else {
          setFormError(err.message);
        }
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred while saving.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMovies = movies.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'watched') return m.watched;
    if (filter === 'unwatched') return !m.watched;
    return true;
  });

  const totalWatched = movies.filter((m) => m.watched).length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100">MCU Movie Catalog</h2>
          <p className="text-xs text-slate-400">
            {isLoading
              ? 'Loading catalog from database...'
              : `${totalWatched} of ${movies.length} movies watched · Track prerequisite requirements`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Filter by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isLoading}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500 disabled:opacity-50"
          />

          {/* Add Movie */}
          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <IconPlus className="w-3.5 h-3.5" />
            <span>Add Movie</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-medium"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({movies.length})
        </button>
        <button
          onClick={() => setFilter('watched')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filter === 'watched' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Watched ({totalWatched})
        </button>
        <button
          onClick={() => setFilter('unwatched')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filter === 'unwatched' ? 'bg-slate-800 text-amber-400 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unwatched ({movies.length - totalWatched})
        </button>
      </div>

      {/* Movies Table / List */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 w-24">Year</th>
                <th className="py-3 px-4 w-28">Runtime</th>
                <th className="py-3 px-4">Prerequisites</th>
                <th className="py-3 px-4 w-20 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && movies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Fetching movies from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMovies.map((movie) => (
                <tr
                  key={movie.id}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    movie.watched ? 'bg-slate-900/40' : ''
                  }`}
                >
                  {/* Watched Toggle */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggle(movie.id)}
                      title={movie.watched ? 'Mark as unwatched' : 'Mark as watched'}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                        movie.watched
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-700 bg-slate-950 text-transparent hover:border-slate-500'
                      }`}
                    >
                      <IconCheck className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </td>

                  {/* Title */}
                  <td className="py-3 px-4">
                    <span className={`font-medium ${movie.watched ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                      {movie.title}
                    </span>
                  </td>

                  {/* Year */}
                  <td className="py-3 px-4 text-slate-400 font-mono">{movie.releaseYear}</td>

                  {/* Runtime */}
                  <td className="py-3 px-4 text-slate-400">
                    <span>{formatMinutes(movie.runtimeMinutes)}</span>
                    <span className="text-slate-500 text-[10px] ml-1">({movie.runtimeMinutes}m)</span>
                  </td>

                  {/* Prerequisites */}
                  <td className="py-3 px-4">
                    {movie.prerequisiteIds.length === 0 ? (
                      <span className="text-slate-500 italic text-[11px]">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {movie.prerequisiteIds.map((pid) => {
                          const prereq = movieMap.get(pid);
                          return (
                            <span
                              key={pid}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                prereq?.watched
                                  ? 'bg-slate-800/80 text-emerald-400/90 border-slate-700'
                                  : 'bg-slate-950 text-slate-300 border-slate-800'
                              }`}
                            >
                              {prereq?.title || pid}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Edit */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openEditModal(movie)}
                      className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && filteredMovies.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    {search ? 'No movies match your search filter.' : 'No movies in catalog. Add your first title!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Movie Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New Movie'}
              </h3>
              <button
                onClick={() => !isSaving && setIsModalOpen(false)}
                disabled={isSaving}
                className="text-slate-400 hover:text-white p-1 rounded-md disabled:opacity-40"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                <IconAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  disabled={isSaving}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Black Panther"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Release Year</label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    required
                    disabled={isSaving}
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Runtime (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    required
                    disabled={isSaving}
                    value={runtimeMinutes}
                    onChange={(e) => setRuntimeMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Required Prerequisites (Direct Dependencies)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Select movies that must be watched prior to this one. Cycle detection is enforced atomically.
                </p>
                <div className="max-h-44 overflow-y-auto space-y-1.5 border border-slate-800 bg-slate-950/70 p-2.5 rounded-lg divide-y divide-slate-800/40">
                  {movies
                    .filter((m) => m.id !== editingMovie?.id)
                    .map((candidate) => {
                      const isChecked = selectedPrereqIds.includes(candidate.id);
                      return (
                        <label
                          key={candidate.id}
                          className="flex items-center space-x-2 pt-1.5 first:pt-0 cursor-pointer hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSaving}
                            onChange={() => handlePrereqToggle(candidate.id)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-900 disabled:opacity-50"
                          />
                          <span className="text-slate-300">{candidate.title}</span>
                          <span className="text-slate-500 text-[10px]">({candidate.releaseYear})</span>
                        </label>
                      );
                    })}
                  {movies.length <= 1 && (
                    <p className="text-slate-500 text-[11px] italic py-2 text-center">
                      No other movies available to select as prerequisites.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isSaving && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isSaving ? 'Saving...' : editingMovie ? 'Save Changes' : 'Create Movie'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
