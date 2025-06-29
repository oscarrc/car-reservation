import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  action?: () => void;
  actionText?: string;
  actionIcon?: LucideIcon;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  actionText,
  actionIcon: ActionIcon,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {action && actionText && (
          <Button className="cursor-pointer" onClick={action}>
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
} 