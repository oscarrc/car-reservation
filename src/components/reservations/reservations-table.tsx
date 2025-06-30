"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FilterX, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReservationWithId, ReservationStatus } from "@/types/reservation";

interface ReservationsTableProps {
  columns: ColumnDef<ReservationWithId>[];
  data: ReservationWithId[];
  loading?: boolean;
  onStatusFilterChange: (status: ReservationStatus | "all") => void;
  onStartDateFilterChange: (date: Date | undefined) => void;
  onEndDateFilterChange: (date: Date | undefined) => void;
  statusFilter: ReservationStatus | "all";
  startDateFilter: Date | undefined;
  endDateFilter: Date | undefined;
}

export function ReservationsTable({ 
  columns, 
  data, 
  loading = false,
  onStatusFilterChange,
  onStartDateFilterChange,
  onEndDateFilterChange,
  statusFilter,
  startDateFilter,
  endDateFilter,
}: ReservationsTableProps) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  });

  const clearFilters = () => {
    onStatusFilterChange("all");
    onStartDateFilterChange(undefined);
    onEndDateFilterChange(undefined);
  };

  const hasActiveFilters = statusFilter !== "all" || startDateFilter !== undefined || endDateFilter !== undefined;

  // Function to get translated column name
  const getColumnDisplayName = (columnId: string) => {
    const columnMap: Record<string, string> = {
      select: t("table.selectAll"),
      userName: t("table.userName"),
      carLicensePlate: t("table.carLicensePlate"),
      startDateTime: t("reservations.startDate"),
      endDateTime: t("reservations.endDate"),
      status: t("common.status"),
      actions: t("common.actions"),
    };
    return columnMap[columnId] || columnId;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusFilterChange(value as ReservationStatus | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("reservations.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
              <SelectItem value="pending">{t("reservations.pending")}</SelectItem>
              <SelectItem value="confirmed">{t("reservations.confirmed")}</SelectItem>
              <SelectItem value="cancelled">{t("reservations.cancelled")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Start Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !startDateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDateFilter ? format(startDateFilter, "PPP") : <span>{t("reservations.startDate")}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDateFilter}
                onSelect={onStartDateFilterChange}
              />
            </PopoverContent>
          </Popover>

          {/* End Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !endDateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDateFilter ? format(endDateFilter, "PPP") : <span>{t("reservations.endDate")}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDateFilter}
                onSelect={onEndDateFilterChange}
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-8 px-2 lg:px-3"
            >
              <FilterX className="mr-2 h-4 w-4" />
              {t("reservations.clearFilters")}
            </Button>
          )}
        </div>

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {t("table.columns")} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {getColumnDisplayName(column.id)}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {loading ? t("loading.loadingReservations") : t("reservations.noReservationsFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} {t("common.of")}{" "}
          {table.getFilteredRowModel().rows.length} {t("common.selected")}.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}

 