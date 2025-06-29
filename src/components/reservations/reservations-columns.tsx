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
import { format } from "date-fns";

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

const statusLabels: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export const createColumns = ({
  onStatusChange,
}: ColumnsProps): ColumnDef<ReservationWithId>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
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
          Name
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
          Car
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
          Start
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const startDateTime = row.getValue("startDateTime") as Date;
      return (
        <div className="text-sm">
          <div className="font-medium">
            {format(startDateTime, "MMM dd, yyyy")}
          </div>
          <div className="text-muted-foreground">
            {format(startDateTime, "HH:mm")}
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
          End
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const endDateTime = row.getValue("endDateTime") as Date;
      return (
        <div className="text-sm">
          <div className="font-medium">
            {format(endDateTime, "MMM dd, yyyy")}
          </div>
          <div className="text-muted-foreground">
            {format(endDateTime, "HH:mm")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
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
                {statusLabels[currentStatus]}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              <Badge variant={getStatusVariant("pending")}>
                Pending
              </Badge>
            </SelectItem>
            <SelectItem value="confirmed">
              <Badge variant={getStatusVariant("confirmed")}>
                Confirmed
              </Badge>
            </SelectItem>
            <SelectItem value="cancelled">
              <Badge variant={getStatusVariant("cancelled")}>
                Cancelled
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
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            Reservation details
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Edit reservation
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Cancel reservation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
 