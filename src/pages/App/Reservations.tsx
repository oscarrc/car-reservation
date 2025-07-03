import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
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
  requestCancellation,
  type ReservationsQueryParams,
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
  const queryClient = useQueryClient();

  const queryParams: ReservationsQueryParams = {
    pageSize: 50,
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
  } = useQuery({
    queryKey: ["userReservations", queryParams],
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return fetchUserReservations({ ...queryParams, userId: currentUser.uid });
    },
    enabled: !!currentUser?.uid,
  });

  const reservations = reservationsResponse?.reservations || [];

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

  const handleView = (reservation: ReservationWithCarAndUser) => {
    // TODO: Implement view reservation details dialog
    console.log("View reservation:", reservation);
  };

  const handleCancel = (reservation: ReservationWithCarAndUser) => {
    if (!settings) return;

    // Check if cancellation is allowed based on advance cancellation time
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

    // Show confirmation dialog
    setReservationToCancel(reservation);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (reservationToCancel) {
      cancelMutation.mutate(reservationToCancel.id);
    }
  };

  const handleNewReservation = () => {
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
    onView: handleView,
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
          onStatusFilterChange={handleStatusFilterChange}
          onStartDateFilterChange={handleStartDateFilterChange}
          onEndDateFilterChange={handleEndDateFilterChange}
          statusFilter={statusFilter}
          startDateFilter={startDateFilter}
          endDateFilter={endDateFilter}
        />
      </div>

      {/* Reservation Form Dialog */}
      <ReservationFormDialog
        open={reservationDialogOpen}
        onOpenChange={setReservationDialogOpen}
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
