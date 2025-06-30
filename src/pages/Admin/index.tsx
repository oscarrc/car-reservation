"use client";

import { FleetStatusChart } from "@/components/dashboard/fleet-status-chart";
import { ReservationsChart } from "@/components/dashboard/reservations-chart";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AdminPage() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.year, prev.month);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return { year: newDate.getFullYear(), month: newDate.getMonth() };
    });
  };

  return (
    <>
      <div className="mb-4 px-4 lg:px-6">
        <h1 className="text-2xl font-bold">{t("navigation.adminDashboard")}</h1>
        {userProfile && (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.welcome", { name: userProfile.name, role: userProfile.role })}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 px-4 lg:px-6">
        <FleetStatusChart />
        <ReservationsChart
          currentDate={currentDate}
          onNavigateMonth={navigateMonth}
        />
      </div>
    </>
  );
}
