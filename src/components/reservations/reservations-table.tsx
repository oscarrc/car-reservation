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
import { BulkActions, createReservationBulkActions } from "@/components/ui/bulk-actions";
import { BulkConfirmationDialog } from "@/components/ui/bulk-confirmation-dialog";
import { cn } from "@/lib/utils";
import type { ReservationWithId, ReservationStatus } from "@/types/reservation";

interface ReservationsTableProps {
  columns: ColumnDef<ReservationWithId>[];
  data: ReservationWithId[];
  loading?: boolean;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onStatusFilterChange: (status: ReservationStatus | "all") => void;
  onStartDateFilterChange: (date: Date | undefined) => void;
  onEndDateFilterChange: (date: Date | undefined) => void;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onFirstPage?: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onLastPage?: () => void;
  statusFilter: ReservationStatus | "all";
  startDateFilter: Date | undefined;
  endDateFilter: Date | undefined;
  countError?: Error | null;
  countLoading?: boolean;
  // Bulk actions
  bulkActions?: {
    onCancel?: (reservationIds: string[]) => void;
    onStatusChange?: (reservationIds: string[], status: ReservationStatus) => void;
    isLoading?: boolean;
    autoCancelation?: boolean;
  };
}

export function ReservationsTable({
  columns,
  data,
  loading = false,
  pagination,
  onStatusFilterChange,
  onStartDateFilterChange,
  onEndDateFilterChange,
  onPageChange,
  onPageSizeChange,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
  statusFilter,
  startDateFilter,
  endDateFilter,
  countError,
  countLoading,
  bulkActions,
}: ReservationsTableProps) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  
  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    action: any;
  }>({
    open: false,
    action: null,
  });

  // Use provided pagination or fallback to defaults
  const pageIndex = pagination?.pageIndex || 0;
  const pageSize = pagination?.pageSize || 25;
  const totalRows = pagination?.totalCount || data?.length || 0;

  // Pagination handlers
  const handlePageChange = (newPageIndex: number) => {
    if (onPageChange) {
      onPageChange(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };

  const table = useReactTable({
    data: data || [],
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
    pageCount: Math.ceil(totalRows / pageSize),
  });

  const clearFilters = () => {
    onStatusFilterChange("all");
    onStartDateFilterChange(undefined);
    onEndDateFilterChange(undefined);
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    startDateFilter !== undefined ||
    endDateFilter !== undefined;

  // Bulk action handlers
  const handleBulkCancel = () => {
    if (!bulkActions?.onCancel) return;
    
    const selectedReservations = table.getFilteredSelectedRowModel().rows;
    const reservationIds = selectedReservations.map(row => row.original.id);
    
    if (reservationIds.length === 0) return;
    
    bulkActions.onCancel(reservationIds);
  };

  // Handle bulk action clicks with confirmation
  const handleBulkActionClick = (action: any) => {
    if (action.requiresConfirmation) {
      setConfirmationDialog({
        open: true,
        action,
      });
    } else {
      action.onClick();
    }
  };

  // Handle confirmation dialog confirm
  const handleConfirmAction = () => {
    if (confirmationDialog.action) {
      confirmationDialog.action.onClick();
      setConfirmationDialog({ open: false, action: null });
    }
  };

  const handleBulkStatusChange = (status: ReservationStatus) => {
    if (!bulkActions?.onStatusChange) return;
    
    const selectedReservations = table.getFilteredSelectedRowModel().rows;
    const reservationIds = selectedReservations.map(row => row.original.id);
    
    if (reservationIds.length === 0) return;
    
    bulkActions.onStatusChange(reservationIds, status);
  };

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
              onValueChange={(value) =>
                onStatusFilterChange(value as ReservationStatus | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t("reservations.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="pending">
                  {t("reservations.pending")}
                </SelectItem>
                <SelectItem value="confirmed">
                  {t("reservations.confirmed")}
                </SelectItem>
                <SelectItem value="cancelled">
                  {t("reservations.cancelled")}
                </SelectItem>
                <SelectItem value="cancellation_pending">
                  {t("reservations.cancellation_pending")}
                </SelectItem>
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
                  {startDateFilter ? (
                    format(startDateFilter, getLocalizedFormats().dateShort)
                  ) : (
                    <span>{t("reservations.startDate")}</span>
                  )}
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
                  {endDateFilter ? (
                    format(endDateFilter, getLocalizedFormats().dateShort)
                  ) : (
                    <span>{t("reservations.endDate")}</span>
                  )}
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

          {/* Bulk Actions and Column Visibility */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
            {bulkActions && (
              <BulkActions
                selectedCount={table.getFilteredSelectedRowModel().rows.length}
                isLoading={bulkActions.isLoading}
                onActionClick={handleBulkActionClick}
                {...createReservationBulkActions(
                  t,
                  bulkActions.onCancel ? handleBulkCancel : undefined,
                  bulkActions.onStatusChange ? handleBulkStatusChange : undefined,
                  bulkActions.isLoading,
                  bulkActions.autoCancelation
                )}
              />
            )}
            
            <ColumnSelector
              tableId="reservations-table"
              columns={table.getAllColumns()}
              getColumnDisplayName={getColumnDisplayName}
            />
          </div>
        </div>
      </div>

      {/* Bulk Confirmation Dialog */}
      <BulkConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open) => setConfirmationDialog({ open, action: confirmationDialog.action })}
        onConfirm={handleConfirmAction}
        title={
          typeof confirmationDialog.action?.confirmationTitle === 'function'
            ? confirmationDialog.action.confirmationTitle(table.getFilteredSelectedRowModel().rows.length)
            : confirmationDialog.action?.confirmationTitle || ""
        }
        description={
          typeof confirmationDialog.action?.confirmationDescription === 'function'
            ? confirmationDialog.action.confirmationDescription(table.getFilteredSelectedRowModel().rows.length)
            : confirmationDialog.action?.confirmationDescription || ""
        }
        confirmText={
          typeof confirmationDialog.action?.confirmText === 'function'
            ? confirmationDialog.action.confirmText(table.getFilteredSelectedRowModel().rows.length)
            : confirmationDialog.action?.confirmText
        }
        isLoading={bulkActions?.isLoading}
      />

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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="relative">
                      <div className="w-8 h-8 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {t("loading.loadingReservations")}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  {t("reservations.noReservationsFound")}
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
          totalRows={countError ? 0 : totalRows}
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onFirstPage={onFirstPage}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onLastPage={onLastPage}
          countError={countError}
          countLoading={countLoading}
        />
      </div>
    </div>
  );
}
