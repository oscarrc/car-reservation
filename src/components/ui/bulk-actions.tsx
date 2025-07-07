/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, UserCheck, UserX, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CarStatus } from "@/types/car";
import type { ReservationStatus } from "@/types/reservation";
import { useTranslation } from "react-i18next";

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  onClick: () => void;
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  confirmText?: string;
}

export interface StatusAction {
  id: string;
  label: string;
  value: string;
}

interface BulkActionsProps {
  selectedCount: number;
  isLoading?: boolean;
  actions?: BulkAction[];
  statusActions?: {
    label: string;
    options: StatusAction[];
    onStatusChange: (status: string) => void;
  };
  className?: string;
  onActionClick?: (action: BulkAction) => void;
}

export function BulkActions({
  selectedCount,
  isLoading = false,
  actions = [],
  statusActions,
  className = "",
  onActionClick,
}: BulkActionsProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 ${className}`}
    >
      {/* Selected count badge */}
      <span className="text-sm text-muted-foreground">
        {t("table.selectedCount", { count: selectedCount })}
      </span>

      {/* Status change select (if provided) */}
      {statusActions && (
        <Select
          onValueChange={statusActions.onStatusChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={statusActions.label} />
          </SelectTrigger>
          <SelectContent>
            {statusActions.options.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Action buttons */}
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant={action.variant || "outline"}
            size="sm"
            onClick={() => {
              if (onActionClick) {
                onActionClick(action);
              } else {
                action.onClick();
              }
            }}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {Icon && <Icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

// Utility functions to create common bulk actions

export function createReservationBulkActions(
  t: (key: string) => string,
  onCancel?: () => void,
  onStatusChange?: (status: ReservationStatus) => void,
  _isLoading?: boolean
): { actions?: BulkAction[]; statusActions?: any } {
  const actions: BulkAction[] = [];
  let statusActions;

  if (onCancel) {
    actions.push({
      id: "cancel",
      label: t("reservations.cancelSelected"),
      icon: XCircle,
      variant: "destructive",
      onClick: onCancel,
      requiresConfirmation: true,
      confirmationTitle: t("reservations.cancelSelectedConfirm"),
      confirmationDescription: t("reservations.cancelSelectedConfirmDesc"),
      confirmText: t("reservations.cancelSelected"),
    });
  }

  if (onStatusChange) {
    statusActions = {
      label: t("reservations.changeStatus"),
      options: [
        { id: "pending", label: t("reservations.pending"), value: "pending" },
        {
          id: "confirmed",
          label: t("reservations.confirmed"),
          value: "confirmed",
        },
        {
          id: "cancelled",
          label: t("reservations.cancelled"),
          value: "cancelled",
        },
        {
          id: "cancellation_pending",
          label: t("reservations.cancellation_pending"),
          value: "cancellation_pending",
        },
      ],
      onStatusChange: (status: string) =>
        onStatusChange(status as ReservationStatus),
    };
  }

  return { actions: actions.length > 0 ? actions : undefined, statusActions };
}

export function createCarBulkActions(
  t: (key: string) => string,
  onDelete?: () => void,
  onStatusChange?: (status: CarStatus) => void,
  _isLoading?: boolean
): { actions?: BulkAction[]; statusActions?: any } {
  const actions: BulkAction[] = [];
  let statusActions;

  if (onDelete) {
    actions.push({
      id: "delete",
      label: t("fleet.deleteSelected"),
      icon: Trash2,
      variant: "destructive",
      onClick: onDelete,
      requiresConfirmation: true,
      confirmationTitle: t("fleet.deleteSelectedConfirm"),
      confirmationDescription: t("fleet.deleteSelectedConfirmDesc"),
      confirmText: t("fleet.deleteSelected"),
    });
  }

  if (onStatusChange) {
    statusActions = {
      label: t("fleet.changeStatus"),
      options: [
        { id: "available", label: t("fleet.available"), value: "available" },
        {
          id: "maintenance",
          label: t("fleet.maintenance"),
          value: "maintenance",
        },
        {
          id: "out_of_service",
          label: t("fleet.out_of_service"),
          value: "out_of_service",
        },
      ],
      onStatusChange: (status: string) => onStatusChange(status as CarStatus),
    };
  }

  return { actions: actions.length > 0 ? actions : undefined, statusActions };
}

export function createUserBulkActions(
  t: (key: string) => string,
  onSuspend?: () => void,
  onUnsuspend?: () => void,
  onRoleChange?: (role: string) => void,
  _isLoading?: boolean
): { actions?: BulkAction[]; statusActions?: any } {
  const actions: BulkAction[] = [];
  let statusActions;

  if (onSuspend) {
    actions.push({
      id: "suspend",
      label: t("users.suspendSelected"),
      icon: UserX,
      variant: "destructive",
      onClick: onSuspend,
      requiresConfirmation: true,
      confirmationTitle: t("users.suspendSelectedConfirm"),
      confirmationDescription: t("users.suspendSelectedConfirmDesc"),
      confirmText: t("users.suspendSelected"),
    });
  }

  if (onUnsuspend) {
    actions.push({
      id: "unsuspend",
      label: t("users.unsuspendSelected"),
      icon: UserCheck,
      variant: "default",
      onClick: onUnsuspend,
      requiresConfirmation: true,
      confirmationTitle: t("users.unsuspendSelectedConfirm"),
      confirmationDescription: t("users.unsuspendSelectedConfirmDesc"),
      confirmText: t("users.unsuspendSelected"),
    });
  }

  if (onRoleChange) {
    statusActions = {
      label: t("users.changeRole"),
      options: [
        { id: "admin", label: t("users.admin"), value: "admin" },
        { id: "teacher", label: t("users.teacher"), value: "teacher" },
      ],
      onStatusChange: onRoleChange,
    };
  }

  return { actions: actions.length > 0 ? actions : undefined, statusActions };
}

export function createEmailBulkActions(
  t: (key: string) => string,
  onDelete?: () => void,
  _isLoading?: boolean
): { actions?: BulkAction[] } {
  const actions: BulkAction[] = [];

  if (onDelete) {
    actions.push({
      id: "delete",
      label: t("allowedEmails.deleteSelected"),
      icon: Trash2,
      variant: "destructive",
      onClick: onDelete,
      requiresConfirmation: true,
      confirmationTitle: t("allowedEmails.deleteSelectedConfirm"),
      confirmationDescription: t("allowedEmails.deleteSelectedConfirmDesc"),
      confirmText: t("allowedEmails.deleteSelected"),
    });
  }

  return { actions: actions.length > 0 ? actions : undefined };
}
