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
      toast.success("Car added successfully", {
        description: `${form.getValues("model")} (${form.getValues(
          "licensePlate"
        )}) has been added to the fleet.`,
      });
    },
    onError: (error) => {
      console.error("Failed to create car:", error);
      toast.error("Failed to add car", {
        description:
          "Please try again or contact support if the problem persists.",
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
                <FormLabel>License Plate</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABC-1234"
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
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="Toyota Camry" {...field} />
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
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="White" {...field} />
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
                <FormLabel>Number of Seats</FormLabel>
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">
                      Out of Service
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
            disabled={createMutation.isPending}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="cursor-pointer"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Car"
            )}
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
    mutationFn: async (data: { carId: string; carData: Partial<Car> }) => {
      return await updateCar(data.carId, data.carData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      onOpenChange(false);
      toast.success("Car updated successfully", {
        description: `${form.getValues("model")} (${form.getValues(
          "licensePlate"
        )}) has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Failed to update car:", error);
      toast.error("Failed to update car", {
        description:
          "Please try again or contact support if the problem persists.",
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
    updateMutation.mutate({ carId: car.id, carData });
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
                <FormLabel>License Plate</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABC-1234"
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
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="Toyota Camry" {...field} />
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
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="White" {...field} />
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
                <FormLabel>Number of Seats</FormLabel>
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">
                      Out of Service
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
            disabled={updateMutation.isPending}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="cursor-pointer"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Car"
            )}
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Car" : "Edit Car"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new car to the fleet. Fill in all the required information."
              : "Update the car information. You can modify any field."}
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
