"use client";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Label, Pie, PieChart } from "recharts";
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
import { fetchFleetStatus } from "@/lib/dashboard-service";
import { cn } from "@/lib/utils";
import { queryConfig } from "@/lib/query-config";

interface FleetStatusChartProps {
  className?: string;
}

export function FleetStatusChart({ className }: FleetStatusChartProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fleetChartConfig = {
    count: {
      label: "Cars",
    },
    available: {
      label: t("fleet.available"),
      color: "var(--success)",
    },
    maintenance: {
      label: t("fleet.maintenance"),
      color: "var(--warning)",
    },
    out_of_service: {
      label: t("fleet.out_of_service"),
      color: "var(--error)",
    },
  } satisfies ChartConfig;

  const {
    data: fleetData,
    isLoading: isFleetLoading,
    error: fleetError,
  } = useQuery({
    queryKey: ["fleet-status"],
    queryFn: fetchFleetStatus,
    staleTime: queryConfig.dashboard.staleTime,
    gcTime: queryConfig.dashboard.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const totalCars = useMemo(() => {
    if (!fleetData?.fleetStatus) return 0;
    return fleetData.fleetStatus.reduce((acc, curr) => acc + curr.count, 0);
  }, [fleetData?.fleetStatus]);

  return (
    <Card className={cn("flex flex-col justify-between", className)}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("dashboard.fleetStatus")}</CardTitle>
        <CardDescription>{t("dashboard.fleetSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {isFleetLoading ? (
          <div className="flex items-center justify-center h-[350px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t("dashboard.loadingFleet")}
              </p>
            </div>
          </div>
        ) : fleetError ? (
          <div className="flex items-center justify-center h-[350px]">
            <div className="text-center">
              <p className="text-sm text-destructive">
                {t("dashboard.errorLoadingFleet")}
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={fleetChartConfig}
            className="mx-auto aspect-square max-h-[350px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <ChartLegend
                formatter={(value) => {
                  const formatted = value.replace(/_/g, " ");
                  return (
                    <span
                      className="capitalize"
                      style={{ color: "var(--foreground)" }}
                    >
                      {formatted}
                    </span>
                  );
                }}
              />
              <Pie
                data={fleetData?.fleetStatus || []}
                dataKey="count"
                nameKey="status"
                innerRadius={80}
                outerRadius={120}
                strokeWidth={5}
              >
                <Label
                  content={() => (
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x="50%"
                        y="45%"
                        className="fill-foreground text-3xl font-bold"
                      >
                        {totalCars.toLocaleString()}
                      </tspan>
                      <tspan
                        x="50%"
                        y="55%"
                        className="text-lg fill-muted-foreground"
                      >
                        {t("dashboard.totalCars")}
                      </tspan>
                    </text>
                  )}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/fleet")}
          className="cursor-pointer"
        >
          {t("navigation.manageFleet")}
        </Button>
      </CardFooter>
    </Card>
  );
}
