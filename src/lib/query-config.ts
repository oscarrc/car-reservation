// Query configuration for optimized Firebase usage
export const queryConfig = {
  // Static data - cache longer
  cars: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  // Dynamic data - shorter cache
  reservations: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },

  // User profiles - medium cache
  users: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  // Counts - longer cache
  counts: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },

  // Dashboard/Analytics - longer cache
  dashboard: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },

  // Available cars for date range - shorter cache (more dynamic)
  availableCars: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },

  // Settings - very long cache
  settings: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  },
};

// Search configuration
export const searchConfig = {
  minSearchLength: 2,
  debounceDelay: 300, // 300ms
  maxResults: 100,
};

// Batch configuration
export const batchConfig = {
  batchSize: 10, // Firestore 'in' query limit
  batchDelay: 50, // 50ms delay for batching
};