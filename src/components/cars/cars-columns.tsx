"use client";

import type { CarStatus, CarWithId } from "@/types/car";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
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
import { Link } from "react-router-dom";

interface CreateCarColumnsProps {
  onEditCar: (car: CarWithId) => void;
  onDeleteCar?: (car: CarWithId) => void;
  onStatusChange: (carId: string, status: CarStatus) => void;
  isUpdatingStatus: boolean;
  t: (key: string, options?: Record<string, string>) => string;
}

export function createCarColumns({
  onEditCar,
  onDeleteCar,
  onStatusChange,
  isUpdatingStatus,
  t,
}: CreateCarColumnsProps): ColumnDef<CarWithId>[] {
  const getStatusVariant = (status: CarStatus) => {
    switch (status) {
      case "available":
        return "success";
      case "maintenance":
        return "warning";
      case "out_of_service":
        return "error";
      default:
        return "warning";
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
      accessorKey: "licensePlate",
      header: t("fleet.licensePlate"),
      cell: ({ row }) => (
        <div className="font-mono font-medium">
          {row.getValue("licensePlate")}
        </div>
      ),
    },
    {
      accessorKey: "model",
      header: t("fleet.model"),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("model")}</div>
      ),
    },
    {
      accessorKey: "year",
      header: t("fleet.year"),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("year") || "-"}</div>
      ),
    },
    {
      accessorKey: "color",
      header: t("fleet.color"),
      cell: ({ row }) => {
        const color = row.getValue("color") as string;
        const translatedColor = t(`fleet.colors.${color}`, {
          defaultValue: color,
        });
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: color.toLowerCase() }}
            />
            <span>{translatedColor}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "seats",
      header: t("fleet.seats"),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("seats")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: t("common.status"),
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
                <Badge variant={getStatusVariant("available")}>
                  {t("fleet.available")}
                </Badge>
              </SelectItem>
              <SelectItem value="maintenance">
                <Badge variant={getStatusVariant("maintenance")}>
                  {t("fleet.maintenance")}
                </Badge>
              </SelectItem>
              <SelectItem value="out_of_service">
                <Badge variant={getStatusVariant("out_of_service")}>
                  {t("fleet.out_of_service")}
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
                <span className="sr-only">{t("table.openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={`/admin/fleet/${car.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("fleet.carDetails")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEditCar(car)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("fleet.editCar")}
              </DropdownMenuItem>
              {onDeleteCar && <DropdownMenuSeparator />}
              {onDeleteCar && (
                <DropdownMenuItem
                  onClick={() => onDeleteCar(car)}
                  className="cursor-pointer text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("fleet.deleteCar")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
