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

type StatusAction = "suspend" | "unsuspend";

interface StatusConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  action: StatusAction;
  isLoading?: boolean;
}

export function StatusConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  action,
  isLoading = false,
}: StatusConfirmationDialogProps) {
  const { t } = useTranslation();

  const getActionText = () => {
    if (isLoading) {
      return action === "suspend" 
        ? t("users.suspending") 
        : t("users.unsuspending");
    }
    return action === "suspend" 
      ? t("users.suspendUser") 
      : t("users.unsuspendUser");
  };

  const getButtonColor = () => {
    return action === "suspend" 
      ? "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-600"
      : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-600";
  };

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
            className={getButtonColor()}
          >
            {getActionText()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 