import { useMutation, useQueryClient } from "@tanstack/react-query";

import { SectionHeader } from "@/components/ui/section-header";
import { StatusConfirmationDialog } from "@/components/ui/status-confirmation-dialog";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import type { UserProfileWithId } from "@/lib/users-service";
import { UsersTable } from "@/components/users/users-table";
import { toast } from "sonner";
import { toggleUserSuspension } from "@/lib/users-service";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfileWithId | null>(
    null
  );
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userToChangeStatus, setUserToChangeStatus] =
    useState<UserProfileWithId | null>(null);
  const [statusAction, setStatusAction] = useState<"suspend" | "unsuspend">(
    "suspend"
  );

  const handleEditUser = (user: UserProfileWithId) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };





  const suspendMutation = useMutation({
    mutationFn: async ({
      userId,
      currentStatus,
    }: {
      userId: string;
      currentStatus: boolean;
    }) => {
      return await toggleUserSuspension(userId, currentStatus);
    },
    onSuccess: (_, { currentStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const action = currentStatus ? "unsuspended" : "suspended";
      toast.success(
        t(`users.user${action.charAt(0).toUpperCase() + action.slice(1)}`),
        {
          description: t(
            `users.user${action.charAt(0).toUpperCase() + action.slice(1)}Desc`
          ),
        }
      );
      setStatusDialogOpen(false);
      setUserToChangeStatus(null);
    },
    onError: (error, { currentStatus }) => {
      console.error("Failed to toggle user suspension:", error);
      const action = currentStatus ? "unsuspend" : "suspend";
      toast.error(
        t(
          `users.failedTo${
            action.charAt(0).toUpperCase() + action.slice(1)
          }User`
        ),
        {
          description: error.message || t("common.retry"),
        }
      );
    },
  });



  const handleSuspendUser = (user: UserProfileWithId) => {
    setUserToChangeStatus(user);
    setStatusAction("suspend");
    setStatusDialogOpen(true);
  };

  const handleUnsuspendUser = (user: UserProfileWithId) => {
    setUserToChangeStatus(user);
    setStatusAction("unsuspend");
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (userToChangeStatus) {
      suspendMutation.mutate({
        userId: userToChangeStatus.id,
        currentStatus: userToChangeStatus.suspended,
      });
    }
  };



  return (
    <>
      <SectionHeader
        title={t("users.management")}
        subtitle={t("users.subtitle")}
      />

      <div className="px-4 lg:px-6">
        <UsersTable
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEditUser={handleEditUser}
          onSuspendUser={handleSuspendUser}
          onUnsuspendUser={handleUnsuspendUser}
        />
      </div>



      {/* Edit User Dialog */}
      <UserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        mode="edit"
      />



      {/* Status Change Confirmation Dialog */}
      <StatusConfirmationDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onConfirm={confirmStatusChange}
        title={
          userToChangeStatus && statusAction === "suspend"
            ? t("users.suspendConfirmation", { name: userToChangeStatus.name })
            : userToChangeStatus
            ? t("users.unsuspendConfirmation", {
                name: userToChangeStatus.name,
              })
            : ""
        }
        description={
          userToChangeStatus && statusAction === "suspend"
            ? t("users.suspendConfirmationDesc", {
                name: userToChangeStatus.name,
                email: userToChangeStatus.email,
              })
            : userToChangeStatus
            ? t("users.unsuspendConfirmationDesc", {
                name: userToChangeStatus.name,
                email: userToChangeStatus.email,
              })
            : ""
        }
        action={statusAction}
        isLoading={suspendMutation.isPending}
      />
    </>
  );
}
