import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CarFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface ErrorProps {
  error?: Error | string | null;
}

const Error = ({ error }: ErrorProps) => {
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

  // Determine if user is admin
  const isAdmin = userProfile?.role === "admin";

  // Get error message
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

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

        {/* Error Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {t("error.title")}
          </h1>
          <p className="text-lg text-muted-foreground">{t("error.subtitle")}</p>
        </div>

        {/* Error Details for Admins */}
        {isAdmin && error && (
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("error.technicalDetails")}</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <p className="font-mono text-xs break-all">{errorMessage}</p>
                  {error instanceof Error && error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium">
                        {t("error.showStack")}
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Return Button */}
        <Button asChild className="mt-6 cursor-pointer" size="lg">
          <Link to={getRedirectPath()}>{t("error.returnToWebsite")}</Link>
        </Button>

        {/* Language Switcher */}
        <div className="flex justify-center mt-6">
          <LanguageSwitcher authOnly={!currentUser} />
        </div>
      </div>
    </main>
  );
};

export default Error;
