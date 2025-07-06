import { Link, Navigate } from "react-router-dom";

import { CarFront } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();

  // If user is already logged in, redirect to app
  if (currentUser) {
    if (userProfile?.role === "admin") {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/app" />;
  }

  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <section className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/auth"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <CarFront className="size-4" />
          </div>
          {t("brand.name")}
        </Link>
        <LoginForm />
        <div className="flex justify-center">
          <LanguageSwitcher authOnly={true} />
        </div>
      </section>
    </main>
  );
};

export default Login;
