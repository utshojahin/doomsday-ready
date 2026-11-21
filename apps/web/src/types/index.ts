export interface Movie {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
  prerequisiteIds: string[];
}

export interface Cinema {
  id: string;
  name: string;
  bundleSizes: number[];
}

export interface RewatchPlan {
  target: {
    id: string;
    title: string;
    releaseYear: number;
    runtimeMinutes: number;
  };
  movies: Movie[];
  watchedCount: number;
  totalCount: number;
  unwatchedRuntimeMinutes: number;
}

export interface BundleAllocation {
  size: number;
  count: number;
}

export interface BookingQuote {
  possible: boolean;
  groupSize: number;
  totalBundles: number | null;
  bundles: BundleAllocation[];
}

