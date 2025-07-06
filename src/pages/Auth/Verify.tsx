import { CarFront, CheckCircle, Mail, RefreshCw, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const Verify = () => {
  const { currentUser, userProfile, sendVerificationEmail, refreshUser } =
    useAuth();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error" | "loading"
  >("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleEmailVerification = async () => {
      const oobCode = searchParams.get("oobCode");

      if (oobCode) {
        setVerificationStatus("loading");
        try {
          // Check if the action code is valid
          await checkActionCode(auth, oobCode);

          // Apply the action code (verify email)
          await applyActionCode(auth, oobCode);

          // Refresh the user to get updated emailVerified status
          await refreshUser();

          setVerificationStatus("success");
        } catch (error) {
          console.error("Email verification error:", error);
          setVerificationStatus("error");
          setErrorMessage(t("auth.emailVerificationFailed"));
        }
      }
    };

    handleEmailVerification();
  }, [searchParams, refreshUser, t]);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await sendVerificationEmail();
      setVerificationStatus("pending");
    } catch (error) {
      console.error("Error resending verification email:", error);
      setErrorMessage(t("auth.emailVerificationFailed"));
    } finally {
      setIsResending(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await refreshUser();
      if (currentUser?.emailVerified) {
        setVerificationStatus("success");
      }
    } catch (error) {
      console.error("Error refreshing user status:", error);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <div className="text-center space-y-4">
            <div className="animate-spin mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                {t("auth.emailVerificationSuccess")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t("auth.emailVerificationSuccessSubtitle")}
              </p>
            </div>
            <Button
              onClick={() =>
                (window.location.href =
                  userProfile?.role === "admin" ? "/admin" : "/app")
              }
              className="w-full"
            >
              {t("auth.continueToDashboard")}
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-4">
            <XCircle className="mx-auto w-12 h-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-700">
                {t("auth.emailVerificationError")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {errorMessage || t("auth.emailVerificationErrorSubtitle")}
              </p>
            </div>
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? t("common.loading") : t("auth.resendVerification")}
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-6">
            <Mail className="mx-auto w-12 h-12 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">
                {t("auth.emailVerificationPending")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t("auth.emailVerificationPendingSubtitle")}{" "}
                <strong>{currentUser?.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("auth.emailVerificationInstructions")}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRefreshStatus}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("auth.checkVerificationStatus")}
              </Button>

              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
              >
                {isResending
                  ? t("common.loading")
                  : t("auth.resendVerification")}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t("auth.verificationEmailHelp")}</p>
              <p>{t("auth.verificationEmailHelpSpam")}</p>
              <p>{t("auth.verificationEmailHelpCorrect")}</p>
              <p>{t("auth.verificationEmailHelpWait")}</p>
            </div>
          </div>
        );
    }
  };

  // If user is already logged in and verified, redirect to app
  if (currentUser && currentUser.emailVerified) {
    if (userProfile?.role === "admin") {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/app" />;
  }

  // If no user is logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/auth" />;
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
              {t("auth.emailVerification")}
            </CardTitle>
            <CardDescription>
              {verificationStatus === "success"
                ? t("auth.emailVerificationSuccessSubtitle")
                : t("auth.emailVerificationSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>

        <div className="text-center">
          <Link
            to="/auth"
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            {t("auth.backToLogin")}
          </Link>
        </div>

        <div className="flex justify-center">
          <LanguageSwitcher authOnly={true} />
        </div>
      </section>
    </main>
  );
};

export default Verify;
