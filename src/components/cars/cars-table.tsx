"use client";

import * as React from "react";

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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumns } from "./cars-columns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CarWithId, CarStatus } from "@/types/car";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
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
      toast.success("Status updated", {
        description: `Car status changed to ${status.replace("_", " ")}.`,
      });
    },
    onError: (error) => {
      console.error("Failed to update car status:", error);
      toast.error("Failed to update status", {
        description: "Please try again or contact support if the problem persists.",
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

  const handlePreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (pageIndex < totalPages - 1) {
      setPageIndex(pageIndex + 1);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading cars</p>
          <Button onClick={() => refetch()} className="cursor-pointer">Retry</Button>
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
            placeholder="Search by model or license plate..."
            value={localSearchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="pl-10"
          />
        </div>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto cursor-pointer">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                    {column.id}
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading cars...</span>
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {debouncedSearchTerm ? "No cars found matching your search." : "No cars found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {data.length > 0 ? pageIndex * pageSize + 1 : 0} to{" "}
          {Math.min((pageIndex + 1) * pageSize, totalRows)} of {totalRows} car(s)
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={pageIndex === 0}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {pageIndex + 1} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={pageIndex >= totalPages - 1}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 