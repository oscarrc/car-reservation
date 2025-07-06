import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePWA } from "@/contexts/PWAContext";
import { useTranslation } from "react-i18next";

export function InstallApp() {
  const { t } = useTranslation();
  const { isInstallable, installApp } = usePWA();

  if (!isInstallable) {
    return null;
  }

  return (
    <div className="px-2 pb-2">
      <Button
        variant="outline"
        size="sm"
        onClick={installApp}
        className="w-full justify-start gap-2 rounded-sm"
      >
        <Download className="h-4 w-4" />
        {t("installApp.install", "Install App")}
      </Button>
    </div>
  );
}
