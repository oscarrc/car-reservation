"use client";

import type { Car, CarStatus, CarWithId } from "@/types/car";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCar, updateCar } from "@/lib/cars-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  car?: CarWithId;
}

interface CarFormData {
  licensePlate: string;
  model: string;
  color: string;
  seats: number;
  status: CarStatus;
}

interface CarFormErrors {
  licensePlate?: string;
  model?: string;
  color?: string;
  seats?: string;
  status?: string;
}

export function CarFormDialog({
  open,
  onOpenChange,
  mode,
  car,
}: CarFormDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CarFormData>({
    licensePlate: "",
    model: "",
    color: "",
    seats: 4,
    status: "available",
  });
  const [errors, setErrors] = useState<Partial<CarFormErrors>>({});

  // Reset form when dialog opens/closes or mode changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && car) {
        setFormData({
          licensePlate: car.licensePlate,
          model: car.model,
          color: car.color,
          seats: car.seats,
          status: car.status,
        });
      } else {
        setFormData({
          licensePlate: "",
          model: "",
          color: "",
          seats: 4,
          status: "available",
        });
      }
      setErrors({});
    }
  }, [open, mode, car]);

  const createMutation = useMutation({
    mutationFn: async (data: Car) => {
      return await createCar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      onOpenChange(false);
      toast.success("Car added successfully", {
        description: `${formData.model} (${formData.licensePlate}) has been added to the fleet.`,
      });
    },
    onError: (error) => {
      console.error("Failed to create car:", error);
      toast.error("Failed to add car", {
        description: "Please try again or contact support if the problem persists.",
      });
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
        description: `${formData.model} (${formData.licensePlate}) has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Failed to update car:", error);
      toast.error("Failed to update car", {
        description: "Please try again or contact support if the problem persists.",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<CarFormErrors> = {};

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = "License plate is required";
    }

    if (!formData.model.trim()) {
      newErrors.model = "Model is required";
    }

    if (!formData.color.trim()) {
      newErrors.color = "Color is required";
    }

    if (formData.seats < 1 || formData.seats > 20) {
      newErrors.seats = "Seats must be between 1 and 20";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const carData: Car = {
      licensePlate: formData.licensePlate.trim().toUpperCase(),
      model: formData.model.trim(),
      color: formData.color.trim(),
      seats: formData.seats,
      status: formData.status,
    };

    if (mode === "create") {
      createMutation.mutate(carData);
    } else if (mode === "edit" && car) {
      updateMutation.mutate({
        carId: car.id,
        carData,
      });
    }
  };

  const handleInputChange = (
    field: keyof CarFormData,
    value: string | number | CarStatus
  ) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          [field]: value,
        } as CarFormData)
    );
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            {/* License Plate */}
            <div className="grid gap-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) =>
                  handleInputChange("licensePlate", e.target.value)
                }
                placeholder="ABC-1234"
                className={errors.licensePlate ? "border-red-500" : ""}
                style={{ textTransform: "uppercase" }}
              />
              {errors.licensePlate && (
                <p className="text-sm text-red-500">{errors.licensePlate}</p>
              )}
            </div>

            {/* Model */}
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="Toyota Camry"
                className={errors.model ? "border-red-500" : ""}
              />
              {errors.model && (
                <p className="text-sm text-red-500">{errors.model}</p>
              )}
            </div>

            {/* Color */}
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                placeholder="White"
                className={errors.color ? "border-red-500" : ""}
              />
              {errors.color && (
                <p className="text-sm text-red-500">{errors.color}</p>
              )}
            </div>

            {/* Seats */}
            <div className="grid gap-2">
              <Label htmlFor="seats">Number of Seats</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="20"
                value={formData.seats.toString()}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  handleInputChange("seats", isNaN(value) ? 4 : value);
                }}
                className={errors.seats ? "border-red-500" : ""}
              />
              {errors.seats && (
                <p className="text-sm text-red-500">{errors.seats}</p>
              )}
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: CarStatus) =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status}</p>
              )}
            </div>
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
              {isLoading
                ? mode === "create"
                  ? "Adding..."
                  : "Updating..."
                : mode === "create"
                ? "Add Car"
                : "Update Car"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
 