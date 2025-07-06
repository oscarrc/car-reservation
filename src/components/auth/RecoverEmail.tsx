import { CheckCircle, Mail, XCircle } from "lucide-react";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export const RecoverEmail = () => {
  const { refreshUser, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [recoverStatus, setRecoverStatus] = useState<
    "pending" | "success" | "error" | "loading" | "processing"
  >("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recoveredEmail, setRecoveredEmail] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const handleEmailRecovery = async () => {
      const oobCode = searchParams.get("oobCode");

      if (oobCode) {
        setRecoverStatus("processing");
        try {
          // Check if the action code is valid
          const actionCodeInfo = await checkActionCode(auth, oobCode);

          // Extract email information from the action code
          if (actionCodeInfo.data?.email) {
            setRecoveredEmail(actionCodeInfo.data.email);
          }

          setRecoverStatus("pending");
        } catch (error) {
          console.error("Email recovery error:", error);
          setRecoverStatus("error");
          setErrorMessage(t("auth.emailRecoveryInvalidCode"));
        }
      }
    };

    handleEmailRecovery();
  }, [searchParams, t]);

  const handleConfirmEmailRecovery = async () => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) return;

    setIsProcessing(true);
    try {
      // Apply the action code to recover the email
      await applyActionCode(auth, oobCode);
      
      // Refresh user data to get the recovered email
      await refreshUser();
      await refreshProfile();
      
      setRecoverStatus("success");
    } catch (error) {
      console.error("Error recovering email:", error);
      setRecoverStatus("error");
      setErrorMessage(t("auth.emailRecoveryErrorSubtitle"));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (recoverStatus) {
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
              {t("auth.emailRecoveryProcessing")}
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                {t("auth.emailRecoverySuccess")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t("auth.emailRecoverySuccessSubtitle")}
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
                {t("auth.emailRecoveryError")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {errorMessage || t("auth.emailRecoveryErrorSubtitle")}
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
            <Mail className="mx-auto w-12 h-12 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">
                {t("auth.emailRecoveryPending")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t("auth.emailRecoveryPendingSubtitle")}
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
                <p className="font-medium mb-1">
                  {t("auth.emailRecoveryEmailFound")}
                </p>
                <p className="font-semibold text-lg">{recoveredEmail}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                {t("auth.emailRecoveryInstructions")}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleConfirmEmailRecovery}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing
                  ? t("auth.emailRecoveryConfirming")
                  : t("auth.emailRecoveryConfirm")}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">{t("auth.emailRecoveryWhatToDo")}</p>
              <p>{t("auth.emailRecoveryWhatToDoConfirm")}</p>
              <p>{t("auth.emailRecoveryWhatToDoContact")}</p>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};
