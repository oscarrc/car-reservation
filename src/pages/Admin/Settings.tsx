"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { fetchSettings, updateSettings, type AppSettings } from "@/lib/settings-service";

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
  weekendReservationsEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
  businessHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  businessHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  supportEmails: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
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
    values: settings ? {
      ...settings,
      supportEmails: settings.supportEmails?.join('\n') || '',
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    const settingsToUpdate: AppSettings = {
      ...data,
      supportEmails: data.supportEmails 
        ? data.supportEmails.split('\n').map(email => email.trim()).filter(email => email.length > 0)
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
            Loading Settings...
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
            Error Loading Settings
          </h2>
          <p className="text-muted-foreground">
            Failed to load application settings. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title="Application Settings"
        subtitle="Configure system behavior and business rules for the car reservation system"
        action={handleSaveSettings}
        actionText={updateMutation.isPending ? "Saving..." : "Save Settings"}
        actionIcon={updateMutation.isPending ? Loader2 : Save}
      />

      <div className="px-4 lg:px-6 max-w-6xl mx-auto">
        <Form {...form}>
          <form className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reservation Management */}
            <Card>
              <CardHeader>
                <CardTitle>Reservation Management</CardTitle>
                <CardDescription>
                  Configure how reservations are handled and validated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="advanceReservation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advance Reservation (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum days before a reservation can be made (Mon-Fri)
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
                        <FormLabel>Maximum Reservation Duration (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of days a car can be reserved
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
                        <FormLabel>Advance Cancellation Time (Hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="168"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Hours before reservation start to allow cancellation
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
                        <FormLabel>Max Concurrent Reservations</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum concurrent reservations per user
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
                        <FormLabel>Min Time Between Reservations (Hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="72"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum hours between reservations for the same user
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
                          <FormLabel className="text-base">Auto-approve Reservations</FormLabel>
                          <FormDescription>
                            Automatically approve new reservations without admin confirmation
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
                          <FormLabel className="text-base">Auto-approve Cancellations</FormLabel>
                          <FormDescription>
                            Automatically approve cancellation requests without admin confirmation
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
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  General system settings and business hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="businessHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Hours Start</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Start time for business operations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Hours End</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          End time for business operations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="supportEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email Addresses</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter support email addresses, one per line&#10;support@company.com&#10;help@company.com"
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter email addresses for support notifications, one per line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="weekendReservationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Weekend Reservations</FormLabel>
                          <FormDescription>
                            Allow users to make reservations for weekends
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
                    name="emailNotificationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Send email notifications for reservation updates
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
          </form>
        </Form>
      </div>
    </>
  );
} 