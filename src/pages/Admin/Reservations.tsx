import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/ui/section-header";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { createColumns } from "@/components/reservations/reservations-columns";
import {
  fetchReservations,
  updateReservationStatus,
  type ReservationsQueryParams,
} from "@/lib/reservations-service";
import type { ReservationWithId, ReservationStatus } from "@/types/reservation";

export default function ReservationsPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const queryClient = useQueryClient();

  const queryParams: ReservationsQueryParams = {
    pageSize: 50,
    statusFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  };

  const {
    data: reservationsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reservations", queryParams],
    queryFn: () => fetchReservations(queryParams),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ reservationId, status }: { reservationId: string; status: ReservationStatus }) =>
      updateReservationStatus(reservationId, status),
    onSuccess: (_, { status }) => {
      toast.success(t("reservations.statusUpdated"), {
        description: t("reservations.statusUpdatedDesc", { 
          status: t(`reservations.${status}`) 
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (error) => {
      console.error("Error updating reservation status:", error);
      toast.error(t("reservations.failedToUpdateStatus"), {
        description: t("common.retry"),
      });
    },
  });

  const handleStatusChange = (reservation: ReservationWithId, status: ReservationStatus) => {
    if (status === reservation.status) return;
    
    updateStatusMutation.mutate({
      reservationId: reservation.id,
      status,
    });
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

  const columns = createColumns({
    onStatusChange: handleStatusChange,
  });

  const reservations = reservationsResponse?.reservations || [];

  if (error) {
    return (
      <>
        <SectionHeader
          title={t("reservations.management")}
          subtitle={t("reservations.subtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">{t("reservations.errorLoadingReservations")}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("reservations.management")}
        subtitle={t("reservations.subtitle")}
      />
      
      <div className="px-4 lg:px-6">
        <ReservationsTable
          columns={columns}
          data={reservations}
          loading={isLoading}
          onStatusFilterChange={handleStatusFilterChange}
          onStartDateFilterChange={handleStartDateFilterChange}
          onEndDateFilterChange={handleEndDateFilterChange}
          statusFilter={statusFilter}
          startDateFilter={startDateFilter}
          endDateFilter={endDateFilter}
        />
      </div>
    </>
  );
}
