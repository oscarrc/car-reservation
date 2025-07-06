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
  fetchUserReservations,
  getReservationsCount,
  requestCancellation,
  countActiveUserReservations,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
  type PaginationCursor,
} from "@/lib/reservations-service";
import { fetchCarsByIds } from "@/lib/cars-service";
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

  // Fetch user reservations
  const {
    data: reservationsResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch,
  } = useQuery({
    queryKey: [
      "userReservations",
      currentUser?.uid,
      queryParams.pageSize,
      queryParams.pageIndex,
      queryParams.statusFilter,
      queryParams.startDate,
      queryParams.endDate,
    ],
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return fetchUserReservations({ ...queryParams, userId: currentUser.uid });
    },
    enabled: !!currentUser?.uid,
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["userReservations", "count", currentUser?.uid, pageSize, filterParams],
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return getReservationsCount(filterParams);
    },
    enabled: !!currentUser?.uid,
  });

  const reservations = reservationsResponse?.reservations || [];
  
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

  // Extract unique car IDs from DocumentReferences
  const carIds = [
    ...new Set(reservations.map((r) => r.carRef.id).filter(Boolean)),
  ];

  // Fetch cars data for the reservations
  const {
    data: carsData,
    isLoading: carsLoading,
    error: carsError,
  } = useQuery({
    queryKey: ["reservationCars", carIds],
    queryFn: () => fetchCarsByIds(carIds),
    enabled: carIds.length > 0,
  });

  // Merge reservations with car data using reference IDs
  const reservationsWithCarData: ReservationWithCarAndUser[] = reservations.map(
    (reservation) => ({
      ...reservation,
      carInfo: carsData?.find((car) => car.id === reservation.carRef.id),
      userEmail: currentUser?.email || "",
    })
  );

  // Cancellation mutation
  const cancelMutation = useMutation({
    mutationFn: (reservationId: string) =>
      requestCancellation(reservationId, settings?.autoCancelation || false),
    onSuccess: (result, reservationId) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      const carInfo = carsData?.find(
        (car) => car.id === reservation?.carRef.id
      );

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

      queryClient.invalidateQueries({ queryKey: ["userReservations"] });
      queryClient.invalidateQueries({ queryKey: ["activeReservationsCount"] });
      queryClient.invalidateQueries({ queryKey: ["availableCarsForDateRange"] });
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

  const isLoading = reservationsLoading || carsLoading;
  const hasError = reservationsError || carsError;

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
