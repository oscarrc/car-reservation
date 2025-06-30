"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/ui/section-header";
import { CarsTable } from "@/components/cars/cars-table";
import { CarFormDialog } from "@/components/cars/car-form-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { deleteCar } from "@/lib/cars-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CarWithId } from "@/types/car";

export default function FleetPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedCar, setSelectedCar] = useState<CarWithId | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<CarWithId | null>(null);

  const handleAddCar = () => {
    setDialogMode("create");
    setSelectedCar(undefined);
    setDialogOpen(true);
  };

  const handleEditCar = (car: CarWithId) => {
    setDialogMode("edit");
    setSelectedCar(car);
    setDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (carId: string) => {
      return await deleteCar(carId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      setDeleteDialogOpen(false);
      setCarToDelete(null);
      toast.success(t("fleet.carDeleted"), {
        description: t("fleet.carDeletedDesc", {
          model: carToDelete?.model,
          licensePlate: carToDelete?.licensePlate,
        }),
      });
    },
    onError: (error) => {
      console.error("Failed to delete car:", error);
      toast.error(t("fleet.failedToDeleteCar"), {
        description: t("common.retry"),
      });
    },
  });

  const handleDeleteCar = (car: CarWithId) => {
    setCarToDelete(car);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (carToDelete) {
      deleteMutation.mutate(carToDelete.id);
    }
  };

  return (
    <>
      <SectionHeader
        title={t("fleet.management")}
        subtitle={t("fleet.subtitle")}
        action={handleAddCar}
        actionText={t("fleet.addCar")}
        actionIcon={Plus}
      />

      <div className="px-4 lg:px-6">
        <CarsTable
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEditCar={handleEditCar}
          onDeleteCar={handleDeleteCar}
        />
      </div>

        <CarFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          car={selectedCar}
        />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t("fleet.deleteCar")}
        description={
          carToDelete
            ? t("fleet.deleteConfirmation", { 
                model: carToDelete.model, 
                licensePlate: carToDelete.licensePlate 
              })
            : ""
        }
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
