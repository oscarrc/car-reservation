import { CarFront, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const Unauthorized = () => {
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();

  // Determine redirect path based on user role
  const getRedirectPath = () => {
    if (!currentUser || !userProfile) {
      return "/auth";
    }

    if (userProfile.role === "admin") {
      return "/admin";
    }

    return "/app";
  };

  return (
    <main className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Logo */}
        <Link
          to={getRedirectPath()}
          className="flex items-center gap-2 font-medium mb-4"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <CarFront className="size-4" />
          </div>
          {t("brand.name")}
        </Link>

        {/* Unauthorized Header */}
        <div className="space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {t("errors.unauthorized")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("error.unauthorizedDescription")}
          </p>
        </div>

        {/* Return Button */}
        <Button asChild className="mt-6 cursor-pointer" size="lg">
          <Link to={getRedirectPath()}>{t("error.goHome")}</Link>
        </Button>

        {/* Language Switcher */}
        <div className="flex justify-center mt-6">
          <LanguageSwitcher authOnly={!currentUser} />
        </div>
      </div>
    </main>
  );
};

export default Unauthorized;
