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
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useState } from "react";

const carSchema = z.object({
  licensePlate: z.string().min(1, "License plate is required"),
  model: z.string().min(1, "Model is required"),
  color: z.string().min(1, "Color is required"),
  seats: z
    .number()
    .min(1, "Seats must be between 1 and 20")
    .max(20, "Seats must be between 1 and 20"),
  status: z.enum(["available", "maintenance", "out_of_service"]),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  description: z.string().optional(),
});

type CarFormData = z.infer<typeof carSchema>;

interface CarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  car?: CarWithId;
}

// Color list data - this should match the colors in the translations
const colorKeys = [
  "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown",
  "black", "white", "gray", "grey", "silver", "gold", "beige", "navy",
  "maroon", "olive", "lime", "aqua", "teal", "fuchsia", "crimson", "indigo",
  "violet", "turquoise", "coral", "salmon", "khaki", "tan", "chocolate",
  "peru", "sienna", "darkred", "darkblue", "darkgreen", "darkgray",
  "lightgray", "lightblue", "lightgreen", "lightyellow", "lightpink",
  "lightcoral", "steelblue", "royalblue", "skyblue", "forestgreen",
  "seagreen", "springgreen"
];

function ColorCombobox({ 
  value, 
  onValueChange, 
  placeholder 
}: { 
  value: string; 
  onValueChange: (value: string) => void; 
  placeholder: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const colors = colorKeys.map(key => ({
    value: key,
    label: t(`fleet.colors.${key}`)
  }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: value.toLowerCase() }}
              />
              <span>{colors.find((color) => color.value === value)?.label}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t("fleet.searchColor")} className="h-9" />
          <CommandList>
            <CommandEmpty>{t("fleet.noColorFound")}</CommandEmpty>
            <CommandGroup>
              {colors.map((color) => (
                <CommandItem
                  key={color.value}
                  value={color.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.value.toLowerCase() }}
                    />
                    <span>{color.label}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === color.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
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
      year: undefined,
      description: "",
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
      year: data.year,
      description: data.description?.trim() || undefined,
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
                  <ColorCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={t("fleet.selectColor")}
                  />
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
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.year")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder={t("fleet.yearPlaceholder")}
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    value={field.value || ""}
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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.otherInformation")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("fleet.descriptionPlaceholder")}
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
      year: car.year,
      description: car.description || "",
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
      year: data.year,
      description: data.description?.trim() || undefined,
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
                  <ColorCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={t("fleet.selectColor")}
                  />
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
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.year")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder={t("fleet.yearPlaceholder")}
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    value={field.value || ""}
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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fleet.otherInformation")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("fleet.descriptionPlaceholder")}
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
