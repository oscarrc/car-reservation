import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/ui/section-header";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import {
  createAdminColumns,
  type ReservationWithCarAndUser,
} from "@/components/reservations/admin-reservations-columns";
import {
  fetchReservations,
  updateReservationStatus,
  type ReservationsQueryParams,
  type PaginationCursor,
} from "@/lib/reservations-service";
import { fetchCarsByIds } from "@/lib/cars-service";
import { fetchUsersByIds } from "@/lib/users-service";
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
  const [editingReservation, setEditingReservation] = useState<ReservationWithId | null>(null);
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
    cursor: cursors[pageIndex],
  };

  // Fetch all reservations (admin view)
  const {
    data: reservationsResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: ["reservations", queryParams.pageSize, queryParams.pageIndex, queryParams.statusFilter, queryParams.startDate, queryParams.endDate],
    queryFn: () => fetchReservations(queryParams),
  });

  const reservations = reservationsResponse?.reservations || [];
  const pagination = reservationsResponse?.pagination ? {
    pageIndex: reservationsResponse.pagination.pageIndex,
    pageSize: reservationsResponse.pagination.pageSize,
    totalCount: reservationsResponse.pagination.totalCount || 0,
    hasNextPage: reservationsResponse.pagination.hasNextPage,
    hasPreviousPage: reservationsResponse.pagination.hasPreviousPage,
  } : undefined;

  // Extract unique car and user IDs from DocumentReferences
  const carIds = [
    ...new Set(reservations.map((r) => r.carRef.id).filter(Boolean)),
  ];
  const userIds = [
    ...new Set(reservations.map((r) => r.userRef.id).filter(Boolean)),
  ];

  // Fetch cars and users data for the reservations
  const {
    data: carsData,
    isLoading: carsLoading,
    error: carsError,
  } = useQuery({
    queryKey: ["reservationCars", carIds],
    queryFn: () => fetchCarsByIds(carIds),
    enabled: carIds.length > 0,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["reservationUsers", userIds],
    queryFn: () => fetchUsersByIds(userIds),
    enabled: userIds.length > 0,
  });

  // Merge reservations with car and user data using reference IDs
  const reservationsWithData: ReservationWithCarAndUser[] = reservations.map(
    (reservation) => ({
      ...reservation,
      carInfo: carsData?.find((car) => car.id === reservation.carRef.id),
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
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
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

  const isLoading = reservationsLoading || carsLoading || usersLoading;
  const hasError = reservationsError || carsError || usersError;

  if (hasError) {
    return (
      <>
        <SectionHeader
          title={t("reservations.management")}
          subtitle={t("reservations.subtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">
              {t("reservations.errorLoadingReservations")}
            </p>
          </div>
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

      <ReservationFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        reservation={editingReservation}
        mode="edit"
      />
    </>
  );
}
