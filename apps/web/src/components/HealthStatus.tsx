import React, { useEffect, useState } from 'react';
import { fetchHealth, HealthResponse } from '../api/client';

export const HealthStatus: React.FC = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHealth();
      setData(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error connecting to API');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto bg-slate-800 rounded-xl shadow-md border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">Backend Connection Status</h2>
      {loading && (
        <div data-testid="health-loading" className="text-amber-400 flex items-center space-x-2">
          <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
          <span>Checking API health...</span>
        </div>
      )}
      {error && (
        <div data-testid="health-error" className="space-y-3">
          <div className="text-rose-400 bg-rose-950/50 p-3 rounded border border-rose-800 text-sm">
            Failed to connect: {error}
          </div>
          <button
            onClick={checkHealth}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-sm font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}
      {!loading && !error && data && (
        <div data-testid="health-success" className="text-emerald-400 bg-emerald-950/40 p-4 rounded border border-emerald-800 text-sm space-y-1">
          <p className="font-semibold flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block mr-2"></span>
            Status: {data.status}
          </p>
          <p className="text-slate-300">Timestamp: {data.timestamp}</p>
          <p className="text-slate-300">Uptime: {data.uptime}s</p>
        </div>
      )}
    </div>
  );
};

