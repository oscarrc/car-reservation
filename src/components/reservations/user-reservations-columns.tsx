"use client";

import { format, getLocalizedFormats } from "@/lib/date-locale";
import { MoreHorizontal, Eye, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReservationWithId, ReservationStatus } from "@/types/reservation";
import type { CarWithId } from "@/types/car";
import type { UserProfileWithId } from "@/lib/users-service";

// Extended reservation type with car and user information
export interface ReservationWithCarAndUser extends ReservationWithId {
  carInfo?: CarWithId;
  userInfo?: UserProfileWithId;
  userEmail?: string;
}

// Helper function to get status variant
const getStatusVariant = (status: ReservationStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "pending":
      return "outline";
    case "confirmed":
      return "default";
    case "cancelled":
      return "destructive";
    case "cancellation_pending":
      return "secondary";
    default:
      return "outline";
  }
};

// User columns for user reservations page
export function createUserColumns({
  onView,
  onCancel,
  t,
}: {
  onView?: (reservation: ReservationWithCarAndUser) => void;
  onCancel?: (reservation: ReservationWithCarAndUser) => void;
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
            <span className="text-sm text-muted-foreground">{carInfo.licensePlate}</span>
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
        const status = row.getValue("status") as ReservationStatus;

        return (
          <Badge variant={getStatusVariant(status)}>
            {t(`reservations.${status}`)}
          </Badge>
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
        const canCancel = ["pending", "confirmed"].includes(reservation.status);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("common.actions")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(reservation)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("reservations.viewDetails")}
                </DropdownMenuItem>
              )}
              {onCancel && canCancel && (
                <>
                  {onView && <DropdownMenuSeparator />}
                  <DropdownMenuItem 
                    onClick={() => onCancel(reservation)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t("reservations.cancelReservation")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
} 