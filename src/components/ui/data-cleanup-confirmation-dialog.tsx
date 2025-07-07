import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

interface DataCleanupConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedYear: number;
  recordCount: number;
  isLoading?: boolean;
}

export function DataCleanupConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  selectedYear,
  recordCount,
  isLoading = false,
}: DataCleanupConfirmationDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-destructive">
                {t("settings.dataCleanup.confirmTitle")}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>{t("settings.dataCleanup.confirmDescription")}</p>
            <div className="rounded-md bg-destructive/5 p-3 space-y-1">
              <p className="font-medium text-destructive">
                {t("settings.dataCleanup.warningTitle")}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t("settings.dataCleanup.warningPermanent")}</li>
                <li>• {t("settings.dataCleanup.warningReports")}</li>
                <li>• {t("settings.dataCleanup.warningBackup")}</li>
              </ul>
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm">
                <span className="font-medium">{t("settings.dataCleanup.year")}:</span> {selectedYear}
              </p>
              <p className="text-sm">
                <span className="font-medium">{t("settings.dataCleanup.recordsToDelete")}:</span>{" "}
                {recordCount.toLocaleString()} {t("settings.dataCleanup.reservations")}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
          >
            {isLoading
              ? t("settings.dataCleanup.deleting")
              : t("settings.dataCleanup.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}