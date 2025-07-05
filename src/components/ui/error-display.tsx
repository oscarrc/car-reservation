"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface ErrorDisplayProps {
  error?: Error | string | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  homePath?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  title,
  description,
  showHomeButton = true,
  homePath,
}: ErrorDisplayProps) {
  const { t } = useTranslation();
  const { authUser } = useAuth();

  // Determine if user is admin
  const isAdmin = authUser?.profile?.role === "admin";

  // Determine homepage path
  const defaultHomePath = isAdmin ? "/admin" : "/app";
  const finalHomePath = homePath || defaultHomePath;

  // Get error message
  const errorMessage =
    error instanceof Error ? error.message : error || "Unknown error";

  // Default content
  const defaultTitle = t(
    "error.unexpectedError",
    "There was an unexpected error"
  );
  const defaultDescription = t(
    "error.userDescription",
    "We're sorry, but something went wrong. Please try again, and if the problem persists, contact support."
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 py-8 text-center">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {title || defaultTitle}
          </h2>
        </div>

        {/* Description for Users */}
        {!isAdmin && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description || defaultDescription}
          </p>
        )}

        {/* Error Details for Admins */}
        {isAdmin && error && (
          <Alert variant="destructive" className="text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {t("error.technicalDetails", "Technical Details")}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p className="font-mono text-xs break-all">{errorMessage}</p>
                {error instanceof Error && error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium">
                      {t("error.showStack", "Show Stack Trace")}
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showHomeButton && (
            <Button
              variant="outline"
              onClick={() => (window.location.href = finalHomePath)}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              {t("error.goHome", "Go to Homepage")}
            </Button>
          )}

          {onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              {t("error.retry", "Try Again")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
