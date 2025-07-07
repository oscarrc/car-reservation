import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Edit } from "lucide-react";

import { ErrorDisplay } from "@/components/ui/error-display";
import { SectionHeader } from "@/components/ui/section-header";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserFullInfoCard } from "@/components/users/user-full-info-card";
import { UserInfoSkeleton } from "@/components/users/user-info-skeleton";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import { createUserDetailsReservationColumns } from "@/components/reservations/user-details-reservation-columns";
import type { ReservationWithCarAndUser } from "@/components/reservations/user-details-reservation-columns";

import { fetchUserById } from "@/lib/users-service";
import {
  fetchReservationsWithData,
  getReservationsCount,
  updateReservationStatus,
  bulkUpdateReservationStatus,
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

  // Bulk actions state
  const [isBulkActionsLoading, setIsBulkActionsLoading] = useState(false);

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

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({
      reservationIds,
      status,
    }: {
      reservationIds: string[];
      status: ReservationStatus;
    }) => {
      setIsBulkActionsLoading(true);
      return await bulkUpdateReservationStatus(reservationIds, status);
    },
    onSuccess: (result, { status }) => {
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true,
        invalidateReservationsCount: true,
        invalidateDashboard: true,
        specificUserId: userId,
      });

      if (result.successCount > 0) {
        toast.success(
          t("reservations.bulkStatusUpdateSuccess", {
            count: result.successCount,
            status: t(`reservations.${status}`),
          })
        );
      }
      if (result.errorCount > 0) {
        toast.error(
          t("reservations.bulkStatusUpdatePartialError", {
            successCount: result.successCount,
            errorCount: result.errorCount,
          })
        );
      }

      setIsBulkActionsLoading(false);
    },
    onError: (error) => {
      console.error("Error in bulk status update:", error);
      toast.error(t("reservations.bulkStatusUpdateError"));
      setIsBulkActionsLoading(false);
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

  // Bulk action handler
  const handleBulkStatusChange = (
    reservationIds: string[],
    status: ReservationStatus
  ) => {
    if (reservationIds.length === 0) {
      toast.error(t("reservations.noReservationsSelected"));
      return;
    }

    bulkStatusMutation.mutate({ reservationIds, status });
  };

  const columns = createUserDetailsReservationColumns({
    t,
    onStatusChange: handleStatusChange,
    onEdit: handleEditReservation,
    isUpdatingStatus: statusMutation.isPending,
  });

  const isLoading = userLoading || reservationsLoading;
  const hasError = userError || reservationsError;

  // Show loading state first
  if (userLoading) {
    return (
      <>
        <SectionHeader
          title={t("users.userDetails")}
          subtitle={t("users.userDetailsSubtitle")}
        />
        <div className="px-4 lg:px-6 space-y-6">
          <UserInfoSkeleton />

          {/* Reservations Table with Loading State */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("users.userReservations")}
            </h3>
            <ReservationsTable
              columns={columns}
              data={[]}
              loading={true}
              pagination={undefined}
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
            />
          </div>
        </div>
      </>
    );
  }

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
        action={() => setEditUserOpen(true)}
        actionText={t("user.editUser")}
        actionIcon={Edit}
      />

      <div className="px-4 lg:px-6 space-y-6">
        {/* User Info Card */}
        <UserFullInfoCard user={user} />

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
            bulkActions={{
              onStatusChange: handleBulkStatusChange,
              isLoading: isBulkActionsLoading,
            }}
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
