"use client";

import type {
  CreateUserData,
  UpdateUserData,
} from "@/lib/user-management-service";
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
import { createUser, updateUser } from "@/lib/user-management-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { UserProfileWithId } from "@/lib/users-service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Email is invalid"),
  phone: z.string().optional(),
  role: z.enum(["admin", "teacher"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Email is invalid"),
  phone: z.string().optional(),
  role: z.enum(["admin", "teacher"]),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfileWithId | null;
  mode: "create" | "edit";
}

function CreateUserForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "teacher",
      password: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      return await createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
      toast.success(t("users.userCreatedSuccessfully"), {
        description: `${form.getValues("name")} has been added to the system.`,
      });
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      toast.error(t("users.failedToCreateUser"), {
        description:
          "Please try again or contact support if the problem persists.",
      });
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.password")} *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter password (min 6 characters)"
                    {...field}
                  />
                </FormControl>
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

          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong>{t("users.note")}:</strong> {t("users.createUserNote")}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createUserMutation.isPending}
            className="cursor-pointer"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createUserMutation.isPending}
            className="cursor-pointer"
          >
            {createUserMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("users.createUser")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
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
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; userData: UpdateUserData }) => {
      if (!currentUser) throw new Error("No current user");
      return await updateUser(data.userId, data.userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
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
  mode,
}: UserFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("users.createNewUser") : t("users.editUser")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("users.createUserDesc")
              : t("users.editUserDesc")}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateUserForm onOpenChange={onOpenChange} />
        ) : user ? (
          <EditUserForm user={user} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
