import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export function EmailVerificationAlert() {
  const { currentUser, isEmailVerified, sendVerificationEmail } = useAuth();
  const [isSending, setIsSending] = useState(false);

  // Don't show anything if no user or email is already verified
  if (!currentUser || isEmailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsSending(true);
    try {
      await sendVerificationEmail();
    } catch {
      // Error is already handled in the sendVerificationEmail function
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Alert className="mb-6 bg-warning/50 border-warning items-center">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-black">
          <span>Please verify your email address.</span>
        </div>
        <Button
          variant="default"
          className="bg-warning border-warning text-black"
          size="sm"
          onClick={handleResendEmail}
          disabled={isSending}
        >
          {isSending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Mail className="h-3 w-3" />
          )}
          <span className="ml-1">Resend Email</span>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
