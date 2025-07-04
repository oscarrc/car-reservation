"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { VisibilityState } from "@tanstack/react-table";

interface ColumnSelectorProps {
  tableId: string;
  columns: Array<{
    id: string;
    getCanHide: () => boolean;
    getIsVisible: () => boolean;
    toggleVisibility: (value: boolean) => void;
  }>;
  getColumnDisplayName: (columnId: string) => string;
}

export function ColumnSelector({ 
  tableId, 
  columns, 
  getColumnDisplayName 
}: ColumnSelectorProps) {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Load column visibility from localStorage on mount
  React.useEffect(() => {
    const savedVisibility = localStorage.getItem(`table-columns-${tableId}`);
    if (savedVisibility) {
      try {
        const parsed = JSON.parse(savedVisibility);
        setColumnVisibility(parsed);
      } catch (error) {
        console.error(`Failed to parse column visibility for table ${tableId}:`, error);
      }
    }
  }, [tableId]);

  // Save column visibility to localStorage when it changes
  const handleColumnVisibilityChange = React.useCallback((columnId: string, isVisible: boolean) => {
    const newVisibility = { ...columnVisibility, [columnId]: isVisible };
    setColumnVisibility(newVisibility);
    
    // Save to localStorage
    try {
      localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(newVisibility));
    } catch (error) {
      console.error(`Failed to save column visibility for table ${tableId}:`, error);
    }
  }, [columnVisibility, tableId]);

  // Apply visibility changes to table columns
  React.useEffect(() => {
    columns.forEach(column => {
      if (column.getCanHide()) {
        const isVisible = columnVisibility[column.id] !== false; // Default to visible if not explicitly hidden
        if (column.getIsVisible() !== isVisible) {
          column.toggleVisibility(isVisible);
        }
      }
    });
  }, [columnVisibility, columns]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-auto cursor-pointer"
        >
          {t("table.columns")} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 max-h-96 overflow-y-auto"
      >
        {columns
          .filter((column) => column.getCanHide())
          .map((column) => {
            const isVisible = columnVisibility[column.id] !== false;
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={isVisible}
                onCheckedChange={(value) =>
                  handleColumnVisibilityChange(column.id, !!value)
                }
              >
                {getColumnDisplayName(column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 