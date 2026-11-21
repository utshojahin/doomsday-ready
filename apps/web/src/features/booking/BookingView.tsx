import React, { useState, useMemo } from 'react';
import { Cinema } from '../../types';
import { computeBookingQuote } from '../../utils/algorithms';
import { IconPlus, IconAlertCircle, IconCheck, IconX, IconTicket } from '../../components/Icons';

interface BookingViewProps {
  cinemas: Cinema[];
  onAddCinema: (cinema: Omit<Cinema, 'id'>) => void;
}

export const BookingView: React.FC<BookingViewProps> = ({ cinemas, onAddCinema }) => {
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(cinemas[0]?.id || '');
  const [groupSize, setGroupSize] = useState<number>(11);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Add cinema form state
  const [newCinemaName, setNewCinemaName] = useState('');
  const [bundleInput, setBundleInput] = useState('2, 5, 10');
  const [modalError, setModalError] = useState<string | null>(null);

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId) || cinemas[0];

  const quote = useMemo(() => {
    if (!selectedCinema || groupSize <= 0) {
      return { possible: false, groupSize, totalBundles: null, bundles: [] };
    }
    return computeBookingQuote(selectedCinema.bundleSizes, groupSize);
  }, [selectedCinema, groupSize]);

  const handleAddCinemaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCinemaName.trim();
    if (!trimmedName) {
      setModalError('Cinema name is required.');
      return;
    }

    if (cinemas.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setModalError('A cinema with this name already exists.');
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

    onAddCinema({
      name: trimmedName,
      bundleSizes: uniqueSizes,
    });

    setIsModalOpen(false);
    setNewCinemaName('');
    setBundleInput('2, 5, 10');
    setModalError(null);
  };

  const presets = [
    { label: 'Stark 11 seats', cinemaId: 'c-stark-imax', size: 11 },
    { label: 'Odin 44 seats', cinemaId: 'c-odin-odeon', size: 44 },
    { label: 'Sanctum 7 seats (impossible)', cinemaId: 'c-sanctum-cinema', size: 7 },
    { label: 'Group 25', cinemaId: selectedCinema?.id, size: 25 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Opening Night Group Ticket Optimizer</h2>
          <p className="text-xs text-slate-400">
            Computes exact minimum-bundle combination using unbounded dynamic programming.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <IconPlus className="w-3.5 h-3.5" />
          <span>New Cinema</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Configuration Controls */}
        <div className="space-y-4 md:col-span-1">
          {/* Cinema Selection */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
              1. Select Cinema
            </label>
            <div className="space-y-2">
              {cinemas.map((cinema) => (
                <div
                  key={cinema.id}
                  onClick={() => setSelectedCinemaId(cinema.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    cinema.id === selectedCinema?.id
                      ? 'bg-slate-800/90 border-indigo-500/80 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-100">{cinema.name}</span>
                    {cinema.id === selectedCinema?.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500">Bundles:</span>
                    <div className="flex flex-wrap gap-1">
                      {cinema.bundleSizes.map((size) => (
                        <span
                          key={size}
                          className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 font-mono text-[10px] border border-slate-700/60"
                        >
                          {size} seats
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Size Input */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
              2. Total Group Size
            </label>
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={groupSize}
                  onChange={(e) => setGroupSize(Math.max(1, Math.min(10000, Number(e.target.value) || 0)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400 shrink-0">seats</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Accepts 1 to 10,000 attendees</p>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider block mb-1.5">
                Quick Test Cases:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (preset.cinemaId) setSelectedCinemaId(preset.cinemaId);
                      setGroupSize(preset.size);
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Optimization Results */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Optimization Outcome
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cinema: <span className="text-slate-200 font-medium">{selectedCinema?.name}</span> · Group size:{' '}
                  <span className="font-mono text-slate-200">{groupSize}</span>
                </p>
              </div>

              {quote.possible ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 text-xs font-medium border border-emerald-800 flex items-center space-x-1">
                  <IconCheck className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Exact Allocation Found</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-rose-950/60 text-rose-300 text-xs font-medium border border-rose-800 flex items-center space-x-1">
                  <IconAlertCircle className="w-3.5 h-3.5" />
                  <span>Not Possible</span>
                </span>
              )}
            </div>

            {quote.possible ? (
              <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Minimum Bundles Needed
                    </span>
                    <div className="mt-1 flex items-baseline space-x-1.5">
                      <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                        {quote.totalBundles}
                      </span>
                      <span className="text-xs text-slate-400">total bundles</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Total Allocated Seats
                    </span>
                    <div className="mt-1 flex items-baseline space-x-1.5">
                      <span className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
                        {quote.bundles.reduce((acc, b) => acc + b.size * b.count, 0)}
                      </span>
                      <span className="text-xs text-slate-400">/ {groupSize} seats (0 wasted)</span>
                    </div>
                  </div>
                </div>

                {/* Bundle Breakdown List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Bundle Breakdown
                  </h4>
                  <div className="space-y-2">
                    {quote.bundles.map((bundle) => {
                      const totalSubSeats = bundle.size * bundle.count;
                      return (
                        <div
                          key={bundle.size}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs font-mono">
                              {bundle.size}s
                            </span>
                            <div>
                              <span className="text-xs font-medium text-slate-100">
                                {bundle.count} × {bundle.size}-Seat Bundle{bundle.count > 1 ? 's' : ''}
                              </span>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {bundle.count} bundle{bundle.count > 1 ? 's' : ''} × {bundle.size} seats
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              {totalSubSeats} seats
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  ✓ Calculated with dynamic programming in O(N × B) operations. Guaranteed minimum bundle count with zero seat surplus.
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 rounded-lg bg-slate-950/80 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
                  <IconAlertCircle className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Exact Seat Allocation Impossible
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No exact combination of available bundle sizes ({selectedCinema?.bundleSizes.join(', ')} seats) can total exactly {groupSize} seats.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setGroupSize(groupSize + 1)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                  >
                    Try adjusting group size to {groupSize + 1}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Cinema Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <IconTicket className="w-4 h-4 text-indigo-400" />
                <span>Create Cinema Venue</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
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
                <label className="block text-slate-300 font-medium mb-1">Cinema Venue Name</label>
                <input
                  type="text"
                  required
                  value={newCinemaName}
                  onChange={(e) => setNewCinemaName(e.target.value)}
                  placeholder="e.g. Wakanda Grand Cinema"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Ticket Bundle Sizes (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={bundleInput}
                  onChange={(e) => setBundleInput(e.target.value)}
                  placeholder="e.g. 2, 5, 10, 25"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  1 to 10 distinct integers between 1 and 500 (e.g. 2, 5).
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  Create Cinema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

