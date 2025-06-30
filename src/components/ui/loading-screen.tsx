import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface LoadingScreenProps {
  text?: string;
  className?: string;
}

export function LoadingScreen({ 
  text, 
  className 
}: LoadingScreenProps) {
  const { t } = useTranslation();
  const displayText = text || t("common.loading");
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-screen bg-background",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <p className="text-lg font-medium text-muted-foreground animate-pulse">
          {displayText}
        </p>
      </div>
    </div>
  );
} 