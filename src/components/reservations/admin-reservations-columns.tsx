"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import type { ReservationStatus, ReservationWithId } from "@/types/reservation";
import { format, getLocalizedFormats } from "@/lib/date-locale";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { CarWithId } from "@/types/car";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusSelect } from "@/components/ui/status-select";
import type { UserProfileWithId } from "@/lib/users-service";

// Extended reservation type with car and user information
export interface ReservationWithCarAndUser extends ReservationWithId {
  carInfo?: CarWithId;
  userInfo?: UserProfileWithId;
  userEmail?: string;
}

// Admin columns for admin reservations page
export function createAdminColumns({
  onStatusChange,
  isUpdatingStatus,
  t,
}: {
  onStatusChange: (
    reservation: ReservationWithCarAndUser,
    status: ReservationStatus
  ) => void;
  isUpdatingStatus?: boolean;
  t: (key: string) => string;
}): ColumnDef<ReservationWithCarAndUser>[] {
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
      accessorKey: "userInfo",
      header: () => t("table.user"),
      cell: ({ row }) => {
        const userInfo = row.getValue("userInfo") as UserProfileWithId;
        if (!userInfo) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium">{userInfo.name}</span>
            <span className="text-sm text-muted-foreground">
              {userInfo.email}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "carInfo",
      header: () => t("reservations.car"),
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
      header: () => t("reservations.startDateTime"),
      cell: ({ row }) => {
        const date = row.getValue("startDateTime") as Date;
        return format(date, getLocalizedFormats().dateTime);
      },
    },
    {
      accessorKey: "endDateTime",
      header: () => t("reservations.endDateTime"),
      cell: ({ row }) => {
        const date = row.getValue("endDateTime") as Date;
        return format(date, getLocalizedFormats().dateTime);
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
      header: () => t("reservations.driver"),
      cell: ({ row }) => {
        const driver = row.getValue("driver") as string;
        return driver || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "comments",
      header: () => t("reservations.comments"),
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
      header: () => t("reservations.createdOn"),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(date, getLocalizedFormats().dateShort);
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
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={`/admin/reservations/${reservation.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("reservations.viewDetails")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                {t("reservations.editDetails")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t("reservations.deleteReservation")}
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
