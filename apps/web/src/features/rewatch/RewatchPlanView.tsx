import React, { useState, useMemo } from 'react';
import { Movie } from '../../types';
import { computeRewatchPlan, formatMinutes } from '../../utils/algorithms';
import { IconCheck, IconClock, IconAlertCircle } from '../../components/Icons';

interface RewatchPlanViewProps {
  movies: Movie[];
  onToggleWatched: (movieId: string) => void;
}

export const RewatchPlanView: React.FC<RewatchPlanViewProps> = ({ movies, onToggleWatched }) => {
  // Default target: Avengers: Doomsday or the last movie in list
  const defaultTargetId = movies.find((m) => m.title.includes('Doomsday'))?.id || movies[movies.length - 1]?.id || '';
  const [selectedTargetId, setSelectedTargetId] = useState<string>(defaultTargetId);

  const { plan, error } = useMemo(() => {
    if (!selectedTargetId) return { plan: null, error: 'Please select a movie.' };
    return computeRewatchPlan(selectedTargetId, movies);
  }, [selectedTargetId, movies]);

  const targetMovie = movies.find((m) => m.id === selectedTargetId);
  const movieMap = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies]);

  const progressPercent = plan && plan.totalCount > 0
    ? Math.round((plan.watchedCount / plan.totalCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Target Selector Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Rewatch Road to Doomsday</h2>
          <p className="text-xs text-slate-400">
            Topological sequence ensuring every prerequisite is watched before dependent titles.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-300 font-medium shrink-0">Target Movie:</label>
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {plan && (
        <>
          {/* Key Metric Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Prereq count */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Required Titles</span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white tracking-tight">{plan.totalCount}</span>
                <span className="text-xs text-slate-500">prerequisite movies</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Target excluded from calculation</p>
            </div>

            {/* Watched count & progress */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Watched Progress</span>
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
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Unwatched Runtime</span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-amber-300 tracking-tight">
                  {formatMinutes(plan.unwatchedRuntimeMinutes)}
                </span>
                <span className="text-xs text-slate-500 font-mono">({plan.unwatchedRuntimeMinutes}m)</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Estimated viewing time needed</p>
            </div>
          </div>

          {/* Sequential Ordered Timeline */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Prerequisite-First Sequence for {targetMovie?.title}
              </h3>
              <span className="text-xs text-slate-500">
                {plan.totalCount === 0 ? 'No prerequisites required' : 'Follow top to bottom'}
              </span>
            </div>

            {plan.movies.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                This movie has no prerequisites. You can jump straight to watching it!
              </div>
            ) : (
              <div className="space-y-3">
                {plan.movies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                      movie.watched
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Step Number Badge */}
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 font-mono shrink-0">
                        {index + 1}
                      </span>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-medium ${movie.watched ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {movie.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">({movie.releaseYear})</span>
                        </div>

                        {movie.prerequisiteIds.length > 0 && (
                          <div className="flex items-center space-x-1.5 mt-1 text-[10px] text-slate-400">
                            <span>Requires:</span>
                            {movie.prerequisiteIds.map((pid) => (
                              <span key={pid} className="px-1.5 py-0.2 bg-slate-800/60 rounded text-slate-300 border border-slate-700/60">
                                {movieMap.get(pid)?.title || pid}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
                        <span className="flex items-center space-x-1">
                          <IconClock className="w-3 h-3 text-slate-500" />
                          <span>{movie.runtimeMinutes} min</span>
                        </span>
                      </div>

                      <button
                        onClick={() => onToggleWatched(movie.id)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                          movie.watched
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <IconCheck className={`w-3.5 h-3.5 ${movie.watched ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{movie.watched ? 'Watched' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Final Goal Movie Marker */}
                <div className="mt-4 p-4 rounded-lg bg-indigo-950/30 border border-indigo-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-900 border border-indigo-700 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                      ★
                    </span>
                    <div>
                      <span className="font-semibold text-indigo-200">
                        Ready for: {targetMovie?.title} ({targetMovie?.releaseYear})
                      </span>
                      <p className="text-[11px] text-indigo-300/70">
                        Once all {plan.totalCount} prerequisite titles above are completed, you are prepared for opening night.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-indigo-300 font-mono">{targetMovie?.runtimeMinutes}m</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

