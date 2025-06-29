import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      toast.success("Status updated", {
        description: `Reservation status changed to ${statusLabel}`,
      });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (error) => {
      console.error("Error updating reservation status:", error);
      toast.error("Failed to update status", {
        description: "Please try again or contact support if the problem persists.",
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
          title="Reservations"
          subtitle="Manage car reservations and bookings"
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">Error loading reservations. Please try again.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title="Reservations"
        subtitle="Manage car reservations and bookings"
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
