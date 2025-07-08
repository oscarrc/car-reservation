"use client";

import { ArrowUpDown, Edit, Eye, Trash2 } from "lucide-react";
import type { ReservationStatus, ReservationWithId } from "@/types/reservation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, getLocalizedFormats } from "@/lib/date-locale";

import { Button } from "@/components/ui/button";
import type { CarWithId } from "@/types/car";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
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
  onEdit,
  onDelete,
  isUpdatingStatus,
  t,
}: {
  onStatusChange: (
    reservation: ReservationWithCarAndUser,
    status: ReservationStatus
  ) => void;
  onEdit?: (reservation: ReservationWithCarAndUser) => void;
  onDelete?: (reservation: ReservationWithCarAndUser) => void;
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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("table.user")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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
      sortingFn: (rowA, rowB) => {
        const userA = rowA.getValue("userInfo") as UserProfileWithId;
        const userB = rowB.getValue("userInfo") as UserProfileWithId;
        if (!userA?.name) return 1;
        if (!userB?.name) return -1;
        return userA.name.localeCompare(userB.name);
      },
    },
    {
      accessorKey: "carInfo",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("reservations.car")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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
      sortingFn: (rowA, rowB) => {
        const carA = rowA.getValue("carInfo") as CarWithId;
        const carB = rowB.getValue("carInfo") as CarWithId;
        if (!carA?.model) return 1;
        if (!carB?.model) return -1;
        return carA.model.localeCompare(carB.model);
      },
    },
    {
      accessorKey: "startDateTime",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("reservations.startDateTime")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("startDateTime") as Date;
        return format(date, getLocalizedFormats().dateTime);
      },
      sortingFn: "datetime",
    },
    {
      accessorKey: "endDateTime",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("reservations.endDateTime")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("endDateTime") as Date;
        return format(date, getLocalizedFormats().dateTime);
      },
      sortingFn: "datetime",
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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("reservations.driver")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const driver = row.getValue("driver") as string;
        return driver || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "comments",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("reservations.comments")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("reservations.createdOn")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(date, getLocalizedFormats().dateShort);
      },
      sortingFn: "datetime",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const reservation = row.original;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <Link to={`/admin/reservations/${reservation.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">
                      {t("reservations.viewDetails")}
                    </span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("reservations.viewDetails")}</p>
              </TooltipContent>
            </Tooltip>

            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(reservation)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">
                      {t("reservations.editDetails")}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("reservations.editDetails")}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(reservation)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">
                      {t("reservations.deleteReservation")}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("reservations.deleteReservation")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
