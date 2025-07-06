import { Navigate, useLocation } from "react-router-dom";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface ProtectedProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "teacher";
  fallbackPath?: string;
}

export default function Protected({
  children,
  requiredRole,
  fallbackPath = "/login",
}: ProtectedProps) {
  const { currentUser, userProfile, loading, isProfileComplete } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return <LoadingScreen text={undefined} />;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If authenticated but no profile found, show error
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {t("profile.notFound")}
          </h2>
          <p className="text-gray-600">{t("profile.unableToLoad")}</p>
        </div>
      </div>
    );
  }

  // Check if profile is complete (name and phone exist)
  // Only check for app routes, not admin routes
  if (
    !isProfileComplete &&
    location.pathname.startsWith("/app") &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" />;
  }

  // If role is required, check if user has the required role
  if (requiredRole) {
    const hasRequiredRole =
      requiredRole === "admin"
        ? userProfile.role === "admin"
        : userProfile.role === "admin" || userProfile.role === "teacher";

    if (!hasRequiredRole) {
      return <Navigate to={fallbackPath} />;
    }
  }

  return <SettingsProvider>{children}</SettingsProvider>;
}
