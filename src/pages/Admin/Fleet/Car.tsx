import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Edit } from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { CarFormDialog } from "@/components/cars/car-form-dialog";
import { createCarReservationColumns } from "@/components/reservations/car-reservation-columns";
import type { ReservationWithCarAndUser } from "@/components/reservations/admin-reservations-columns";

import { fetchCarById } from "@/lib/cars-service";
import {
  fetchReservations,
  updateReservationStatus,
  type ReservationsQueryParams,
} from "@/lib/reservations-service";
import { fetchUsersByIds } from "@/lib/users-service";
import type { ReservationStatus } from "@/types/reservation";

export default function CarPage() {
  const { carId } = useParams<{ carId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editCarOpen, setEditCarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all"
  );
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(
    undefined
  );

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
    pageSize: 50,
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
    queryKey: ["carReservations", carId],
    queryFn: () => fetchReservations(queryParams),
    enabled: !!carId,
  });

  const reservations = reservationsResponse?.reservations || [];

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "available":
        return "success";
      case "maintenance":
        return "warning";
      case "out_of_service":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const columns = createCarReservationColumns({
    onStatusChange: handleStatusChange,
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

  if (carLoading) {
    return (
      <>
        <SectionHeader
          title={t("fleet.carDetails")}
          subtitle={t("fleet.carDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p>{t("loading.loadingCars")}</p>
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
        <Card>
          <CardHeader>
            <CardTitle>{t("fleet.carInformation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("fleet.licensePlate")}
                </label>
                <p className="text-lg font-mono font-medium">
                  {car.licensePlate}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("fleet.model")}
                </label>
                <p className="text-lg font-medium">{car.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("fleet.color")}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: car.color.toLowerCase() }}
                  />
                  <span className="text-lg">
                    {t(`fleet.colors.${car.color}`, {
                      defaultValue: car.color,
                    })}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("fleet.seats")}
                </label>
                <p className="text-lg font-medium">{car.seats}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("common.status")}
                </label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(car.status)}>
                    {t(`fleet.${car.status}`)}
                  </Badge>
                </div>
              </div>
              {car.description && (
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("fleet.otherInformation")}
                  </label>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {car.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {t("fleet.carReservations")}
          </h3>
          <ReservationsTable
            columns={columns}
            data={reservationsWithData}
            loading={isLoading}
            onStatusFilterChange={setStatusFilter}
            onStartDateFilterChange={setStartDateFilter}
            onEndDateFilterChange={setEndDateFilter}
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
    </>
  );
}
