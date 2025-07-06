"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { UpdateUserData } from "@/lib/user-management-service";
import type { UserProfileWithId } from "@/lib/users-service";
import { toast } from "sonner";
import { updateUser } from "@/lib/user-management-service";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Email is invalid"),
  phone: z.string().optional(),
  role: z.enum(["admin", "teacher"]),
  suspended: z.boolean(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfileWithId | null;
  mode: "edit";
}

function EditUserForm({
  user,
  onOpenChange,
}: {
  user: UserProfileWithId;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      suspended: user.suspended || false,
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; userData: UpdateUserData }) => {
      if (!currentUser) throw new Error("No current user");
      return await updateUser(data.userId, data.userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      queryClient.invalidateQueries({
        queryKey: ["userReservations", user.id],
      });
      onOpenChange(false);
      toast.success(t("users.userUpdatedSuccessfully"), {
        description: `${form.getValues(
          "name"
        )}'s information has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast.error(t("users.failedToUpdateUser"), {
        description:
          "Please try again or contact support if the problem persists.",
      });
    },
  });

  const onSubmit = (data: EditUserFormData) => {
    updateUserMutation.mutate({ userId: user.id, userData: data });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.name")} *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.email")} *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    disabled
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("users.emailCannotBeChanged")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.role")} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="suspended"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.status")} *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                  value={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="false">{t("users.active")}</SelectItem>
                    <SelectItem value="true">{t("users.suspended")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.phone")}</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter phone number (optional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateUserMutation.isPending}
            className="cursor-pointer"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={updateUserMutation.isPending}
            className="cursor-pointer"
          >
            {updateUserMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("users.updateUser")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("users.editUser")}</DialogTitle>
          <DialogDescription>{t("users.editUserDesc")}</DialogDescription>
        </DialogHeader>

        {user ? <EditUserForm user={user} onOpenChange={onOpenChange} /> : null}
      </DialogContent>
    </Dialog>
  );
}
