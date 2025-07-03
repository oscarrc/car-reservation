"use client";

import * as React from "react";

import { Calendar as CalendarIcon, Car, Clock2Icon, Users } from "lucide-react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createReservation } from "@/lib/reservations-service";
import { fetchAvailableCars } from "@/lib/cars-service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const reservationSchema = z
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

type ReservationFormData = z.infer<typeof reservationSchema>;

interface ReservationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservationFormDialog({
  open,
  onOpenChange,
}: ReservationFormDialogProps) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const [carDropdownOpen, setCarDropdownOpen] = React.useState(false);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
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

  // Fetch available cars
  const { data: availableCars = [], isLoading: carsLoading } = useQuery({
    queryKey: ["availableCars"],
    queryFn: fetchAvailableCars,
    enabled: open,
  });

  // Create reservation mutation
  const createMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      if (!settings) throw new Error("Settings not loaded");

      const startDateTime = new Date(
        `${data.startDate.toDateString()} ${data.startTime}`
      );
      const endDateTime = new Date(
        `${data.endDate.toDateString()} ${data.endTime}`
      );

      // When autoReservation is true, reservations require admin confirmation (so autoApprove should be false)
      // When autoReservation is false, reservations don't require admin confirmation (so autoApprove should be true)
      const autoApprove = !settings.autoReservation;

      return await createReservation({
        userRef: currentUser.uid,
        carRef: data.carId,
        startDateTime,
        endDateTime,
        driver: data.driver || undefined,
        comments: data.comments || undefined,
        autoApprove,
      });
    },
    onSuccess: (_reservationId, formData) => {
      const selectedCar = availableCars.find(
        (car) => car.id === formData.carId
      );

      // Ensure settings are available for determining message
      if (!settings) return;

      // When autoReservation is false, reservations are auto-approved
      const isAutoApproved = !settings.autoReservation;

      if (isAutoApproved) {
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

      queryClient.invalidateQueries({ queryKey: ["userReservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Failed to create reservation:", error);
      toast.error(t("reservations.failedToCreateReservation"), {
        description: t("common.retry"),
      });
    },
  });

  const onSubmit = (data: ReservationFormData) => {
    createMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !createMutation.isPending) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const getColorCircle = (color: string) => (
    <div
      className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
      style={{ backgroundColor: color.toLowerCase() }}
    />
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:!max-w-fit max-h-[90vh] px-4 sm:px-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("reservations.newReservation")}</DialogTitle>
          <DialogDescription>
            {t("reservations.newReservationDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-4 -mr-4">
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
                                  className="bg-transparent p-0 scale-110 md:scale-100"
                                  disabled={(date) => {
                                    const today = new Date(
                                      new Date().setHours(0, 0, 0, 0)
                                    );
                                    const isPastDate = date < today;

                                    // Check if weekends should be disabled
                                    const isWeekend =
                                      date.getDay() === 0 ||
                                      date.getDay() === 6; // Sunday = 0, Saturday = 6
                                    const weekendsDisabled = settings
                                      ? !settings.weekendReservations
                                      : false;

                                    return (
                                      isPastDate ||
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
                                  className="bg-transparent p-0 scale-110 md:scale-100"
                                  disabled={(date) => {
                                    const today = new Date(
                                      new Date().setHours(0, 0, 0, 0)
                                    );
                                    const startDate =
                                      form.getValues("startDate");
                                    const isPastDate = date < today;
                                    const isBeforeStartDate =
                                      startDate && date < startDate;

                                    // Check if weekends should be disabled
                                    const isWeekend =
                                      date.getDay() === 0 ||
                                      date.getDay() === 6; // Sunday = 0, Saturday = 6
                                    const weekendsDisabled = settings
                                      ? !settings.weekendReservations
                                      : false;

                                    return (
                                      isPastDate ||
                                      isBeforeStartDate ||
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
                                          <Car className="h-4 w-4" />
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
                                  ? "Loading cars..."
                                  : t("reservations.noCarsFound")}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                  {carsLoading ? (
                                    <CommandItem disabled>
                                      Loading available cars...
                                    </CommandItem>
                                  ) : availableCars.length === 0 ? (
                                    <CommandItem disabled>
                                      No cars available
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
                                        <Car className="h-4 w-4" />
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
            </form>
          </Form>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
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
              ? t("reservations.requestReservation")
              : t("reservations.createReservation")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
