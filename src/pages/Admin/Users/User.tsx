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
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { createUserDetailsReservationColumns } from "@/components/reservations/user-details-reservation-columns";
import type { ReservationWithCarAndUser } from "@/components/reservations/user-details-reservation-columns";

import { fetchUserById } from "@/lib/users-service";
import {
  fetchReservations,
  updateReservationStatus,
  type ReservationsQueryParams,
} from "@/lib/reservations-service";
import { fetchCarsByIds } from "@/lib/cars-service";
import type { ReservationStatus } from "@/types/reservation";

export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all"
  );
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(
    undefined
  );
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(
    undefined
  );

  // Fetch user details
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
  });

  // Fetch reservations for this user
  const queryParams: ReservationsQueryParams = {
    pageSize: 50,
    userId,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  };

  const {
    data: reservationsResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: ["userReservations", userId, statusFilter, startDateFilter, endDateFilter],
    queryFn: () => fetchReservations(queryParams),
    enabled: !!userId,
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
  const reservationsWithData: ReservationWithCarAndUser[] = reservations.map(
    (reservation) => ({
      ...reservation,
      carInfo: carsData?.find((car) => car.id === reservation.carRef.id),
      userInfo: user || undefined,
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
      queryClient.invalidateQueries({ queryKey: ["userReservations", userId] });
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



  const getStatusVariant = (suspended: boolean) => {
    return suspended ? "destructive" : "success";
  };

  const getRoleVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary";
  };

  const columns = createUserDetailsReservationColumns({
    t,
    onStatusChange: handleStatusChange,
    isUpdatingStatus: statusMutation.isPending,
  });

  const isLoading = userLoading || reservationsLoading || carsLoading;
  const hasError = userError || reservationsError || carsError;

  if (hasError) {
    return (
      <>
        <SectionHeader
          title={t("users.userDetails")}
          subtitle={t("users.userDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">
              {t("users.errorLoadingUserDetails")}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (userLoading) {
    return (
      <>
        <SectionHeader
          title={t("users.userDetails")}
          subtitle={t("users.userDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p>{t("loading.loadingUsers")}</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SectionHeader
          title={t("users.userDetails")}
          subtitle={t("users.userDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">{t("users.userNotFound")}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("users.userDetails")}
        subtitle={t("users.userDetailsSubtitle")}
        action={() => setEditUserOpen(true)}
        actionText={t("users.editUser")}
        actionIcon={Edit}
      />

      <div className="px-4 lg:px-6 space-y-6">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("users.userInformation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("users.name")}
                </label>
                <p className="text-lg font-medium">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("users.email")}
                </label>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("users.phone")}
                </label>
                <p className="text-lg">
                  {user.phone || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("users.role")}
                </label>
                <div className="mt-1">
                  <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("common.status")}
                </label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(user.suspended || false)}>
                    {user.suspended ? t("users.suspended") : t("users.active")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Reservations Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {t("users.userReservations")}
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

      {/* Edit User Dialog */}
      <UserFormDialog
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        mode="edit"
        user={user}
      />
    </>
  );
}
