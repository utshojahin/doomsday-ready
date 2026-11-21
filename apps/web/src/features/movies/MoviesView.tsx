import React, { useState } from 'react';
import { Movie, CreateMovieInput, UpdateMovieInput } from '../../types';
import { formatMinutes } from '../../utils/algorithms';
import {
  IconCheck,
  IconPlus,
  IconAlertCircle,
  IconX,
  IconSearch,
  IconClock,
  IconFilm,
  IconTrash,
} from '../../components/Icons';
import { ApiError } from '../../api/client';

interface MoviesViewProps {
  movies: Movie[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onToggleWatched: (movieId: string) => Promise<void>;
  onAddMovie: (movie: CreateMovieInput) => Promise<void>;
  onUpdateMovie: (id: string, movie: UpdateMovieInput) => Promise<void>;
  onDeleteMovie?: (id: string) => Promise<void>;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  movies,
  isLoading = false,
  error = null,
  onRetry,
  onToggleWatched,
  onAddMovie,
  onUpdateMovie,
  onDeleteMovie,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Delete confirmation state
  const [confirmDeleteMovie, setConfirmDeleteMovie] = useState<Movie | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setTogglingId(movieId);
    try {
      await onToggleWatched(movieId);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError('Failed to update watched status.');
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (movie: Movie) => {
    if (!onDeleteMovie) return;
    setActionError(null);
    setIsDeleting(true);

    try {
      await onDeleteMovie(movie.id);
      setConfirmDeleteMovie(null);
      if (editingMovie?.id === movie.id) {
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError('Failed to delete movie.');
      }
    } finally {
      setIsDeleting(false);
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
          setFormError(`Circular dependency detected: ${err.message}. The update was rejected to preserve a valid watch order.`);
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
  const totalUnwatchedMinutes = movies
    .filter((m) => !m.watched)
    .reduce((acc, m) => acc + m.runtimeMinutes, 0);
  const totalMinutes = movies.reduce((acc, m) => acc + m.runtimeMinutes, 0);
  const progressPercent = movies.length > 0 ? Math.round((totalWatched / movies.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Movies */}
        <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            MCU Catalog
          </span>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {movies.length}
            </span>
            <span className="text-xs text-slate-400">titles</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">Catalog in release order</p>
        </div>

        {/* Watched Progress */}
        <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Watched
          </span>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
              {totalWatched}
            </span>
            <span className="text-xs text-slate-400">/ {movies.length}</span>
            <span className="text-xs text-emerald-500 font-mono">({progressPercent}%)</span>
          </div>
          <div className="mt-2 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Unwatched Runtime */}
        <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Remaining Time
          </span>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-bold text-amber-300 tracking-tight font-mono">
              {formatMinutes(totalUnwatchedMinutes)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            {movies.length - totalWatched} unwatched titles
          </p>
        </div>

        {/* Total Runtime */}
        <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total MCU Time
          </span>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-200 tracking-tight font-mono">
              {formatMinutes(totalMinutes)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">{totalMinutes} total minutes</p>
        </div>
      </div>

      {/* Action Bar (Search, Filters, Add Movie) */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <IconSearch className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search movie by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills and Add Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({movies.length})
            </button>
            <button
              onClick={() => setFilter('watched')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'watched'
                  ? 'bg-emerald-950/70 text-emerald-300 font-medium border border-emerald-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Watched ({totalWatched})
            </button>
            <button
              onClick={() => setFilter('unwatched')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'unwatched'
                  ? 'bg-amber-950/60 text-amber-300 font-medium border border-amber-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unwatched ({movies.length - totalWatched})
            </button>
          </div>

          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <IconPlus className="w-4 h-4" />
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
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white p-1">
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
              className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-medium"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* MOBILE CARD VIEW (Visible only on < sm screens) */}
      <div className="sm:hidden space-y-3">
        {isLoading && movies.length === 0 ? (
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center text-slate-400 space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">Loading MCU titles from database...</p>
          </div>
        ) : filteredMovies.map((movie) => (
          <div
            key={movie.id}
            className={`p-4 rounded-xl border transition-all ${
              movie.watched
                ? 'bg-slate-900/50 border-slate-800/80'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3
                  className={`text-sm font-semibold leading-tight ${
                    movie.watched ? 'text-slate-400 line-through' : 'text-slate-100'
                  }`}
                >
                  {movie.title}
                </h3>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="font-mono">{movie.releaseYear}</span>
                  <span>·</span>
                  <span className="flex items-center space-x-1">
                    <IconClock className="w-3 h-3 text-slate-500 inline" />
                    <span>{formatMinutes(movie.runtimeMinutes)}</span>
                  </span>
                </div>
              </div>

              {/* Watched Action Button */}
              <button
                onClick={() => handleToggle(movie.id)}
                disabled={togglingId === movie.id}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                  movie.watched
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <IconCheck className={`w-3.5 h-3.5 ${movie.watched ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{movie.watched ? 'Watched' : 'Mark Watched'}</span>
              </button>
            </div>

            {/* Prerequisites */}
            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs gap-2">
              <div className="flex-1 pr-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block mb-1">
                  Required Prerequisites:
                </span>
                {movie.prerequisiteIds.length === 0 ? (
                  <span className="text-[11px] text-slate-500 italic">None (Standalone entry)</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {movie.prerequisiteIds.map((pid) => {
                      const prereq = movieMap.get(pid);
                      return (
                        <span
                          key={pid}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            prereq?.watched
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
                              : 'bg-slate-950 text-slate-300 border-slate-800'
                          }`}
                        >
                          {prereq?.title || pid}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => openEditModal(movie)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 py-1 px-2 rounded bg-indigo-950/40 border border-indigo-900/40 font-medium"
                >
                  Edit
                </button>
                {onDeleteMovie && (
                  <button
                    onClick={() => setConfirmDeleteMovie(movie)}
                    className="p-1 rounded bg-rose-950/30 text-rose-400 hover:text-rose-200 border border-rose-900/30"
                    title="Delete movie"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {!isLoading && filteredMovies.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 rounded-xl border border-slate-800">
            {search ? 'No movies match your search query.' : 'No movies in catalog.'}
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Visible on sm+ screens) */}
      <div className="hidden sm:block bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 w-24">Year</th>
                <th className="py-3 px-4 w-28">Runtime</th>
                <th className="py-3 px-4">Prerequisites</th>
                <th className="py-3 px-4 w-28 text-right">Action</th>
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
                      disabled={togglingId === movie.id}
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

                  {/* Edit / Delete Buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => openEditModal(movie)}
                        className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded hover:bg-slate-800 transition-colors"
                      >
                        Edit
                      </button>
                      {onDeleteMovie && (
                        <button
                          onClick={() => setConfirmDeleteMovie(movie)}
                          title="Delete movie"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <IconFilm className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New MCU Movie'}
                </h3>
              </div>
              <button
                onClick={() => !isSaving && setIsModalOpen(false)}
                disabled={isSaving}
                className="text-slate-400 hover:text-white p-1 rounded-md disabled:opacity-40"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                <IconAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Movie Title</label>
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
                  <label className="block text-slate-300 font-medium mb-1">Runtime (minutes)</label>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">
                    Required Prerequisites (Direct Dependencies)
                  </label>
                  <span className="text-[11px] text-indigo-400 font-mono">
                    {selectedPrereqIds.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Select titles that must be watched prior to this movie. Circular dependencies will be rejected atomically.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-800 bg-slate-950/80 p-2.5 rounded-xl divide-y divide-slate-800/40">
                  {movies
                    .filter((m) => m.id !== editingMovie?.id)
                    .map((candidate) => {
                      const isChecked = selectedPrereqIds.includes(candidate.id);
                      return (
                        <label
                          key={candidate.id}
                          className="flex items-center space-x-2.5 py-1.5 first:pt-0 cursor-pointer hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSaving}
                            onChange={() => handlePrereqToggle(candidate.id)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-900 w-4 h-4 disabled:opacity-50"
                          />
                          <span className="text-slate-300 text-xs">{candidate.title}</span>
                          <span className="text-slate-500 text-[10px] font-mono">
                            ({candidate.releaseYear})
                          </span>
                        </label>
                      );
                    })}
                  {movies.length <= 1 && (
                    <p className="text-slate-500 text-[11px] italic py-2 text-center">
                      No other movies in catalog to select as prerequisites.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {editingMovie && onDeleteMovie ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setConfirmDeleteMovie(editingMovie)}
                    className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 rounded hover:bg-rose-950/30 transition-colors"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                    <span>Delete Movie</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {isSaving && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span>{isSaving ? 'Saving...' : editingMovie ? 'Save Changes' : 'Create Movie'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-rose-400">
              <IconAlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Movie</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{confirmDeleteMovie.title}"</strong>? This will permanently remove the movie and its prerequisite links from the database.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteMovie(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(confirmDeleteMovie)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isDeleting && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
