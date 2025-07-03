"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReservationStatus } from "@/types/reservation";
import type { ReservationWithCarAndUser } from "@/components/reservations/admin-reservations-columns";
import { StatusSelect } from "@/components/ui/status-select";
import { format } from "date-fns";

interface CreateCarDetailsReservationColumnsProps {
  onStatusChange: (
    reservation: ReservationWithCarAndUser,
    status: ReservationStatus
  ) => void;
  isUpdatingStatus?: boolean;
  t: (key: string, options?: Record<string, string>) => string;
}

export function createCarDetailsReservationColumns({
  onStatusChange,
  isUpdatingStatus,
  t,
}: CreateCarDetailsReservationColumnsProps): ColumnDef<ReservationWithCarAndUser>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("table.selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("table.selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "userInfo.name",
      header: t("table.userName"),
      cell: ({ row }) => {
        const userInfo = row.original.userInfo;
        return userInfo ? (
          <div className="font-medium">{userInfo.name}</div>
        ) : (
          <div className="text-muted-foreground">
            {t("reservations.userNotFound")}
          </div>
        );
      },
    },
    {
      accessorKey: "startDateTime",
      header: t("table.start"),
      cell: ({ row }) => {
        const startDate = row.getValue("startDateTime") as Date;
        return (
          <div className="text-sm">
            {format(startDate, "MMM dd, yyyy")}
            <br />
            <span className="text-muted-foreground">
              {format(startDate, "HH:mm")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "endDateTime",
      header: t("table.end"),
      cell: ({ row }) => {
        const endDate = row.getValue("endDateTime") as Date;
        return (
          <div className="text-sm">
            {format(endDate, "MMM dd, yyyy")}
            <br />
            <span className="text-muted-foreground">
              {format(endDate, "HH:mm")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("table.status"),
      cell: ({ row }) => {
        const reservation = row.original;
        const status = row.getValue("status") as ReservationStatus;

        return (
          <StatusSelect
            value={status}
            onValueChange={(newStatus: ReservationStatus) =>
              onStatusChange(reservation, newStatus)
            }
            t={t}
            triggerClassName="border-0 h-8 w-auto p-1 focus:ring-0 focus:ring-offset-0 shadow-none"
            showValue={false}
            disabled={isUpdatingStatus}
          />
        );
      },
    },
  ];
}
