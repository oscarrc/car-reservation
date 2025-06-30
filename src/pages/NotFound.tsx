import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();

  // Determine redirect path based on user role
  const getRedirectPath = () => {
    if (!currentUser || !userProfile) {
      return "/login";
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
            <Car className="size-4" />
          </div>
          {t("brand.name")}
        </Link>

        {/* 404 Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            <span className="text-6xl py-4">404</span>
            <br />
            {t("notFound.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("notFound.subtitle")}
          </p>
        </div>

        {/* Return Button */}
        <Button asChild className="mt-6 cursor-pointer" size="lg">
          <Link to={getRedirectPath()}>{t("notFound.returnToWebsite")}</Link>
        </Button>

        {/* Language Switcher */}
        <div className="flex justify-center mt-6">
          <LanguageSwitcher authOnly={!currentUser} />
        </div>
      </div>
    </main>
  );
};

export default NotFound;
