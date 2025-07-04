"use client";

import * as React from "react";

import type { CarStatus, CarWithId } from "@/types/car";
import { ChevronDown, Loader2, Search } from "lucide-react";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCars, searchCars, updateCarStatus } from "@/lib/cars-service";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import { createColumns } from "./cars-columns";
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
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(25);
  const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
      onSearchChange?.(localSearchTerm);
      setPageIndex(0); // Reset to first page when searching
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
    data: carsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cars", debouncedSearchTerm, pageSize],
    queryFn: async () => {
      if (debouncedSearchTerm.trim()) {
        return searchCars(debouncedSearchTerm, pageSize * 5); // Get more results for search
      }
      return fetchCars({ pageSize: pageSize * 5 }); // Get more for pagination
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const data = React.useMemo(() => {
    if (!carsData?.cars) return [];

    // Handle client-side pagination for search results
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return carsData.cars.slice(start, end);
  }, [carsData?.cars, pageIndex, pageSize]);

  const totalRows = carsData?.cars.length || 0;
  const totalPages = Math.ceil(totalRows / pageSize);

  // Create columns with callbacks
  const columns = createColumns({
    onEditCar,
    onDeleteCar,
    onStatusChange: handleStatusChange,
    isUpdatingStatus: statusMutation.isPending,
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
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: totalPages,
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{t("fleet.errorLoadingCars")}</p>
          <Button onClick={() => refetch()} className="cursor-pointer">
            {t("common.retryButton")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("fleet.searchPlaceholder")}
            value={localSearchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="pl-10"
          />
        </div>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto cursor-pointer">
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
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">{t("loading.loadingCars")}</span>
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
        onPageChange={setPageIndex}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
