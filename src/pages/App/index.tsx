import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function AppPage() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-4 px-4 lg:px-6">
        <h1 className="text-2xl font-bold">{t("navigation.carReservationDashboard")}</h1>
        {userProfile && (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.welcome", { name: userProfile.name, role: userProfile.role })}
          </p>
        )}
      </div>
      
      <div className="grid auto-rows-min gap-4 md:grid-cols-3 px-4 lg:px-6">
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{t("dashboard.availableCars")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.browseReserve")}</p>
          </div>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{t("dashboard.myBookings")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.currentReservations")}</p>
          </div>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{t("dashboard.quickActions")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.commonTasks")}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-muted/50 min-h-[400px] flex-1 rounded-xl mx-4 lg:mx-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">{t("dashboard.carReservationSystem")}</h2>
          <p className="text-muted-foreground">
            {t("dashboard.manageReservationsBookings")}
          </p>
        </div>
      </div>
    </>
  );
}
