"use client";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";
import { fetchDailyReservations } from "@/lib/dashboard-service";
import { getLocaleString } from "@/lib/date-locale";
import { cn } from "@/lib/utils";
import { queryConfig } from "@/lib/query-config";

interface ReservationsChartProps {
  className?: string;
  currentDate: { year: number; month: number };
  onNavigateMonth: (direction: "prev" | "next") => void;
}

export function ReservationsChart({
  className,
  currentDate,
  onNavigateMonth,
}: ReservationsChartProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const reservationsChartConfig = {
    confirmed: {
      label: t("reservations.confirmed"),
      color: "var(--success)",
    },
    pending: {
      label: t("reservations.pending"),
      color: "var(--warning)",
    },
    cancellation_pending: {
      label: t("reservations.cancellation_pending"),
      color: "var(--orange)",
    },
    cancelled: {
      label: t("reservations.cancelled"),
      color: "var(--error)",
    },
    rejected: {
      label: t("reservations.rejected"),
      color: "var(--red)",
    },
  } satisfies ChartConfig;

  const {
    data: reservationsData,
    isLoading: isReservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: ["daily-reservations", currentDate.year, currentDate.month],
    queryFn: () => fetchDailyReservations(currentDate.year, currentDate.month),
    staleTime: queryConfig.dashboard.staleTime,
    gcTime: queryConfig.dashboard.gcTime,
    refetchOnWindowFocus: false,
  });

  const currentMonth = new Date(
    currentDate.year,
    currentDate.month
  ).toLocaleDateString(getLocaleString(), {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className={cn("justify-between", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("dashboard.dailyReservations")}</CardTitle>
            <CardDescription>{currentMonth}</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateMonth("prev")}
              className="cursor-pointer h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateMonth("next")}
              className="cursor-pointer h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isReservationsLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t("dashboard.loadingReservations")}
              </p>
            </div>
          </div>
        ) : reservationsError ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <p className="text-sm text-destructive">
                {t("dashboard.errorLoadingReservations")}
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer config={reservationsChartConfig}>
            <BarChart
              accessibilityLayer
              data={reservationsData || []}
              margin={{
                top: 20,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend
                formatter={(value) => {
                  return (
                    <span
                      className="capitalize"
                      style={{ color: "var(--foreground)" }}
                    >
                      {t(`reservations.${value}`)}
                    </span>
                  );
                }}
              />
              <Bar
                dataKey="confirmed"
                stackId="a"
                fill="var(--color-confirmed)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="pending"
                stackId="a"
                fill="var(--color-pending)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="cancellation_pending"
                stackId="a"
                fill="var(--color-cancellation_pending)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="cancelled"
                stackId="a"
                fill="var(--color-cancelled)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="rejected"
                stackId="a"
                fill="var(--color-rejected)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/reservations")}
          className="cursor-pointer"
        >
          {t("navigation.manageReservations")}
        </Button>
      </CardFooter>
    </Card>
  );
}
