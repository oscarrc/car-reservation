"use client";

import * as React from "react";
import { Trash2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllowedEmails,
  getAllowedEmailsCount,
  removeAllowedEmail,
  bulkDeleteAllowedEmails,
  type AllowedEmailWithId,
  type PaginationCursor,
  type AllowedEmailsFilterParams,
} from "@/lib/allowed-emails-service";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnSelector } from "@/components/ui/column-selector";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TablePagination } from "@/components/ui/table-pagination";
import { BulkActions, createEmailBulkActions } from "@/components/ui/bulk-actions";
import { BulkConfirmationDialog } from "@/components/ui/bulk-confirmation-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AllowedEmailsTableProps {
  onAddEmail?: () => void;
  onRemoveEmail: (email: AllowedEmailWithId) => void;
}

const createAllowedEmailsColumns = ({
  onRemoveEmail,
  t,
}: {
  onRemoveEmail: (email: AllowedEmailWithId) => void;
  t: (key: string) => string;
  rowSelection: Record<string, boolean>;
  setRowSelection: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}): ColumnDef<AllowedEmailWithId>[] => {
  const getStatusVariant = (status: "pending" | "registered") => {
    switch (status) {
      case "pending":
        return "warning";
      case "registered":
        return "success";
      default:
        return "outline";
    }
  };

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: t("allowedEmails.email"),
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return <div className="font-medium">{email}</div>;
      },
    },
    {
      accessorKey: "status",
      header: t("allowedEmails.status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as "pending" | "registered";
        return (
          <Badge variant={getStatusVariant(status)}>
            {t(`allowedEmails.${status}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("allowedEmails.addedDate"),
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as Date;
        return <div>{format(createdAt, "PPP")}</div>;
      },
    },
    {
      accessorKey: "updatedAt",
      header: t("allowedEmails.updatedDate"),
      cell: ({ row }) => {
        const updatedAt = row.getValue("updatedAt") as Date;
        return <div>{format(updatedAt, "PPP")}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const email = row.original;

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveEmail(email)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{t("allowedEmails.removeEmail")}</span>
          </Button>
        );
      },
    },
  ];
};

export function AllowedEmailsTable({ onAddEmail }: AllowedEmailsTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [emailToDelete, setEmailToDelete] =
    React.useState<AllowedEmailWithId | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(25);
  const [cursors, setCursors] = React.useState<{
    [key: number]: PaginationCursor;
  }>({});
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "pending" | "registered"
  >("all");

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

  // Filter params for count query (without pagination params)
  const filterParams: AllowedEmailsFilterParams = {
    status: statusFilter === "all" ? undefined : statusFilter,
  };

  // Fetch allowed emails with React Query
  const {
    data: emailsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["allowedEmails", pageIndex, pageSize, statusFilter],
    queryFn: async () => {
      const cursor = cursors[pageIndex];
      const queryParams = {
        pageSize,
        pageIndex,
        cursor,
        status: statusFilter === "all" ? undefined : statusFilter,
      };

      return getAllowedEmails(queryParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["allowedEmails", "count", filterParams],
    queryFn: async () => {
      return getAllowedEmailsCount(filterParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const removeEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return await removeAllowedEmail(emailId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowedEmails"] });
      queryClient.invalidateQueries({ queryKey: ["allowedEmails", "count"] });
      toast.success(t("allowedEmails.emailRemoved"));
      setDeleteDialogOpen(false);
      setEmailToDelete(null);
    },
    onError: (error) => {
      console.error("Error removing email:", error);
      toast.error(t("allowedEmails.failedToRemoveEmail"));
      setDeleteDialogOpen(false);
      setEmailToDelete(null);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (emailIds: string[]) => {
      setIsBulkActionsLoading(true);
      return await bulkDeleteAllowedEmails(emailIds);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["allowedEmails"] });
      queryClient.invalidateQueries({ queryKey: ["allowedEmails", "count"] });
      
      if (result.successCount > 0) {
        toast.success(t("allowedEmails.bulkDeleteSuccess", { count: result.successCount }));
      }
      if (result.errorCount > 0) {
        toast.error(t("allowedEmails.bulkDeletePartialError", { 
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
      toast.error(t("allowedEmails.bulkDeleteError"));
      setIsBulkActionsLoading(false);
    },
  });

  const handleDeleteEmail = (email: AllowedEmailWithId) => {
    setEmailToDelete(email);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (emailToDelete) {
      removeEmailMutation.mutate(emailToDelete.id);
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as "all" | "pending" | "registered");
    setPageIndex(0);
    setCursors({});
  };

  // Bulk action handlers
    const handleBulkDelete = () => {
    const selectedEmails = table.getFilteredSelectedRowModel().rows;
    const emailIds = selectedEmails.map(row => row.original.id);
    
    if (emailIds.length === 0) {
      toast.error(t("allowedEmails.noEmailsSelected"));
      return;
    }
    
    bulkDeleteMutation.mutate(emailIds);
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

  const data = emailsResponse?.emails || [];
  const totalRows = totalCount || 0;

  // Update cursor cache when new data is fetched
  React.useEffect(() => {
    if (emailsResponse?.pagination?.endCursor && pageIndex >= 0) {
      setCursors((prev) => ({
        ...prev,
        [pageIndex + 1]: {
          docSnapshot: emailsResponse.pagination.endCursor!,
          direction: "forward",
        },
      }));
    }
  }, [emailsResponse?.pagination?.endCursor, pageIndex]);

  // Create columns
  const columns = createAllowedEmailsColumns({
    onRemoveEmail: handleDeleteEmail,
    t,
    rowSelection,
    setRowSelection,
  });

  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    manualPagination: true,
    pageCount: Math.ceil(totalRows / pageSize),
  });

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => refetch()}
        title={t("allowedEmails.errorLoadingEmails")}
        description={t("allowedEmails.errorLoadingEmailsDescription")}
        showHomeButton={false}
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("allowedEmails.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("allowedEmails.allStatuses")}
              </SelectItem>
              <SelectItem value="pending">
                {t("allowedEmails.pending")}
              </SelectItem>
              <SelectItem value="registered">
                {t("allowedEmails.registered")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          <BulkActions
            selectedCount={table.getFilteredSelectedRowModel().rows.length}
            isLoading={isBulkActionsLoading}
            onActionClick={handleBulkActionClick}
            {...createEmailBulkActions(t, handleBulkDelete, isBulkActionsLoading)}
          />
          
          <ColumnSelector
            tableId="allowed-emails-table"
            columns={table.getAllColumns()}
            getColumnDisplayName={(columnId) => {
              const columnMap: Record<string, string> = {
                select: t("common.select"),
                email: t("allowedEmails.email"),
                status: t("allowedEmails.status"),
                createdAt: t("allowedEmails.addedDate"),
                updatedAt: t("allowedEmails.updatedDate"),
                actions: t("common.actions"),
              };
              return columnMap[columnId] || columnId;
            }}
          />
          {onAddEmail && (
            <Button onClick={onAddEmail}>
              <Plus className="h-4 w-4 mr-2" />
              {t("allowedEmails.addEmail")}
            </Button>
          )}
        </div>
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
                      {t("loading.loadingEmails")}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  {t("allowedEmails.noEmailsFound")}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("allowedEmails.removeEmail")}
        description={
          emailToDelete
            ? t("allowedEmails.removeEmailConfirmation", {
                email: emailToDelete.email,
              })
            : ""
        }
        isLoading={removeEmailMutation.isPending}
      />

      {/* Bulk Confirmation Dialog */}
      <BulkConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open) => setConfirmationDialog({ open, action: confirmationDialog.action })}
        onConfirm={handleConfirmAction}
        title={confirmationDialog.action?.confirmationTitle || ""}
        description={confirmationDialog.action?.confirmationDescription || ""}
        confirmText={confirmationDialog.action?.confirmText}
        isLoading={isBulkActionsLoading}
      />
    </div>
  );
}
