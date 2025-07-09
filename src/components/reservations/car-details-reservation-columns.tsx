"use client";

import { ArrowUpDown, Edit, Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import type { ReservationStatus } from "@/types/reservation";
import type { ReservationWithCarAndUser } from "@/components/reservations/admin-reservations-columns";
import { StatusSelect } from "@/components/ui/status-select";
import { format, getLocalizedFormats } from "@/lib/date-locale";

interface CreateCarDetailsReservationColumnsProps {
  onStatusChange: (
    reservation: ReservationWithCarAndUser,
    status: ReservationStatus
  ) => void;
  onEdit?: (reservation: ReservationWithCarAndUser) => void;
  isUpdatingStatus?: boolean;
  t: (key: string, options?: Record<string, string>) => string;
}

export function createCarDetailsReservationColumns({
  onStatusChange,
  onEdit,
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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("table.userName")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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
      sortingFn: (rowA, rowB) => {
        const userA = rowA.original.userInfo;
        const userB = rowB.original.userInfo;
        if (!userA?.name) return 1;
        if (!userB?.name) return -1;
        return userA.name.localeCompare(userB.name);
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
            {t("table.start")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const startDate = row.getValue("startDateTime") as Date;
        return (
          <div className="text-sm">
            {format(startDate, getLocalizedFormats().dateShort)}
            <br />
            <span className="text-muted-foreground">
              {format(startDate, getLocalizedFormats().time)}
            </span>
          </div>
        );
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
            {t("table.end")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const endDate = row.getValue("endDateTime") as Date;
        return (
          <div className="text-sm">
            {format(endDate, getLocalizedFormats().dateShort)}
            <br />
            <span className="text-muted-foreground">
              {format(endDate, getLocalizedFormats().time)}
            </span>
          </div>
        );
      },
      sortingFn: "datetime",
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
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
