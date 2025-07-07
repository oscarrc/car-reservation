import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Edit } from "lucide-react";

import { ErrorDisplay } from "@/components/ui/error-display";
import { SectionHeader } from "@/components/ui/section-header";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { CarFormDialog } from "@/components/cars/car-form-dialog";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import { createCarDetailsReservationColumns } from "@/components/reservations/car-details-reservation-columns";
import type { ReservationWithCarAndUser } from "@/components/reservations/admin-reservations-columns";

import { fetchCarById } from "@/lib/cars-service";
import {
  fetchReservationsWithData,
  getReservationsCount,
  updateReservationStatus,
  bulkUpdateReservationStatus,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
} from "@/lib/reservations-service";
import { invalidateReservationQueries } from "@/lib/query-utils";
import type { ReservationStatus, ReservationWithId } from "@/types/reservation";
import { CarInfoSkeleton } from "@/components/cars/car-info-skeleton";
import { CarInfoCard } from "@/components/cars/car-info-card";

export default function CarPage() {
  const { carId } = useParams<{ carId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editCarOpen, setEditCarOpen] = useState(false);
  const [editReservationOpen, setEditReservationOpen] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<ReservationWithId | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all"
  );
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Bulk actions state
  const [isBulkActionsLoading, setIsBulkActionsLoading] = useState(false);

  // Fetch car details
  const {
    data: car,
    isLoading: carLoading,
    error: carError,
  } = useQuery({
    queryKey: ["car", carId],
    queryFn: () => fetchCarById(carId!),
    enabled: !!carId,
  });

  const queryParams: ReservationsQueryParams = {
    pageSize,
    pageIndex,
    carId,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  };

  // Filter params for count query (without pagination params)
  const filterParams: ReservationsFilterParams = {
    carId,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  };

  const {
    data: reservationsResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: [
      "carReservationsWithData",
      carId,
      statusFilter,
      startDateFilter,
      endDateFilter,
      pageIndex,
      pageSize,
    ],
    queryFn: () => fetchReservationsWithData(queryParams),
    enabled: !!carId,
    staleTime: 2 * 60 * 1000, // 2 minutes - reduce refetches for performance
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["carReservations", "count", carId, pageSize, filterParams],
    queryFn: () => getReservationsCount(filterParams),
    enabled: !!carId,
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
      // Use utility for targeted invalidation
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true, // Update admin list
        invalidateReservationsCount: true, // Update global count
        invalidateDashboard: true, // Status changes affect dashboard
        invalidateAvailableCars: true, // Car availability may change
        specificCarId: carId,
      });
    },
    onError: (error) => {
      console.error("Error updating reservation status:", error);
      toast.error(t("reservations.failedToUpdateStatus"), {
        description: t("common.retry"),
      });
    },
  });

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ reservationIds, status }: { reservationIds: string[]; status: ReservationStatus }) => {
      setIsBulkActionsLoading(true);
      return await bulkUpdateReservationStatus(reservationIds, status);
    },
    onSuccess: (result, { status }) => {
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true,
        invalidateReservationsCount: true,
        invalidateDashboard: true,
        invalidateAvailableCars: true,
        specificCarId: carId,
      });

      if (result.successCount > 0) {
        toast.success(t("reservations.bulkStatusUpdateSuccess", { 
          count: result.successCount,
          status: t(`reservations.${status}`)
        }));
      }
      if (result.errorCount > 0) {
        toast.error(t("reservations.bulkStatusUpdatePartialError", { 
          successCount: result.successCount, 
          errorCount: result.errorCount 
        }));
      }

      setIsBulkActionsLoading(false);
    },
    onError: (error) => {
      console.error("Error in bulk status update:", error);
      toast.error(t("reservations.bulkStatusUpdateError"));
      setIsBulkActionsLoading(false);
    },
  });

  const handleStatusChange = (
    reservation: ReservationWithCarAndUser,
    status: ReservationStatus
  ) => {
    statusMutation.mutate({ reservationId: reservation.id, status });
  };

  const handleEditReservation = (reservation: ReservationWithCarAndUser) => {
    setEditingReservation(reservation);
    setEditReservationOpen(true);
  };

  // Bulk action handler
  const handleBulkStatusChange = (reservationIds: string[], status: ReservationStatus) => {
    if (reservationIds.length === 0) {
      toast.error(t("reservations.noReservationsSelected"));
      return;
    }

    bulkStatusMutation.mutate({ reservationIds, status });
  };

  const columns = createCarDetailsReservationColumns({
    isUpdatingStatus: statusMutation.isPending,
    onStatusChange: handleStatusChange,
    onEdit: handleEditReservation,
    t,
  });

  const isLoading = carLoading || reservationsLoading;
  const hasError = carError || reservationsError;

  // Show loading state first
  if (carLoading) {
    return (
      <>
        <SectionHeader
          title={t("fleet.carDetails")}
          subtitle={t("fleet.carDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6 space-y-6">
          <CarInfoSkeleton />

          {/* Reservations Table with Loading State */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("fleet.carReservations")}
            </h3>
            <ReservationsTable
              columns={columns}
              data={[]}
              loading={true}
              pagination={undefined}
              onStatusFilterChange={setStatusFilter}
              onStartDateFilterChange={setStartDateFilter}
              onEndDateFilterChange={setEndDateFilter}
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
        </div>
      </>
    );
  }

  if (hasError) {
    return (
      <>
        <SectionHeader
          title={t("fleet.carDetails")}
          subtitle={t("fleet.carDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <ErrorDisplay
            error={hasError}
            onRetry={() => window.location.reload()}
            title={t("fleet.errorLoadingCarDetails")}
            description={t("fleet.errorLoadingCarDetailsDescription")}
            homePath="/admin/fleet"
          />
        </div>
      </>
    );
  }

  if (!car) {
    return (
      <>
        <SectionHeader
          title={t("fleet.carDetails")}
          subtitle={t("fleet.carDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">{t("fleet.carNotFound")}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("fleet.carDetails")}
        subtitle={t("fleet.carDetailsSubtitle")}
        action={() => setEditCarOpen(true)}
        actionText={t("fleet.editCar")}
        actionIcon={Edit}
      />

      <div className="px-4 lg:px-6 space-y-6">
        {/* Car Info Card */}
        <CarInfoCard car={car} t={t} />

        {/* Reservations Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {t("fleet.carReservations")}
          </h3>
          <ReservationsTable
            columns={columns}
            data={reservationsWithData}
            loading={isLoading}
            pagination={pagination}
            onStatusFilterChange={setStatusFilter}
            onStartDateFilterChange={setStartDateFilter}
            onEndDateFilterChange={setEndDateFilter}
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
            bulkActions={{
              onStatusChange: handleBulkStatusChange,
              isLoading: isBulkActionsLoading,
            }}
          />
        </div>

        {/* Edit Car Dialog */}
        {editCarOpen && (
          <CarFormDialog
            open={editCarOpen}
            onOpenChange={setEditCarOpen}
            car={car}
            mode="edit"
          />
        )}

        {/* Edit Reservation Dialog */}
        {editReservationOpen && editingReservation && (
          <ReservationFormDialog
            open={editReservationOpen}
            onOpenChange={setEditReservationOpen}
            reservation={editingReservation}
            mode="edit"
          />
        )}
      </div>
    </>
  );
}
