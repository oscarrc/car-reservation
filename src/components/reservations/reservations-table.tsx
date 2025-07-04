"use client";

import * as React from "react";
import { format, getLocalizedFormats } from "@/lib/date-locale";
import { Calendar as CalendarIcon, FilterX } from "lucide-react";
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
  type RowSelectionState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { TablePagination } from "@/components/ui/table-pagination";
import { ColumnSelector } from "@/components/ui/column-selector";
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
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(25);

  // Handle client-side pagination
  const paginatedData = React.useMemo(() => {
    if (!data) return [];
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, pageIndex, pageSize]);

  const totalRows = data?.length || 0;
  const totalPages = Math.ceil(totalRows / pageSize);

  // Pagination handlers
  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when changing page size
  };

  const table = useReactTable({
    data: paginatedData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    manualPagination: true,
    pageCount: totalPages,
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
      userInfo: t("table.userName"),
      carLicensePlate: t("table.carLicensePlate"),
      carInfo: t("reservations.car"),
      startDateTime: t("reservations.startDateTime"),
      endDateTime: t("reservations.endDateTime"),
      status: t("common.status"),
      driver: t("reservations.driver"),
      comments: t("reservations.comments"),
      createdAt: t("reservations.createdOn"),
      actions: t("common.actions"),
    };
    return columnMap[columnId] || columnId;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4 py-4">
        {/* Filters Section - Responsive */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => onStatusFilterChange(value as ReservationStatus | "all")}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t("reservations.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("reservations.pending")}</SelectItem>
                <SelectItem value="confirmed">{t("reservations.confirmed")}</SelectItem>
                <SelectItem value="cancelled">{t("reservations.cancelled")}</SelectItem>
                <SelectItem value="cancellation_pending">{t("reservations.cancellation_pending")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Start Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !startDateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDateFilter ? format(startDateFilter, getLocalizedFormats().dateShort) : <span>{t("reservations.startDate")}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !endDateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDateFilter ? format(endDateFilter, getLocalizedFormats().dateShort) : <span>{t("reservations.endDate")}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
                className="w-full sm:w-auto h-8 px-2 lg:px-3"
              >
                <FilterX className="mr-2 h-4 w-4" />
                {t("reservations.clearFilters")}
              </Button>
            )}
          </div>

          {/* Column Visibility - Using new component */}
          <ColumnSelector
            tableId="reservations-table"
            columns={table.getAllColumns()}
            getColumnDisplayName={getColumnDisplayName}
          />
        </div>
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

      <div className="py-4">
        <TablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}

 