import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CarFront } from "lucide-react";
import { EmailChange } from "@/components/auth/EmailChange";
import { EmailVerification } from "@/components/auth/EmailVerification";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "react-router-dom";
import { PasswordReset } from "@/components/auth/PasswordReset";
import { RecoverEmail } from "@/components/auth/RecoverEmail";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Action = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const mode = searchParams.get("mode");

  const renderActionComponent = () => {
    switch (mode) {
      case "resetPassword":
        return <PasswordReset />;
      case "verifyEmail":
        return <EmailVerification />;
      case "verifyAndChangeEmail":
        return <EmailChange />;
      case "recoverEmail":
        return <RecoverEmail />;
      case "action":
        // For email change notifications, check if it's a recoverEmail action
        return <EmailChange />;
      default:
        return (
          <div className="text-center space-y-4">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {t("auth.invalidActionMode")}
            </div>
            <Link
              to="/auth"
              className="inline-block text-sm text-primary hover:underline"
            >
              {t("auth.backToLogin")}
            </Link>
          </div>
        );
    }
  };

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
              {mode === "resetPassword" && t("auth.resetPassword")}
              {mode === "verifyEmail" && t("auth.emailVerification")}
              {mode === "verifyAndChangeEmail" && t("auth.emailChange")}
              {mode === "recoverEmail" && t("auth.emailRecovery")}
              {mode === "action" && t("auth.emailChange")}
              {!mode && t("auth.action")}
            </CardTitle>
            <CardDescription>
              {mode === "resetPassword" && t("auth.resetPasswordDesc")}
              {mode === "verifyEmail" && t("auth.emailVerificationDesc")}
              {mode === "verifyAndChangeEmail" && t("auth.emailChangeDesc")}
              {mode === "recoverEmail" && t("auth.emailRecoveryDesc")}
              {mode === "action" && t("auth.emailChangeDesc")}
              {!mode && t("auth.actionDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>{renderActionComponent()}</CardContent>
        </Card>
        <div className="flex justify-center">
          <LanguageSwitcher authOnly={true} />
        </div>
      </section>
    </main>
  );
};

export default Action;
