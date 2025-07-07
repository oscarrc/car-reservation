import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ErrorDisplay } from "@/components/ui/error-display";
import { SectionHeader } from "@/components/ui/section-header";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import { CancellationConfirmationDialog } from "@/components/ui/cancellation-confirmation-dialog";
import { format, getLocalizedFormats } from "@/lib/date-locale";
import {
  createUserColumns,
  // type ReservationWithCarAndUser, // Will use from service
} from "@/components/reservations/user-reservations-columns";
import {
  // fetchUserReservations, // Removed
  fetchReservationsWithPopulatedData, // Added
  getReservationsCount,
  requestCancellation,
  countActiveUserReservations,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
  type PaginationCursor,
  type ReservationWithCarAndUser, // Added
} from "@/lib/reservations-service";
import { CACHE_STRATEGIES } from "@/lib/query-config"; // Added
// import { fetchCarsByIds } from "@/lib/cars-service"; // Removed
import type { ReservationStatus } from "@/types/reservation";

export default function UserReservationsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all"
  );
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] =
    useState<ReservationWithCarAndUser | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [cursors, setCursors] = useState<{ [key: number]: PaginationCursor }>({});
  const queryClient = useQueryClient();

  const queryParams: ReservationsQueryParams = {
    pageSize,
    pageIndex,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
    userId: currentUser?.uid,
    cursor: cursors[pageIndex],
  };

  // Filter params for count query (without pagination params)
  const filterParams: ReservationsFilterParams = {
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
    userId: currentUser?.uid,
  };

  // Fetch user reservations with populated data
  const {
    data: populatedDataResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch, // Keep refetch for error display retry
  } = useQuery({
    queryKey: ["reservations-populated-for-user", queryParams], // Updated queryKey, pass full queryParams
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      // Ensure userId is part of queryParams for the call
      return fetchReservationsWithPopulatedData({ ...queryParams, userId: currentUser.uid });
    },
    enabled: !!currentUser?.uid,
    ...CACHE_STRATEGIES.reservations, // Added cache strategy
  });

  // Fetch total count for user's reservations
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["reservations-count-for-user", filterParams], // Updated queryKey, pass full filterParams
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return getReservationsCount(filterParams);
    },
    enabled: !!currentUser?.uid,
    ...CACHE_STRATEGIES.counts, // Added cache strategy
  });

  const reservationsWithData = populatedDataResponse?.reservations || [];
  const responsePagination = populatedDataResponse?.pagination;
  
  const totalRows = totalCount || 0;

  const currentEffectivePageIndex = responsePagination?.pageIndex ?? pageIndex;
  const currentEffectivePageSize = responsePagination?.pageSize ?? pageSize;

  const hasNextPage = (currentEffectivePageIndex + 1) * currentEffectivePageSize < totalRows;
  const hasPreviousPage = currentEffectivePageIndex > 0;
  
  const pagination = {
    pageIndex: currentEffectivePageIndex,
    pageSize: currentEffectivePageSize,
    totalCount: totalRows,
    hasNextPage,
    hasPreviousPage,
  };

  // No need to fetch carsData separately or merge data manually.
  // reservationsWithData from fetchReservationsWithPopulatedData already contains carInfo and userInfo.
  // The old `reservationsWithCarData` is now `reservationsWithData`.
  // The `userEmail` field previously added manually might be covered by `userInfo` if it includes email.
  // If `userInfo.email` is not available, and `userEmail` is strictly needed for columns,
  // it might need to be added if columns expect it directly on the object.
  // For now, assuming columns will adapt to `userInfo.email` or similar.

  // Cancellation mutation
  const cancelMutation = useMutation({
    mutationFn: (reservationId: string) =>
      requestCancellation(reservationId, settings?.autoCancelation || false),
    onSuccess: (result, reservationId) => {
      // Find the reservation from the already populated data
      const reservation = reservationsWithData.find((r) => r.id === reservationId);
      // carInfo is now directly on the reservation object
      const carInfo = reservation?.carInfo;

      if (result.status === "cancelled") {
        toast.success(t("reservations.cancellationSuccess"), {
          description: t("reservations.cancellationSuccessDesc", {
            car: carInfo?.model || t("common.unknown"), // Use carInfo from the reservation
          }),
        });
      } else {
        toast.success(t("reservations.cancellationRequested"), {
          description: t("reservations.cancellationRequestedDesc", {
            car: carInfo?.model || t("common.unknown"), // Use carInfo from the reservation
          }),
        });
      }

      // Invalidate the new populated query and the count query
      queryClient.invalidateQueries({ queryKey: ["reservations-populated-for-user", queryParams] });
      queryClient.invalidateQueries({ queryKey: ["reservations-count-for-user", filterParams] });
      // Keep other invalidations if still relevant
      queryClient.invalidateQueries({ queryKey: ["activeReservationsCount", currentUser?.uid] });
      queryClient.invalidateQueries({ queryKey: ["availableCarsForDateRange"] }); // This might need adjustment if it depended on the old structure
      setCancelDialogOpen(false);
      setReservationToCancel(null);
    },
    onError: (error) => {
      console.error("Error cancelling reservation:", error);
      toast.error(t("reservations.failedToCancel"), {
        description: t("common.retry"),
      });
    },
  });

  const handleCancel = (reservation: ReservationWithCarAndUser) => {
    if (!settings) return;

    // Check if advance cancellation time is enabled (> 0) and if cancellation is allowed
    if (settings.advanceCancellationTime > 0) {
      const now = new Date();
      const startTime = new Date(reservation.startDateTime);
      const hoursUntilStart =
        (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilStart < settings.advanceCancellationTime) {
        toast.error(t("reservations.cancellationTooLate"), {
          description: t("reservations.cancellationTooLateDesc", {
            hours: settings.advanceCancellationTime,
          }),
        });
        return;
      }
    }

    // Show confirmation dialog
    setReservationToCancel(reservation);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (reservationToCancel) {
      cancelMutation.mutate(reservationToCancel.id);
    }
  };

  // Query for active reservations count
  const { data: activeReservationsCount = 0 } = useQuery({
    queryKey: ["activeReservationsCount", currentUser?.uid],
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return countActiveUserReservations(currentUser.uid);
    },
    enabled: !!currentUser?.uid && !!settings?.maxConcurrentReservations && settings.maxConcurrentReservations > 0,
    // staleTime: 30000, // Consider data fresh for 30 seconds - Replaced by CACHE_STRATEGIES.users
    // gcTime: 300000, // Keep in cache for 5 minutes - Replaced by CACHE_STRATEGIES.users
    ...CACHE_STRATEGIES.users, // Applied users strategy, could also be counts
  });

  const handleNewReservation = () => {
    if (!currentUser?.uid || !settings) return;

    // Check if maxConcurrentReservations is enabled (> 0)
    if (settings.maxConcurrentReservations > 0) {
      if (activeReservationsCount >= settings.maxConcurrentReservations) {
        toast.error(t("reservations.maxConcurrentReservationsReached"), {
          description: t("reservations.maxConcurrentReservationsReachedDesc", {
            maxReservations: settings.maxConcurrentReservations,
          }),
        });
        return;
      }
    }

    setReservationDialogOpen(true);
  };

  const handleStatusFilterChange = (status: ReservationStatus | "all") => {
    setStatusFilter(status);
  };

  const handleStartDateFilterChange = (date: Date | undefined) => {
    setStartDateFilter(date);
  };

  const handleEndDateFilterChange = (date: Date | undefined) => {
    setEndDateFilter(date);
  };

  const columns = createUserColumns({
    onCancel: handleCancel,
    t,
  });

  // isLoading now depends on reservationsLoading (which includes cars/users) and countLoading.
  const isLoading = reservationsLoading || countLoading;
  // Prioritize reservationsError.
  const displayError = reservationsError || (countError && !reservationsWithData.length ? countError : null);

  if (!currentUser) {
    return (
      <>
        <SectionHeader
          title={t("reservations.myReservations")}
          subtitle={t("reservations.userSubtitle")}
          action={handleNewReservation}
          actionText={t("reservations.newReservation")}
          actionIcon={Plus}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">{t("auth.invalidCredentials")}</p>
          </div>
        </div>
      </>
    );
  }

  if (hasError) {
    return (
      <>
        <SectionHeader
          title={t("reservations.myReservations")}
          subtitle={t("reservations.userSubtitle")}
          action={handleNewReservation}
          actionText={t("reservations.newReservation")}
          actionIcon={Plus}
        />
        <div className="px-4 lg:px-6">
          <ErrorDisplay
            error={displayError} // Use the determined displayError
            onRetry={() => { // Refetch both main data and count
                queryClient.invalidateQueries({ queryKey: ["reservations-populated-for-user", queryParams] });
                queryClient.invalidateQueries({ queryKey: ["reservations-count-for-user", filterParams] });
            }}
            title={t("reservations.errorLoadingReservations")}
            description={t("reservations.errorLoadingReservationsDescription", "Unable to load reservations. Please try again.")}
            showHomeButton={false}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("reservations.myReservations")}
        subtitle={t("reservations.userSubtitle")}
        action={handleNewReservation}
        actionText={t("reservations.newReservation")}
        actionIcon={Plus}
      />

      <div className="px-4 lg:px-6">
        <ReservationsTable
          columns={columns}
          data={reservationsWithData} // Use directly populated data
          loading={isLoading} // Use updated isLoading
          pagination={pagination}
          onStatusFilterChange={handleStatusFilterChange}
          onStartDateFilterChange={handleStartDateFilterChange}
          onEndDateFilterChange={handleEndDateFilterChange}
          onPageChange={setPageIndex}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(0);
            setCursors({});
          }}
          onFirstPage={() => {
            setPageIndex(0);
            setCursors({});
          }}
          onPreviousPage={() => {
            setPageIndex(Math.max(0, pageIndex - 1));
          }}
          onNextPage={() => {
            setPageIndex(pageIndex + 1);
          }}
          onLastPage={() => {
            if (pagination?.totalCount) {
              const lastPageIndex = Math.ceil(pagination.totalCount / pageSize) - 1;
              setPageIndex(lastPageIndex);
            }
          }}
          statusFilter={statusFilter}
          startDateFilter={startDateFilter}
          endDateFilter={endDateFilter}
          countError={countError}
          countLoading={countLoading}
        />
      </div>

      {/* Reservation Form Dialog */}
      <ReservationFormDialog
        open={reservationDialogOpen}
        onOpenChange={setReservationDialogOpen}
        mode="create"
      />

      {/* Cancellation Confirmation Dialog */}
      <CancellationConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={confirmCancel}
        title={t("reservations.cancelConfirmation")}
        description={
          reservationToCancel
            ? t("reservations.cancelConfirmationDesc", {
                action: settings?.autoCancelation
                  ? t("reservations.cancelConfirmationAuto")
                  : t("reservations.cancelConfirmationRequest"),
                car: reservationToCancel.carInfo?.model || t("common.unknown"),
                startDate: format(
                  new Date(reservationToCancel.startDateTime),
                  getLocalizedFormats().dateTime
                ),
                endDate: format(
                  new Date(reservationToCancel.endDateTime),
                  getLocalizedFormats().dateTime
                ),
              })
            : ""
        }
        isLoading={cancelMutation.isPending}
        isAutoCancel={settings?.autoCancelation || false}
      />
    </>
  );
}
