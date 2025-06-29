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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, updateUser } from "@/lib/user-management-service";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { UserProfileWithId } from "@/lib/users-service";
import { useAuth } from "@/contexts/AuthContext";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfileWithId | null;
  mode: "create" | "edit";
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  mode,
}: UserFormDialogProps) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "teacher" as "admin" | "teacher",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open && mode === "edit" && user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        password: "",
      });
    } else if (open && mode === "create") {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "teacher",
        password: "",
      });
    }
    setErrors({});
  }, [open, mode, user]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      return await createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
      // User creation was successful
      // The user will be automatically signed out due to Firebase behavior
      // They will need to log back in, which is expected
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      setErrors({ submit: error.message || "Failed to create user" });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; userData: UpdateUserData }) => {
      if (!currentUser) throw new Error("No current user");
      return await updateUser(data.userId, data.userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      setErrors({ submit: error.message || "Failed to update user" });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (mode === "create" && !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (mode === "create" && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (mode === "create") {
      const createData: CreateUserData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password,
      };
      createUserMutation.mutate(createData);
    } else if (mode === "edit" && user) {
      const updateData: UpdateUserData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      };
      updateUserMutation.mutate({ userId: user.id, userData: updateData });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isLoading =
    createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the information below to create a new user account."
              : "Update the user information below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name Field */}
            <div className="grid gap-3">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="grid gap-3">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? "border-red-500" : ""}
                disabled={mode === "edit"}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
              {mode === "edit" && (
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed after account creation
                </p>
              )}
            </div>

            {/* Password Field (only for create mode) */}
            {mode === "create" && (
              <div className="grid gap-3">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Enter password (min 6 characters)"
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            )}

            {/* Role Field */}
            <div className="grid gap-3">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "teacher") =>
                  handleInputChange("role", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phone Field */}
            <div className="grid gap-3">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number (optional)"
              />
            </div>

            {/* Create User Warning */}
            {mode === "create" && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                <strong>Note:</strong> Creating a new user will temporarily sign
                you out. You'll need to log back in after the user is created.
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                {errors.submit}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create User" : "Update User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
