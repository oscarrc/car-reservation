"use client";

import type { CarStatus, CarWithId } from "@/types/car";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
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

interface CreateColumnsProps {
  onEditCar: (car: CarWithId) => void;
  onDeleteCar?: (car: CarWithId) => void;
  onStatusChange: (carId: string, status: CarStatus) => void;
  isUpdatingStatus: boolean;
}

export function createColumns({
  onEditCar,
  onDeleteCar,
  onStatusChange,
  isUpdatingStatus,
}: CreateColumnsProps): ColumnDef<CarWithId>[] {
  const getStatusVariant = (status: CarStatus) => {
    switch (status) {
      case "available":
        return "default";
      case "maintenance":
        return "secondary";
      case "out_of_service":
        return "destructive";
      default:
        return "secondary";
    }
  };

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
      accessorKey: "licensePlate",
      header: "License Plate",
      cell: ({ row }) => (
        <div className="font-mono font-medium">
          {row.getValue("licensePlate")}
        </div>
      ),
    },
    {
      accessorKey: "model",
      header: "Model",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("model")}</div>
      ),
    },
    {
      accessorKey: "color",
      header: "Color",
      cell: ({ row }) => {
        const color = row.getValue("color") as string;
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: color.toLowerCase() }}
            />
            <span className="capitalize">{color}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "seats",
      header: "Seats",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("seats")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const car = row.original;
        const status = row.getValue("status") as CarStatus;

        return (
          <Select
            value={status}
            onValueChange={(newStatus: CarStatus) =>
              onStatusChange(car.id, newStatus)
            }
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="border-0 h-8 w-auto p-1 focus:ring-0 focus:ring-offset-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">
                <Badge variant={getStatusVariant("available")}>Available</Badge>
              </SelectItem>
              <SelectItem value="maintenance">
                <Badge variant={getStatusVariant("maintenance")}>
                  Maintenance
                </Badge>
              </SelectItem>
              <SelectItem value="out_of_service">
                <Badge variant={getStatusVariant("out_of_service")}>
                  Out of Service
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
      cell: ({ row }) => {
        const car = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEditCar(car)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {onDeleteCar && (
                <DropdownMenuItem
                  onClick={() => onDeleteCar(car)}
                  className="cursor-pointer text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
