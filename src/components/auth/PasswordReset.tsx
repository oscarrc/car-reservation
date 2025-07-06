import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { FirebaseError } from "firebase/app";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validCode, setValidCode] = useState(false);
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
        await verifyPasswordResetCode(auth, oobCode);
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
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">
          {t("auth.verifyingCode")}
        </p>
      </div>
    );
  }

  if (!validCode) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
        <a
          href="/auth/forgot"
          className="inline-block text-sm text-primary hover:underline"
        >
          {t("auth.requestNewLink")}
        </a>
      </div>
    );
  }

  return (
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
          <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
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
            {loading ? t("auth.resetting") : t("auth.resetPasswordBtn")}
          </Button>
        )}
        <div className="text-center">
          <a
            href="/auth"
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            {message ? t("auth.continueToLogin") : t("auth.backToLogin")}
          </a>
        </div>
      </div>
    </form>
  );
};
