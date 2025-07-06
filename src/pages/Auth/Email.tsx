import { CarFront, CheckCircle, Shield, XCircle } from "lucide-react";
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

const Email = () => {
  const { currentUser, userProfile, refreshUser, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [emailResetStatus, setEmailResetStatus] = useState<
    "pending" | "success" | "error" | "loading" | "processing"
  >("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [previousEmail, setPreviousEmail] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const handleEmailReset = async () => {
      const oobCode = searchParams.get("oobCode");
      const mode = searchParams.get("mode");

      if (oobCode && mode === "action") {
        setEmailResetStatus("processing");
        try {
          // Check if the action code is valid
          const actionCodeInfo = await checkActionCode(auth, oobCode);

          // Extract email information from the action code
          if (actionCodeInfo.data?.email) {
            setNewEmail(actionCodeInfo.data.email);
          }
          if (actionCodeInfo.data?.previousEmail) {
            setPreviousEmail(actionCodeInfo.data.previousEmail);
          }

          setEmailResetStatus("pending");
        } catch (error) {
          console.error("Email reset error:", error);
          setEmailResetStatus("error");
          setErrorMessage(t("auth.emailResetInvalidCode"));
        }
      }
    };

    handleEmailReset();
  }, [searchParams, t]);

  const handleConfirmEmailChange = async () => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) return;

    setIsProcessing(true);
    try {
      // Apply the action code to confirm the email change
      await applyActionCode(auth, oobCode);
      
      // Refresh user data to get the new email
      await refreshUser();
      await refreshProfile();
      
      setEmailResetStatus("success");
    } catch (error) {
      console.error("Error confirming email change:", error);
      setEmailResetStatus("error");
      setErrorMessage(t("auth.emailResetErrorSubtitle"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevertEmailChange = async () => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) return;

    setIsProcessing(true);
    try {
      // Apply the action code to revert the email change
      await applyActionCode(auth, oobCode);
      
      // Refresh user data to get the reverted email
      await refreshUser();
      await refreshProfile();
      
      setEmailResetStatus("success");
    } catch (error) {
      console.error("Error reverting email change:", error);
      setEmailResetStatus("error");
      setErrorMessage(t("auth.emailResetErrorSubtitle"));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (emailResetStatus) {
      case "loading":
        return (
          <div className="text-center space-y-4">
            <div className="animate-spin mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        );

      case "processing":
        return (
          <div className="text-center space-y-4">
            <div className="animate-spin mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">
              {t("auth.emailResetProcessing")}
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                {t("auth.emailResetSuccess")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t("auth.emailResetSuccessSubtitle")}
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/auth")}
              className="w-full"
            >
              {t("auth.backToLogin")}
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-4">
            <XCircle className="mx-auto w-12 h-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-700">
                {t("auth.emailResetError")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {errorMessage || t("auth.emailResetErrorSubtitle")}
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/auth")}
              className="w-full"
            >
              {t("auth.backToLogin")}
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-8 h-8 text-amber-500" />
              <h3 className="text-lg font-semibold text-amber-700">
                {t("auth.emailResetSecurityNotice")}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
                <p className="font-medium mb-1">
                  {t("auth.emailResetPendingSubtitle")}
                </p>
                <p className="font-semibold text-lg">{newEmail}</p>
                {previousEmail && (
                  <p className="text-xs mt-1">
                    {t("auth.emailResetPrevious")} {previousEmail}
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {t("auth.emailResetInstructions")}
              </p>

              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
                <p className="font-medium">
                  {t("auth.emailResetSecurityDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRevertEmailChange}
                disabled={isProcessing}
                variant="destructive"
                className="w-full"
              >
                {isProcessing
                  ? t("auth.emailResetReverting")
                  : t("auth.emailResetRevert")}
              </Button>

              <Button
                onClick={handleConfirmEmailChange}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing
                  ? t("auth.emailResetConfirming")
                  : t("auth.emailResetConfirm")}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">{t("auth.emailResetWhatToDo")}</p>
              <p>{t("auth.emailResetWhatToDoConfirm")}</p>
              <p>{t("auth.emailResetWhatToDoRevert")}</p>
              <p>{t("auth.emailResetWhatToDoContact")}</p>
            </div>
          </div>
        );
    }
  };

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

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t("auth.emailReset")}</CardTitle>
            <CardDescription>
              {emailResetStatus === "success"
                ? t("auth.emailResetSuccessSubtitle")
                : t("auth.emailResetSubtitle")}
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

export default Email;
