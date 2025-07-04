import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  action?: () => void;
  actionText?: string;
  actionIcon?: LucideIcon;
  actionVariant?: "default" | "outline" | "destructive";
}

export function SectionHeader({
  title,
  subtitle,
  action,
  actionText,
  actionIcon: ActionIcon,
  actionVariant = "default",
}: SectionHeaderProps) {
  return (
    <div className="mb-6 px-4 lg:px-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {action && actionText && (
          <Button className="cursor-pointer gap-2" variant={actionVariant} onClick={action}>
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            <span className="hidden sm:block">{actionText}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
