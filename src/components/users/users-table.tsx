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
  bulkUpdateUserStatus,
  bulkUpdateUserRole,
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
import {
  BulkActions,
  createUserBulkActions,
} from "@/components/ui/bulk-actions";
import { BulkConfirmationDialog } from "@/components/ui/bulk-confirmation-dialog";
import { invalidateUserQueries } from "@/lib/query-utils";
import type { UserProfileWithId } from "@/lib/users-service";
import { createUserColumns } from "./users-columns";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UsersTableProps {
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
  onEditUser: (user: UserProfileWithId) => void;
  onSuspendUser?: (user: UserProfileWithId) => void;
  onUnsuspendUser?: (user: UserProfileWithId) => void;
}

export function UsersTable({
  searchTerm = "",
  onSearchChange,
  onEditUser,
  onSuspendUser,
  onUnsuspendUser,
}: UsersTableProps) {
  const { t } = useTranslation();
  const { authUser } = useAuth();
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
  const [roleFilter, setRoleFilter] = React.useState<
    "all" | "admin" | "teacher"
  >("all");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "suspended"
  >("all");

  // Bulk actions state
  const [isBulkActionsLoading, setIsBulkActionsLoading] = React.useState(false);

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: any;
  }>({
    open: false,
    action: null,
  });

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
    role: roleFilter === "all" ? undefined : roleFilter,
    suspended:
      statusFilter === "all" ? undefined : statusFilter === "suspended",
  };

  // Fetch users with React Query
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "users",
      debouncedSearchTerm,
      pageIndex,
      pageSize,
      roleFilter,
      statusFilter,
    ],
    queryFn: async () => {
      const cursor = cursors[pageIndex];
      const queryParams = {
        pageSize,
        pageIndex,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        cursor,
        role: roleFilter === "all" ? undefined : roleFilter,
        suspended:
          statusFilter === "all" ? undefined : statusFilter === "suspended",
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

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({
      userIds,
      suspended,
    }: {
      userIds: string[];
      suspended: boolean;
    }) => {
      setIsBulkActionsLoading(true);
      return await bulkUpdateUserStatus(userIds, suspended);
    },
    onSuccess: (result, { suspended }) => {
      invalidateUserQueries(queryClient, {
        invalidateUsersList: true,
        invalidateUsersCount: false,
      });

      if (result.successCount > 0) {
        toast.success(
          t("users.bulkStatusUpdateSuccess", {
            count: result.successCount,
            status: suspended ? t("users.suspended") : t("users.active"),
          })
        );
      }
      if (result.errorCount > 0) {
        toast.error(
          t("users.bulkStatusUpdatePartialError", {
            successCount: result.successCount,
            errorCount: result.errorCount,
          })
        );
      }

      // Clear selection
      setRowSelection({});
      setIsBulkActionsLoading(false);
    },
    onError: (error) => {
      console.error("Error in bulk status update:", error);
      toast.error(t("users.bulkStatusUpdateError"));
      setIsBulkActionsLoading(false);
    },
  });

  // Bulk role update mutation
  const bulkRoleMutation = useMutation({
    mutationFn: async ({
      userIds,
      role,
    }: {
      userIds: string[];
      role: string;
    }) => {
      setIsBulkActionsLoading(true);
      return await bulkUpdateUserRole(userIds, role);
    },
    onSuccess: (result, { role }) => {
      invalidateUserQueries(queryClient, {
        invalidateUsersList: true,
        invalidateUsersCount: false,
      });

      if (result.successCount > 0) {
        toast.success(
          t("users.bulkRoleUpdateSuccess", {
            count: result.successCount,
            role: t(`users.${role}`),
          })
        );
      }
      if (result.errorCount > 0) {
        toast.error(
          t("users.bulkRoleUpdatePartialError", {
            successCount: result.successCount,
            errorCount: result.errorCount,
          })
        );
      }

      // Clear selection
      setRowSelection({});
      setIsBulkActionsLoading(false);
    },
    onError: (error) => {
      console.error("Error in bulk role update:", error);
      toast.error(t("users.bulkRoleUpdateError"));
      setIsBulkActionsLoading(false);
    },
  });

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

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value as "all" | "admin" | "teacher");
    setPageIndex(0);
    setCursors({});
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as "all" | "active" | "suspended");
    setPageIndex(0);
    setCursors({});
  };

  // Bulk action handlers
  const handleBulkSuspend = () => {
    const selectedUsers = table.getFilteredSelectedRowModel().rows;
    const userIds = selectedUsers.map((row) => row.original.id);

    if (userIds.length === 0) {
      toast.error(t("users.noUsersSelected"));
      return;
    }

    bulkStatusMutation.mutate({ userIds, suspended: true });
  };

  const handleBulkUnsuspend = () => {
    const selectedUsers = table.getFilteredSelectedRowModel().rows;
    const userIds = selectedUsers.map((row) => row.original.id);

    if (userIds.length === 0) {
      toast.error(t("users.noUsersSelected"));
      return;
    }

    bulkStatusMutation.mutate({ userIds, suspended: false });
  };

  const handleBulkRoleChange = (role: string) => {
    const selectedUsers = table.getFilteredSelectedRowModel().rows;
    const userIds = selectedUsers.map((row) => row.original.id);

    if (userIds.length === 0) {
      toast.error(t("users.noUsersSelected"));
      return;
    }

    bulkRoleMutation.mutate({ userIds, role });
  };

  // Handle bulk action clicks with confirmation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        description={t("users.errorLoadingUsersDescription")}
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
              placeholder={t("users.searchPlaceholder")}
              value={localSearchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="pl-10 w-full"
            />
          </div>
          {/* Role filter */}
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={t("users.filterByRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allRoles")}</SelectItem>
              <SelectItem value="admin">{t("users.admin")}</SelectItem>
              <SelectItem value="teacher">{t("users.teacher")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={t("users.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allStatuses")}</SelectItem>
              <SelectItem value="active">{t("users.active")}</SelectItem>
              <SelectItem value="suspended">{t("users.suspended")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions and Column visibility */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
          <BulkActions
            selectedCount={table.getFilteredSelectedRowModel().rows.length}
            isLoading={isBulkActionsLoading}
            onActionClick={handleBulkActionClick}
            {...createUserBulkActions(
              t,
              handleBulkSuspend,
              handleBulkUnsuspend,
              handleBulkRoleChange,
              isBulkActionsLoading
            )}
          />

          <ColumnSelector
            tableId="users-table"
            columns={table.getAllColumns()}
            getColumnDisplayName={getColumnDisplayName}
          />
        </div>
      </div>

      {/* Bulk Confirmation Dialog */}
      <BulkConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open) =>
          setConfirmationDialog({ open, action: confirmationDialog.action })
        }
        onConfirm={handleConfirmAction}
        title={
          typeof confirmationDialog.action?.confirmationTitle === "function"
            ? confirmationDialog.action.confirmationTitle(
                table.getFilteredSelectedRowModel().rows.length
              )
            : confirmationDialog.action?.confirmationTitle || ""
        }
        description={
          typeof confirmationDialog.action?.confirmationDescription ===
          "function"
            ? confirmationDialog.action.confirmationDescription(
                table.getFilteredSelectedRowModel().rows.length
              )
            : confirmationDialog.action?.confirmationDescription || ""
        }
        confirmText={
          typeof confirmationDialog.action?.confirmText === "function"
            ? confirmationDialog.action.confirmText(
                table.getFilteredSelectedRowModel().rows.length
              )
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
