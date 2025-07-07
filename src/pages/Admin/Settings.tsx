"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Loader2, Save, Trash2 } from "lucide-react";
import * as React from "react";
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
import { ErrorDisplay } from "@/components/ui/error-display";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataCleanupConfirmationDialog } from "@/components/ui/data-cleanup-confirmation-dialog";
import {
  fetchSettings,
  updateSettings,
  type AppSettings,
} from "@/lib/settings-service";
import {
  deleteReservationsByYear,
  getReservationsCountByYear,
} from "@/lib/reservations-service";
import { invalidateReservationQueries } from "@/lib/query-utils";

const settingsSchema = z.object({
  // Reservation Management
  advanceReservation: z.number().min(0),
  autoReservation: z.boolean(),
  autoCancelation: z.boolean(),
  maxReservationDuration: z.number().min(0),
  advanceCancellationTime: z.number().min(0), // max 1 week
  maxConcurrentReservations: z.number().min(0).max(10),

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

  // Data cleanup state
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    React.useState(false);

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

  // Generate list of past years (current year - 10 to current year - 1)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: 10 },
    (_, i) => currentYear - 1 - i
  ).reverse();

  // Query for reservation count for selected year
  const { data: reservationCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ["reservations-count-by-year", selectedYear],
    queryFn: () =>
      selectedYear
        ? getReservationsCountByYear(selectedYear)
        : Promise.resolve(0),
    enabled: !!selectedYear,
  });

  // Mutation for deleting reservations
  const deleteMutation = useMutation({
    mutationFn: deleteReservationsByYear,
    onSuccess: (result, year) => {
      toast.success(t("settings.dataCleanup.successTitle"), {
        description: t("settings.dataCleanup.successDescription", {
          count: result.deletedCount,
          year,
        }),
      });

      // Invalidate all reservation-related queries
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true,
        invalidateReservationsCount: true,
        invalidateDashboard: true,
        invalidateActiveReservationsCount: true,
      });

      // Reset form
      setSelectedYear(null);
      setShowDeleteConfirmation(false);
    },
    onError: (error) => {
      console.error("Error deleting reservations:", error);
      toast.error(t("settings.dataCleanup.errorTitle"), {
        description: t("settings.dataCleanup.errorDescription"),
      });
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

  const handleDeleteConfirm = () => {
    if (selectedYear) {
      deleteMutation.mutate(selectedYear);
    }
  };

  const handleDeleteClick = () => {
    if (selectedYear && reservationCount > 0) {
      setShowDeleteConfirmation(true);
    } else if (selectedYear && reservationCount === 0) {
      toast.info(t("settings.dataCleanup.noDataFound", { year: selectedYear }));
    }
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
      <ErrorDisplay
        error={error}
        onRetry={() => window.location.reload()}
        title={t("settings.errorLoadingSettings")}
        description={t("settings.failedToLoadSettings")}
        homePath="/admin"
      />
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

      <div className="px-4 lg:px-6 space-y-6">
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
                            min="0"
                            max="30"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
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
                            min="0"
                            max="168"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
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
                            min="0"
                            max="10"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
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

        {/* Data Cleanup Card - Full Width */}
        <Card className="lg:col-span-2 border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">
                  {t("settings.dataCleanup.title")}
                </CardTitle>
                <CardDescription>
                  {t("settings.dataCleanup.subtitle")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Year Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("settings.dataCleanup.selectYear")}
                </label>
                <Select
                  value={selectedYear?.toString() || ""}
                  onValueChange={(value) =>
                    setSelectedYear(value ? parseInt(value) : null)
                  }
                >
                  <SelectTrigger className="w-full mb-0 min-h-10">
                    <SelectValue
                      placeholder={t(
                        "settings.dataCleanup.selectYearPlaceholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Record Count Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("settings.dataCleanup.estimatedRecords")}
                </label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted/50 flex items-center text-sm">
                  {selectedYear ? (
                    countLoading ? (
                      <span className="text-muted-foreground">
                        {t("settings.dataCleanup.loadingCount")}
                      </span>
                    ) : (
                      <span>
                        {reservationCount.toLocaleString()}{" "}
                        {t("settings.dataCleanup.reservations")}
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={
                  !selectedYear ||
                  countLoading ||
                  deleteMutation.isPending ||
                  reservationCount === 0
                }
                className="w-full md:w-auto min-h-10"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("settings.dataCleanup.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("settings.dataCleanup.deleteData")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <DataCleanupConfirmationDialog
          open={showDeleteConfirmation}
          onOpenChange={setShowDeleteConfirmation}
          onConfirm={handleDeleteConfirm}
          selectedYear={selectedYear || 0}
          recordCount={reservationCount}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </>
  );
}
