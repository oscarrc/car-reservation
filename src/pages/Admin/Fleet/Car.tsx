import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Edit } from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { CarFormDialog } from "@/components/cars/car-form-dialog";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import { createCarDetailsReservationColumns } from "@/components/reservations/car-details-reservation-columns";
import type { ReservationWithCarAndUser } from "@/components/reservations/admin-reservations-columns";

import { fetchCarById } from "@/lib/cars-service";
import {
  fetchReservations,
  updateReservationStatus,
  type ReservationsQueryParams,
  type PaginationCursor,
} from "@/lib/reservations-service";
import { fetchUsersByIds } from "@/lib/users-service";
import type { ReservationStatus, ReservationWithId } from "@/types/reservation";
import { CarInfoSkeleton } from "@/components/cars/car-info-skeleton";
import { CarInfoCard } from "@/components/cars/car-info-card";

export default function CarPage() {
  const { carId } = useParams<{ carId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editCarOpen, setEditCarOpen] = useState(false);
  const [editReservationOpen, setEditReservationOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationWithId | null>(null);
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
  const [cursors, setCursors] = useState<{ [key: number]: PaginationCursor }>({});

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

  // Fetch reservations for this car
  const queryParams: ReservationsQueryParams = {
    pageSize,
    pageIndex,
    carId,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
    cursor: cursors[pageIndex],
  };

  const {
    data: reservationsResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: [
      "carReservations",
      carId,
      statusFilter,
      startDateFilter,
      endDateFilter,
      pageIndex,
      pageSize,
    ],
    queryFn: () => fetchReservations(queryParams),
    enabled: !!carId,
  });

  const reservations = reservationsResponse?.reservations || [];
  const pagination = reservationsResponse?.pagination ? {
    pageIndex: reservationsResponse.pagination.pageIndex,
    pageSize: reservationsResponse.pagination.pageSize,
    totalCount: reservationsResponse.pagination.totalCount || 0,
    hasNextPage: reservationsResponse.pagination.hasNextPage,
    hasPreviousPage: reservationsResponse.pagination.hasPreviousPage,
  } : undefined;

  // Extract unique user IDs from DocumentReferences
  const userIds = [
    ...new Set(reservations.map((r) => r.userRef.id).filter(Boolean)),
  ];

  // Fetch users data for the reservations
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["reservationUsers", userIds],
    queryFn: () => fetchUsersByIds(userIds),
    enabled: userIds.length > 0,
  });

  // Merge reservations with user data using reference IDs
  const reservationsWithData: ReservationWithCarAndUser[] = reservations.map(
    (reservation) => ({
      ...reservation,
      carInfo: car || undefined,
      userInfo: usersData?.find((user) => user.id === reservation.userRef.id),
    })
  );

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
      queryClient.invalidateQueries({ queryKey: ["carReservations", carId] });
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

  const isLoading = carLoading || reservationsLoading || usersLoading;
  const hasError = carError || reservationsError || usersError;

  if (hasError) {
    return (
      <>
        <SectionHeader
          title={t("fleet.carDetails")}
          subtitle={t("fleet.carDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">
              {t("fleet.errorLoadingCarDetails")}
            </p>
          </div>
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
        {/* Car Information Card */}
        {carLoading ? (
          <CarInfoSkeleton />
        ) : car ? (
          <CarInfoCard car={car} t={t} />
        ) : null}
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
          />
        </div>
      </div>

      {/* Edit Car Dialog */}
      <CarFormDialog
        open={editCarOpen}
        onOpenChange={setEditCarOpen}
        mode="edit"
        car={car}
      />

      {/* Edit Reservation Dialog */}
      <ReservationFormDialog
        open={editReservationOpen}
        onOpenChange={setEditReservationOpen}
        reservation={editingReservation}
        mode="edit"
      />
    </>
  );
}
