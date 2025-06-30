import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/ui/section-header";
import { UsersTable } from "@/components/users/users-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { deleteUser } from "@/lib/user-management-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserProfileWithId } from "@/lib/users-service";

export default function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfileWithId | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfileWithId | null>(null);

  const handleEditUser = (user: UserProfileWithId) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleCreateUser = () => {
    setCreateDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success(t("users.userDeleted"), {
        description: t("users.userDeletedDesc", { name: userToDelete?.name }),
      });
    },
    onError: (error) => {
      console.error("Failed to delete user:", error);
      toast.error(t("users.failedToDeleteUser"), {
        description: error.message || t("common.retry"),
      });
    },
  });

  const handleDeleteUser = (user: UserProfileWithId) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  return (
    <>
      <SectionHeader
        title={t("users.management")}
        subtitle={t("users.subtitle")}
        action={handleCreateUser}
        actionText={t("users.addUser")}
        actionIcon={Plus}
      />

      <div className="px-4 lg:px-6">
        <UsersTable 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
        />
      </div>

      {/* Create User Dialog */}
      <UserFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
      />

      {/* Edit User Dialog */}
      <UserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("users.deleteUser")}
        description={
          userToDelete
            ? t("users.deleteConfirmation", {
                name: userToDelete.name,
                email: userToDelete.email,
              })
            : ""
        }
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
