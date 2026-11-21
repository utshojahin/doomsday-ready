import React, { useEffect, useState } from 'react';
import { fetchHealth, HealthResponse } from '../api/client';
import { IconFilm, IconCompass, IconTicket } from './Icons';

export type ActiveTab = 'movies' | 'rewatch' | 'booking';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  moviesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, moviesCount }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkApi = async () => {
      try {
        const res = await fetchHealth();
        if (mounted) {
          setHealth(res);
          setIsOnline(true);
        }
      } catch {
        if (mounted) {
          setIsOnline(false);
        }
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-sm shadow-sm tracking-tighter">
            DR
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-100 tracking-tight text-sm">DOOMSDAY READY</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                Phase 01
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">MCU Rewatch & Ticket Bundle Engine</p>
          </div>
        </div>

        {/* Segmented Navigation */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('movies')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'movies'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <IconFilm className="w-3.5 h-3.5" />
            <span>Movies</span>
            <span className="ml-1 text-[10px] text-slate-300 bg-slate-700/60 px-1.5 py-0.2 rounded-full">
              {moviesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rewatch')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'rewatch'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <IconCompass className="w-3.5 h-3.5" />
            <span>Rewatch Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'booking'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <IconTicket className="w-3.5 h-3.5" />
            <span>Cinema Booking</span>
          </button>
        </nav>

        {/* Live API Health Status */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          {isOnline === true ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>API Live</span>
              {health && <span className="text-emerald-500 font-mono">({health.uptime.toFixed(0)}s)</span>}
            </div>
          ) : isOnline === false ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/30 border border-amber-800/50 text-amber-300 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Local Mock Mode</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></span>
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

