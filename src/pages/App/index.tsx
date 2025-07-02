import { Building, Calendar, Car, Clock, Mail, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, getLocalizedFormats } from "@/lib/date-locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import type { ReservationWithId } from "@/types/reservation";
import { SectionHeader } from "@/components/ui/section-header";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCarsByIds } from "@/lib/cars-service";
import { fetchUserReservations } from "@/lib/reservations-service";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/contexts/SettingsContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type ReservationWithCarInfo = ReservationWithId & {
  carInfo?: {
    id: string;
    model: string;
    licensePlate: string;
    color: string;
    seats: number;
    status: string;
  };
};

export default function AppPage() {
  const { userProfile, currentUser } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);

  // Fetch user reservations to get upcoming ones
  const { data: reservationsResponse, isLoading: reservationsLoading } =
    useQuery({
      queryKey: ["userUpcomingReservations", currentUser?.uid],
      queryFn: () => {
        if (!currentUser?.uid) throw new Error("User not authenticated");
        return fetchUserReservations({
          userId: currentUser.uid,
          pageSize: 50, // Get more to filter for upcoming
        });
      },
      enabled: !!currentUser?.uid,
    });

  const reservations = reservationsResponse?.reservations || [];

  // Filter for upcoming reservations (startDateTime > now) and sort by startDateTime
  const upcomingReservations = reservations
    .filter((reservation) => {
      const now = new Date();
      const startDateTime = new Date(reservation.startDateTime);
      return (
        startDateTime > now &&
        (reservation.status === "confirmed" || reservation.status === "pending")
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime()
    )
    .slice(0, 3); // Take only the next 3

  // Extract unique car IDs from upcoming reservations
  const carIds = [
    ...new Set(upcomingReservations.map((r) => r.carRef.id).filter(Boolean)),
  ];

  // Fetch cars data for the upcoming reservations
  const { data: carsData, isLoading: carsLoading } = useQuery({
    queryKey: ["upcomingReservationCars", carIds],
    queryFn: () => fetchCarsByIds(carIds),
    enabled: carIds.length > 0,
  });

  // Merge upcoming reservations with car data
  const upcomingReservationsWithCarData: ReservationWithCarInfo[] =
    upcomingReservations.map((reservation) => ({
      ...reservation,
      carInfo: carsData?.find((car) => car.id === reservation.carRef.id),
    }));

  const handleNewReservation = () => {
    setReservationDialogOpen(true);
  };

  const handleViewAllReservations = () => {
    navigate("/app/reservations");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancellation_pending":
        return "orange";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getColorCircle = (color: string) => (
    <div
      className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
      style={{ backgroundColor: color.toLowerCase() }}
    />
  );

  const isLoading = reservationsLoading || carsLoading;

  return (
    <>
      <SectionHeader
        title={t("navigation.carReservationDashboard")}
        subtitle={
          userProfile
            ? t("dashboard.welcome", {
                name: userProfile.name,
                role: userProfile.role,
              })
            : t("dashboard.appSubtitle")
        }
        action={handleNewReservation}
        actionText={t("reservations.newReservation")}
        actionIcon={Plus}
      />

      <div className="space-y-6 px-4 lg:px-6">
        {/* Upcoming Reservations Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("dashboard.upcomingReservations")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.upcomingReservationsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : upcomingReservationsWithCarData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("dashboard.noUpcomingReservations")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("dashboard.noUpcomingReservationsDesc")}
                </p>
                <Button onClick={handleNewReservation}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("reservations.newReservation")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingReservationsWithCarData.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 rounded-lg">
                        <div className="text-sm font-semibold text-primary">
                          {format(new Date(reservation.startDateTime), "MMM")}
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {format(new Date(reservation.startDateTime), "dd")}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Car className="h-4 w-4" />
                          {reservation.carInfo && (
                            <div className="flex items-center gap-2">
                              {getColorCircle(reservation.carInfo.color)}
                              <span className="font-medium">
                                {reservation.carInfo.model}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                ({reservation.carInfo.licensePlate})
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(
                                new Date(reservation.startDateTime),
                                getLocalizedFormats().dateTime
                              )}
                            </span>
                          </div>
                          <span>→</span>
                          <span>
                            {format(
                              new Date(reservation.endDateTime),
                              getLocalizedFormats().dateTime
                            )}
                          </span>
                        </div>
                        {reservation.driver && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {t("reservations.driver")}: {reservation.driver}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(reservation.status)}>
                      {t(`reservations.${reservation.status}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {upcomingReservationsWithCarData.length > 0 && (
            <CardFooter className="justify-end">
              <Button
                variant="outline"
                onClick={handleViewAllReservations}
                className="w-full sm:w-auto"
              >
                {t("dashboard.viewAllReservations")}
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Business Information Card */}
        {settings && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t("dashboard.businessInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business Hours */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("dashboard.businessHours")}
                </h4>
                <p className="text-muted-foreground">
                  {settings.businessHoursStart} - {settings.businessHoursEnd}
                </p>
              </div>

              {/* Support Information */}
              {settings.supportEmails && settings.supportEmails.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t("dashboard.contactSupport")}
                    </h4>
                    <div className="space-y-1">
                      {settings.supportEmails.map((email, index) => (
                        <a
                          key={index}
                          href={`mailto:${email}`}
                          className="text-muted-foreground hover:text-primary block transition-colors"
                        >
                          {email}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reservation Form Dialog */}
      <ReservationFormDialog
        open={reservationDialogOpen}
        onOpenChange={setReservationDialogOpen}
      />
    </>
  );
}
