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
  type ReservationWithCarAndUser,
} from "@/components/reservations/user-reservations-columns";
import {
  fetchReservationsWithData,
  getReservationsCount,
  requestCancellation,
  bulkCancelReservations,
  countActiveUserReservations,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
  type PaginationCursor,
} from "@/lib/reservations-service";
import { invalidateReservationQueries } from "@/lib/query-utils";
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
  const [cursors, setCursors] = useState<{ [key: number]: PaginationCursor }>(
    {}
  );
  const queryClient = useQueryClient();

  // Bulk actions state
  const [isBulkActionsLoading, setIsBulkActionsLoading] = useState(false);

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

  // Fetch user reservations with related data
  const {
    data: reservationsResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch,
  } = useQuery({
    queryKey: [
      "userReservationsWithData",
      currentUser?.uid,
      queryParams.pageSize,
      queryParams.pageIndex,
      queryParams.statusFilter,
      queryParams.startDate,
      queryParams.endDate,
    ],
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return fetchReservationsWithData({
        ...queryParams,
        userId: currentUser.uid,
      });
    },
    enabled: !!currentUser?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutes - reduce refetches for performance
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: [
      "userReservations",
      "count",
      currentUser?.uid,
      pageSize,
      filterParams,
    ],
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return getReservationsCount(filterParams);
    },
    enabled: !!currentUser?.uid,
  });

  const reservationsWithCarData = reservationsResponse?.reservations || [];

  // Calculate pagination state locally
  const totalRows = totalCount || 0;
  const hasNextPage = pageIndex < Math.ceil(totalRows / pageSize) - 1;
  const hasPreviousPage = pageIndex > 0;

  const pagination = {
    pageIndex: reservationsResponse?.pagination.pageIndex || 0,
    pageSize: reservationsResponse?.pagination.pageSize || 25,
    totalCount: totalRows,
    hasNextPage,
    hasPreviousPage,
  };

  // Cancellation mutation
  const cancelMutation = useMutation({
    mutationFn: (reservationId: string) =>
      requestCancellation(reservationId, settings?.autoCancelation || false),
    onSuccess: (result, reservationId) => {
      const reservation = reservationsWithCarData.find(
        (r) => r.id === reservationId
      );
      const carInfo = reservation?.carInfo;

      if (result.status === "cancelled") {
        toast.success(t("reservations.cancellationSuccess"), {
          description: t("reservations.cancellationSuccessDesc", {
            car: carInfo?.model || t("common.unknown"),
          }),
        });
      } else {
        toast.success(t("reservations.cancellationRequested"), {
          description: t("reservations.cancellationRequestedDesc", {
            car: carInfo?.model || t("common.unknown"),
          }),
        });
      }

      // Use utility for targeted invalidation
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: false, // Don't invalidate main admin list
        invalidateReservationsCount: false, // Don't invalidate global count
        invalidateDashboard: false,
        invalidateActiveReservationsCount: true,
        invalidateAvailableCars: true,
        specificUserId: currentUser?.uid,
      });
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

  // Bulk cancellation mutation
  const bulkCancelMutation = useMutation({
    mutationFn: async (reservationIds: string[]) => {
      setIsBulkActionsLoading(true);
      return await bulkCancelReservations(reservationIds, settings?.autoCancelation || false);
    },
    onSuccess: (result) => {
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: false, // Don't invalidate main admin list
        invalidateReservationsCount: false, // Don't invalidate global count
        invalidateDashboard: false,
        invalidateActiveReservationsCount: true,
        invalidateAvailableCars: true,
        specificUserId: currentUser?.uid,
      });

      if (result.successCount > 0) {
        if (settings?.autoCancelation) {
          toast.success(t("reservations.bulkCancelSuccess", { 
            count: result.successCount
          }));
        } else {
          toast.success(t("reservations.cancellationRequested"), {
            description: t("reservations.bulkCancelSuccess", { 
              count: result.successCount
            }),
          });
        }
      }
      if (result.errorCount > 0) {
        toast.error(t("reservations.bulkCancelPartialError", { 
          successCount: result.successCount, 
          errorCount: result.errorCount 
        }));
      }

      setIsBulkActionsLoading(false);
    },
    onError: (error) => {
      console.error("Error in bulk cancellation:", error);
      toast.error(t("reservations.bulkCancelError"));
      setIsBulkActionsLoading(false);
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

  // Bulk action handler
  const handleBulkCancel = (reservationIds: string[]) => {
    if (reservationIds.length === 0) {
      toast.error(t("reservations.noReservationsSelected"));
      return;
    }

    // Check advance cancellation time for all selected reservations
    if (settings && settings.advanceCancellationTime > 0) {
      const now = new Date();
      const invalidReservations = reservationsWithCarData.filter(reservation => {
        if (!reservationIds.includes(reservation.id)) return false;
        
        const startTime = new Date(reservation.startDateTime);
        const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilStart < settings.advanceCancellationTime;
      });

      if (invalidReservations.length > 0) {
        toast.error(t("reservations.cancellationTooLate"), {
          description: t("reservations.cancellationTooLateDesc", {
            hours: settings.advanceCancellationTime,
          }),
        });
        return;
      }
    }

    bulkCancelMutation.mutate(reservationIds);
  };

  // Query for active reservations count
  const { data: activeReservationsCount = 0 } = useQuery({
    queryKey: ["activeReservationsCount", currentUser?.uid],
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return countActiveUserReservations(currentUser.uid);
    },
    enabled:
      !!currentUser?.uid &&
      !!settings?.maxConcurrentReservations &&
      settings.maxConcurrentReservations > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
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

  const isLoading = reservationsLoading;
  const hasError = reservationsError;

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
            error={hasError}
            onRetry={() => refetch()}
            title={t("reservations.errorLoadingReservations")}
            description={t("reservations.errorLoadingReservationsDescription")}
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
            data={reservationsWithCarData}
            loading={isLoading}
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
                const lastPageIndex =
                  Math.ceil(pagination.totalCount / pageSize) - 1;
                setPageIndex(lastPageIndex);
              }
            }}
            statusFilter={statusFilter}
            startDateFilter={startDateFilter}
            endDateFilter={endDateFilter}
            countError={countError}
            countLoading={countLoading}
            bulkActions={{
              onCancel: handleBulkCancel,
              isLoading: isBulkActionsLoading,
              autoCancelation: settings?.autoCancelation || false,
            }}
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
