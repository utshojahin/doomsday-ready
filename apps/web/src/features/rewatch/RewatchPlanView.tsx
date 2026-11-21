import React, { useState, useEffect, useCallback } from 'react';
import { Movie, RewatchPlan } from '../../types';
import { formatMinutes } from '../../utils/algorithms';
import { fetchRewatchOrder, ApiError } from '../../api/client';
import {
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconCompass,
} from '../../components/Icons';

interface RewatchPlanViewProps {
  movies: Movie[];
  onToggleWatched: (movieId: string) => Promise<void>;
}

export const RewatchPlanView: React.FC<RewatchPlanViewProps> = ({ movies, onToggleWatched }) => {
  // Default target: Avengers: Doomsday or the last movie in list
  const defaultTargetId =
    movies.find((m) => m.title.includes('Doomsday'))?.id || movies[movies.length - 1]?.id || '';

  const [selectedTargetId, setSelectedTargetId] = useState<string>(defaultTargetId);
  const [plan, setPlan] = useState<RewatchPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Sync selectedTargetId if movies change and selectedTargetId is invalid
  useEffect(() => {
    if (movies.length > 0 && !movies.some((m) => m.id === selectedTargetId)) {
      const fallback =
        movies.find((m) => m.title.includes('Doomsday'))?.id || movies[movies.length - 1]?.id || '';
      setSelectedTargetId(fallback);
    }
  }, [movies, selectedTargetId]);

  const loadPlan = useCallback(async (targetId: string) => {
    if (!targetId) {
      setPlan(null);
      setError('Please select a target movie.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchRewatchOrder(targetId);
      setPlan(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to compute rewatch plan from server.');
      }
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadPlan(selectedTargetId);
    }
  }, [selectedTargetId, loadPlan]);

  const handleToggle = async (movieId: string) => {
    setTogglingId(movieId);
    try {
      await onToggleWatched(movieId);
      if (selectedTargetId) {
        await loadPlan(selectedTargetId);
      }
    } catch {
      // Handled in parent
    } finally {
      setTogglingId(null);
    }
  };

  const targetMovie = movies.find((m) => m.id === selectedTargetId);

  const progressPercent =
    plan && plan.totalCount > 0 ? Math.round((plan.watchedCount / plan.totalCount) * 100) : 0;

  // Find IDs for assessment quick presets
  const doomsday = movies.find((m) => m.title.includes('Doomsday'));
  const civilWar = movies.find((m) => m.title.includes('Civil War'));
  const ragnarok = movies.find((m) => m.title.includes('Ragnarok'));

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Target Selector Banner & Quick Presets */}
      <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <IconCompass className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Topological Rewatch Sequencer</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select the MCU movie you are planning to watch. The engine traverses the dependency graph and schedules prerequisites first.
            </p>
          </div>

          {/* Target Dropdown */}
          <div className="w-full md:w-auto">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Destination Target Movie
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              disabled={isLoading || movies.length === 0}
              className="w-full md:w-72 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.releaseYear})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Scenarios:</span>
          {doomsday && (
            <button
              onClick={() => setSelectedTargetId(doomsday.id)}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                selectedTargetId === doomsday.id
                  ? 'bg-indigo-950/70 border-indigo-700 text-indigo-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Road to Doomsday (Full 7 Titles)
            </button>
          )}
          {civilWar && (
            <button
              onClick={() => setSelectedTargetId(civilWar.id)}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                selectedTargetId === civilWar.id
                  ? 'bg-indigo-950/70 border-indigo-700 text-indigo-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Civil War (Phase 1 & 2 Prereqs)
            </button>
          )}
          {ragnarok && (
            <button
              onClick={() => setSelectedTargetId(ragnarok.id)}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                selectedTargetId === ragnarok.id
                  ? 'bg-indigo-950/70 border-indigo-700 text-indigo-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Thor: Ragnarok (Standalone)
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconAlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadPlan(selectedTargetId)}
            className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && !plan && (
        <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Traversing dependency graph and calculating optimal sequence...</p>
        </div>
      )}

      {plan && (
        <>
          {/* Summary Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Prereq count */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Required Prerequisite Titles
              </span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {plan.totalCount}
                </span>
                <span className="text-xs text-slate-400">
                  {plan.totalCount === 1 ? 'movie' : 'movies'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Target ({targetMovie?.title || plan.target.title}) excluded from requirements
              </p>
            </div>

            {/* Watched progress */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Preparation Progress
              </span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
                  {plan.watchedCount} / {plan.totalCount}
                </span>
                <span className="text-xs text-slate-400 font-mono">({progressPercent}%)</span>
              </div>
              <div className="mt-2 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Unwatched Runtime */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Watch Time Needed
              </span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight font-mono">
                  {formatMinutes(plan.unwatchedRuntimeMinutes)}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({plan.unwatchedRuntimeMinutes}m)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Remaining unwatched time to catch up</p>
            </div>
          </div>

          {/* Sequential Order Stepper */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Step-by-Step Watch Sequence for {targetMovie?.title || plan.target.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every prerequisite is guaranteed to be scheduled prior to the movie that depends on it.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                {plan.totalCount} {plan.totalCount === 1 ? 'Step' : 'Steps'}
              </span>
            </div>

            {plan.movies.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto">
                  <IconCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Ready to Watch Instantly!
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  <strong className="text-white">{targetMovie?.title || plan.target.title}</strong> has no prerequisite dependencies in the catalog. You can watch it directly without catching up on prior titles.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {plan.movies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className={`p-4 sm:p-4.5 flex items-start sm:items-center justify-between gap-3 transition-colors ${
                      movie.watched ? 'bg-slate-900/40' : 'hover:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                      {/* Step Number Circle */}
                      <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-sm">
                        {index + 1}
                      </span>

                      {/* Watched Action Button */}
                      <button
                        onClick={() => handleToggle(movie.id)}
                        disabled={togglingId === movie.id}
                        title={movie.watched ? 'Click to mark unwatched' : 'Click to mark watched'}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border shrink-0 mt-0.5 sm:mt-0 ${
                          movie.watched
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                            : 'border-slate-700 bg-slate-950 text-transparent hover:border-slate-500'
                        } disabled:opacity-50`}
                      >
                        <IconCheck className="w-4 h-4 stroke-[3]" />
                      </button>

                      {/* Movie Info */}
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span
                            className={`text-xs sm:text-sm font-semibold ${
                              movie.watched ? 'text-slate-400 line-through' : 'text-slate-100'
                            }`}
                          >
                            {movie.title}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            ({movie.releaseYear})
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center space-x-1">
                            <IconClock className="w-3 h-3 text-slate-500" />
                            <span>{formatMinutes(movie.runtimeMinutes)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {movie.watched ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          Watched
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
