import { CheckCircle, Shield, XCircle } from "lucide-react";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const EmailChange = () => {
  const { refreshUser, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [emailChangeStatus, setEmailChangeStatus] = useState<
    "pending" | "success" | "error" | "loading" | "processing"
  >("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [previousEmail, setPreviousEmail] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const handleEmailChange = async () => {
      const oobCode = searchParams.get("oobCode");

      if (oobCode) {
        setEmailChangeStatus("processing");
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

          setEmailChangeStatus("pending");
        } catch (error) {
          console.error("Email change error:", error);
          setEmailChangeStatus("error");
          setErrorMessage(t("auth.emailChangeInvalidCode"));
        }
      }
    };

    handleEmailChange();
  }, [searchParams, t]);

  const handleConfirmEmailChange = async () => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) return;

    setIsChanging(true);
    try {
      // Apply the action code to confirm the email change
      await applyActionCode(auth, oobCode);

      // Refresh user data to get the new email
      await refreshUser();
      await refreshProfile();

      setEmailChangeStatus("success");
    } catch (error) {
      console.error("Error confirming email change:", error);
      setEmailChangeStatus("error");
      setErrorMessage(t("auth.emailChangeErrorSubtitle"));
    } finally {
      setIsChanging(false);
    }
  };

  const handleRevertEmailChange = async () => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) return;

    setIsReverting(true);
    try {
      // Apply the action code to revert the email change
      await applyActionCode(auth, oobCode);

      // Refresh user data to get the reverted email
      await refreshUser();
      await refreshProfile();

      setEmailChangeStatus("success");
    } catch (error) {
      console.error("Error reverting email change:", error);
      setEmailChangeStatus("error");
      setErrorMessage(t("auth.emailChangeErrorSubtitle"));
    } finally {
      setIsReverting(false);
    }
  };

  const renderContent = () => {
    switch (emailChangeStatus) {
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
              {t("auth.emailChangeProcessing")}
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                {t("auth.emailChangeSuccess")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t("auth.emailChangeSuccessSubtitle")}
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
                {t("auth.emailChangeError")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {errorMessage || t("auth.emailChangeErrorSubtitle")}
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
                {t("auth.emailChangeSecurityNotice")}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
                <p className="font-medium mb-1">
                  {t("auth.emailChangePendingSubtitle")}
                </p>
                <p className="font-semibold text-lg">{newEmail}</p>
                {previousEmail && (
                  <p className="text-xs mt-1">
                    {t("auth.emailChangePrevious")} {previousEmail}
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {t("auth.emailChangeInstructions")}
              </p>

              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
                <p className="font-medium">
                  {t("auth.emailChangeSecurityDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRevertEmailChange}
                disabled={isReverting || isChanging}
                variant="destructive"
                className="w-full"
              >
                {isReverting
                  ? t("auth.emailChangeReverting")
                  : t("auth.emailChangeRevert")}
              </Button>

              <Button
                onClick={handleConfirmEmailChange}
                disabled={isChanging || isReverting}
                className="w-full"
              >
                {isChanging
                  ? t("auth.emailChangeConfirming")
                  : t("auth.emailChangeConfirm")}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">{t("auth.emailChangeWhatToDo")}</p>
              <p>{t("auth.emailChangeWhatToDoConfirm")}</p>
              <p>{t("auth.emailChangeWhatToDoRevert")}</p>
              <p>{t("auth.emailChangeWhatToDoContact")}</p>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};
