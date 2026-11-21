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

  const navItems = [
    {
      id: 'movies' as ActiveTab,
      label: 'Movies',
      badge: moviesCount > 0 ? String(moviesCount) : undefined,
      icon: IconFilm,
      description: 'MCU Catalog',
    },
    {
      id: 'rewatch' as ActiveTab,
      label: 'Rewatch Plan',
      icon: IconCompass,
      description: 'Topological Order',
    },
    {
      id: 'booking' as ActiveTab,
      label: 'Cinema Booking',
      icon: IconTicket,
      description: 'Bundle Optimizer',
    },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-red-950/30 tracking-tight select-none">
              DR
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white tracking-tight text-sm sm:text-base">
                  DOOMSDAY READY
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-950/40 text-red-400 border border-red-900/40">
                  MCU 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Prerequisite Sequence & Opening Night Ticket Optimizer
              </p>
            </div>
          </div>

          {/* Desktop/Tablet Segmented Navigation */}
          <nav className="hidden sm:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Live API Health Status */}
          <div className="flex items-center space-x-2 text-xs">
            {isOnline === true ? (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>API Live</span>
                {health && (
                  <span className="text-emerald-500 font-mono hidden md:inline">
                    ({health.uptime.toFixed(0)}s)
                  </span>
                )}
              </div>
            ) : isOnline === false ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/30 border border-amber-800/50 text-amber-300 text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></span>
                <span className="hidden sm:inline">Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation Bar (Visible only on < sm screens) */}
      <nav
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-3 left-3 right-3 z-50 bg-slate-900/95 backdrop-blur-lg border border-slate-800/90 rounded-2xl shadow-2xl p-1.5 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 text-[9px] bg-indigo-600 text-white font-mono px-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
