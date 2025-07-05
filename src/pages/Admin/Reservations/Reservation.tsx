"use client";

import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { CarInfoCard } from "@/components/cars/car-info-card";
import { CarInfoSkeleton } from "@/components/cars/car-info-skeleton";
import { Edit } from "lucide-react";
import { ReservationDetailsCard } from "@/components/reservations/reservation-details-card";
import { ReservationDetailsSkeleton } from "@/components/reservations/reservation-details-skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { UserInfoCard } from "@/components/users/user-info-card";
import { UserInfoSkeleton } from "@/components/users/user-info-skeleton";
import { fetchCarById } from "@/lib/cars-service";
import { fetchReservationById } from "@/lib/reservations-service";
import { fetchUserById } from "@/lib/users-service";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function AdminReservationPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch reservation details
  const {
    data: reservation,
    isLoading: reservationLoading,
    error: reservationError,
  } = useQuery({
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

  // Fetch user details
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", reservation?.userRef?.id],
    queryFn: () => fetchUserById(reservation!.userRef.id),
    enabled: !!reservation?.userRef?.id,
  });

  // Handle edit reservation
  const handleEditReservation = () => {
    // TODO: Implement edit reservation functionality
    toast.info(t("reservations.editFeatureComingSoon"));
  };

  // Show loading state first
  if (reservationLoading) {
    return (
      <>
        <SectionHeader
          title={t("reservations.reservationDetails")}
          subtitle={t("reservations.reservationDetailsDesc")}
          action={handleEditReservation}
          actionText={t("reservations.editReservation")}
          actionIcon={Edit}
        />
        <div className="px-4 lg:px-6 space-y-6">
          <ReservationDetailsSkeleton />
          <UserInfoSkeleton />
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
            <h2 className="text-xl font-semibold">
              {t("reservations.reservationNotFound")}
            </h2>
            <p className="text-muted-foreground">
              {t("reservations.reservationNotFoundDesc")}
            </p>
            <Button onClick={() => navigate("/admin/reservations")}>
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
        action={handleEditReservation}
        actionText={t("reservations.editReservation")}
        actionIcon={Edit}
      />

      <div className="px-4 lg:px-6 space-y-6">
        {/* Content */}
        <div className="space-y-6">
          <ReservationDetailsCard reservation={reservation} t={t} />
          {userLoading ? (
            <UserInfoSkeleton />
          ) : user ? (
            <UserInfoCard user={user} t={t} />
          ) : null}
          {carLoading ? (
            <CarInfoSkeleton />
          ) : car ? (
            <CarInfoCard car={car} t={t} />
          ) : null}
        </div>
      </div>
    </>
  );
}
