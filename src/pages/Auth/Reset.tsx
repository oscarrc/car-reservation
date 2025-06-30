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
import { Car } from "lucide-react";
import type { FirebaseError } from "firebase/app";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

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

  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    async function verifyResetCode() {
      if (!oobCode) {
        setError("Invalid or missing reset code.");
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
          setError("Reset code has expired. Please request a new one.");
        } else if (
          (error as FirebaseError).code === "auth/invalid-action-code"
        ) {
          setError("Invalid reset code. Please request a new one.");
        } else {
          setError("Invalid reset code. Please try again.");
        }
        setValidCode(false);
      } finally {
        setVerifying(false);
      }
    }

    verifyResetCode();
  }, [oobCode]);

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
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setError("");
      setMessage("");
      setLoading(true);

      await confirmPasswordReset(auth, oobCode!, password);
      setMessage(
        "Password reset successful! You can now log in with your new password."
      );
    } catch (error) {
      console.error("Password reset error:", error);
      if ((error as FirebaseError).code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError("Failed to reset password. Please try again.");
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
            to="/login"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Car className="size-4" />
            </div>
            Car Reservation System
          </Link>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">
                  Verifying reset code...
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <section className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/login"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Car className="size-4" />
          </div>
          Car Reservation System
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Set new password</CardTitle>
            <CardDescription>
              {validCode && userEmail
                ? `Reset password for ${userEmail}`
                : "Enter your new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!validCode ? (
              <div className="text-center space-y-4">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
                <Link
                  to="/forgot"
                  className="inline-block text-sm text-primary hover:underline"
                >
                  Request a new reset link
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
                    <Label htmlFor="password">New Password</Label>
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
                      Confirm New Password
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
                      {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                  )}
                  <div className="text-center">
                    <Link
                      to="/login"
                      className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                    >
                      {message ? "Continue to Login" : "Back to Login"}
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Reset;
