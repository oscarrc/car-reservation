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
  // type ReservationWithCarAndUser, // Now imported from reservations-service
} from "@/components/reservations/admin-reservations-columns";
import {
  // fetchReservations, // Removed
  fetchReservationsWithPopulatedData, // Added
  getReservationsCount,
  updateReservationStatus,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
  type ReservationWithCarAndUser, // Added import from service
} from "@/lib/reservations-service";
import { CACHE_STRATEGIES } from "@/lib/query-config"; // Added
// import { fetchCarsByIds } from "@/lib/cars-service"; // Removed
// import { fetchUsersByIds } from "@/lib/users-service"; // Removed
import type { ReservationStatus, ReservationWithId } from "@/types/reservation";

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

  // Fetch reservations with populated data
  const {
    data: populatedDataResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
    // refetch is available from useQuery if needed for manual refetching
  } = useQuery({
    queryKey: ["reservations-populated", queryParams], // Use the whole queryParams object
    queryFn: () => fetchReservationsWithPopulatedData(queryParams),
    // keepPreviousData: true, // Consider for smoother UX
    ...CACHE_STRATEGIES.reservations, // Added cache strategy
  });

  // Fetch total count (this can remain for overall count display)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["reservations", "count", filterParams], // Keyed by filterParams only
    queryFn: () => getReservationsCount(filterParams),
    ...CACHE_STRATEGIES.counts, // Added cache strategy
  });

  const reservationsWithData: ReservationWithCarAndUser[] = populatedDataResponse?.reservations || [];
  const responsePagination = populatedDataResponse?.pagination;

  const totalRows = totalCount || 0;

  // Use pageIndex from local state as the primary driver for pagination,
  // but allow responsePagination to override if necessary.
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

  // N+1 queries for cars and users and their manual merging are no longer needed.

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({
      reservationId,
      status,
    }: {
      reservationId: string;
      status: ReservationStatus;
    }) => updateReservationStatus(reservationId, status),
    onSuccess: (_, { status }) => {
      toast.success(t("reservations.statusUpdated"), {
        description: t("reservations.statusUpdatedDesc", {
          status: t(`reservations.${status}`),
        }),
      });
      // Invalidate the new populated query and the count query using their full keys
      queryClient.invalidateQueries({ queryKey: ["reservations-populated", queryParams] });
      queryClient.invalidateQueries({ queryKey: ["reservations", "count", filterParams] });
    },
    onError: (error) => {
      console.error("Error updating reservation status:", error);
      toast.error(t("reservations.failedToUpdateStatus"), {
        description: t("common.retry"),
      });
    },
  });

  const handleStatusChange = (
    reservation: ReservationWithCarAndUser,
    status: ReservationStatus
  ) => {
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

  // isLoading combines the loading state of the main data query and the count query.
  const isLoading = reservationsLoading || countLoading;
  // Error to display: prioritize the main data query's error.
  // Show countError only if main data is fine but count fails, and it's critical for UI.
  const displayError = reservationsError || (countError && !reservationsWithData.length ? countError : null);

  const handleRetry = () => {
    // Invalidate queries to refetch them using their full keys
    queryClient.invalidateQueries({ queryKey: ["reservations-populated", queryParams] });
    queryClient.invalidateQueries({ queryKey: ["reservations", "count", filterParams] });
  };

  if (displayError && reservationsWithData.length === 0) {
    // Show full page error if the main data fetching fails and no data is available.
    return (
      <>
        <SectionHeader
          title={t("reservations.management")}
          subtitle={t("reservations.subtitle")}
        />
        <div className="px-4 lg:px-6">
          <ErrorDisplay
            error={displayError} // Show the determined error
            onRetry={handleRetry} // Use the new handleRetry
            title={t("reservations.errorLoadingReservations")}
            description={t(
              "reservations.errorLoadingReservationsDescription",
              "Unable to load reservations. Please try again."
            )}
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
