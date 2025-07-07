import { QueryClient } from '@tanstack/react-query';

/**
 * Utility functions for optimizing TanStack Query invalidations
 * These help reduce unnecessary Firebase reads by being more selective about invalidations
 */

/**
 * Intelligently invalidate related queries after a reservation status change
 * Only invalidates queries that are actually affected by the change
 */
export function invalidateReservationQueries(
  queryClient: QueryClient,
  options: {
    invalidateReservationsList?: boolean;
    invalidateReservationsCount?: boolean;
    invalidateDashboard?: boolean;
    invalidateActiveReservationsCount?: boolean;
    invalidateAvailableCars?: boolean;
    specificReservationId?: string;
    specificUserId?: string;
    specificCarId?: string;
  } = {}
) {
  const {
    invalidateReservationsList = true,
    invalidateReservationsCount = true,
    invalidateDashboard = false,
    invalidateActiveReservationsCount = false,
    invalidateAvailableCars = false,
    specificReservationId,
    specificUserId,
    specificCarId,
  } = options;

  // Invalidate main reservations list if needed
  if (invalidateReservationsList) {
    queryClient.invalidateQueries({ 
      queryKey: ["reservationsWithData"],
      exact: false 
    });
  }

  // Invalidate count queries if needed
  if (invalidateReservationsCount) {
    queryClient.invalidateQueries({ 
      queryKey: ["reservations", "count"],
      exact: false 
    });
  }

  // Invalidate active reservations count if needed (for user reservation limits)
  if (invalidateActiveReservationsCount && specificUserId) {
    queryClient.invalidateQueries({ 
      queryKey: ["activeReservationsCount", specificUserId] 
    });
  }

  // Invalidate available cars if needed (for car availability)
  if (invalidateAvailableCars) {
    queryClient.invalidateQueries({ 
      queryKey: ["availableCarsForDateRange"],
      exact: false 
    });
  }

  // Invalidate dashboard data if the status change affects charts
  if (invalidateDashboard) {
    queryClient.invalidateQueries({ 
      queryKey: ["daily-reservations"],
      exact: false 
    });
  }

  // Invalidate specific reservation details if provided
  if (specificReservationId) {
    queryClient.invalidateQueries({ 
      queryKey: ["reservation", specificReservationId] 
    });
  }

  // Invalidate specific user reservations if provided
  if (specificUserId) {
    queryClient.invalidateQueries({ 
      queryKey: ["userReservationsWithData", specificUserId],
      exact: false 
    });
  }

  // Invalidate specific car reservations if provided
  if (specificCarId) {
    queryClient.invalidateQueries({ 
      queryKey: ["carReservationsWithData", specificCarId],
      exact: false 
    });
  }
}

/**
 * Intelligently invalidate car-related queries after a car status change
 */
export function invalidateCarQueries(
  queryClient: QueryClient,
  options: {
    invalidateCarsList?: boolean;
    invalidateCarsCount?: boolean;
    invalidateFleetStatus?: boolean;
    invalidateAvailableCars?: boolean;
    specificCarId?: string;
  } = {}
) {
  const {
    invalidateCarsList = true,
    invalidateCarsCount = false,
    invalidateFleetStatus = true,
    invalidateAvailableCars = true,
    specificCarId,
  } = options;

  if (invalidateCarsList) {
    queryClient.invalidateQueries({ 
      queryKey: ["cars"],
      exact: false 
    });
  }

  if (invalidateCarsCount) {
    queryClient.invalidateQueries({ 
      queryKey: ["cars", "count"],
      exact: false 
    });
  }

  if (invalidateFleetStatus) {
    queryClient.invalidateQueries({ 
      queryKey: ["fleet-status"] 
    });
  }

  if (invalidateAvailableCars) {
    queryClient.invalidateQueries({ 
      queryKey: ["availableCars"],
      exact: false 
    });
  }

  if (specificCarId) {
    queryClient.invalidateQueries({ 
      queryKey: ["car", specificCarId] 
    });
  }
}

/**
 * Intelligently invalidate user-related queries after a user change
 */
export function invalidateUserQueries(
  queryClient: QueryClient,
  options: {
    invalidateUsersList?: boolean;
    invalidateUsersCount?: boolean;
    specificUserId?: string;
  } = {}
) {
  const {
    invalidateUsersList = true,
    invalidateUsersCount = false,
    specificUserId,
  } = options;

  if (invalidateUsersList) {
    queryClient.invalidateQueries({ 
      queryKey: ["users"],
      exact: false 
    });
  }

  if (invalidateUsersCount) {
    queryClient.invalidateQueries({ 
      queryKey: ["users", "count"],
      exact: false 
    });
  }

  if (specificUserId) {
    queryClient.invalidateQueries({ 
      queryKey: ["user", specificUserId] 
    });
  }
}

/**
 * Prefetch commonly needed data to reduce loading times
 * Note: Import the service directly in components that need prefetching
 * to avoid dynamic imports and maintain better bundling
 */
export function prefetchCommonData(queryClient: QueryClient, fetchFleetStatus: () => Promise<unknown>) {
  // Only prefetch if data is not already cached
  const fleetStatusCached = queryClient.getQueryData(["fleet-status"]);
  if (!fleetStatusCached) {
    queryClient.prefetchQuery({
      queryKey: ["fleet-status"],
      queryFn: fetchFleetStatus,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  }
}

/**
 * Batch multiple query invalidations to reduce re-renders
 */
export function batchInvalidations(
  _queryClient: QueryClient,
  invalidations: (() => void)[]
) {
  // Use React's batching mechanism by wrapping in setTimeout
  setTimeout(() => {
    invalidations.forEach(fn => fn());
  }, 0);
}