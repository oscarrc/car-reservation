"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Loader2, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "@/components/ui/section-header";
import {
  fetchSettings,
  updateSettings,
  type AppSettings,
} from "@/lib/settings-service";

const settingsSchema = z.object({
  // Reservation Management
  advanceReservation: z.number().min(0).max(30),
  autoReservation: z.boolean(),
  autoCancelation: z.boolean(),
  maxReservationDuration: z.number().min(1).max(30),
  advanceCancellationTime: z.number().min(1).max(168), // max 1 week
  maxConcurrentReservations: z.number().min(1).max(10),
  minTimeBetweenReservations: z.number().min(0).max(72), // max 3 days

  // System Configuration
  weekendReservations: z.boolean(),
  businessHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  businessHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  supportEmails: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    values: settings
      ? {
          ...settings,
          supportEmails: settings.supportEmails?.join("\n") || "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(t("settings.settingsUpdated"));
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error(t("settings.failedToUpdateSettings"));
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    const settingsToUpdate: AppSettings = {
      ...data,
      supportEmails: data.supportEmails
        ? data.supportEmails
            .split("\n")
            .map((email) => email.trim())
            .filter((email) => email.length > 0)
        : [],
    };
    updateMutation.mutate(settingsToUpdate);
  };

  const handleSaveSettings = () => {
    form.handleSubmit(onSubmit)();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <h2 className="text-xl font-semibold text-muted-foreground">
            {t("loading.loadingSettings")}
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-destructive mb-2">
            {t("settings.errorLoadingSettings")}
          </h2>
          <p className="text-muted-foreground">
            {t("settings.failedToLoadSettings")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        action={handleSaveSettings}
        actionText={
          updateMutation.isPending
            ? t("settings.saving")
            : t("settings.saveSettings")
        }
        actionIcon={updateMutation.isPending ? Loader2 : Save}
      />

      <div className="px-4 lg:px-6">
        <Form {...form}>
          <form className="grid gap-6 lg:grid-cols-2">
            {/* Reservation Management */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.reservationManagement")}</CardTitle>
                <CardDescription>
                  {t("settings.reservationSubtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="advanceReservation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("settings.advanceReservation")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.advanceReservationDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxReservationDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("settings.maxReservationDuration")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.maxReservationDurationDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advanceCancellationTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("settings.advanceCancellation")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="168"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.advanceCancellationDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxConcurrentReservations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.maxConcurrent")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.maxConcurrentDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minTimeBetweenReservations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("settings.minTimeBetweenReservations")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="72"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.minTimeBetweenReservationsDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="autoReservation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t("settings.autoReservation")}
                          </FormLabel>
                          <FormDescription>
                            {t("settings.autoReservationDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoCancelation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t("settings.autoCancellation")}
                          </FormLabel>
                          <FormDescription>
                            {t("settings.autoCancellationDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.systemConfiguration")}</CardTitle>
                <CardDescription>
                  {t("settings.systemConfigurationDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="weekendReservations"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t("settings.weekendReservations")}
                          </FormLabel>
                          <FormDescription>
                            {t("settings.weekendReservationsDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">
                      {t("settings.businessHours")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.businessHoursDesc")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessHoursStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("settings.businessHoursStart")}
                          </FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessHoursEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("settings.businessHoursEnd")}
                          </FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="supportEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.supportEmails")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("settings.supportEmailsPlaceholder")}
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("settings.supportEmailsDesc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </>
  );
}
