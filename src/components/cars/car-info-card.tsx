"use client";

import { CarFront, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import type { CarWithId } from "@/types/car";
import { Separator } from "@/components/ui/separator";

interface CarInfoCardProps {
  car: CarWithId;
  t: (key: string) => string;
}

// Helper function to get status variant
const getStatusVariant = (
  status: string
):
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning" => {
  switch (status) {
    case "available":
      return "success";
    case "maintenance":
      return "warning";
    case "out_of_service":
      return "destructive";
    default:
      return "outline";
  }
};

export function CarInfoCard({ car, t }: CarInfoCardProps) {
  const getColorCircle = (color: string) => (
    <div
      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
      style={{ backgroundColor: color.toLowerCase() }}
    />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CarFront className="h-5 w-5" />
            {t("reservations.carInformation")}
          </div>
          <Badge variant={getStatusVariant(car.status)}>
            {t(`fleet.${car.status}`)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* License Plate */}
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              {t("browse.carCard.licensePlate")}
            </span>
            <span className="font-mono font-semibold text-primary">
              {car.licensePlate}
            </span>
          </div>

          {/* Model */}
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              {t("fleet.model")}
            </span>
            <span className="font-medium">{car.model}</span>
          </div>

          {/* Year */}
          {car.year && (
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                {t("fleet.year")}
              </span>
              <span className="font-medium">{car.year}</span>
            </div>
          )}

          {/* Color */}
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              {t("fleet.color")}
            </span>
            <div className="flex items-center gap-2">
              {getColorCircle(car.color)}
              <span className="font-medium">
                {t(`fleet.colors.${car.color}`) || car.color}
              </span>
            </div>
          </div>

          {/* Seats */}
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              {t("browse.carCard.capacity")}
            </span>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {car.seats} {t("browse.carCard.people")}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {car.description && (
          <>
            <Separator className="my-4" />
            <div>
              <span className="text-sm font-medium text-muted-foreground block mb-2">
                {t("browse.carCard.description")}
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {car.description}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
