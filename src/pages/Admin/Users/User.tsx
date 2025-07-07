import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ErrorDisplay } from "@/components/ui/error-display";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import { createUserDetailsReservationColumns } from "@/components/reservations/user-details-reservation-columns";
// import type { ReservationWithCarAndUser } from "@/components/reservations/user-details-reservation-columns"; // Will use from service

import { fetchUserById } from "@/lib/users-service";
import {
  // fetchReservations, // Removed
  fetchReservationsWithPopulatedData, // Added
  getReservationsCount,
  updateReservationStatus,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
  type ReservationWithCarAndUser, // Added
} from "@/lib/reservations-service";
// import { fetchCarsByIds } from "@/lib/cars-service"; // Removed
import { CACHE_STRATEGIES } from "@/lib/query-config"; // Added
import type { ReservationStatus, ReservationWithId } from "@/types/reservation";

export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editUserOpen, setEditUserOpen] = useState(false);
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

  // Fetch user details
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
    ...CACHE_STRATEGIES.users, // Added cache strategy
  });

  // Fetch reservations for this user
  const queryParams: ReservationsQueryParams = {
    pageSize,
    pageIndex,
    userId,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  };

  // Filter params for count query (without pagination params)
  const filterParams: ReservationsFilterParams = {
    userId,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  };

  // Fetch reservations with populated data for this user
  const {
    data: populatedDataResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: ["reservations-populated-for-user-admin", queryParams], // Distinguish from App user page query
    queryFn: () => fetchReservationsWithPopulatedData(queryParams),
    enabled: !!userId,
    ...CACHE_STRATEGIES.reservations,
  });

  // Fetch total count for reservations of this user
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["reservations-count-for-user-admin", filterParams], // Distinguish
    queryFn: () => getReservationsCount(filterParams),
    enabled: !!userId,
    ...CACHE_STRATEGIES.counts,
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

  // N+1 query for carsData is no longer needed as fetchReservationsWithPopulatedData handles it.
  // The `userInfo` in reservationsWithData will be populated by the service.
  // It should match the `user` object fetched by `fetchUserById`.

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
      // Invalidate the new populated query and the count query for this user
      queryClient.invalidateQueries({ queryKey: ["reservations-populated-for-user-admin", queryParams] });
      queryClient.invalidateQueries({ queryKey: ["reservations-count-for-user-admin", filterParams] });
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

  const getStatusVariant = (suspended: boolean) => {
    return suspended ? "destructive" : "success";
  };

  const getRoleVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary";
  };

  const columns = createUserDetailsReservationColumns({
    t,
    onStatusChange: handleStatusChange,
    onEdit: handleEditReservation,
    isUpdatingStatus: statusMutation.isPending,
  });

  // isLoading now depends on userLoading, reservationsLoading (which includes cars), and countLoading.
  const isLoading = userLoading || reservationsLoading || countLoading;
  // Prioritize userError for the page, then reservationsError.
  const displayError = userError || reservationsError || (countError && !reservationsWithData.length ? countError : null);


  const handleRetry = () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["reservations-populated-for-user-admin", queryParams] });
      queryClient.invalidateQueries({ queryKey: ["reservations-count-for-user-admin", filterParams] });
    } else {
      window.location.reload(); // Fallback
    }
  };

  if (displayError && (!user || !reservationsWithData.length)) {
    return (
      <>
        <SectionHeader
          title={t("users.userDetails")}
          subtitle={t("users.userDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <ErrorDisplay
            error={displayError}
            onRetry={handleRetry}
            title={t("users.errorLoadingUserDetails")}
            description={t(
              "users.errorLoadingUserDetailsDescription",
              "Unable to load user details. Please try again."
            )}
            homePath="/admin/users"
          />
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
            <p>{t("users.userNotFound")}</p>
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
      />

      <div className="px-4 lg:px-6 space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("users.userInformation")}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditUserOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t("common.edit")}
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("users.name")}
                </p>
                <p className="text-sm">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("users.email")}
                </p>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("users.phone")}
                </p>
                <p className="text-sm">
                  {user.phone || t("common.notProvided")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("users.role")}
                </p>
                <Badge variant={getRoleVariant(user.role)}>
                  {t(`users.roles.${user.role}`)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("users.status")}
                </p>
                <Badge variant={getStatusVariant(user.suspended)}>
                  {user.suspended ? t("users.suspended") : t("users.active")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {t("users.userReservations")}
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
      </div>

      {/* Edit User Dialog */}
      {editUserOpen && (
        <UserFormDialog
          open={editUserOpen}
          onOpenChange={setEditUserOpen}
          user={user}
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
    </>
  );
}
