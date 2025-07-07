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
// import type { ReservationWithCarAndUser } from "@/components/reservations/admin-reservations-columns"; // Will use from service

import { fetchCarById } from "@/lib/cars-service";
import {
  // fetchReservations, // Removed
  fetchReservationsWithPopulatedData, // Added
  getReservationsCount,
  updateReservationStatus,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
  type ReservationWithCarAndUser, // Added
} from "@/lib/reservations-service";
import { CACHE_STRATEGIES } from "@/lib/query-config"; // Added
// import { fetchUsersByIds } from "@/lib/users-service"; // Removed
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

  // Fetch car details
  const {
    data: car,
    isLoading: carLoading,
    error: carError,
  } = useQuery({
    queryKey: ["car", carId],
    queryFn: () => fetchCarById(carId!),
    enabled: !!carId,
    ...CACHE_STRATEGIES.cars, // Added cache strategy
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

  // Fetch reservations with populated data for this specific car
  const {
    data: populatedDataResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: ["reservations-populated-by-car", queryParams], // Updated queryKey, pass full queryParams
    queryFn: () => fetchReservationsWithPopulatedData(queryParams),
    enabled: !!carId, // Only run if carId is available
    ...CACHE_STRATEGIES.reservations, // Added cache strategy
  });

  // Fetch total count for reservations of this car
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["reservations-count-for-car", filterParams], // Updated queryKey, pass full filterParams
    queryFn: () => getReservationsCount(filterParams),
    enabled: !!carId,
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

  // No need to fetch usersData separately or merge data manually.
  // reservationsWithData from fetchReservationsWithPopulatedData already contains carInfo and userInfo.

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
      // Invalidate the new populated query and the count query for this car
      queryClient.invalidateQueries({ queryKey: ["reservations-populated-by-car", queryParams] });
      queryClient.invalidateQueries({ queryKey: ["reservations-count-for-car", filterParams] });
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

  const handleEditReservation = (reservation: ReservationWithCarAndUser) => {
    setEditingReservation(reservation);
    setEditReservationOpen(true);
  };

  const columns = createCarDetailsReservationColumns({
    isUpdatingStatus: statusMutation.isPending,
    onStatusChange: handleStatusChange,
    onEdit: handleEditReservation,
    t,
  });

  // isLoading now depends on carLoading, reservationsLoading (which includes users), and countLoading.
  const isLoading = carLoading || reservationsLoading || countLoading;
  // Prioritize carError for the page, then reservationsError.
  const displayError = carError || reservationsError || (countError && !reservationsWithData.length ? countError : null);


  const handleRetry = () => {
    // Refetch car details and reservations data
    if (carId) {
      queryClient.invalidateQueries({ queryKey: ["car", carId] });
      queryClient.invalidateQueries({ queryKey: ["reservations-populated-by-car", queryParams] });
      queryClient.invalidateQueries({ queryKey: ["reservations-count-for-car", filterParams] });
    } else {
      window.location.reload(); // Fallback if carId is missing, though query `enabled` should prevent this
    }
  };

  // Show loading state first
  if (carLoading) { // Still show skeleton for car info while car details load
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
            error={displayError} // Use the determined displayError
            onRetry={handleRetry} // Use the new handleRetry
            title={t("fleet.errorLoadingCarDetails")}
            description={t(
              "fleet.errorLoadingCarDetailsDescription",
              "Unable to load car details. Please try again."
            )}
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
