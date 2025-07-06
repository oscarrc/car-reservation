import { Outlet, useNavigate } from "react-router-dom";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function OnboardingLayout() {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!currentUser) {
      navigate("/auth");
      return;
    }
  }, [currentUser, navigate]);

  // Show loading while checking authentication and profile status
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading.authenticating")}</p>
        </div>
      </div>
    );
  }

  // Show loading while profile is being checked
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading.loadingProfile")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t("brand.name")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 bg-muted">
        <Outlet />
      </main>
    </div>
  );
}

export default OnboardingLayout;
