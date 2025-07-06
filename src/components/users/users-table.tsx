"use client";

import * as React from "react";

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
  fetchUsers,
  getUsersCount,
  searchUsers,
  type PaginationCursor,
  type UsersFilterParams,
} from "@/lib/users-service";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { ColumnSelector } from "@/components/ui/column-selector";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import type { UserProfileWithId } from "@/lib/users-service";
import { createUserColumns } from "./users-columns";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

interface UsersTableProps {
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
  onEditUser: (user: UserProfileWithId) => void;
  onDeleteUser?: (user: UserProfileWithId) => void;
  onSuspendUser?: (user: UserProfileWithId) => void;
  onUnsuspendUser?: (user: UserProfileWithId) => void;
}

export function UsersTable({
  searchTerm = "",
  onSearchChange,
  onEditUser,
  onDeleteUser,
  onSuspendUser,
  onUnsuspendUser,
}: UsersTableProps) {
  const { t } = useTranslation();
  const { authUser } = useAuth();
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

  // Filter params for count query (without pagination params)
  const filterParams: UsersFilterParams = {
    searchTerm: debouncedSearchTerm.trim() || undefined,
  };

  // Fetch users with React Query
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users", debouncedSearchTerm, pageIndex, pageSize],
    queryFn: async () => {
      const cursor = cursors[pageIndex];
      const queryParams = {
        pageSize,
        pageIndex,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        cursor,
      };

      if (debouncedSearchTerm.trim()) {
        return searchUsers(debouncedSearchTerm, queryParams);
      }
      return fetchUsers(queryParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["users", "count", pageSize, filterParams],
    queryFn: async () => {
      return getUsersCount(filterParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const data = usersResponse?.users || [];
  const totalRows = totalCount || 0;
  
  // Update cursor cache when new data is fetched
  React.useEffect(() => {
    if (usersResponse?.pagination?.endCursor && pageIndex >= 0) {
      setCursors((prev) => ({
        ...prev,
        [pageIndex + 1]: {
          docSnapshot: usersResponse.pagination.endCursor!,
          direction: "forward",
        },
      }));
    }
  }, [usersResponse?.pagination?.endCursor, pageIndex]);

  // Create columns with callbacks
  const columns = createUserColumns({
    onEditUser,
    onDeleteUser,
    onSuspendUser,
    onUnsuspendUser,
    t,
    authUser,
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
      name: t("users.name"),
      email: t("users.email"),
      phone: t("users.phone"),
      role: t("users.role"),
      suspended: t("users.status"),
      actions: t("common.actions"),
    };
    return columnMap[columnId] || columnId;
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => refetch()}
        title={t("users.errorLoadingUsers")}
        description={t(
          "users.errorLoadingUsersDescription",
          "Unable to load users. Please try again."
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
            placeholder={t("users.searchPlaceholder")}
            value={localSearchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Column visibility - Using new component */}
        <ColumnSelector
          tableId="users-table"
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
                      {t("loading.loadingUsers")}
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
                    ? t("users.searchNoUsersFound")
                    : t("users.noUsersFound")}
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
