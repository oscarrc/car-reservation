"use client";

import { ArrowUpDown, Edit, Eye, UserCheck, UserX } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { AuthUser } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import type { UserProfileWithId } from "@/lib/users-service";

interface UserColumnsProps {
  onEditUser: (user: UserProfileWithId) => void;
  onSuspendUser?: (user: UserProfileWithId) => void;
  onUnsuspendUser?: (user: UserProfileWithId) => void;
  t: (key: string, options?: Record<string, string>) => string;
  authUser: AuthUser | null;
}

export const createUserColumns = ({
  onEditUser,
  onSuspendUser,
  onUnsuspendUser,
  t,
  authUser,
}: UserColumnsProps): ColumnDef<UserProfileWithId>[] => {
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
          aria-label={t("table.selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("table.selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("users.name")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return <div className="font-medium">{name}</div>;
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent cursor-pointer"
          >
            {t("users.email")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return <div className="lowercase">{email}</div>;
      },
    },
    {
      accessorKey: "phone",
      header: t("users.phone"),
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return <div>{phone}</div>;
      },
    },
    {
      accessorKey: "role",
      header: t("users.role"),
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "suspended",
      header: t("users.status"),
      cell: ({ row }) => {
        const suspended = row.getValue("suspended") as boolean;
        return (
          <Badge variant={suspended ? "destructive" : "success"}>
            {suspended ? t("users.suspended") : t("users.active")}
          </Badge>
        );
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = authUser?.uid === user.id;

        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <Link to={`/admin/users/${user.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">{t("users.userDetails")}</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("users.userDetails")}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditUser(user)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">{t("users.editUser")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("users.editUser")}</p>
              </TooltipContent>
            </Tooltip>

            {/* Suspend/Unsuspend actions - only if not current user */}
            {!isCurrentUser && (
              <>
                {user.suspended
                  ? onUnsuspendUser && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUnsuspendUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span className="sr-only">
                              {t("users.unsuspendUser")}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("users.unsuspendUser")}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  : onSuspendUser && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSuspendUser(user)}
                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                          >
                            <UserX className="h-4 w-4" />
                            <span className="sr-only">
                              {t("users.suspendUser")}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("users.suspendUser")}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
              </>
            )}
          </div>
        );
      },
    },
  ];
};
