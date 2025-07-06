import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function EmailVerificationBadge() {
  const { currentUser, isEmailVerified } = useAuth();
  const navigate = useNavigate();

  // Only show badge if user is logged in and email is not verified
  if (!currentUser || isEmailVerified) {
    return null;
  }

  return (
    <Badge
      variant="warning"
      className="cursor-pointer hover:bg-yellow-500 transition-colors text-black"
      onClick={() => navigate("/profile")}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Verify Email
    </Badge>
  );
}
