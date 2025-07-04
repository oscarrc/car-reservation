"use client";

import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { ReservationDetailsCard } from "@/components/reservations/reservation-details-card";
import { ReservationDetailsSkeleton } from "@/components/reservations/reservation-details-skeleton";
import { CarInfoCard } from "@/components/reservations/car-info-card";
import { CarInfoSkeleton } from "@/components/reservations/car-info-skeleton";
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
  const { data: reservation, isLoading: reservationLoading, error: reservationError } = useQuery({
    queryKey: ["reservation", reservationId],
    queryFn: () => fetchReservationById(reservationId!),
    enabled: !!reservationId,
  });

  // Fetch car details
  const { data: car, isLoading: carLoading } = useQuery({
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
    if (canCancel) {
      setShowCancelDialog(true);
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    cancelMutation.mutate();
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
  if (reservationError || !reservation) {
    return (
      <>
        <SectionHeader
          title={t("reservations.reservationDetails")}
          subtitle={t("reservations.reservationDetailsDesc")}
        />
        <div className="px-4 lg:px-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <h2 className="text-xl font-semibold">{t("reservations.reservationNotFound")}</h2>
            <p className="text-muted-foreground">{t("reservations.reservationNotFoundDesc")}</p>
            <Button onClick={() => navigate("/app/reservations")}>
              {t("common.backToReservations")}
            </Button>
          </div>
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
