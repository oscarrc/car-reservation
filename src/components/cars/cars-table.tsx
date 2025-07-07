"use client";

import * as React from "react";

import type { CarStatus, CarWithId } from "@/types/car";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchCars,
  getCarsCount,
  searchCars,
  updateCarStatus,
  bulkUpdateCarStatus,
  bulkDeleteCars,
  type PaginationCursor,
  type CarsFilterParams,
} from "@/lib/cars-service";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateCarQueries } from "@/lib/query-utils";
import { queryConfig } from "@/lib/query-config";
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch";

import { ColumnSelector } from "@/components/ui/column-selector";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import { BulkActions, createCarBulkActions } from "@/components/ui/bulk-actions";
import { BulkConfirmationDialog } from "@/components/ui/bulk-confirmation-dialog";
import { createCarColumns } from "./cars-columns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CarsTableProps {
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
  onEditCar: (car: CarWithId) => void;
  onDeleteCar?: (car: CarWithId) => void;
}

export function CarsTable({
  searchTerm = "",
  onSearchChange,
  onEditCar,
  onDeleteCar,
}: CarsTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(25);
  const [cursors, setCursors] = React.useState<{
    [key: number]: PaginationCursor;
  }>({});
  const [statusFilter, setStatusFilter] = React.useState<"all" | CarStatus>(
    "all"
  );

  // Bulk actions state
  const [isBulkActionsLoading, setIsBulkActionsLoading] = React.useState(false);
  
  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    action: any;
  }>({
    open: false,
    action: null,
  });

  // Use optimized search hook
  const {
    searchTerm: localSearchTerm,
    setSearchTerm: setLocalSearchTerm,
    debouncedSearchTerm,
  } = useOptimizedSearch(searchTerm);

  React.useEffect(() => {
    onSearchChange?.(debouncedSearchTerm);
    setPageIndex(0); // Reset to first page when searching
    setCursors({}); // Clear cursor cache when searching
  }, [debouncedSearchTerm, onSearchChange]);

  // Status update mutation with optimistic updates
  const statusMutation = useMutation({
    mutationFn: async ({
      carId,
      status,
    }: {
      carId: string;
      status: CarStatus;
    }) => {
      return await updateCarStatus(carId, status);
    },
    onMutate: async ({ carId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cars"] });

      // Snapshot the previous value
      const previousCars = queryClient.getQueryData([
        "cars",
        debouncedSearchTerm,
        pageIndex,
        pageSize,
        statusFilter,
      ]);

      // Optimistically update the car status
      queryClient.setQueryData(
        ["cars", debouncedSearchTerm, pageIndex, pageSize, statusFilter],
        (old: { cars: CarWithId[] }) => {
          if (!old) return old;

          return {
            ...old,
            cars: old.cars.map((car: CarWithId) =>
              car.id === carId ? { ...car, status, updatedAt: new Date() } : car
            ),
          };
        }
      );

      return { previousCars };
    },
    onSuccess: (_, { status }) => {
      // Intelligently invalidate related queries
      invalidateCarQueries(queryClient, {
        invalidateCarsList: true,
        invalidateFleetStatus: true,
        invalidateAvailableCars: true, // Status changes affect available cars
        invalidateCarsCount: false, // Count rarely changes
      });
      toast.success(t("fleet.statusUpdated"), {
        description: t("fleet.statusUpdatedDesc", {
          status: t(`fleet.${status}`),
        }),
      });
    },
    onError: (error, _variables, context) => {
      console.error("Failed to update car status:", error);

      // Rollback optimistic update
      if (context?.previousCars) {
        queryClient.setQueryData(
          ["cars", debouncedSearchTerm, pageIndex, pageSize, statusFilter],
          context.previousCars
        );
      }

      toast.error(t("fleet.failedToUpdateStatus"), {
        description: t("common.retry"),
      });
    },
    onSettled: () => {
      // Ensure we're in sync with server after mutation
      invalidateCarQueries(queryClient, {
        invalidateCarsList: true,
        invalidateFleetStatus: false, // Already done on success
        invalidateAvailableCars: false, // Already done on success
        invalidateCarsCount: false,
      });
    },
  });

  const handleStatusChange = (carId: string, newStatus: CarStatus) => {
    statusMutation.mutate({ carId, status: newStatus });
  };

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ carIds, status }: { carIds: string[]; status: CarStatus }) => {
      setIsBulkActionsLoading(true);
      return await bulkUpdateCarStatus(carIds, status);
    },
    onSuccess: (result, { status }) => {
      invalidateCarQueries(queryClient, {
        invalidateCarsList: true,
        invalidateFleetStatus: true,
        invalidateAvailableCars: true,
        invalidateCarsCount: false,
      });

      if (result.successCount > 0) {
        toast.success(t("fleet.bulkStatusUpdateSuccess", { 
          count: result.successCount,
          status: t(`fleet.${status}`)
        }));
      }
      if (result.errorCount > 0) {
        toast.error(t("fleet.bulkStatusUpdatePartialError", { 
          successCount: result.successCount, 
          errorCount: result.errorCount 
        }));
      }

      // Clear selection
      setRowSelection({});
      setIsBulkActionsLoading(false);
    },
    onError: (error) => {
      console.error("Error in bulk status update:", error);
      toast.error(t("fleet.bulkStatusUpdateError"));
      setIsBulkActionsLoading(false);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (carIds: string[]) => {
      setIsBulkActionsLoading(true);
      return await bulkDeleteCars(carIds);
    },
    onSuccess: (result) => {
      invalidateCarQueries(queryClient, {
        invalidateCarsList: true,
        invalidateFleetStatus: true,
        invalidateAvailableCars: true,
        invalidateCarsCount: true,
      });

      if (result.successCount > 0) {
        toast.success(t("fleet.bulkDeleteSuccess", { count: result.successCount }));
      }
      if (result.errorCount > 0) {
        toast.error(t("fleet.bulkDeletePartialError", { 
          successCount: result.successCount, 
          errorCount: result.errorCount 
        }));
      }

      // Clear selection
      setRowSelection({});
      setIsBulkActionsLoading(false);
    },
    onError: (error) => {
      console.error("Error in bulk delete:", error);
      toast.error(t("fleet.bulkDeleteError"));
      setIsBulkActionsLoading(false);
    },
  });

  // Filter params for count query (without pagination params)
  const filterParams: CarsFilterParams = {
    searchTerm: debouncedSearchTerm.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  };

  // Fetch cars with React Query
  const {
    data: carsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cars", debouncedSearchTerm, pageIndex, pageSize, statusFilter],
    queryFn: async () => {
      const cursor = cursors[pageIndex];
      const queryParams = {
        pageSize,
        pageIndex,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        cursor,
        status: statusFilter === "all" ? undefined : statusFilter,
      };

      if (debouncedSearchTerm.trim()) {
        return searchCars(debouncedSearchTerm, queryParams);
      }
      return fetchCars(queryParams);
    },
    staleTime: queryConfig.cars.staleTime,
    gcTime: queryConfig.cars.gcTime,
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["cars", "count", pageSize, filterParams],
    queryFn: async () => {
      return getCarsCount(filterParams);
    },
    staleTime: queryConfig.counts.staleTime,
    gcTime: queryConfig.counts.gcTime,
  });

  const data = carsResponse?.cars || [];
  const totalRows = totalCount || 0;

  // Update cursor cache when new data is fetched
  React.useEffect(() => {
    if (carsResponse?.pagination?.endCursor && pageIndex >= 0) {
      setCursors((prev) => ({
        ...prev,
        [pageIndex + 1]: {
          docSnapshot: carsResponse.pagination.endCursor!,
          direction: "forward",
        },
      }));
    }
  }, [carsResponse?.pagination?.endCursor, pageIndex]);

  // Create columns with callbacks
  const columns = createCarColumns({
    onEditCar,
    onDeleteCar,
    onStatusChange: handleStatusChange,
    isUpdatingStatus: statusMutation.isPending,
    t,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    manualPagination: true,
    pageCount: Math.ceil(totalRows / pageSize),
  });

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as "all" | CarStatus);
    setPageIndex(0);
    setCursors({});
  };

  // Bulk action handlers
    const handleBulkDelete = () => {
    const selectedCars = table.getFilteredSelectedRowModel().rows;
    const carIds = selectedCars.map(row => row.original.id);
    
    if (carIds.length === 0) {
      toast.error(t("fleet.noCarsSelected"));
      return;
    }
    
    bulkDeleteMutation.mutate(carIds);
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

  const handleBulkStatusChange = (status: CarStatus) => {
    const selectedCars = table.getFilteredSelectedRowModel().rows;
    const carIds = selectedCars.map(row => row.original.id);
    
    if (carIds.length === 0) {
      toast.error(t("fleet.noCarsSelected"));
      return;
    }

    bulkStatusMutation.mutate({ carIds, status });
  };

  // Function to get translated column name
  const getColumnDisplayName = (columnId: string) => {
    const columnMap: Record<string, string> = {
      select: t("table.selectAll"),
      licensePlate: t("fleet.licensePlate"),
      model: t("fleet.model"),
      color: t("fleet.color"),
      seats: t("fleet.seats"),
      status: t("common.status"),
      actions: t("common.actions"),
    };
    return columnMap[columnId] || columnId;
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => refetch()}
        title={t("fleet.errorLoadingCars")}
        description={t(
          "fleet.errorLoadingCarsDescription",
          "Unable to load cars. Please try again."
        )}
        showHomeButton={false}
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Filters Section - Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("fleet.searchPlaceholder")}
              value={localSearchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="pl-10 w-full"
            />
          </div>
          {/* Status filter */}
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={t("fleet.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("fleet.allStatuses")}</SelectItem>
              <SelectItem value="available">{t("fleet.available")}</SelectItem>
              <SelectItem value="maintenance">
                {t("fleet.maintenance")}
              </SelectItem>
              <SelectItem value="out_of_service">
                {t("fleet.out_of_service")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions and Column visibility */}
        <div className="flex items-center gap-2">
          <BulkActions
            selectedCount={table.getFilteredSelectedRowModel().rows.length}
            isLoading={isBulkActionsLoading}
            onActionClick={handleBulkActionClick}
            {...createCarBulkActions(t, handleBulkDelete, handleBulkStatusChange, isBulkActionsLoading)}
          />
          
          <ColumnSelector
            tableId="cars-table"
            columns={table.getAllColumns()}
            getColumnDisplayName={getColumnDisplayName}
          />
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
        isLoading={isBulkActionsLoading}
      />

      {/* Table */}
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
            {isLoading ? (
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
                      {t("loading.loadingCars")}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
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
                  {debouncedSearchTerm
                    ? t("fleet.searchNoCarsFound")
                    : t("fleet.noCarsFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <TablePagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRows={countError ? 0 : totalRows}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onPageChange={setPageIndex}
        onPageSizeChange={handlePageSizeChange}
        onFirstPage={() => {
          setPageIndex(0);
          setCursors({});
        }}
        onPreviousPage={() => {
          const newPageIndex = Math.max(0, pageIndex - 1);
          setPageIndex(newPageIndex);
        }}
        onNextPage={() => {
          setPageIndex(pageIndex + 1);
        }}
        onLastPage={() => {
          if (totalCount) {
            const lastPageIndex = Math.ceil(totalCount / pageSize) - 1;
            setPageIndex(lastPageIndex);
          }
        }}
        countError={countError}
        countLoading={countLoading}
      />
    </div>
  );
}
