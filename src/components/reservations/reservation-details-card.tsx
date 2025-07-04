"use client";

import { format, getLocalizedFormats } from "@/lib/date-locale";
import { Calendar, Clock, User, MessageSquare, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ReservationWithId, ReservationStatus } from "@/types/reservation";

interface ReservationDetailsCardProps {
  reservation: ReservationWithId;
  t: (key: string) => string;
}

// Helper function to get status variant
const getStatusVariant = (status: ReservationStatus): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "orange" => {
  switch (status) {
    case "pending":
      return "warning";
    case "confirmed":
      return "success";
    case "cancelled":
      return "destructive";
    case "cancellation_pending":
      return "orange";
    default:
      return "outline";
  }
};

export function ReservationDetailsCard({ reservation, t }: ReservationDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("reservations.reservationDetails")}
          </div>
          <Badge variant={getStatusVariant(reservation.status)}>
            {t(`reservations.${reservation.status}`)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date and Time - One line */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("reservations.startDateTime")}</div>
              <div className="text-sm font-medium">
                {format(reservation.startDateTime, getLocalizedFormats().dateTime)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("reservations.endDateTime")}</div>
              <div className="text-sm font-medium">
                {format(reservation.endDateTime, getLocalizedFormats().dateTime)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("reservations.createdOn")}</div>
              <div className="text-sm font-medium">
                {format(reservation.createdAt, getLocalizedFormats().dateTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Driver and Comments - Second line */}
        {(reservation.driver || reservation.comments) && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservation.driver && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t("reservations.driver")}</div>
                    <div className="text-sm font-medium">{reservation.driver}</div>
                  </div>
                </div>
              )}

              {reservation.comments && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{t("reservations.comments")}</div>
                    <div className="text-sm whitespace-pre-wrap">{reservation.comments}</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 