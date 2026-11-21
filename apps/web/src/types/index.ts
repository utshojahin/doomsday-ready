export interface MoviePrerequisiteRef {
  id: string;
  title: string;
  releaseYear: number;
}

export interface Movie {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
  prerequisiteIds: string[];
  prerequisites?: MoviePrerequisiteRef[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMovieInput {
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched?: boolean;
  prerequisiteIds?: string[];
}

export interface UpdateMovieInput {
  title?: string;
  releaseYear?: number;
  runtimeMinutes?: number;
  watched?: boolean;
  prerequisiteIds?: string[];
}

export interface Cinema {
  id: string;
  name: string;
  bundleSizes: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCinemaInput {
  name: string;
  bundleSizes: number[];
}

export interface RewatchTarget {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
}

export interface RewatchPlan {
  target: RewatchTarget;
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
