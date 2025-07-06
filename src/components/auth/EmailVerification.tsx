import { CheckCircle, Mail, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { FirebaseError } from "firebase/app";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const EmailVerification = () => {
  const {
    currentUser,
    userProfile,
    sendVerificationEmail,
    refreshUser,
    isEmailVerified,
  } = useAuth();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error" | "loading"
  >("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const { t } = useTranslation();

  const hasProcessed = useRef(false);
  const processedCode = useRef<string | null>(null);

  const handleVerification = useCallback(
    async (oobCode: string) => {
      if (processedCode.current === oobCode || hasProcessed.current) {
        return;
      }

      hasProcessed.current = true;
      processedCode.current = oobCode;
      setVerificationStatus("loading");

      try {
        await applyActionCode(auth, oobCode);
        await refreshUser();
        setVerificationStatus("success");
        toast.success("Email verified successfully!");
      } catch (error) {
        setVerificationStatus("error");

        let errorMsg = "Email verification failed.";
        if ((error as FirebaseError).code === "auth/expired-action-code") {
          errorMsg = "Verification link has expired. Please request a new one.";
        } else if (
          (error as FirebaseError).code === "auth/invalid-action-code"
        ) {
          errorMsg = "Invalid verification link. Please request a new one.";
        }

        setErrorMessage(errorMsg);
      }
    },
    [refreshUser]
  );

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");

    if (oobCode) {
      handleVerification(oobCode);
    }
  }, [searchParams, handleVerification]);

  useEffect(() => {
    if (
      (currentUser?.emailVerified || isEmailVerified) &&
      verificationStatus !== "success"
    ) {
      setVerificationStatus("success");
    }
  }, [currentUser?.emailVerified, isEmailVerified, verificationStatus]);

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage("");

    try {
      await refreshUser();

      if (currentUser?.emailVerified) {
        setVerificationStatus("success");
        toast.success("Email is already verified!");
        return;
      }

      await sendVerificationEmail();
      setVerificationStatus("pending");
      toast.success("New verification email sent!");

      hasProcessed.current = false;
      processedCode.current = null;
    } catch {
      setErrorMessage("Failed to send verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshUser();

      if (currentUser?.emailVerified) {
        setVerificationStatus("success");
        toast.success("Email verified successfully!");
      } else {
        toast.info("Email not yet verified. Please check your email.");
      }
    } catch (error) {
      console.error("Error refreshing user status:", error);
    }
  };

  const isVerified = currentUser?.emailVerified || isEmailVerified;

  if (isVerified) {
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
  }

  if (verificationStatus === "loading") {
    return (
      <div className="text-center space-y-4">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (verificationStatus === "error") {
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
          onClick={handleResend}
          disabled={isResending}
          className="w-full"
        >
          {isResending ? t("common.loading") : t("auth.resendVerification")}
        </Button>
      </div>
    );
  }

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
        <Button onClick={handleRefresh} variant="outline" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("auth.checkVerificationStatus")}
        </Button>

        <Button
          onClick={handleResend}
          disabled={isResending}
          className="w-full"
        >
          {isResending ? t("common.loading") : t("auth.resendVerification")}
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
};
