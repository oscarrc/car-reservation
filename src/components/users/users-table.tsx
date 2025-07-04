"use client";

import * as React from "react";

import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { Loader2, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchUsers, searchUsers } from "@/lib/users-service";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { ColumnSelector } from "@/components/ui/column-selector";
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

  // Fetch users with React Query
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users", debouncedSearchTerm, pageSize],
    queryFn: async () => {
      if (debouncedSearchTerm.trim()) {
        return searchUsers(debouncedSearchTerm, pageSize * 5); // Get more results for search
      }
      return fetchUsers({ pageSize: pageSize * 5 }); // Get more for pagination
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const data = React.useMemo(() => {
    if (!usersData?.users) return [];

    // Handle client-side pagination for search results
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return usersData.users.slice(start, end);
  }, [usersData?.users, pageIndex, pageSize]);

  const totalRows = usersData?.users.length || 0;
  const totalPages = Math.ceil(totalRows / pageSize);

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{t("users.errorLoadingUsers")}</p>
          <Button onClick={() => refetch()} className="cursor-pointer">
            {t("common.retryButton")}
          </Button>
        </div>
      </div>
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
                  className="h-64 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    {t("loading.loadingUsers")}
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
                  {t("users.noUsersFound")}
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
