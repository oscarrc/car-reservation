import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReservationStatus } from "@/types/reservation";

interface StatusSelectProps {
  value: ReservationStatus;
  onValueChange: (status: ReservationStatus) => void;
  t: (key: string) => string;
  triggerClassName?: string;
  showValue?: boolean;
  disabled?: boolean;
}

const getStatusVariant = (
  status: ReservationStatus
):
  | "default"
  | "secondary" 
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "orange"
  | "red" => {
  switch (status) {
    case "pending":
      return "warning";
    case "confirmed":
      return "success";
    case "cancelled":
      return "destructive";
    case "cancellation_pending":
      return "orange";
    case "rejected":
      return "red";
    default:
      return "outline";
  }
};

export function StatusSelect({
  value,
  onValueChange,
  t,
  triggerClassName = "w-[180px] border-none shadow-none",
  showValue = true,
  disabled = false,
}: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        {showValue ? (
          <SelectValue>
            <Badge variant={getStatusVariant(value)}>
              {t(`reservations.${value}`)}
            </Badge>
          </SelectValue>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">
          <Badge variant={getStatusVariant("pending")}>
            {t("reservations.pending")}
          </Badge>
        </SelectItem>
        <SelectItem value="confirmed">
          <Badge variant={getStatusVariant("confirmed")}>
            {t("reservations.confirmed")}
          </Badge>
        </SelectItem>
        <SelectItem value="cancelled">
          <Badge variant={getStatusVariant("cancelled")}>
            {t("reservations.cancelled")}
          </Badge>
        </SelectItem>
        <SelectItem value="cancellation_pending">
          <Badge variant={getStatusVariant("cancellation_pending")}>
            {t("reservations.cancellation_pending")}
          </Badge>
        </SelectItem>
        <SelectItem value="rejected">
          <Badge variant={getStatusVariant("rejected")}>
            {t("reservations.rejected")}
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
} 