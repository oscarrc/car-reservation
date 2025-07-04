"use client";

import type { ReservationStatus, ReservationWithId } from "@/types/reservation";

import type { CarWithId } from "@/types/car";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusSelect } from "@/components/ui/status-select";
import type { UserProfileWithId } from "@/lib/users-service";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Extended reservation type with car and user information
export interface ReservationWithCarAndUser extends ReservationWithId {
  carInfo?: CarWithId;
  userInfo?: UserProfileWithId;
  userEmail?: string;
}

interface CreateUserDetailsReservationColumnsProps {
  onStatusChange: (
    reservation: ReservationWithCarAndUser,
    status: ReservationStatus
  ) => void;
  isUpdatingStatus?: boolean;
  t: (key: string) => string;
}

export function createUserDetailsReservationColumns({
  onStatusChange,
  isUpdatingStatus,
  t,
}: CreateUserDetailsReservationColumnsProps): ColumnDef<ReservationWithCarAndUser>[] {
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
      accessorKey: "carInfo",
      header: t("reservations.car"),
      cell: ({ row }) => {
        const carInfo = row.getValue("carInfo") as CarWithId;
        if (!carInfo) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium">{carInfo.model}</span>
            <span className="text-sm text-muted-foreground">
              {carInfo.licensePlate}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "startDateTime",
      header: t("reservations.startDateTime"),
      cell: ({ row }) => {
        const date = row.getValue("startDateTime") as Date;
        return (
          <div className="text-sm">
            {format(date, "MMM dd, yyyy")}
            <br />
            <span className="text-muted-foreground">
              {format(date, "HH:mm")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "endDateTime",
      header: t("reservations.endDateTime"),
      cell: ({ row }) => {
        const date = row.getValue("endDateTime") as Date;
        return (
          <div className="text-sm">
            {format(date, "MMM dd, yyyy")}
            <br />
            <span className="text-muted-foreground">
              {format(date, "HH:mm")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => t("common.status"),
      cell: ({ row }) => {
        const reservation = row.original;
        const status = row.getValue("status") as ReservationStatus;

        return (
          <StatusSelect
            value={status}
            onValueChange={(newStatus) =>
              onStatusChange(reservation, newStatus as ReservationStatus)
            }
            t={t}
            disabled={isUpdatingStatus}
          />
        );
      },
    },
    {
      accessorKey: "driver",
      header: t("reservations.driver"),
      cell: ({ row }) => {
        const driver = row.getValue("driver") as string;
        return driver || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "comments",
      header: t("reservations.comments"),
      cell: ({ row }) => {
        const comments = row.getValue("comments") as string;
        return comments ? (
          <span className="max-w-[200px] truncate" title={comments}>
            {comments}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("reservations.createdOn"),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(date, "MMM dd, yyyy");
      },
    },
    {
      id: "actions",
      header: () => t("common.actions"),
      cell: ({ row }) => {
        const reservation = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("common.actions")}</span>
                <Eye className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/admin/reservations/${reservation.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("reservations.viewDetails")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
