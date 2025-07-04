"use client";

import {
  ArrowUpDown,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import type { UserProfileWithId } from "@/lib/users-service";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface ColumnsProps {
  onViewUser?: (user: UserProfileWithId) => void;
  onEditUser: (user: UserProfileWithId) => void;
  onDeleteUser?: (user: UserProfileWithId) => void;
  onSuspendUser?: (user: UserProfileWithId) => void;
  onUnsuspendUser?: (user: UserProfileWithId) => void;
}

export const createColumns = ({
  onViewUser,
  onEditUser,
  onDeleteUser,
  onSuspendUser,
  onUnsuspendUser,
}: ColumnsProps): ColumnDef<UserProfileWithId>[] => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { authUser } = useAuth();

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">{t("table.openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={`/admin/users/${user.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("users.userDetails")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEditUser(user)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("users.editUser")}
              </DropdownMenuItem>

              {/* Suspend/Unsuspend actions - only if not current user */}
              {!isCurrentUser && (
                <>
                  <DropdownMenuSeparator />
                  {user.suspended
                    ? onUnsuspendUser && (
                        <DropdownMenuItem
                          onClick={() => onUnsuspendUser(user)}
                          className="cursor-pointer"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          {t("users.unsuspendUser")}
                        </DropdownMenuItem>
                      )
                    : onSuspendUser && (
                        <DropdownMenuItem
                          onClick={() => onSuspendUser(user)}
                          className="cursor-pointer text-orange-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          {t("users.suspendUser")}
                        </DropdownMenuItem>
                      )}
                </>
              )}

              {/* Delete action - only if not current user */}
              {!isCurrentUser && onDeleteUser && (
                <>
                  <DropdownMenuItem
                    onClick={() => onDeleteUser(user)}
                    className="cursor-pointer text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("users.deleteUser")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
