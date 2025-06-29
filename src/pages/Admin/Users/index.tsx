import { useState } from "react";
import { Plus } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { UsersTable } from "@/components/users/users-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { deleteUser } from "@/lib/user-management-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserProfileWithId } from "@/lib/users-service";

export default function UsersPage() {
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
      toast.success("User deleted successfully", {
        description: `${userToDelete?.name} has been removed from the system.`,
      });
    },
    onError: (error) => {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user", {
        description: error.message || "Please try again or contact support if the problem persists.",
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
        title="Users Management"
        subtitle="Manage system users and their permissions"
        action={handleCreateUser}
        actionText="Create User"
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
        title="Delete User"
        description={
          userToDelete
            ? `Are you sure you want to delete ${userToDelete.name} (${userToDelete.email})? This action cannot be undone and will remove the user from the system.`
            : ""
        }
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
