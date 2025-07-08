import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ErrorDisplay } from "@/components/ui/error-display";
import { SectionHeader } from "@/components/ui/section-header";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import {
  createAdminColumns,
  type ReservationWithCarAndUser,
} from "@/components/reservations/admin-reservations-columns";
import {
  fetchReservationsWithData,
  getReservationsCount,
  updateReservationStatus,
  checkReservationOverlap,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
} from "@/lib/reservations-service";
import type { ReservationStatus, ReservationWithId } from "@/types/reservation";
import { invalidateReservationQueries } from "@/lib/query-utils";

export default function AdminReservationsPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all"
  );
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<ReservationWithId | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const queryClient = useQueryClient();

  const queryParams: ReservationsQueryParams = {
    pageSize,
    pageIndex,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  };

  // Filter params for count query (without pagination params)
  const filterParams: ReservationsFilterParams = {
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  };

  // Fetch all reservations with related data (optimized to avoid N+1)
  const {
    data: reservationsResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch,
  } = useQuery({
    queryKey: [
      "reservationsWithData",
      queryParams.pageSize,
      queryParams.pageIndex,
      queryParams.statusFilter,
      queryParams.startDate,
      queryParams.endDate,
    ],
    queryFn: () => fetchReservationsWithData(queryParams),
    staleTime: 2 * 60 * 1000, // 2 minutes - reduce refetches for performance
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["reservations", "count", pageSize, filterParams],
    queryFn: () => getReservationsCount(filterParams),
  });

  const reservationsWithData = reservationsResponse?.reservations || [];

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

  // Status update mutation with optimistic updates
  const statusMutation = useMutation({
    mutationFn: ({
      reservationId,
      status,
    }: {
      reservationId: string;
      status: ReservationStatus;
    }) => updateReservationStatus(reservationId, status),
    onMutate: async ({ reservationId, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["reservationsWithData"] });

      // Snapshot the previous value
      const previousReservations = queryClient.getQueryData([
        "reservationsWithData",
        queryParams.pageSize,
        queryParams.pageIndex,
        queryParams.statusFilter,
        queryParams.startDate,
        queryParams.endDate,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [
          "reservationsWithData",
          queryParams.pageSize,
          queryParams.pageIndex,
          queryParams.statusFilter,
          queryParams.startDate,
          queryParams.endDate,
        ],
        (old: { reservations: ReservationWithCarAndUser[] }) => {
          if (!old) return old;

          return {
            ...old,
            reservations: old.reservations.map(
              (reservation: ReservationWithCarAndUser) =>
                reservation.id === reservationId
                  ? { ...reservation, status, updatedAt: new Date() }
                  : reservation
            ),
          };
        }
      );

      // Return a context object with the snapshotted value
      return { previousReservations };
    },
    onSuccess: (_, { status }) => {
      toast.success(t("reservations.statusUpdated"), {
        description: t("reservations.statusUpdatedDesc", {
          status: t(`reservations.${status}`),
        }),
      });
      // Intelligently invalidate related queries
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true,
        invalidateReservationsCount: true,
        invalidateDashboard: true, // Status changes affect dashboard charts
      });
    },
    onError: (error, _variables, context) => {
      console.error("Error updating reservation status:", error);

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousReservations) {
        queryClient.setQueryData(
          [
            "reservationsWithData",
            queryParams.pageSize,
            queryParams.pageIndex,
            queryParams.statusFilter,
            queryParams.startDate,
            queryParams.endDate,
          ],
          context.previousReservations
        );
      }

      toast.error(t("reservations.failedToUpdateStatus"), {
        description: t("common.retry"),
      });
    },
    onSettled: () => {
      // Ensure we're in sync with server after mutation
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true,
        invalidateReservationsCount: false, // Don't invalidate count on settled
        invalidateDashboard: false, // Already done on success
      });
    },
  });

  const handleStatusChange = async (
    reservation: ReservationWithCarAndUser,
    status: ReservationStatus
  ) => {
    // Check for overlap if confirming a reservation
    if (status === "confirmed") {
      try {
        const hasOverlap = await checkReservationOverlap(
          reservation.carInfo?.id || reservation.carRef.id,
          reservation.startDateTime,
          reservation.endDateTime,
          reservation.id
        );

        if (hasOverlap) {
          toast.error(t("reservations.overlapError"), {
            description: t("reservations.overlapErrorDesc"),
          });
          return;
        }
      } catch (error) {
        console.error("Error checking reservation overlap:", error);
        toast.error(t("reservations.overlapCheckError"), {
          description: t("common.retry"),
        });
        return;
      }
    }

    statusMutation.mutate({ reservationId: reservation.id, status });
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

  const handleEditReservation = (reservation: ReservationWithCarAndUser) => {
    setEditingReservation(reservation);
    setEditDialogOpen(true);
  };

  const columns = createAdminColumns({
    isUpdatingStatus: statusMutation.isPending,
    onStatusChange: handleStatusChange,
    onEdit: handleEditReservation,
    t,
  });

  const isLoading = reservationsLoading;
  const hasError = reservationsError;

  // Show loading state first
  if (isLoading) {
    return (
      <>
        <SectionHeader
          title={t("reservations.management")}
          subtitle={t("reservations.subtitle")}
        />
        <div className="px-4 lg:px-6">
          <ReservationsTable
            columns={columns}
            data={[]}
            loading={true}
            pagination={undefined}
            onStatusFilterChange={handleStatusFilterChange}
            onStartDateFilterChange={handleStartDateFilterChange}
            onEndDateFilterChange={handleEndDateFilterChange}
            onPageChange={setPageIndex}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPageIndex(0);
            }}
            statusFilter={statusFilter}
            startDateFilter={startDateFilter}
            endDateFilter={endDateFilter}
          />
        </div>
      </>
    );
  }

  if (hasError) {
    return (
      <>
        <SectionHeader
          title={t("reservations.management")}
          subtitle={t("reservations.subtitle")}
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
        title={t("reservations.management")}
        subtitle={t("reservations.subtitle")}
      />

      <div className="px-4 lg:px-6">
        <ReservationsTable
          columns={columns}
          data={reservationsWithData}
          loading={isLoading}
          pagination={pagination}
          onStatusFilterChange={handleStatusFilterChange}
          onStartDateFilterChange={handleStartDateFilterChange}
          onEndDateFilterChange={handleEndDateFilterChange}
          onPageChange={setPageIndex}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(0);
          }}
          statusFilter={statusFilter}
          startDateFilter={startDateFilter}
          endDateFilter={endDateFilter}
          countError={countError}
          countLoading={countLoading}
        />

        {/* Edit Reservation Dialog */}
        {editDialogOpen && editingReservation && (
          <ReservationFormDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            reservation={editingReservation}
            mode="edit"
          />
        )}
      </div>
    </>
  );
}
