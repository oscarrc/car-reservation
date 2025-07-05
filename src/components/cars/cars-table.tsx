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
  searchCars,
  updateCarStatus,
  type PaginationCursor,
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

import { ColumnSelector } from "@/components/ui/column-selector";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import { createCarColumns } from "./cars-columns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
  const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm);
  const [cursors, setCursors] = React.useState<{
    [key: number]: PaginationCursor;
  }>({});

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
      onSearchChange?.(localSearchTerm);
      setPageIndex(0); // Reset to first page when searching
      setCursors({}); // Clear cursor cache when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm, onSearchChange]);

  // Status update mutation
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
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast.success(t("fleet.statusUpdated"), {
        description: t("fleet.statusUpdatedDesc", {
          status: t(`fleet.${status}`),
        }),
      });
    },
    onError: (error) => {
      console.error("Failed to update car status:", error);
      toast.error(t("fleet.failedToUpdateStatus"), {
        description: t("common.retry"),
      });
    },
  });

  const handleStatusChange = (carId: string, newStatus: CarStatus) => {
    statusMutation.mutate({ carId, status: newStatus });
  };

  // Fetch cars with React Query
  const {
    data: carsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cars", debouncedSearchTerm, pageIndex, pageSize],
    queryFn: async () => {
      const cursor = cursors[pageIndex];
      const queryParams = {
        pageSize,
        pageIndex,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        cursor,
      };

      if (debouncedSearchTerm.trim()) {
        return searchCars(debouncedSearchTerm, queryParams);
      }
      return fetchCars(queryParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const data = carsResponse?.cars || [];
  const pagination = carsResponse?.pagination;
  const totalRows = pagination?.totalCount || 0;
  const hasNextPage = pagination?.hasNextPage || false;
  const hasPreviousPage = pagination?.hasPreviousPage || false;

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
      {/* Search and filters - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("fleet.searchPlaceholder")}
            value={localSearchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Column visibility - Using new component */}
        <ColumnSelector
          tableId="cars-table"
          columns={table.getAllColumns()}
          getColumnDisplayName={getColumnDisplayName}
        />
      </div>

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
        totalRows={totalRows}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
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
          if (pagination?.totalCount) {
            const lastPageIndex =
              Math.ceil(pagination.totalCount / pageSize) - 1;
            setPageIndex(lastPageIndex);
          }
        }}
      />
    </div>
  );
}
