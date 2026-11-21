import React, { useState, useEffect, useCallback } from 'react';
import { Cinema, BookingQuote } from '../../types';
import { fetchBookingQuote, createCinema, ApiError } from '../../api/client';
import { IconPlus, IconAlertCircle, IconCheck, IconX, IconTicket } from '../../components/Icons';

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
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(cinemas[0]?.id || '');
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

  // Sync selected cinema if list updates
  useEffect(() => {
    if (cinemas.length > 0 && !cinemas.some((c) => c.id === selectedCinemaId)) {
      setSelectedCinemaId(cinemas[0].id);
    }
  }, [cinemas, selectedCinemaId]);

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId) || cinemas[0];

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
  const sanctumCinema = cinemas.find((c) => c.name.includes('Sanctum'));

  const presets = [
    { label: 'Stark 11 seats', cinemaId: starkCinema?.id || selectedCinema?.id, size: 11 },
    { label: 'Odin 44 seats', cinemaId: odinCinema?.id || selectedCinema?.id, size: 44 },
    { label: 'Sanctum 7 seats (impossible)', cinemaId: sanctumCinema?.id || selectedCinema?.id, size: 7 },
    { label: 'Group 25', cinemaId: selectedCinema?.id, size: 25 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Opening Night Group Ticket Optimizer</h2>
          <p className="text-xs text-slate-400">
            Calculates exact minimum bundle combinations using unbounded dynamic programming.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          disabled={isCinemasLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <IconPlus className="w-3.5 h-3.5" />
          <span>New Cinema</span>
        </button>
      </div>

      {/* Booking Parameters Form */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cinema Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Select Cinema Venue</label>
          <select
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value)}
            disabled={isCinemasLoading || cinemas.length === 0}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Bundles: {c.bundleSizes.join(', ')})
              </option>
            ))}
          </select>
          {selectedCinema && (
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pt-1">
              <span>Available seat packages:</span>
              <div className="flex gap-1">
                {selectedCinema.bundleSizes.map((size) => (
                  <span
                    key={size}
                    className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300 border border-slate-700"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Group Size Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Group Size (Exact Seat Requirement)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="10000"
              value={groupSize || ''}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              placeholder="e.g. 11"
            />
            <button
              onClick={() => loadQuote(selectedCinemaId, groupSize)}
              disabled={isQuoteLoading}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium shrink-0 transition-colors border border-slate-700"
            >
              {isQuoteLoading ? 'Calculating...' : 'Recalculate'}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
            {presets.map(
              (p, idx) =>
                p.cinemaId && (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCinemaId(p.cinemaId!);
                      setGroupSize(p.size);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                  >
                    {p.label}
                  </button>
                ),
            )}
          </div>
        </div>
      </div>

      {quoteError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{quoteError}</span>
        </div>
      )}

      {/* Quote Results Display */}
      {quote && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconTicket className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-200">
                Ticket Bundle Quote · {selectedCinema?.name}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Exact Group Size: {quote.groupSize}</span>
          </div>

          {quote.possible ? (
            <div className="p-6 space-y-6">
              {/* Quote Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Total Bundles Required
                  </span>
                  <div className="mt-1 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
                      {quote.totalBundles}
                    </span>
                    <span className="text-xs text-slate-500">packages</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Minimum possible count via DP</p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Total Seats Covered
                  </span>
                  <div className="mt-1 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                      {quote.bundles.reduce((acc, b) => acc + b.size * b.count, 0)}
                    </span>
                    <span className="text-xs text-slate-500">exact seats</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-400/90 font-medium flex items-center space-x-1">
                    <IconCheck className="w-3 h-3 inline" />
                    <span>Exact zero wasted seats</span>
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Algorithm Guarantee
                  </span>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Unbounded knapsack dynamic programming guarantees minimum bundle overhead without greedy pitfalls.
                  </p>
                </div>
              </div>

              {/* Recommended Bundle Breakdown */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Optimal Bundle Allocation Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {quote.bundles.map((b) => (
                    <div
                      key={b.size}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs text-slate-400">Bundle Size</span>
                        <div className="text-sm font-bold text-white font-mono">{b.size} seats</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Quantity</span>
                        <div className="text-sm font-bold text-indigo-400 font-mono">× {b.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic border-t border-slate-800/60 pt-3">
                * Note: This is an exact ticket package calculation quote. No tickets or seats have been reserved.
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-950/50 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
                <IconX className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="text-sm font-semibold text-rose-300">Exact Seating Impossible</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                It is mathematically impossible to seat exactly <strong className="text-white">{quote.groupSize}</strong> attendees using the available bundle sizes ({selectedCinema?.bundleSizes.join(', ')} seats) without having empty seats left over.
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[11px] font-mono">
                  State: Not Possible (No valid exact partition exists)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Cinema Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add New Cinema Venue</h3>
              <button
                onClick={() => !isCreatingCinema && setIsModalOpen(false)}
                disabled={isCreatingCinema}
                className="text-slate-400 hover:text-white p-1 rounded-md disabled:opacity-40"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                <IconAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddCinemaSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Cinema Name</label>
                <input
                  type="text"
                  required
                  disabled={isCreatingCinema}
                  value={newCinemaName}
                  onChange={(e) => setNewCinemaName(e.target.value)}
                  placeholder="e.g. Stark IMAX Theatre"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Bundle Sizes (Comma-Separated)
                </label>
                <input
                  type="text"
                  required
                  disabled={isCreatingCinema}
                  value={bundleInput}
                  onChange={(e) => setBundleInput(e.target.value)}
                  placeholder="e.g. 2, 5, 10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter 1 to 10 distinct integer bundle capacities between 1 and 500 (e.g. "6, 9, 20").
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isCreatingCinema}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCinema}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isCreatingCinema && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
