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
import type { ReservationWithCarAndUser } from "@/components/reservations/user-details-reservation-columns";

import { fetchUserById } from "@/lib/users-service";
import {
  fetchReservationsWithData,
  getReservationsCount,
  updateReservationStatus,
  type ReservationsQueryParams,
  type ReservationsFilterParams,
} from "@/lib/reservations-service";
import { invalidateReservationQueries } from "@/lib/query-utils";
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

  const {
    data: reservationsResponse,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: [
      "userReservationsWithData",
      userId,
      statusFilter,
      startDateFilter,
      endDateFilter,
      pageIndex,
      pageSize,
    ],
    queryFn: () => fetchReservationsWithData(queryParams),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes - reduce refetches for performance
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["userReservations", "count", userId, pageSize, filterParams],
    queryFn: () => getReservationsCount(filterParams),
    enabled: !!userId,
  });

  const reservationsWithData = reservationsResponse?.reservations || [];

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
      // Use utility for targeted invalidation
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true, // Update admin list
        invalidateReservationsCount: true, // Update global count  
        invalidateDashboard: true, // Status changes affect dashboard
        specificUserId: userId,
      });
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

  const isLoading = userLoading || reservationsLoading;
  const hasError = userError || reservationsError;

  if (hasError) {
    return (
      <>
        <SectionHeader
          title={t("users.userDetails")}
          subtitle={t("users.userDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6">
          <ErrorDisplay
            error={hasError}
            onRetry={() => window.location.reload()}
            title={t("users.errorLoadingUserDetails")}
            description={t("users.errorLoadingUserDetailsDescription")}
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
