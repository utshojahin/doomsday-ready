import React, { useState, useEffect, useCallback } from 'react';
import { Movie, RewatchPlan } from '../../types';
import { formatMinutes } from '../../utils/algorithms';
import { fetchRewatchOrder, ApiError } from '../../api/client';
import { IconCheck, IconClock, IconAlertCircle } from '../../components/Icons';

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
      // Refresh rewatch plan to get recalculated metrics from backend
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

  return (
    <div className="space-y-6">
      {/* Target Selector Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Rewatch Road to Doomsday</h2>
          <p className="text-xs text-slate-400">
            Topological sequence computed via post-order DFS ensuring prerequisite ordering.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-300 font-medium shrink-0">Target Movie:</label>
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            disabled={isLoading || movies.length === 0}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.releaseYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadPlan(selectedTargetId)}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && !plan && (
        <div className="p-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Computing topological rewatch plan...</span>
          </div>
        </div>
      )}

      {plan && (
        <>
          {/* Key Metric Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Prereq count */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Required Titles
              </span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white tracking-tight">{plan.totalCount}</span>
                <span className="text-xs text-slate-500">prerequisite movies</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Target excluded from calculation</p>
            </div>

            {/* Watched count & progress */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Watched Progress
              </span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                  {plan.watchedCount} / {plan.totalCount}
                </span>
                <span className="text-xs text-slate-400 font-mono">({progressPercent}%)</span>
              </div>
              <div className="mt-2 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Remaining Runtime */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Unwatched Runtime
              </span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-amber-300 tracking-tight">
                  {formatMinutes(plan.unwatchedRuntimeMinutes)}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({plan.unwatchedRuntimeMinutes}m)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Time needed to prepare</p>
            </div>
          </div>

          {/* Sequential Order List */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">
                  Optimal Viewing Order for {targetMovie?.title || plan.target.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Every prerequisite precedes the title that depends on it.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {plan.totalCount} {plan.totalCount === 1 ? 'step' : 'steps'}
              </span>
            </div>

            {plan.movies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <p className="text-xs font-medium text-slate-300">
                  No prerequisites required for {targetMovie?.title || plan.target.title}.
                </p>
                <p className="text-[11px] text-slate-500">
                  This movie is completely standalone in the current dependency graph.
                </p>
              </div>
            ) : (
              <ol className="divide-y divide-slate-800/60">
                {plan.movies.map((movie, index) => (
                  <li
                    key={movie.id}
                    className={`p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors ${
                      movie.watched ? 'bg-slate-900/40' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Step Number */}
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Watched Toggle Checkbox */}
                      <button
                        onClick={() => handleToggle(movie.id)}
                        disabled={togglingId === movie.id}
                        title={movie.watched ? 'Mark unwatched' : 'Mark watched'}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                          movie.watched
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-slate-700 bg-slate-950 text-transparent hover:border-slate-500'
                        } disabled:opacity-50`}
                      >
                        <IconCheck className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {/* Movie Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-medium ${
                              movie.watched ? 'text-slate-400 line-through' : 'text-slate-100'
                            }`}
                          >
                            {movie.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
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
                    <div>
                      {movie.watched ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          Watched
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
                          Pending
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  );
};
