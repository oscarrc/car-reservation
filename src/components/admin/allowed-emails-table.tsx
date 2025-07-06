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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

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
      accessorKey: "timestamp",
      header: t("allowedEmails.addedDate"),
      cell: ({ row }) => {
        const timestamp = row.getValue("timestamp") as Date;
        return <div>{format(timestamp, "PPP")}</div>;
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

  // Filter params for count query (without pagination params)
  const filterParams: AllowedEmailsFilterParams = {};

  // Fetch allowed emails with React Query
  const {
    data: emailsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["allowedEmails", pageIndex, pageSize],
    queryFn: async () => {
      const cursor = cursors[pageIndex];
      const queryParams = {
        pageSize,
        pageIndex,
        cursor,
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

  const handleDeleteEmail = (email: AllowedEmailWithId) => {
    setEmailToDelete(email);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (emailToDelete) {
      removeEmailMutation.mutate(emailToDelete.id);
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
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <ColumnSelector
            tableId="allowed-emails-table"
            columns={table.getAllColumns()}
            getColumnDisplayName={(columnId) => {
              const columnMap: Record<string, string> = {
                select: t("common.select"),
                email: t("allowedEmails.email"),
                addedDate: t("allowedEmails.addedDate"),
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
    </div>
  );
}
