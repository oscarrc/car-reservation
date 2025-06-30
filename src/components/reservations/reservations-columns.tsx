"use client";

import { ArrowUpDown, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReservationStatus, ReservationWithId } from "@/types/reservation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { format, getLocalizedFormats } from "@/lib/date-locale";

interface ColumnsProps {
  onStatusChange: (
    reservation: ReservationWithId,
    status: ReservationStatus
  ) => void;
}

const getStatusVariant = (status: ReservationStatus) => {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "warning";
  }
};

export const createColumns = ({
  onStatusChange,
}: ColumnsProps): ColumnDef<ReservationWithId>[] => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();

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
      accessorKey: "userName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("table.name")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const reservation = row.original;
        return (
          <button
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            onClick={() => {
              // Navigate to user details - will implement later
              console.log(`Navigate to /admin/users/${reservation.userId}`);
            }}
          >
            {reservation.userName}
          </button>
        );
      },
    },
    {
      accessorKey: "carLicensePlate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("table.car")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const reservation = row.original;
        return (
          <button
            className="text-blue-600 hover:text-blue-800 hover:underline font-mono font-medium"
            onClick={() => {
              // Navigate to car details - will implement later
              console.log(`Navigate to /admin/fleet/${reservation.carId}`);
            }}
          >
            {reservation.carLicensePlate}
          </button>
        );
      },
    },
    {
      accessorKey: "startDateTime",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("table.start")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const startDateTime = row.getValue("startDateTime") as Date;
        const formats = getLocalizedFormats();
        
        return (
          <div className="text-sm">
            <div className="font-medium">
              {format(startDateTime, formats.dayMonth)}
            </div>
            <div className="text-muted-foreground">
              {format(startDateTime, formats.time)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "endDateTime",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("table.end")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const endDateTime = row.getValue("endDateTime") as Date;
        const formats = getLocalizedFormats();
        
        return (
          <div className="text-sm">
            <div className="font-medium">
              {format(endDateTime, formats.dayMonth)}
            </div>
            <div className="text-muted-foreground">
              {format(endDateTime, formats.time)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("table.status"),
      cell: ({ row }) => {
        const reservation = row.original;
        const currentStatus = reservation.status;

        return (
          <Select
            value={currentStatus}
            onValueChange={(value) =>
              onStatusChange(reservation, value as ReservationStatus)
            }
          >
            <SelectTrigger className="w-[130px] border-0 focus:ring-0 h-8">
              <SelectValue>
                <Badge variant={getStatusVariant(currentStatus)}>
                  {t(`reservations.${currentStatus}`)}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <Badge variant={getStatusVariant("pending")}>
                  {t("reservations.pending")}
                </Badge>
              </SelectItem>
              <SelectItem value="confirmed">
                <Badge variant={getStatusVariant("confirmed")}>
                  {t("reservations.confirmed")}
                </Badge>
              </SelectItem>
              <SelectItem value="cancelled">
                <Badge variant={getStatusVariant("cancelled")}>
                  {t("reservations.cancelled")}
                </Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("table.openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("table.actions")}</DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              {t("table.reservationDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              {t("table.editReservation")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              {t("table.cancelReservation")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
};
