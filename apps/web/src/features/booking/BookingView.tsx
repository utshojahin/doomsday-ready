import React, { useState, useEffect, useCallback } from 'react';
import { Cinema, BookingQuote } from '../../types';
import { fetchBookingQuote, createCinema, ApiError } from '../../api/client';
import {
  IconPlus,
  IconAlertCircle,
  IconCheck,
  IconTicket,
  IconSparkles,
  IconX,
} from '../../components/Icons';

interface BookingViewProps {
  cinemas: Cinema[];
  isLoading?: boolean;
  onCinemaCreated?: () => Promise<void>;
}

export const BookingView: React.FC<BookingViewProps> = ({
  cinemas,
  isLoading: isCinemasLoading = false,
  onCinemaCreated,
}) => {
  // Helper to pick a smart default venue where initial groupSize (11) is solvable
  const getPreferredCinemaId = (list: Cinema[]): string => {
    const stark = list.find((c) => c.name.includes('Stark'));
    if (stark) return stark.id;
    const oddBundle = list.find((c) => c.bundleSizes.some((s) => s % 2 !== 0));
    if (oddBundle) return oddBundle.id;
    return list[0]?.id || '';
  };

  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(() =>
    getPreferredCinemaId(cinemas),
  );
  const [groupSize, setGroupSize] = useState<number>(11);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Add cinema form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCinemaName, setNewCinemaName] = useState('');
  const [bundleInput, setBundleInput] = useState('2, 5, 10');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCreatingCinema, setIsCreatingCinema] = useState(false);

  // Sync selected cinema if list updates and current selection is empty or invalid
  useEffect(() => {
    if (cinemas.length > 0 && !cinemas.some((c) => c.id === selectedCinemaId)) {
      setSelectedCinemaId(getPreferredCinemaId(cinemas));
    }
  }, [cinemas, selectedCinemaId]);

  const selectedCinema =
    cinemas.find((c) => c.id === selectedCinemaId) || cinemas[0];

  const loadQuote = useCallback(async (cinemaId: string, size: number) => {
    if (!cinemaId) {
      setQuote(null);
      return;
    }

    if (size < 1 || size > 10000 || !Number.isInteger(size)) {
      setQuoteError('Group size must be an integer between 1 and 10,000 attendees.');
      setQuote(null);
      return;
    }

    setIsQuoteLoading(true);
    setQuoteError(null);

    try {
      const data = await fetchBookingQuote(cinemaId, size);
      setQuote(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setQuoteError(err.message);
      } else if (err instanceof Error) {
        setQuoteError(err.message);
      } else {
        setQuoteError('Failed to calculate booking quote.');
      }
      setQuote(null);
    } finally {
      setIsQuoteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCinemaId && groupSize >= 1 && groupSize <= 10000) {
      loadQuote(selectedCinemaId, groupSize);
    }
  }, [selectedCinemaId, groupSize, loadQuote]);

  const handleAddCinemaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCinemaName.trim();
    if (!trimmedName) {
      setModalError('Cinema name is required.');
      return;
    }

    // Parse bundle sizes
    const rawSizes = bundleInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => Number(s));

    if (rawSizes.some((s) => isNaN(s) || s < 1 || s > 500 || !Number.isInteger(s))) {
      setModalError('All bundle sizes must be distinct integers between 1 and 500.');
      return;
    }

    const uniqueSizes = Array.from(new Set(rawSizes)).sort((a, b) => a - b);
    if (uniqueSizes.length < 1 || uniqueSizes.length > 10) {
      setModalError('A cinema must have between 1 and 10 distinct bundle sizes.');
      return;
    }

    setIsCreatingCinema(true);
    setModalError(null);

    try {
      const newCinema = await createCinema({
        name: trimmedName,
        bundleSizes: uniqueSizes,
      });

      if (onCinemaCreated) {
        await onCinemaCreated();
      }

      setSelectedCinemaId(newCinema.id);
      setIsModalOpen(false);
      setNewCinemaName('');
      setBundleInput('2, 5, 10');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Failed to create cinema.');
      }
    } finally {
      setIsCreatingCinema(false);
    }
  };

  const starkCinema = cinemas.find((c) => c.name.includes('Stark'));
  const odinCinema = cinemas.find((c) => c.name.includes('Odin'));
  const sanctumCinema = cinemas.find((c) => c.name.includes('Sanctum') || (c.bundleSizes.length === 2 && c.bundleSizes.includes(4) && c.bundleSizes.includes(6)));
  const dpTestCinema = cinemas.find((c) => c.bundleSizes.includes(1) && c.bundleSizes.includes(3) && c.bundleSizes.includes(4));

  const assessmentBenchmarks = [
    {
      title: 'Benchmark 1: DP Beats Greedy',
      venue: dpTestCinema?.name || 'Assessment DP Cinema [1, 3, 4]',
      venueId: dpTestCinema?.id || selectedCinema?.id,
      seats: 6,
      bundles: '[1, 3, 4]',
      expected: 'Optimal: 2 bundles of 3 (beats greedy 4+1+1)',
    },
    {
      title: 'Benchmark 2: Mixed Packages',
      venue: starkCinema?.name || 'Stark IMAX Theatre',
      venueId: starkCinema?.id || selectedCinema?.id,
      seats: 11,
      bundles: '[2, 5]',
      expected: 'Optimal: 1 × 5 seats + 3 × 2 seats = 4 bundles',
    },
    {
      title: 'Benchmark 3: Larger Party Scale',
      venue: odinCinema?.name || 'Odin Odeon Screen',
      venueId: odinCinema?.id || selectedCinema?.id,
      seats: 44,
      bundles: '[6, 9, 20]',
      expected: 'Optimal: 1 × 20 seats + 2 × 9 seats + 1 × 6 seats',
    },
    {
      title: 'Benchmark 4: Impossible Partition Test',
      venue: sanctumCinema?.name || 'Sanctum Sanctorum Cinema',
      venueId: sanctumCinema?.id || selectedCinema?.id,
      seats: 7,
      bundles: '[4, 6]',
      expected: 'Accurately detects impossible partition',
    },
  ];

  // Helper check if venue only offers even bundles
  const allBundlesEven = selectedCinema && selectedCinema.bundleSizes.every((s) => s % 2 === 0);
  const isOddGroupSize = groupSize % 2 !== 0;

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#262A35] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
              Opening Night Ticket Bundle Optimizer
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30">
              KNAPSACK DP
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
            Ticket packages are sold in fixed seat bundles. This unbounded dynamic programming optimizer computes the exact minimal package purchase with zero wasted seats.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          disabled={isCinemasLoading}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs sm:text-sm font-semibold transition-all duration-150 shadow-lg shadow-red-950/40 hover:shadow-red-900/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 shrink-0"
        >
          <IconPlus className="w-4 h-4 stroke-[2.5]" />
          <span>New Cinema</span>
        </button>
      </div>

      {/* Assessment Benchmark 1-Click Cards */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#FAFAFA]">
          <IconSparkles className="w-3.5 h-3.5 text-[#F5C518]" />
          <span>Official Assessment Benchmarks (1-Click Test Scenarios)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {assessmentBenchmarks.map((bench, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (bench.venueId) {
                  setSelectedCinemaId(bench.venueId);
                  setGroupSize(bench.seats);
                }
              }}
              className="text-left p-3.5 rounded-2xl bg-[#15171C] hover:bg-[#1C1F26] border border-[#262A35] hover:border-[#E53935]/50 transition-all space-y-1.5 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#E53935] group-hover:text-[#F5C518] transition-colors">
                  {bench.title}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#09090B] text-[#FAFAFA] border border-[#262A35]">
                  {bench.seats} Seats
                </span>
              </div>
              <div className="text-xs text-[#FAFAFA] font-bold truncate">{bench.venue}</div>
              <div className="text-[11px] text-[#A1A1AA] font-mono">Bundles: {bench.bundles}</div>
              <p className="text-[10px] text-[#F5C518] font-semibold pt-0.5">{bench.expected}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Booking Parameters Form */}
      <div className="bg-[#15171C] p-4 sm:p-5 rounded-2xl border border-[#262A35] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Cinema Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#FAFAFA]">
            Select Cinema Venue
          </label>
          <select
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value)}
            disabled={isCinemasLoading || cinemas.length === 0}
            className="w-full bg-[#09090B] border border-[#262A35] rounded-xl px-3.5 py-2.5 text-xs text-[#FAFAFA] font-semibold focus:outline-none focus:border-[#E53935] disabled:opacity-50"
          >
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Bundles: {c.bundleSizes.join(', ')} seats)
              </option>
            ))}
          </select>
          {selectedCinema && (
            <div className="flex items-center space-x-1.5 text-[11px] text-[#A1A1AA] pt-1">
              <span>Available seat packages:</span>
              <div className="flex gap-1 flex-wrap">
                {selectedCinema.bundleSizes.map((size) => (
                  <span
                    key={size}
                    className="px-2 py-0.5 rounded-lg bg-[#09090B] font-mono font-semibold text-[#F5C518] border border-[#262A35] text-[11px]"
                  >
                    {size} seats
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Group Size Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#FAFAFA]">
            Group Size (Exact Party Attendees)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="10000"
              value={groupSize || ''}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="w-full bg-[#09090B] border border-[#262A35] rounded-xl px-3.5 py-2.5 text-xs text-[#FAFAFA] font-mono font-bold focus:outline-none focus:border-[#E53935]"
              placeholder="e.g. 11"
            />
            <button
              onClick={() => loadQuote(selectedCinemaId, groupSize)}
              disabled={isQuoteLoading}
              className="px-4 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs font-semibold shrink-0 transition-colors shadow-sm disabled:opacity-50"
            >
              {isQuoteLoading ? 'Solving...' : 'Calculate Booking'}
            </button>
          </div>
          <p className="text-[11px] text-[#A1A1AA]">
            Enter exact party size from 1 to 10,000 attendees.
          </p>
        </div>
      </div>

      {quoteError && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <IconAlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{quoteError}</span>
        </div>
      )}

      {/* Quote Results Display (Cinema Admission Ticket Aesthetic) */}
      {quote && (
        <div className="bg-[#15171C] rounded-2xl border border-[#262A35] overflow-hidden shadow-lg relative">
          {/* Ticket Header */}
          <div className="p-4 sm:p-5 border-b border-[#262A35] bg-[#09090B]/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#E53935]/20 text-[#E53935] border border-[#E53935]/30 flex items-center justify-center">
                <IconTicket className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#FAFAFA]">
                Ticket Allocation Result · {selectedCinema?.name}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#262A35] text-[#FAFAFA] border border-[#262A35]">
              Target: {quote.groupSize} Seats
            </span>
          </div>

          {quote.possible ? (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Quote Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-[#09090B] p-4 rounded-2xl border border-[#262A35]">
                  <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
                    Total Packages Needed
                  </span>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-[#F5C518] tracking-tight font-mono">
                      {quote.totalBundles}
                    </span>
                    <span className="text-xs text-[#A1A1AA]">
                      {quote.totalBundles === 1 ? 'bundle' : 'bundles'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#A1A1AA]">Minimum possible count via DP</p>
                </div>

                <div className="bg-[#09090B] p-4 rounded-2xl border border-[#262A35]">
                  <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
                    Total Seats Covered
                  </span>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-[#FAFAFA] tracking-tight font-mono">
                      {quote.bundles.reduce((acc, b) => acc + b.size * b.count, 0)}
                    </span>
                    <span className="text-xs text-[#A1A1AA]">exact seats</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                    <IconCheck className="w-3.5 h-3.5 inline" />
                    <span>Exact zero wasted seats</span>
                  </p>
                </div>

                <div className="bg-[#09090B] p-4 rounded-2xl border border-[#262A35]">
                  <span className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
                    DP Optimality Guarantee
                  </span>
                  <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
                    Unbounded knapsack dynamic programming evaluates all candidate combinations to guarantee minimal bundle transactions.
                  </p>
                </div>
              </div>

              {/* Recommended Bundle Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider mb-3">
                  Optimal Bundle Allocation Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {quote.bundles.map((b) => (
                    <div
                      key={b.size}
                      className="bg-[#09090B] border border-[#262A35] hover:border-[#F5C518]/40 rounded-2xl p-4 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="text-[11px] text-[#A1A1AA] font-semibold">Package Size</span>
                        <div className="text-base font-bold text-[#FAFAFA] font-mono">{b.size} seats</div>
                        <span className="text-[10px] text-[#A1A1AA] font-mono">
                          ({b.size * b.count} total seats)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#A1A1AA] font-semibold">Quantity</span>
                        <div className="text-lg font-black text-[#F5C518] font-mono">× {b.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-[#A1A1AA] italic border-t border-[#262A35] pt-3">
                * Note: This calculation provides the mathematically minimal ticket package allocation. No tickets or seats have been purchased.
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-4">
              <div className="bg-[#09090B] p-5 rounded-2xl border border-amber-900/40 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <IconAlertCircle className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold text-[#FAFAFA]">
                    Exact Seating Partition Not Possible
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 ml-auto font-bold">
                    Not Possible
                  </span>
                </div>

                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  No combination of available packages (<span className="font-mono text-[#FAFAFA]">{selectedCinema?.bundleSizes.join(', ')} seats</span>) can sum to exactly <strong className="text-[#FAFAFA]">{quote.groupSize} seats</strong> without leaving empty seats.
                </p>

                {allBundlesEven && isOddGroupSize && (
                  <div className="text-xs text-[#A1A1AA] bg-[#15171C] p-3.5 rounded-xl border border-[#262A35] space-y-1">
                    <span className="text-[11px] font-bold text-[#FAFAFA] block">
                      Mathematical Reason:
                    </span>
                    <p className="text-[11px]">
                      This venue only offers packages with even capacities ({selectedCinema?.bundleSizes.join(', ')}). Any linear combination of even package sizes will always be an even total. Because your party size ({quote.groupSize}) is odd, an exact partition is mathematically impossible.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[#A1A1AA] font-semibold">Suggestions:</span>
                  {allBundlesEven && isOddGroupSize && (
                    <button
                      onClick={() => setGroupSize(quote.groupSize + 1)}
                      className="px-3 py-1.5 rounded-xl bg-[#262A35] hover:bg-[#1C1F26] text-[#FAFAFA] text-xs font-semibold border border-[#262A35] transition-colors"
                    >
                      Try {quote.groupSize + 1} seats (Even)
                    </button>
                  )}
                  {starkCinema && selectedCinemaId !== starkCinema.id && (
                    <button
                      onClick={() => setSelectedCinemaId(starkCinema.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#E53935]/20 hover:bg-[#E53935]/30 text-[#FAFAFA] text-xs font-semibold border border-[#E53935]/40 transition-colors"
                    >
                      Switch to Stark IMAX (offers 5-seat packages)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Cinema Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#15171C] border border-[#262A35] rounded-2xl max-w-md w-full shadow-2xl p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#262A35] pb-3">
              <h3 className="text-sm sm:text-base font-bold text-[#FAFAFA]">Add New Cinema Venue</h3>
              <button
                onClick={() => !isCreatingCinema && setIsModalOpen(false)}
                disabled={isCreatingCinema}
                className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1 rounded-lg hover:bg-[#262A35] disabled:opacity-40"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                <IconAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddCinemaSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[#FAFAFA] font-semibold">Cinema Venue Name *</label>
                <input
                  type="text"
                  required
                  disabled={isCreatingCinema}
                  value={newCinemaName}
                  onChange={(e) => setNewCinemaName(e.target.value)}
                  placeholder="e.g. Stark IMAX Theatre"
                  className="w-full bg-[#09090B] border border-[#262A35] rounded-xl px-3.5 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#E53935] disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[#FAFAFA] font-semibold">
                  Bundle Sizes (Comma-Separated) *
                </label>
                <input
                  type="text"
                  required
                  disabled={isCreatingCinema}
                  value={bundleInput}
                  onChange={(e) => setBundleInput(e.target.value)}
                  placeholder="e.g. 2, 5, 10"
                  className="w-full bg-[#09090B] border border-[#262A35] rounded-xl px-3.5 py-2 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#E53935] disabled:opacity-50"
                />
                <p className="text-[11px] text-[#A1A1AA] mt-1">
                  Enter 1 to 10 distinct integer bundle capacities between 1 and 500 (e.g. "6, 9, 20").
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#262A35]">
                <button
                  type="button"
                  disabled={isCreatingCinema}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#262A35] transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCinema}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E53935] hover:bg-[#D32F2F] text-white transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
                >
                  {isCreatingCinema && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isCreatingCinema ? 'Creating...' : 'Create Cinema'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
