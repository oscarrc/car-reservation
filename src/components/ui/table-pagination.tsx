"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

interface TablePaginationProps {
  // Pagination state
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  selectedCount: number;

  // Pagination actions
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFirstPage?: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onLastPage?: () => void;

  // Optional customization
  pageSizeOptions?: number[];
  showSelectedCount?: boolean;

  // Count state
  countError?: Error | null;
  countLoading?: boolean;
}

export function TablePagination({
  pageIndex,
  pageSize,
  totalRows,
  selectedCount,
  onPageChange,
  onPageSizeChange,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
  pageSizeOptions = [25, 50, 100],
  showSelectedCount = true,
  countError,
  countLoading,
}: TablePaginationProps) {
  const { t } = useTranslation();

  const totalPages = Math.ceil(totalRows / pageSize);
  const hasPreviousPage = pageIndex > 0;
  const hasNextPage = pageIndex < totalPages - 1;

  const handleFirstPage = () => {
    if (onFirstPage) {
      onFirstPage();
    } else {
      onPageChange(0);
    }
  };

  const handlePreviousPage = () => {
    if (onPreviousPage) {
      onPreviousPage();
    } else {
      onPageChange(pageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (onNextPage) {
      onNextPage();
    } else {
      onPageChange(pageIndex + 1);
    }
  };

  const handleLastPage = () => {
    if (onLastPage) {
      onLastPage();
    } else {
      onPageChange(totalPages - 1);
    }
  };

  const startItem = totalRows > 0 ? pageIndex * pageSize + 1 : 0;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalRows);

  // Render count display based on state
  const renderCountDisplay = () => {
    if (countError) {
      return (
        <div>
          {t("common.showing")} {startItem} {t("common.to")} {endItem}{" "}
          {t("common.of")}{" "}
          <span className="text-destructive text-sm">
            {t("common.errorLoadingCount")}
          </span>
        </div>
      );
    }

    if (countLoading) {
      return (
        <div>
          <Skeleton className="inline-block h-4 w-32" />
        </div>
      );
    }

    return (
      <div>
        {t("common.showing")} {startItem} {t("common.to")} {endItem}{" "}
        {t("common.of")} {totalRows}
      </div>
    );
  };

  return (
    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
      {/* Selected count and showing info */}
      <div className="flex flex-col items-center sm:items-start text-sm text-muted-foreground w-full sm:w-auto">
        {renderCountDisplay()}
        {showSelectedCount && selectedCount > 0 && (
          <div>
            {selectedCount} {t("common.of")} {totalRows} {t("common.selected")}.
          </div>
        )}
      </div>

      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-fit" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} {t("common.perPage")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFirstPage}
            disabled={!hasPreviousPage}
            aria-label={t("common.first")}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!hasPreviousPage}
            aria-label={t("common.previous")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm whitespace-nowrap px-2">
            {t("common.page")} {pageIndex + 1} {t("common.of")}{" "}
            {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            aria-label={t("common.next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLastPage}
            disabled={!hasNextPage}
            aria-label={t("common.last")}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
