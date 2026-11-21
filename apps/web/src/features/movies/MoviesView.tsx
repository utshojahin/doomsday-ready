import React, { useState, useMemo } from 'react';
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
  IconEdit,
  IconGrid,
  IconList,
  IconStar,
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

type SortOption = 'year-asc' | 'year-desc' | 'title-asc' | 'runtime-desc';

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
  const [sortBy, setSortBy] = useState<SortOption>('year-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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
  const [prereqSearch, setPrereqSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const movieMap = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies]);

  const openAddModal = () => {
    setEditingMovie(null);
    setTitle('');
    setReleaseYear(2026);
    setRuntimeMinutes(120);
    setSelectedPrereqIds([]);
    setPrereqSearch('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Movie) => {
    setEditingMovie(m);
    setTitle(m.title);
    setReleaseYear(m.releaseYear);
    setRuntimeMinutes(m.runtimeMinutes);
    setSelectedPrereqIds([...m.prerequisiteIds]);
    setPrereqSearch('');
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

    if (runtimeMinutes < 1 || runtimeMinutes > 360) {
      setFormError('Runtime must be between 1 and 360 minutes.');
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
          setFormError(`Circular dependency detected: ${err.message}. The dependency cannot form a loop.`);
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

  const processedMovies = useMemo(() => {
    return movies
      .filter((m) => {
        const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (filter === 'watched') return m.watched;
        if (filter === 'unwatched') return !m.watched;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'year-asc') return a.releaseYear - b.releaseYear;
        if (sortBy === 'year-desc') return b.releaseYear - a.releaseYear;
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
        if (sortBy === 'runtime-desc') return b.runtimeMinutes - a.runtimeMinutes;
        return 0;
      });
  }, [movies, search, filter, sortBy]);

  const totalWatched = movies.filter((m) => m.watched).length;
  const totalUnwatchedMinutes = movies
    .filter((m) => !m.watched)
    .reduce((acc, m) => acc + m.runtimeMinutes, 0);
  const totalMinutes = movies.reduce((acc, m) => acc + m.runtimeMinutes, 0);
  const progressPercent = movies.length > 0 ? Math.round((totalWatched / movies.length) * 100) : 0;

  // Filter candidates for prerequisites modal (exclude editingMovie)
  const candidatePrereqs = useMemo(() => {
    return movies
      .filter((m) => (!editingMovie || m.id !== editingMovie.id))
      .filter((m) => m.title.toLowerCase().includes(prereqSearch.toLowerCase()));
  }, [movies, editingMovie, prereqSearch]);

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Page Header with Title, Description, and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#262A35] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
              MCU Movie Catalog
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30">
              {movies.length} TITLES
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
            Explore the Marvel Cinematic Universe, manage prerequisite dependencies, and track your rewatch progress leading to Avengers: Doomsday.
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={isLoading}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs sm:text-sm font-semibold transition-all duration-150 shadow-lg shadow-red-950/40 hover:shadow-red-900/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 shrink-0"
        >
          <IconPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Movie</span>
        </button>
      </div>

      {/* Cinematic Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Movies */}
        <div className="bg-[#15171C] p-4 rounded-2xl border border-[#262A35] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#E53935]/5 rounded-full blur-2xl group-hover:bg-[#E53935]/10 transition-all"></div>
          <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
            Universe Titles
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
              {movies.length}
            </span>
            <span className="text-xs text-[#A1A1AA]">features</span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-[#A1A1AA]">
            <IconFilm className="w-3.5 h-3.5 text-[#E53935]" />
            <span>Phase 1 through Phase 6</span>
          </div>
        </div>

        {/* Watched Progress */}
        <div className="bg-[#15171C] p-4 rounded-2xl border border-[#262A35] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5C518]/5 rounded-full blur-2xl group-hover:bg-[#F5C518]/10 transition-all"></div>
          <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
            Watched Progress
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F5C518] tracking-tight font-mono">
              {totalWatched}
            </span>
            <span className="text-xs text-[#A1A1AA]">/ {movies.length}</span>
            <span className="text-xs font-mono font-semibold text-[#F5C518]">({progressPercent}%)</span>
          </div>
          <div className="mt-2.5 w-full bg-[#09090B] rounded-full h-1.5 overflow-hidden border border-[#262A35]">
            <div
              className="bg-gradient-to-r from-[#E53935] to-[#F5C518] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Remaining Time */}
        <div className="bg-[#15171C] p-4 rounded-2xl border border-[#262A35] shadow-sm relative overflow-hidden group">
          <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
            Remaining Watch Time
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
              {formatMinutes(totalUnwatchedMinutes)}
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-[#A1A1AA]">
            <IconClock className="w-3.5 h-3.5 text-[#F5C518]" />
            <span>{movies.length - totalWatched} unwatched titles</span>
          </div>
        </div>

        {/* Total MCU Runtime */}
        <div className="bg-[#15171C] p-4 rounded-2xl border border-[#262A35] shadow-sm relative overflow-hidden group">
          <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
            Total Universe Time
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#A1A1AA] tracking-tight font-mono">
              {formatMinutes(totalMinutes)}
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-[#A1A1AA]">
            <IconStar className="w-3.5 h-3.5 text-[#F5C518]" />
            <span>{totalMinutes} total screen minutes</span>
          </div>
        </div>
      </div>

      {/* Cinematic Controls Bar (Search, Filters, Sort, View Toggle) */}
      <div className="bg-[#15171C] p-3 sm:p-4 rounded-2xl border border-[#262A35] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <IconSearch className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search movie by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#09090B] border border-[#262A35] rounded-xl pl-9 pr-8 py-2 text-xs text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:border-[#E53935] transition-colors disabled:opacity-50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips, Sort & View Mode */}
        <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
          {/* Watched Filter */}
          <div className="flex items-center bg-[#09090B] p-1 rounded-xl border border-[#262A35] text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-[#262A35] text-[#FAFAFA] font-semibold shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              All ({movies.length})
            </button>
            <button
              onClick={() => setFilter('watched')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'watched'
                  ? 'bg-[#F5C518]/20 text-[#F5C518] font-semibold border border-[#F5C518]/30 shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              Watched ({totalWatched})
            </button>
            <button
              onClick={() => setFilter('unwatched')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'unwatched'
                  ? 'bg-[#E53935]/20 text-[#E53935] font-semibold border border-[#E53935]/30 shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              Unwatched ({movies.length - totalWatched})
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#09090B] border border-[#262A35] rounded-xl px-2.5 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#E53935]"
          >
            <option value="year-asc">Chronological (Oldest First)</option>
            <option value="year-desc">Release Year (Newest First)</option>
            <option value="title-asc">Title (A to Z)</option>
            <option value="runtime-desc">Longest Runtime</option>
          </select>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-[#09090B] p-1 rounded-xl border border-[#262A35]">
            <button
              onClick={() => setViewMode('grid')}
              title="Cinematic Cards Grid"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#262A35] text-[#FAFAFA]'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <IconGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Compact Table"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#262A35] text-[#FAFAFA]'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <IconList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
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

      {/* CINEMATIC CARDS GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {isLoading && movies.length === 0 ? (
            <div className="col-span-full bg-[#15171C] p-12 rounded-2xl border border-[#262A35] text-center text-[#A1A1AA] space-y-3">
              <div className="w-6 h-6 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs">Loading MCU catalog from database...</p>
            </div>
          ) : processedMovies.map((movie) => {
            const isWatched = movie.watched;
            return (
              <div
                key={movie.id}
                className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative ${
                  isWatched
                    ? 'bg-[#15171C]/60 border-[#262A35]/80 hover:border-[#262A35]'
                    : 'bg-[#15171C] border-[#262A35] hover:border-[#E53935]/50 shadow-sm hover:shadow-lg hover:shadow-black/40'
                }`}
              >
                {/* Top Poster Header */}
                <div className="p-4 sm:p-5 relative">
                  {/* Subtle decorative glow for target doomsday */}
                  {movie.title.includes('Doomsday') && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#E53935]/15 rounded-full blur-xl pointer-events-none"></div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-[#09090B] text-[#A1A1AA] border border-[#262A35]">
                          {movie.releaseYear}
                        </span>
                        <span className="flex items-center space-x-1 text-[#A1A1AA]">
                          <IconClock className="w-3 h-3 text-[#A1A1AA]" />
                          <span>{formatMinutes(movie.runtimeMinutes)}</span>
                        </span>
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold leading-snug transition-colors ${
                          isWatched ? 'text-[#A1A1AA] line-through' : 'text-[#FAFAFA]'
                        }`}
                      >
                        {movie.title}
                      </h3>
                    </div>

                    {/* Quick Watched Toggle */}
                    <button
                      onClick={() => handleToggle(movie.id)}
                      disabled={togglingId === movie.id}
                      title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 border ${
                        isWatched
                          ? 'bg-[#F5C518] border-[#F5C518] text-[#09090B] shadow-sm shadow-[#F5C518]/20'
                          : 'bg-[#09090B] border-[#262A35] text-transparent hover:text-[#A1A1AA] hover:border-[#E53935]'
                      }`}
                    >
                      <IconCheck className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>

                  {/* Prerequisites List */}
                  <div className="mt-4 pt-3 border-t border-[#262A35]/70">
                    <span className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider block mb-1.5">
                      Required Prerequisites:
                    </span>
                    {movie.prerequisiteIds.length === 0 ? (
                      <span className="text-[11px] text-[#A1A1AA]/70 italic">
                        None (Root entry)
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {movie.prerequisiteIds.map((pid) => {
                          const prereq = movieMap.get(pid);
                          return (
                            <span
                              key={pid}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                                prereq?.watched
                                  ? 'bg-[#F5C518]/10 text-[#F5C518] border-[#F5C518]/25'
                                  : 'bg-[#09090B] text-[#A1A1AA] border-[#262A35]'
                              }`}
                            >
                              {prereq?.title || pid}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-[#09090B]/60 border-t border-[#262A35] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#A1A1AA]">
                    {isWatched ? (
                      <span className="text-[#F5C518] font-medium flex items-center space-x-1">
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-[#A1A1AA]">Pending Rewatch</span>
                    )}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(movie)}
                      className="px-2.5 py-1 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#262A35] transition-colors font-medium flex items-center space-x-1"
                    >
                      <IconEdit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {onDeleteMovie && (
                      <button
                        onClick={() => setConfirmDeleteMovie(movie)}
                        title="Delete movie"
                        className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#E53935] hover:bg-rose-950/30 transition-colors"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!isLoading && processedMovies.length === 0 && (
            <div className="col-span-full p-12 text-center text-[#A1A1AA] text-xs bg-[#15171C] rounded-2xl border border-[#262A35]">
              {search ? 'No movies match your search query.' : 'No movies in catalog.'}
            </div>
          )}
        </div>
      )}

      {/* COMPACT TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-[#15171C] rounded-2xl border border-[#262A35] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#09090B] text-[#A1A1AA] border-b border-[#262A35] font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Watched</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4 w-24">Year</th>
                  <th className="py-3 px-4 w-28">Runtime</th>
                  <th className="py-3 px-4">Prerequisites</th>
                  <th className="py-3 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262A35]/60">
                {isLoading && movies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#A1A1AA]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-5 h-5 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs">Fetching movies from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : processedMovies.map((movie) => (
                  <tr
                    key={movie.id}
                    className={`hover:bg-[#1C1F26] transition-colors ${
                      movie.watched ? 'bg-[#15171C]/50' : ''
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
                            ? 'bg-[#F5C518] border-[#F5C518] text-[#09090B]'
                            : 'border-[#262A35] bg-[#09090B] text-transparent hover:border-[#E53935]'
                        }`}
                      >
                        <IconCheck className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${movie.watched ? 'text-[#A1A1AA] line-through' : 'text-[#FAFAFA]'}`}>
                        {movie.title}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="py-3 px-4 text-[#A1A1AA] font-mono">{movie.releaseYear}</td>

                    {/* Runtime */}
                    <td className="py-3 px-4 text-[#A1A1AA]">
                      <span>{formatMinutes(movie.runtimeMinutes)}</span>
                    </td>

                    {/* Prerequisites */}
                    <td className="py-3 px-4">
                      {movie.prerequisiteIds.length === 0 ? (
                        <span className="text-[#A1A1AA]/60 italic text-[11px]">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {movie.prerequisiteIds.map((pid) => {
                            const prereq = movieMap.get(pid);
                            return (
                              <span
                                key={pid}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                  prereq?.watched
                                    ? 'bg-[#F5C518]/10 text-[#F5C518] border-[#F5C518]/30'
                                    : 'bg-[#09090B] text-[#A1A1AA] border-[#262A35]'
                                }`}
                              >
                                {prereq?.title || pid}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditModal(movie)}
                          className="text-[#A1A1AA] hover:text-[#FAFAFA] text-xs px-2.5 py-1 rounded-lg hover:bg-[#262A35] transition-colors"
                        >
                          Edit
                        </button>
                        {onDeleteMovie && (
                          <button
                            onClick={() => setConfirmDeleteMovie(movie)}
                            title="Delete movie"
                            className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#E53935] hover:bg-rose-950/30 transition-colors"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!isLoading && processedMovies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#A1A1AA] text-xs">
                      {search ? 'No movies match your search filter.' : 'No movies in catalog.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Movie Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#15171C] border border-[#262A35] rounded-2xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#262A35] pb-3">
              <div className="flex items-center space-x-2">
                <IconFilm className="w-4 h-4 text-[#E53935]" />
                <h3 className="text-sm sm:text-base font-bold text-[#FAFAFA]">
                  {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New MCU Movie'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1 rounded-lg hover:bg-[#262A35]"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                  <IconAlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#FAFAFA] block">
                  Movie Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spider-Man: Beyond the Spider-Verse"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#262A35] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:border-[#E53935]"
                />
              </div>

              {/* Year & Runtime */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#FAFAFA] block">
                    Release Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={2100}
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(parseInt(e.target.value) || 2026)}
                    className="w-full bg-[#09090B] border border-[#262A35] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#E53935]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#FAFAFA] block">
                    Runtime (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={360}
                    value={runtimeMinutes}
                    onChange={(e) => setRuntimeMinutes(parseInt(e.target.value) || 120)}
                    className="w-full bg-[#09090B] border border-[#262A35] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#E53935]"
                  />
                </div>
              </div>

              {/* Prerequisite Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#FAFAFA]">
                    Prerequisites ({selectedPrereqIds.length} selected)
                  </label>
                  <span className="text-[10px] text-[#A1A1AA]">
                    Must watch before this movie
                  </span>
                </div>

                <div className="relative">
                  <IconSearch className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search candidate prerequisites..."
                    value={prereqSearch}
                    onChange={(e) => setPrereqSearch(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#262A35] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:border-[#E53935]"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto bg-[#09090B] border border-[#262A35] rounded-xl p-2 space-y-1">
                  {candidatePrereqs.length === 0 ? (
                    <p className="text-[11px] text-[#A1A1AA] text-center py-2">
                      No movies found matching search.
                    </p>
                  ) : (
                    candidatePrereqs.map((candidate) => {
                      const isSelected = selectedPrereqIds.includes(candidate.id);
                      return (
                        <button
                          key={candidate.id}
                          type="button"
                          onClick={() => handlePrereqToggle(candidate.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#E53935]/20 text-[#FAFAFA] border border-[#E53935]/40 font-medium'
                              : 'text-[#A1A1AA] hover:bg-[#15171C] hover:text-[#FAFAFA]'
                          }`}
                        >
                          <span className="truncate pr-2">{candidate.title}</span>
                          <span className="text-[10px] font-mono shrink-0 text-[#A1A1AA]">
                            ({candidate.releaseYear})
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-[#262A35]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#262A35] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E53935] hover:bg-[#D32F2F] text-white transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingMovie ? 'Update Movie' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#15171C] border border-[#262A35] rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800 text-[#E53935] flex items-center justify-center mx-auto">
              <IconTrash className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-[#FAFAFA]">Delete Movie?</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Are you sure you want to delete <strong className="text-[#FAFAFA] font-semibold">{confirmDeleteMovie.title}</strong>? Prerequisite associations with this movie will be cleanly removed.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteMovie(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#262A35] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteMovie)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#E53935] hover:bg-[#D32F2F] text-white transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
