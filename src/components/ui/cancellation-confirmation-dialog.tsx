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

interface CancellationConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  isAutoCancel?: boolean;
}

export function CancellationConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  isLoading = false,
  isAutoCancel = false,
}: CancellationConfirmationDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90 focus:ring-destructive"
          >
            {isLoading
              ? isAutoCancel
                ? t("reservations.cancelling")
                : t("reservations.requestingCancellation")
              : t("reservations.cancelReservation")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 