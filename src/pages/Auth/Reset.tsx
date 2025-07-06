import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CarFront } from "lucide-react";
import type { FirebaseError } from "firebase/app";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const Reset = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validCode, setValidCode] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { t } = useTranslation();

  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    async function verifyResetCode() {
      if (!oobCode) {
        setError(t("auth.invalidResetCode"));
        setVerifying(false);
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setUserEmail(email);
        setValidCode(true);
      } catch (error) {
        console.error("Code verification error:", error);
        if ((error as FirebaseError).code === "auth/expired-action-code") {
          setError(t("auth.resetCodeExpired"));
        } else if (
          (error as FirebaseError).code === "auth/invalid-action-code"
        ) {
          setError(t("auth.invalidResetCode"));
        } else {
          setError(t("auth.invalidResetCode"));
        }
        setValidCode(false);
      } finally {
        setVerifying(false);
      }
    }

    verifyResetCode();
  }, [oobCode, t]);

  // If user is already logged in, redirect to app
  if (currentUser) {
    if (userProfile?.role === "admin") {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/app" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(t("auth.passwordsNoMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    try {
      setError("");
      setMessage("");
      setLoading(true);

      await confirmPasswordReset(auth, oobCode!, password);
      setMessage(t("auth.resetSuccessful"));
    } catch (error) {
      console.error("Password reset error:", error);
      if ((error as FirebaseError).code === "auth/weak-password") {
        setError(t("auth.weakPassword"));
      } else {
        setError(t("auth.failedToReset"));
      }
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
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
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">
                  {t("auth.verifyingCode")}
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center">
            <LanguageSwitcher authOnly={true} />
          </div>
        </section>
      </main>
    );
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
            <CardTitle className="text-xl">
              {t("auth.setNewPassword")}
            </CardTitle>
            <CardDescription>
              {validCode && userEmail
                ? `${t("auth.resetPasswordFor")} ${userEmail}`
                : t("auth.enterNewPassword")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!validCode ? (
              <div className="text-center space-y-4">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
                <Link
                  to="/auth/forgot"
                  className="inline-block text-sm text-primary hover:underline"
                >
                  {t("auth.requestNewLink")}
                </Link>
              </div>
            ) : (
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
                    <Label htmlFor="password">{t("auth.newPassword")}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword">
                      {t("auth.confirmPassword")}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  {!message && (
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      disabled={loading}
                    >
                      {loading
                        ? t("auth.resetting")
                        : t("auth.resetPasswordBtn")}
                    </Button>
                  )}
                  <div className="text-center">
                    <Link
                      to="/auth"
                      className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                    >
                      {message
                        ? t("auth.continueToLogin")
                        : t("auth.backToLogin")}
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <LanguageSwitcher authOnly={true} />
        </div>
      </section>
    </main>
  );
};

export default Reset;
