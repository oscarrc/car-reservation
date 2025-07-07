"use client";

import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserProfileWithId } from "@/lib/users-service";

interface UserFullInfoCardProps {
  user: UserProfileWithId;
}

// Helper functions to get badge variants
const getStatusVariant = (suspended: boolean) => {
  return suspended ? "destructive" : "success";
};

const getRoleVariant = (role: string) => {
  return role === "admin" ? "default" : "secondary";
};

export function UserFullInfoCard({ user }: UserFullInfoCardProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("users.userInformation")}
          </div>
          <Badge variant={getStatusVariant(user.suspended)}>
            {user.suspended ? t("users.suspended") : t("users.active")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("users.name")}
            </p>
            <p className="text-sm">{user.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("users.email")}
            </p>
            <p className="text-sm">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("users.phone")}
            </p>
            <p className="text-sm">
              {user.phone || t("common.notProvided")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("users.role")}
            </p>
            <Badge variant={getRoleVariant(user.role)}>
              {t(`users.roles.${user.role}`)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}