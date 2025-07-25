"use client";

import * as React from "react";

import {
  Calendar as CalendarIcon,
  CarFront,
  Clock2Icon,
  Users,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  checkReservationOverlap,
  createReservation,
  updateReservation,
} from "@/lib/reservations-service";
import {
  fetchAvailableCarsForDateRange,
  fetchCarById,
} from "@/lib/cars-service";
import { format, getLocalizedFormats } from "@/lib/date-locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import type { ReservationWithId } from "@/types/reservation";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fetchUserById } from "@/lib/users-service";
import { invalidateReservationQueries } from "@/lib/query-utils";
import { queryConfig } from "@/lib/query-config";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createReservationSchema = z
  .object({
    carId: z.string().min(1, "Car selection is required"),
    startDate: z.date({ required_error: "Start date is required" }),
    startTime: z.string().min(1, "Start time is required"),
    endDate: z.date({ required_error: "End date is required" }),
    endTime: z.string().min(1, "End time is required"),
    driver: z.string().optional(),
    comments: z.string().optional(),
  })
  .refine(
    (data) => {
      const startDateTime = new Date(
        `${data.startDate.toDateString()} ${data.startTime}`
      );
      const endDateTime = new Date(
        `${data.endDate.toDateString()} ${data.endTime}`
      );
      return endDateTime > startDateTime;
    },
    {
      message: "End date and time must be after start date and time",
      path: ["endDate"],
    }
  );

const editReservationSchema = z.object({
  carId: z.string().min(1, "Car selection is required"),
  status: z.enum(["pending", "confirmed", "cancelled", "cancellation_pending", "rejected"]),
  driver: z.string().optional(),
  comments: z.string().optional(),
});

type CreateReservationFormData = z.infer<typeof createReservationSchema>;
type EditReservationFormData = z.infer<typeof editReservationSchema>;

interface ReservationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: ReservationWithId | null;
  mode: "create" | "edit";
}

function CreateReservationForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const [carDropdownOpen, setCarDropdownOpen] = React.useState(false);
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(new Date());

  const form = useForm<CreateReservationFormData>({
    resolver: zodResolver(createReservationSchema),
    defaultValues: {
      carId: "",
      startDate: undefined,
      startTime: "08:00",
      endDate: undefined,
      endTime: "17:00",
      driver: "",
      comments: "",
    },
  });

  // Watch form values for date/time changes
  const startDate = form.watch("startDate");
  const startTime = form.watch("startTime");
  const endDate = form.watch("endDate");
  const endTime = form.watch("endTime");

  // Calculate start and end date times
  const startDateTime = React.useMemo(() => {
    if (!startDate || !startTime) return null;
    return new Date(`${startDate.toDateString()} ${startTime}`);
  }, [startDate, startTime]);

  const endDateTime = React.useMemo(() => {
    if (!endDate || !endTime) return null;
    return new Date(`${endDate.toDateString()} ${endTime}`);
  }, [endDate, endTime]);

  // Fetch available cars for the selected date/time range
  const { data: availableCars = [], isLoading: carsLoading } = useQuery({
    queryKey: [
      "availableCarsForDateRange",
      startDateTime?.toISOString(),
      endDateTime?.toISOString(),
    ],
    queryFn: () => {
      if (!startDateTime || !endDateTime) {
        throw new Error("Start and end date/time are required");
      }
      return fetchAvailableCarsForDateRange(startDateTime, endDateTime);
    },
    enabled: !!startDateTime && !!endDateTime,
    staleTime: queryConfig.availableCars.staleTime,
    gcTime: queryConfig.availableCars.gcTime,
  });

  // Create reservation mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateReservationFormData) => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      if (!settings) throw new Error("Settings not loaded");

      const startDateTime = new Date(
        `${data.startDate.toDateString()} ${data.startTime}`
      );
      const endDateTime = new Date(
        `${data.endDate.toDateString()} ${data.endTime}`
      );

      // Check for overlap if auto-reservation is enabled (will be confirmed immediately)
      if (settings?.autoReservation) {
        const hasOverlap = await checkReservationOverlap(
          data.carId,
          startDateTime,
          endDateTime
        );

        if (hasOverlap) {
          throw new Error("OVERLAP_ERROR");
        }
      }

      return await createReservation({
        userRef: currentUser.uid,
        carRef: data.carId,
        startDateTime,
        endDateTime,
        driver: data.driver || undefined,
        comments: data.comments || undefined,
        autoReservation: settings?.autoReservation || false,
      });
    },
    onSuccess: (_reservationId, formData) => {
      const selectedCar = availableCars.find(
        (car) => car.id === formData.carId
      );

      if (settings?.autoReservation) {
        toast.success(t("reservations.reservationConfirmed"), {
          description: t("reservations.reservationConfirmedDesc", {
            car: selectedCar?.model || t("common.unknown"),
          }),
        });
      } else {
        toast.success(t("reservations.reservationSubmitted"), {
          description: t("reservations.reservationSubmittedDesc", {
            car: selectedCar?.model || t("common.unknown"),
          }),
        });
      }

      // Use utility for targeted invalidation after creating reservation
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true, // Update all reservation lists
        invalidateReservationsCount: true, // Update counts
        invalidateDashboard: true, // New reservations affect dashboard
        invalidateActiveReservationsCount: true,
        invalidateAvailableCars: true,
        specificUserId: currentUser?.uid,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Failed to create reservation:", error);

      if (error.message === "OVERLAP_ERROR") {
        toast.error(t("reservations.overlapError"), {
          description: t("reservations.overlapErrorDesc"),
        });
      } else {
        toast.error(t("reservations.failedToCreateReservation"), {
          description: t("common.retry"),
        });
      }
    },
  });

  const onSubmit = (data: CreateReservationFormData) => {
    createMutation.mutate(data);
  };

  const getColorCircle = (color: string) => (
    <div
      className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
      style={{ backgroundColor: color.toLowerCase() }}
    />
  );

  return (
    <Form {...form}>
      <form
        id="reservation-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="w-full md:w-fit mx-auto space-y-6">
          {/* Date and Time Selection */}
          <Card className="w-full md:w-fit py-8 sm:py-4">
            <CardContent className="px-2 sm:px-4">
              <div className="flex flex-col md:flex-row gap-8 md:gap-6 justify-center">
                {/* Start Date and Time */}
                <div className="flex flex-col mx-auto md:mx-0">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            className="bg-transparent p-0 scale-110 md:scale-100"
                            disabled={(date) => {
                              const today = new Date(
                                new Date().setHours(0, 0, 0, 0)
                              );
                              const isPastDate = date < today;

                              // Check advance reservation requirement
                              const advanceReservationDays =
                                settings?.advanceReservation || 0;
                              const minReservationDate = new Date(today);
                              minReservationDate.setDate(
                                today.getDate() + advanceReservationDays
                              );
                              const isWithinAdvanceReservation =
                                date < minReservationDate;

                              // Check if weekends should be disabled
                              const isWeekend =
                                date.getDay() === 0 || date.getDay() === 6; // Sunday = 0, Saturday = 6
                              const weekendsDisabled = settings
                                ? !settings.weekendReservations
                                : false;

                              return (
                                isPastDate ||
                                isWithinAdvanceReservation ||
                                (weekendsDisabled && isWeekend)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* End Date and Time */}
                <div className="flex flex-col mx-auto md:mx-0">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            className="bg-transparent p-0 scale-110 md:scale-100"
                            disabled={(date) => {
                              const today = new Date(
                                new Date().setHours(0, 0, 0, 0)
                              );
                              const startDate = form.getValues("startDate");
                              const isPastDate = date < today;
                              const isBeforeStartDate =
                                startDate && date < startDate;

                              // Check advance reservation requirement
                              const advanceReservationDays =
                                settings?.advanceReservation || 0;
                              const minReservationDate = new Date(today);
                              minReservationDate.setDate(
                                today.getDate() + advanceReservationDays
                              );
                              const isWithinAdvanceReservation =
                                date < minReservationDate;

                              // Check maximum reservation duration (only if enabled - maxReservationDuration > 0)
                              const maxReservationDuration =
                                settings?.maxReservationDuration || 0;
                              let isExceedsMaxDuration = false;
                              if (startDate && maxReservationDuration > 0) {
                                const maxEndDate = new Date(startDate);
                                maxEndDate.setDate(
                                  startDate.getDate() + maxReservationDuration
                                );
                                isExceedsMaxDuration = date > maxEndDate;
                              }

                              // Check if weekends should be disabled
                              const isWeekend =
                                date.getDay() === 0 || date.getDay() === 6; // Sunday = 0, Saturday = 6
                              const weekendsDisabled = settings
                                ? !settings.weekendReservations
                                : false;

                              return (
                                isPastDate ||
                                isBeforeStartDate ||
                                isWithinAdvanceReservation ||
                                isExceedsMaxDuration ||
                                (weekendsDisabled && isWeekend)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 sm:gap-6 border-t px-2 sm:px-4 !pt-3 sm:!pt-4">
              <div className="flex flex-col w-full md:flex-row gap-4 md:gap-6">
                {/* Start Time */}
                <div className="flex w-full flex-col gap-3">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel htmlFor="start-time">
                          {t("reservations.startTime")}
                        </FormLabel>
                        <div className="relative flex w-full items-center gap-2">
                          <Clock2Icon className="text-muted-foreground pointer-events-none absolute left-2.5 size-4 select-none" />
                          <FormControl>
                            <Input
                              id="start-time"
                              type="time"
                              step="1"
                              className="appearance-none pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* End Time */}
                <div className="flex w-full flex-col gap-3">
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel htmlFor="end-time">
                          {t("reservations.endTime")}
                        </FormLabel>
                        <div className="relative flex w-full items-center gap-2">
                          <Clock2Icon className="text-muted-foreground pointer-events-none absolute left-2.5 size-4 select-none" />
                          <FormControl>
                            <Input
                              id="end-time"
                              type="time"
                              step="1"
                              className="appearance-none pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardFooter>
          </Card>

          <div className="w-full space-y-6">
            {/* Car Selection */}
            <FormField
              control={form.control}
              name="carId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("reservations.selectCar")}</FormLabel>
                  <Popover
                    modal={true}
                    open={carDropdownOpen}
                    onOpenChange={setCarDropdownOpen}
                  >
                    <PopoverTrigger
                      asChild
                      disabled={!startDateTime || !endDateTime}
                    >
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? (() => {
                                const selectedCar = availableCars.find(
                                  (car) => car.id === field.value
                                );
                                return selectedCar ? (
                                  <div className="flex items-center gap-3 flex-1 text-left">
                                    <CarFront className="h-4 w-4" />
                                    <div className="flex items-center gap-2">
                                      {getColorCircle(selectedCar.color)}
                                      <span className="font-medium">
                                        {selectedCar.model}
                                      </span>
                                      <span className="text-muted-foreground">
                                        ({selectedCar.licensePlate})
                                      </span>
                                      <div className="flex items-center gap-1 ml-auto">
                                        <Users className="h-3 w-3" />
                                        <span className="text-sm">
                                          {selectedCar.seats}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  t("reservations.selectCar")
                                );
                              })()
                            : t("reservations.selectCar")}
                          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={t("reservations.searchCars")}
                        />
                        <CommandEmpty>
                          {carsLoading
                            ? t("loading.loadingCars")
                            : startDateTime && endDateTime
                            ? t("reservations.noCarsAvailableForDates")
                            : t("reservations.noCarsFound")}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {carsLoading ? (
                              <CommandItem disabled>
                                {t("loading.loadingCars")}
                              </CommandItem>
                            ) : availableCars.length === 0 ? (
                              <CommandItem disabled>
                                {startDateTime && endDateTime
                                  ? t("reservations.noCarsAvailableForDates")
                                  : "No cars available"}
                              </CommandItem>
                            ) : (
                              availableCars.map((car) => (
                                <CommandItem
                                  key={car.id}
                                  onSelect={() => {
                                    field.onChange(car.id);
                                    setCarDropdownOpen(false);
                                  }}
                                  className="flex items-center gap-3 p-3"
                                >
                                  <CarFront className="h-4 w-4" />
                                  <div className="flex items-center gap-2 flex-1">
                                    {getColorCircle(car.color)}
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {car.model}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {car.licensePlate}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                      <Users className="h-3 w-3" />
                                      <span className="text-sm">
                                        {car.seats}
                                      </span>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Driver */}
            <FormField
              control={form.control}
              name="driver"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.driver")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("reservations.driverPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comments */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.comments")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("reservations.commentsPlaceholder")}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || !settings}
            form="reservation-form"
          >
            {createMutation.isPending
              ? t("common.saving")
              : !settings
              ? t("loading.loadingSettings")
              : settings.autoReservation
              ? t("reservations.createReservation")
              : t("reservations.requestReservation")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EditReservationForm({
  reservation,
  onOpenChange,
}: {
  reservation: ReservationWithId;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [carDropdownOpen, setCarDropdownOpen] = React.useState(false);

  const form = useForm<EditReservationFormData>({
    resolver: zodResolver(editReservationSchema),
    defaultValues: {
      carId: reservation.carRef.id,
      status: reservation.status,
      driver: reservation.driver || "",
      comments: reservation.comments || "",
    },
  });

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ["user", reservation.userRef.id],
    queryFn: () => fetchUserById(reservation.userRef.id),
    staleTime: queryConfig.users.staleTime,
    gcTime: queryConfig.users.gcTime,
  });

  // Fetch available cars for the reservation time period
  const { data: availableCars = [], isLoading: carsLoading } = useQuery({
    queryKey: [
      "availableCarsForDateRange",
      reservation.startDateTime.toISOString(),
      reservation.endDateTime.toISOString(),
      reservation.id, // Include reservation ID to exclude itself from conflicts
    ],
    queryFn: async () => {
      // Get available cars for this time slot (excluding current reservation)
      const cars = await fetchAvailableCarsForDateRange(
        reservation.startDateTime,
        reservation.endDateTime
      );

      // Also include the currently selected car even if it has conflicts (since it's this reservation)
      const currentCar = await fetchCarById(reservation.carRef.id);
      const isCurrentCarIncluded = cars.some(
        (car) => car.id === currentCar?.id
      );

      if (currentCar && !isCurrentCarIncluded) {
        cars.unshift(currentCar);
      }

      return cars;
    },
    staleTime: queryConfig.availableCars.staleTime,
    gcTime: queryConfig.availableCars.gcTime,
  });

  // Update reservation mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EditReservationFormData) => {
      // Check for overlap if confirming a reservation
      if (data.status === "confirmed") {
        const hasOverlap = await checkReservationOverlap(
          data.carId,
          reservation.startDateTime,
          reservation.endDateTime,
          reservation.id
        );

        if (hasOverlap) {
          throw new Error("OVERLAP_ERROR");
        }
      }

      return await updateReservation(reservation.id, {
        carRef: data.carId,
        status: data.status,
        driver: data.driver || undefined,
        comments: data.comments || undefined,
      });
    },
    onSuccess: (_, formData) => {
      const selectedCar = availableCars.find(
        (car) => car.id === formData.carId
      );

      toast.success(t("reservations.reservationUpdated"), {
        description: t("reservations.reservationUpdatedDesc", {
          car: selectedCar?.model || t("common.unknown"),
        }),
      });

      // Use utility for targeted invalidation after updating reservation
      invalidateReservationQueries(queryClient, {
        invalidateReservationsList: true, // Update all reservation lists
        invalidateReservationsCount: false, // Count doesn't change on edit
        invalidateDashboard: false, // Edits don't typically affect dashboard
        invalidateActiveReservationsCount: false,
        invalidateAvailableCars: true, // Car/date changes affect availability
        specificReservationId: reservation.id,
        specificUserId: reservation.userRef?.id,
        specificCarId:
          formData.carId !== reservation.carRef?.id
            ? formData.carId
            : undefined,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Failed to update reservation:", error);

      if (error.message === "OVERLAP_ERROR") {
        toast.error(t("reservations.overlapError"), {
          description: t("reservations.overlapErrorDesc"),
        });
      } else {
        toast.error(t("reservations.failedToUpdateReservation"), {
          description: t("common.retry"),
        });
      }
    },
  });

  const onSubmit = (data: EditReservationFormData) => {
    updateMutation.mutate(data);
  };

  const getColorCircle = (color: string) => (
    <div
      className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
      style={{ backgroundColor: color.toLowerCase() }}
    />
  );

  return (
    <Form {...form}>
      <form
        id="edit-reservation-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* User Information (disabled) */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("reservations.userInformation")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t("users.name")}</label>
              <Input value={userData?.name || t("common.loading")} disabled />
            </div>
            <div>
              <label className="text-sm font-medium">{t("users.email")}</label>
              <Input value={userData?.email || t("common.loading")} disabled />
            </div>
          </div>
        </div>

        {/* Reservation Dates (disabled) */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("reservations.reservationDates")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                {t("reservations.startDateTime")}
              </label>
              <Input
                value={format(
                  reservation.startDateTime,
                  getLocalizedFormats().dateTime
                )}
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("reservations.endDateTime")}
              </label>
              <Input
                value={format(
                  reservation.endDateTime,
                  getLocalizedFormats().dateTime
                )}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-6">
          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservations.status")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("reservations.selectStatus")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">
                      {t("reservations.pending")}
                    </SelectItem>
                    <SelectItem value="confirmed">
                      {t("reservations.confirmed")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("reservations.cancelled")}
                    </SelectItem>
                    <SelectItem value="cancellation_pending">
                      {t("reservations.cancellation_pending")}
                    </SelectItem>
                    <SelectItem value="rejected">
                      {t("reservations.rejected")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Car Selection */}
          <FormField
            control={form.control}
            name="carId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("reservations.selectCar")}</FormLabel>
                <Popover
                  open={carDropdownOpen}
                  onOpenChange={setCarDropdownOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? (() => {
                              const selectedCar = availableCars.find(
                                (car) => car.id === field.value
                              );
                              return selectedCar ? (
                                <div className="flex items-center gap-3 flex-1 text-left">
                                  <CarFront className="h-4 w-4" />
                                  <div className="flex items-center gap-2">
                                    {getColorCircle(selectedCar.color)}
                                    <span className="font-medium">
                                      {selectedCar.model}
                                    </span>
                                    <span className="text-muted-foreground">
                                      ({selectedCar.licensePlate})
                                    </span>
                                    <div className="flex items-center gap-1 ml-auto">
                                      <Users className="h-3 w-3" />
                                      <span className="text-sm">
                                        {selectedCar.seats}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                t("reservations.selectCar")
                              );
                            })()
                          : t("reservations.selectCar")}
                        <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder={t("reservations.searchCars")}
                      />
                      <CommandEmpty>
                        {carsLoading
                          ? t("loading.loadingCars")
                          : t("reservations.noCarsFound")}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {carsLoading ? (
                            <CommandItem disabled>
                              {t("loading.loadingCars")}
                            </CommandItem>
                          ) : availableCars.length === 0 ? (
                            <CommandItem disabled>
                              {t("reservations.noCarsFound")}
                            </CommandItem>
                          ) : (
                            availableCars.map((car) => (
                              <CommandItem
                                key={car.id}
                                onSelect={() => {
                                  field.onChange(car.id);
                                  setCarDropdownOpen(false);
                                }}
                                className="flex items-center gap-3 p-3"
                              >
                                <CarFront className="h-4 w-4" />
                                <div className="flex items-center gap-2 flex-1">
                                  {getColorCircle(car.color)}
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {car.model}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {car.licensePlate}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 ml-auto">
                                    <Users className="h-3 w-3" />
                                    <span className="text-sm">{car.seats}</span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))
                          )}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Driver */}
          <FormField
            control={form.control}
            name="driver"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservations.driver")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("reservations.driverPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Comments */}
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservations.comments")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("reservations.commentsPlaceholder")}
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            form="edit-reservation-form"
          >
            {updateMutation.isPending
              ? t("common.saving")
              : t("reservations.updateReservation")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ReservationFormDialog({
  open,
  onOpenChange,
  reservation,
  mode,
}: ReservationFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-fit max-h-[90vh] px-4 sm:px-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "create"
              ? t("reservations.newReservation")
              : t("reservations.editReservation")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("reservations.newReservationDesc")
              : t("reservations.editReservationDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-4 -mr-4">
          {mode === "create" ? (
            <CreateReservationForm onOpenChange={onOpenChange} />
          ) : reservation ? (
            <EditReservationForm
              reservation={reservation}
              onOpenChange={onOpenChange}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
