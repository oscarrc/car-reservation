"use client";

import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { ErrorDisplay } from "@/components/ui/error-display";
import { ReservationDetailsCard } from "@/components/reservations/reservation-details-card";
import { ReservationDetailsSkeleton } from "@/components/reservations/reservation-details-skeleton";
import { CarInfoCard } from "@/components/cars/car-info-card";
import { CarInfoSkeleton } from "@/components/cars/car-info-skeleton";
import { CancellationConfirmationDialog } from "@/components/ui/cancellation-confirmation-dialog";
import { fetchReservationById } from "@/lib/reservations-service";
import { fetchCarById } from "@/lib/cars-service";
import { requestCancellation } from "@/lib/reservations-service";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AppReservationPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { currentUser } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch reservation details
  const { 
    data: reservation, 
    isLoading: reservationLoading, 
    error: reservationError,
    refetch: refetchReservation
  } = useQuery({
    queryKey: ["reservation", reservationId],
    queryFn: () => fetchReservationById(reservationId!),
    enabled: !!reservationId,
  });

  // Fetch car details
  const { 
    data: car, 
    isLoading: carLoading,
    error: carError,
    refetch: refetchCar
  } = useQuery({
    queryKey: ["car", reservation?.carRef?.id],
    queryFn: () => fetchCarById(reservation!.carRef.id),
    enabled: !!reservation?.carRef?.id,
  });

  // Cancel reservation mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!reservationId) throw new Error("Reservation ID not found");
      if (!settings) throw new Error("Settings not loaded");

      return await requestCancellation(reservationId, settings.autoCancelation);
    },
    onSuccess: (result) => {
      const selectedCar = car;
      
      if (result.status === "cancelled") {
        toast.success(t("reservations.reservationCancelled"), {
          description: t("reservations.reservationCancelledDesc", {
            car: selectedCar?.model || t("common.unknown"),
          }),
        });
      } else {
        toast.success(t("reservations.cancellationRequested"), {
          description: t("reservations.cancellationRequestedDesc", {
            car: selectedCar?.model || t("common.unknown"),
          }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["userReservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["activeReservationsCount"] });
      queryClient.invalidateQueries({ queryKey: ["availableCarsForDateRange"] });
      navigate("/app/reservations");
    },
    onError: (error) => {
      console.error("Failed to cancel reservation:", error);
      toast.error(t("reservations.failedToCancelReservation"), {
        description: t("common.retry"),
      });
    },
  });

  // Check if user can cancel this reservation
  const canCancel = reservation && 
    ["pending", "confirmed"].includes(reservation.status) &&
    reservation.userRef.id === currentUser?.uid;

  // Handle cancel action
  const handleCancelAction = () => {
    if (!canCancel || !settings) return;

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

    setShowCancelDialog(true);
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    cancelMutation.mutate();
  };

  // Handle retry for errors
  const handleRetry = () => {
    refetchReservation();
    if (reservation?.carRef?.id) {
      refetchCar();
    }
  };

  // Show loading state first
  if (reservationLoading) {
    return (
      <>
        <SectionHeader
          title={t("reservations.reservationDetails")}
          subtitle={t("reservations.reservationDetailsDesc")}
        />
        <div className="px-4 lg:px-6 space-y-6">
          <ReservationDetailsSkeleton />
          <CarInfoSkeleton />
        </div>
      </>
    );
  }

  // Handle error state after loading is complete
  if (reservationError || carError || !reservation) {
    return (
      <>
        <SectionHeader
          title={t("reservations.reservationDetails")}
          subtitle={t("reservations.reservationDetailsDesc")}
        />
        <div className="px-4 lg:px-6">
          <ErrorDisplay
            error={reservationError || carError || new Error("Reservation not found")}
            onRetry={handleRetry}
            title={t("reservations.reservationNotFound")}
            description={t("reservations.reservationNotFoundDesc", "Unable to load reservation details. Please try again.")}
            showHomeButton={false}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("reservations.reservationDetails")}
        subtitle={t("reservations.reservationDetailsDesc")}
        action={canCancel ? handleCancelAction : undefined}
        actionText={canCancel ? t("reservations.cancelReservation") : undefined}
        actionIcon={canCancel ? XCircle : undefined}
        actionVariant={canCancel ? "destructive" : undefined}
      />

      <div className="px-4 lg:px-6 space-y-6">
        {/* Content */}
        <div className="space-y-6">
          <ReservationDetailsCard reservation={reservation} t={t} />
          {carLoading ? (
            <CarInfoSkeleton />
          ) : car ? (
            <CarInfoCard car={car} t={t} />
          ) : null}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <CancellationConfirmationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelConfirm}
        title={t("reservations.cancelReservation")}
        description={
          settings?.autoCancelation 
            ? t("reservations.cancelReservationConfirmAuto")
            : t("reservations.cancelReservationConfirmManual")
        }
        isLoading={cancelMutation.isPending}
        isAutoCancel={settings?.autoCancelation}
      />
    </>
  );
}
