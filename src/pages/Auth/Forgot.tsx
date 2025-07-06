import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, Navigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { CarFront } from "lucide-react";
import type { FirebaseError } from "firebase/app";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const Forgot = () => {
  const { currentUser, userProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  // If user is already logged in, redirect to app
  if (currentUser) {
    if (userProfile?.role === "admin") {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/app" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError("");
      setMessage("");
      setLoading(true);

      await sendPasswordResetEmail(auth, email);
      setMessage(t("auth.checkEmail"));
    } catch (error) {
      console.error("Password reset error:", error);
      if ((error as FirebaseError).code === "auth/user-not-found") {
        setError(t("auth.noAccount"));
      } else if ((error as FirebaseError).code === "auth/invalid-email") {
        setError(t("auth.invalidEmail"));
      } else {
        setError(t("auth.failedToSend"));
      }
    } finally {
      setLoading(false);
    }
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

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t("auth.resetPassword")}</CardTitle>
            <CardDescription>{t("auth.resetSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                    {message}
                  </div>
                )}
                <div className="grid gap-3">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={loading}
                >
                  {loading ? t("auth.sending") : t("auth.sendResetLink")}
                </Button>
                <div className="text-center">
                  <Link
                    to="/auth"
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                  >
                    {t("auth.backToLogin")}
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <LanguageSwitcher authOnly={true} />
        </div>
      </section>
    </main>
  );
};

export default Forgot;
