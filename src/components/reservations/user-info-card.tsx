"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, User } from "lucide-react";
import type { UserProfileWithId } from "@/lib/users-service";

interface UserInfoCardProps {
  user: UserProfileWithId;
  t: (key: string) => string;
}

export function UserInfoCard({ user, t }: UserInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("reservations.userInformation")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("users.name")}</div>
              <div className="text-sm font-medium">{user.name}</div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("users.email")}</div>
              <div className="text-sm font-medium">{user.email}</div>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t("users.phone")}</div>
              <div className="text-sm font-medium">
                {user.phone || <span className="text-muted-foreground">-</span>}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
