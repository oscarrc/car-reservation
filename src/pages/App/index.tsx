import {
  Building,
  Calendar,
  CalendarClock,
  Calendar as CalendarIcon,
  CarFront,
  CheckCircle,
  Clock,
  Mail,
  Plus,
  Timer,
  Users,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  countActiveUserReservations,
  fetchUserReservations,
} from "@/lib/reservations-service";
import { format, getLocalizedFormats } from "@/lib/date-locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import type { ReservationWithId } from "@/types/reservation";
import { SectionHeader } from "@/components/ui/section-header";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCarsByIds } from "@/lib/cars-service";
import { toast } from "sonner";
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

  // Query for active reservations count
  const { data: activeReservationsCount = 0 } = useQuery({
    queryKey: ["activeReservationsCount", currentUser?.uid],
    queryFn: () => {
      if (!currentUser?.uid) throw new Error("User not authenticated");
      return countActiveUserReservations(currentUser.uid);
    },
    enabled:
      !!currentUser?.uid &&
      !!settings?.maxConcurrentReservations &&
      settings.maxConcurrentReservations > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const handleNewReservation = () => {
    if (!currentUser?.uid || !settings) return;

    // Check if maxConcurrentReservations is enabled (> 0)
    if (settings.maxConcurrentReservations > 0) {
      if (activeReservationsCount >= settings.maxConcurrentReservations) {
        toast.error(t("reservations.maxConcurrentReservationsReached"), {
          description: t("reservations.maxConcurrentReservationsReachedDesc", {
            maxReservations: settings.maxConcurrentReservations,
          }),
        });
        return;
      }
    }

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
                    onClick={() =>
                      navigate(`/app/reservations/${reservation.id}`)
                    }
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4 cursor-pointer"
                  >
                    {/* Mobile: Full width layout, Desktop: Left side content */}
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                      {/* Date block - smaller on mobile */}
                      <div className="flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-lg flex-shrink-0">
                        <div className="text-xs sm:text-sm font-semibold text-primary">
                          {format(new Date(reservation.startDateTime), "MMM")}
                        </div>
                        <div className="text-sm sm:text-lg font-bold text-primary">
                          {format(new Date(reservation.startDateTime), "dd")}
                        </div>
                      </div>

                      {/* Content area - stacks on mobile */}
                      <div className="flex-1 min-w-0">
                        {/* Car info */}
                        <div className="flex items-center gap-2 mb-2 sm:mb-1">
                          <CarFront className="h-4 w-4 flex-shrink-0" />
                          {reservation.carInfo && (
                            <div className="flex items-center gap-2 min-w-0">
                              {getColorCircle(reservation.carInfo.color)}
                              <span className="font-medium text-sm sm:text-base truncate">
                                {reservation.carInfo.model}
                              </span>
                              <span className="text-muted-foreground text-xs sm:text-sm hidden xs:inline">
                                ({reservation.carInfo.licensePlate})
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Time info - stacked on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {format(
                                new Date(reservation.startDateTime),
                                getLocalizedFormats().dateTime
                              )}
                            </span>
                          </div>
                          <span className="hidden sm:inline">→</span>
                          <span className="text-xs sm:text-sm pl-4 sm:pl-0">
                            {format(
                              new Date(reservation.endDateTime),
                              getLocalizedFormats().dateTime
                            )}
                          </span>
                        </div>

                        {/* Driver info */}
                        {reservation.driver && (
                          <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                            {t("reservations.driver")}: {reservation.driver}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badge - full width on mobile, right side on desktop */}
                    <div className="flex sm:block">
                      <Badge
                        variant={getStatusBadgeVariant(reservation.status)}
                        className="w-full sm:w-auto justify-center sm:justify-start text-xs sm:text-sm"
                      >
                        {t(`reservations.${reservation.status}`)}
                      </Badge>
                    </div>
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

        {/* Business and Reservations Information Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
          {/* Business Information Card */}
          {settings &&
            (settings?.businessHoursStart || settings?.supportEmails) && (
              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {t("dashboard.businessInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 h-full">
                  {/* Business Hours */}
                  {settings.businessHoursStart && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t("dashboard.businessHours")}
                      </h4>
                      <p className="text-muted-foreground">
                        {settings.businessHoursStart} -{" "}
                        {settings.businessHoursEnd}
                      </p>
                    </div>
                  )}

                  {/* Support Information */}
                  {settings.supportEmails &&
                    settings.supportEmails.length > 0 && (
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

          {/* Reservations Information Card */}
          {settings &&
            (() => {
              const hasReservationSettings =
                settings.advanceReservation > 0 ||
                settings.maxReservationDuration > 0 ||
                settings.maxConcurrentReservations > 0 ||
                settings.advanceCancellationTime > 0 ||
                !settings.autoReservation ||
                !settings.autoCancelation ||
                !settings.weekendReservations;

              return hasReservationSettings ? (
                <Card className="w-full h-full lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5" />
                      {t("dashboard.reservationInfo")}
                    </CardTitle>
                    <CardDescription>
                      {t("dashboard.reservationInfoDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* First Row: Advance Booking and Advance Cancellation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {settings.advanceReservation > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {t("dashboard.advanceReservation")}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {t("dashboard.advanceReservationValue", {
                              days: settings.advanceReservation,
                            })}
                          </p>
                        </div>
                      )}

                      {settings.advanceCancellationTime > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {t("dashboard.advanceCancellation")}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {t("dashboard.advanceCancellationValue", {
                              hours: settings.advanceCancellationTime,
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Second Row: Maximum Duration and Concurrent Reservations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {settings.maxReservationDuration > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1 flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            {t("dashboard.maxReservationDuration")}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {t("dashboard.maxReservationDurationValue", {
                              hours: settings.maxReservationDuration,
                            })}
                          </p>
                        </div>
                      )}

                      {settings.maxConcurrentReservations > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t("dashboard.maxConcurrentReservations")}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {t("dashboard.maxConcurrentReservationsValue", {
                              count: settings.maxConcurrentReservations,
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Third Row: Reservation and Cancellation Approval (Always shown) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          {settings.autoReservation ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-orange-600" />
                          )}
                          {t("dashboard.autoApproval")}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {settings.autoReservation
                            ? t("dashboard.autoApprovalEnabled")
                            : t("dashboard.autoApprovalDisabled")}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          {settings.autoCancelation ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-orange-600" />
                          )}
                          {t("dashboard.autoCancellation")}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {settings.autoCancelation
                            ? t("dashboard.autoCancellationEnabled")
                            : t("dashboard.autoCancellationDisabled")}
                        </p>
                      </div>
                    </div>

                    {/* Weekend Reservations (only if disabled) */}
                    {!settings.weekendReservations && (
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          {t("dashboard.weekendReservations")}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {t("dashboard.weekendReservationsDisabled")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null;
            })()}
        </div>
      </div>

      {/* Reservation Form Dialog */}
      <ReservationFormDialog
        open={reservationDialogOpen}
        onOpenChange={setReservationDialogOpen}
        mode="create"
      />
    </>
  );
}
