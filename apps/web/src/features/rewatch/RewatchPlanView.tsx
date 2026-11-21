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
      {/* Page Header */}
      <div className="border-b border-[#262A35] pb-5">
        <div className="flex items-center space-x-2.5">
          <IconCompass className="w-5 h-5 text-[#E53935]" />
          <h1 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
            Topological Rewatch Sequencer
          </h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30">
            GRAPH DFS
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
          Select any MCU destination title to compute the exact chronological prerequisite order using post-order depth-first traversal with circular cycle guards.
        </p>
      </div>

      {/* Target Selector Banner & Quick Presets */}
      <div className="bg-[#15171C] p-4 sm:p-5 rounded-2xl border border-[#262A35] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#E53935] uppercase tracking-wider block">
              Destination Milestone
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-bold text-[#FAFAFA]">
                Target: {targetMovie?.title || plan?.target.title || 'Select a Movie'}
              </span>
              {targetMovie && (
                <span className="font-mono text-xs text-[#A1A1AA] px-2 py-0.5 rounded bg-[#09090B] border border-[#262A35]">
                  {targetMovie.releaseYear}
                </span>
              )}
            </div>
          </div>

          {/* Target Dropdown Selector */}
          <div className="w-full md:w-auto">
            <label className="block text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1.5">
              Change Target Destination
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              disabled={isLoading || movies.length === 0}
              className="w-full md:w-80 bg-[#09090B] border border-[#262A35] rounded-xl px-3.5 py-2 text-xs text-[#FAFAFA] font-medium focus:outline-none focus:border-[#E53935] transition-colors disabled:opacity-50"
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
        <div className="pt-3 border-t border-[#262A35] flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] text-[#A1A1AA] font-semibold mr-1">Assessment Presets:</span>
          {doomsday && (
            <button
              onClick={() => setSelectedTargetId(doomsday.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                selectedTargetId === doomsday.id
                  ? 'bg-[#E53935]/20 border-[#E53935]/50 text-[#FAFAFA] font-bold shadow-sm shadow-red-950/40'
                  : 'bg-[#09090B] border-[#262A35] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1F26]'
              }`}
            >
              Road to Doomsday (7 Titles)
            </button>
          )}
          {civilWar && (
            <button
              onClick={() => setSelectedTargetId(civilWar.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                selectedTargetId === civilWar.id
                  ? 'bg-[#E53935]/20 border-[#E53935]/50 text-[#FAFAFA] font-bold shadow-sm shadow-red-950/40'
                  : 'bg-[#09090B] border-[#262A35] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1F26]'
              }`}
            >
              Captain America: Civil War (3 Titles)
            </button>
          )}
          {ragnarok && (
            <button
              onClick={() => setSelectedTargetId(ragnarok.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                selectedTargetId === ragnarok.id
                  ? 'bg-[#E53935]/20 border-[#E53935]/50 text-[#FAFAFA] font-bold shadow-sm shadow-red-950/40'
                  : 'bg-[#09090B] border-[#262A35] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1F26]'
              }`}
            >
              Thor: Ragnarok (Standalone)
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
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
        <div className="p-12 text-center text-[#A1A1AA] bg-[#15171C] rounded-2xl border border-[#262A35] space-y-3">
          <div className="w-6 h-6 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Traversing dependency graph and calculating optimal sequence...</p>
        </div>
      )}

      {plan && (
        <>
          {/* Summary Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Prereq count */}
            <div className="bg-[#15171C] p-4 rounded-2xl border border-[#262A35] shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
                Required Prerequisite Titles
              </span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
                  {plan.totalCount}
                </span>
                <span className="text-xs text-[#A1A1AA]">
                  {plan.totalCount === 1 ? 'prerequisite' : 'prerequisites'}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[#A1A1AA]/80">
                Target ({targetMovie?.title || plan.target.title}) excluded from prerequisite count
              </p>
            </div>

            {/* Preparation Progress */}
            <div className="bg-[#15171C] p-4 rounded-2xl border border-[#262A35] shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
                Preparation Progress
              </span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#F5C518] tracking-tight font-mono">
                  {plan.watchedCount} / {plan.totalCount}
                </span>
                <span className="text-xs font-mono font-bold text-[#F5C518]">({progressPercent}%)</span>
              </div>
              <div className="mt-2.5 w-full bg-[#09090B] rounded-full h-2 overflow-hidden border border-[#262A35]">
                <div
                  className="bg-gradient-to-r from-[#E53935] to-[#F5C518] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Watch Time Needed */}
            <div className="bg-[#15171C] p-4 rounded-2xl border border-[#262A35] shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
                Watch Time Needed
              </span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
                  {formatMinutes(plan.unwatchedRuntimeMinutes)}
                </span>
                <span className="text-xs text-[#A1A1AA] font-mono">
                  ({plan.unwatchedRuntimeMinutes}m)
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[#A1A1AA]/80">
                {plan.totalCount - plan.watchedCount} unwatched prerequisite titles remaining
              </p>
            </div>
          </div>

          {/* Sequential Order Timeline */}
          <div className="bg-[#15171C] rounded-2xl border border-[#262A35] overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-[#262A35] bg-[#09090B]/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#FAFAFA]">
                  Step-by-Step Watch Sequence for {targetMovie?.title || plan.target.title}
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Every prerequisite is topologically sorted so each foundation title appears before sequels that depend on it.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#262A35] text-[#FAFAFA] border border-[#262A35] shrink-0">
                {plan.totalCount} {plan.totalCount === 1 ? 'Step' : 'Steps'}
              </span>
            </div>

            {plan.movies.length === 0 ? (
              <div className="p-12 text-center text-[#A1A1AA] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto">
                  <IconCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="text-base font-bold text-[#FAFAFA]">
                  Ready to Watch Instantly!
                </h4>
                <p className="text-xs text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
                  <strong className="text-[#FAFAFA]">{targetMovie?.title || plan.target.title}</strong> has zero prerequisite dependencies in the catalog. You can jump directly into this title without prior preparation.
                </p>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-4">
                {plan.movies.map((movie, index) => {
                  const isWatched = movie.watched;
                  const isNextUp = !isWatched && (index === 0 || plan.movies.slice(0, index).every((m) => m.watched));

                  return (
                    <div
                      key={movie.id}
                      className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isNextUp
                          ? 'bg-[#15171C] border-[#E53935] shadow-lg shadow-red-950/30'
                          : isWatched
                          ? 'bg-[#09090B]/60 border-[#262A35]/80'
                          : 'bg-[#15171C] border-[#262A35]'
                      }`}
                    >
                      <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-4">
                        {/* Step Number Circle */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${
                            isWatched
                              ? 'bg-[#F5C518]/15 border-[#F5C518]/30 text-[#F5C518]'
                              : isNextUp
                              ? 'bg-[#E53935] border-[#E53935] text-white shadow-md shadow-red-950/40'
                              : 'bg-[#09090B] border-[#262A35] text-[#A1A1AA]'
                          }`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        {/* Watched Action Button */}
                        <button
                          onClick={() => handleToggle(movie.id)}
                          disabled={togglingId === movie.id}
                          title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 border shrink-0 ${
                            isWatched
                              ? 'bg-[#F5C518] border-[#F5C518] text-[#09090B] shadow-sm shadow-[#F5C518]/20'
                              : 'bg-[#09090B] border-[#262A35] text-transparent hover:border-[#E53935] hover:text-[#A1A1AA]'
                          }`}
                        >
                          <IconCheck className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Movie Info */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span
                              className={`text-sm sm:text-base font-bold ${
                                isWatched ? 'text-[#A1A1AA] line-through' : 'text-[#FAFAFA]'
                              }`}
                            >
                              {movie.title}
                            </span>
                            <span className="text-[11px] font-mono text-[#A1A1AA]">
                              ({movie.releaseYear})
                            </span>
                            {isNextUp && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E53935] text-white">
                                NEXT UP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-[#A1A1AA]">
                            <span className="flex items-center space-x-1">
                              <IconClock className="w-3.5 h-3.5 text-[#F5C518]" />
                              <span>{formatMinutes(movie.runtimeMinutes)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        {isWatched ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/30 flex items-center space-x-1.5">
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : isNextUp ? (
                          <button
                            onClick={() => handleToggle(movie.id)}
                            disabled={togglingId === movie.id}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#E53935] hover:bg-[#D32F2F] text-white transition-colors shadow-sm"
                          >
                            Mark as Watched
                          </button>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#09090B] text-[#A1A1AA] border border-[#262A35]">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Final Destination Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#E53935]/15 via-[#15171C] to-[#F5C518]/10 border border-[#E53935]/40 flex items-center justify-between gap-4 mt-6">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-red-950/50">
                      ★
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#E53935] tracking-wider block">
                        Final Destination Milestone
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-[#FAFAFA]">
                        {targetMovie?.title || plan.target.title} ({targetMovie?.releaseYear || plan.target.releaseYear})
                      </h4>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#F5C518] bg-[#F5C518]/15 border border-[#F5C518]/30 px-3 py-1 rounded-full shrink-0">
                    {progressPercent === 100 ? 'Ready for Doomsday!' : `${plan.totalCount - plan.watchedCount} left`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
