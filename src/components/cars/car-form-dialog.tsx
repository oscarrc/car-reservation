"use client";

import type { Car, CarWithId } from "@/types/car";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCar, updateCar } from "@/lib/cars-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const carSchema = z.object({
  licensePlate: z.string().min(1, "License plate is required"),
  model: z.string().min(1, "Model is required"),
  color: z.string().min(1, "Color is required"),
  seats: z
    .number()
    .min(1, "Seats must be between 1 and 20")
    .max(20, "Seats must be between 1 and 20"),
  status: z.enum(["available", "maintenance", "out_of_service"]),
});

type CarFormData = z.infer<typeof carSchema>;

interface CarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  car?: CarWithId;
}

function CreateCarForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      licensePlate: "",
      model: "",
      color: "",
      seats: 4,
      status: "available",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Car) => {
      return await createCar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      onOpenChange(false);
      toast.success(t("fleet.carAdded"), {
        description: t("fleet.carAddedDesc", {
          model: form.getValues("model"),
          licensePlate: form.getValues("licensePlate"),
        }),
      });
    },
    onError: (error) => {
      console.error("Failed to create car:", error);
      toast.error(t("fleet.failedToAddCar"), {
        description: t("common.retry"),
      });
    },
  });

  const onSubmit = (data: CarFormData) => {
    const carData: Car = {
      ...data,
      licensePlate: data.licensePlate.trim().toUpperCase(),
      model: data.model.trim(),
      color: data.color.trim(),
    };
    createMutation.mutate(carData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.licensePlate")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("fleet.licensePlatePlaceholder")}
                    style={{ textTransform: "uppercase" }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.model")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("fleet.modelPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.color")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("fleet.colorPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.numberOfSeats")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 4)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.status")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("fleet.selectStatus")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">{t("fleet.available")}</SelectItem>
                    <SelectItem value="maintenance">{t("fleet.maintenance")}</SelectItem>
                    <SelectItem value="out_of_service">
                      {t("fleet.outOfService")}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("fleet.addCar")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EditCarForm({
  car,
  onOpenChange,
}: {
  car: CarWithId;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      licensePlate: car.licensePlate,
      model: car.model,
      color: car.color,
      seats: car.seats,
      status: car.status,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Car) => {
      return await updateCar(car.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      onOpenChange(false);
      toast.success(t("fleet.carUpdated"), {
        description: t("fleet.carUpdatedDesc", {
          model: form.getValues("model"),
          licensePlate: form.getValues("licensePlate"),
        }),
      });
    },
    onError: (error) => {
      console.error("Failed to update car:", error);
      toast.error(t("fleet.failedToUpdateCar"), {
        description: t("common.retry"),
      });
    },
  });

  const onSubmit = (data: CarFormData) => {
    const carData: Car = {
      ...data,
      licensePlate: data.licensePlate.trim().toUpperCase(),
      model: data.model.trim(),
      color: data.color.trim(),
    };
    updateMutation.mutate(carData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.licensePlate")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("fleet.licensePlatePlaceholder")}
                    style={{ textTransform: "uppercase" }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.model")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("fleet.modelPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.color")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("fleet.colorPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.numberOfSeats")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 4)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.status")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("fleet.selectStatus")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">{t("fleet.available")}</SelectItem>
                    <SelectItem value="maintenance">{t("fleet.maintenance")}</SelectItem>
                    <SelectItem value="out_of_service">
                      {t("fleet.outOfService")}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function CarFormDialog({
  open,
  onOpenChange,
  mode,
  car,
}: CarFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("fleet.addNewCar") : t("fleet.editCar")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("fleet.addNewCarDesc")
              : t("fleet.editCarDesc")}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateCarForm onOpenChange={onOpenChange} />
        ) : car ? (
          <EditCarForm car={car} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
