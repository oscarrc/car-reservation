export const CACHE_STRATEGIES = {
  // Dynamic data - changes frequently
  reservations: {
    staleTime: 30 * 1000,      // 30 seconds
    gcTime: 5 * 60 * 1000,     // 5 minutes in memory
    refetchInterval: 60 * 1000, // Background refresh every minute
  },

  // Semi-static data - changes occasionally
  cars: {
    staleTime: 10 * 60 * 1000,  // 10 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes in memory
    refetchOnWindowFocus: false,
  },

  users: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 20 * 60 * 1000,     // 20 minutes in memory
    refetchOnWindowFocus: false,
  },

  // Count queries - change less frequently than data
  counts: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 15 * 60 * 1000,     // 15 minutes in memory
  },

  // Static data - rarely changes
  settings: {
    staleTime: 30 * 60 * 1000,  // 30 minutes
    gcTime: 60 * 60 * 1000,     // 1 hour in memory
  }
};
