"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Lock, Mail, User } from "lucide-react";
import {
  updateDisplayName,
  updateUserEmail,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/profile-service";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number must be at least 9 characters"),
});

// Email form schema
const emailSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newEmail: z.string().email("Invalid email address"),
    confirmEmail: z.string().email("Invalid email address"),
  })
  .refine((data) => data.newEmail === data.confirmEmail, {
    message: "Email addresses don't match",
    path: ["confirmEmail"],
  });

// Password form schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { currentUser, userProfile } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile?.name || "",
      phone: userProfile?.phone || "",
    },
  });

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      currentPassword: "",
      newEmail: "",
      confirmEmail: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    if (!currentUser) return;

    setIsUpdatingProfile(true);
    try {
      // Update profile in Firestore
      await updateUserProfile(currentUser.uid, data);

      // Update display name in Firebase Auth
      await updateDisplayName(currentUser, data.name);

      toast.success(t("profile.profileUpdated"));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : t("profile.failedToUpdateProfile")
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onUpdateEmail = async (data: EmailFormData) => {
    if (!currentUser) return;

    setIsUpdatingEmail(true);
    try {
      await updateUserEmail(currentUser, {
        currentPassword: data.currentPassword,
        newEmail: data.newEmail,
      });

      emailForm.reset();
      toast.success(t("profile.emailUpdated"));
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(
        error instanceof Error ? error.message : t("profile.failedToUpdateEmail")
      );
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    if (!currentUser) return;

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(currentUser, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      passwordForm.reset();
      toast.success(t("profile.passwordUpdated"));
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(
        error instanceof Error ? error.message : t("profile.failedToUpdatePassword")
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <h2 className="text-xl font-semibold text-muted-foreground">
            {t("loading.loadingProfile")}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("profile.settings")}
        subtitle={t("profile.subtitle")}
      />

      <div className="px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("profile.information")}
              </CardTitle>
              <CardDescription>
                {t("profile.informationDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onUpdateProfile)}
                  className="flex flex-col justify-between h-full"
                >
                  <div className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.fullName")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("profile.fullNamePlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.phoneNumber")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("profile.phoneNumberPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full"
                    >
                      {isUpdatingProfile && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("profile.updateProfile")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Change Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t("profile.changeEmail")}
              </CardTitle>
              <CardDescription>
                {t("profile.changeEmailDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(onUpdateEmail)}
                  className="flex flex-col justify-between h-full"
                >
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{t("profile.currentEmail")}</p>
                      <p className="font-medium">{currentUser.email}</p>
                    </div>

                    <FormField
                      control={emailForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.currentPassword")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("profile.currentPasswordPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="newEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.newEmail")}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t("profile.newEmailPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="confirmEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.confirmEmail")}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t("profile.confirmEmailPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isUpdatingEmail}
                      className="w-full"
                      variant="outline"
                    >
                      {isUpdatingEmail && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("profile.updateEmail")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t("profile.changePassword")}
              </CardTitle>
              <CardDescription>
                {t("profile.changePasswordDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onUpdatePassword)}
                  className="flex flex-col justify-between h-full"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.currentPassword")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("profile.currentPasswordPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.newPassword")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("profile.newPasswordPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.confirmNewPassword")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("profile.confirmNewPasswordPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isUpdatingPassword}
                      variant="outline"
                    >
                      {isUpdatingPassword && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("profile.updatePassword")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
