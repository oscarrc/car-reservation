import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSettings, type AppSettings } from "@/lib/settings-service";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useTranslation } from "react-i18next";

interface SettingsContextType {
  settings: AppSettings | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextType>(
  {} as SettingsContextType
);

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    retry: 3,
    retryDelay: 1000,
  });

  const value: SettingsContextType = {
    settings: settings || null,
    isLoading,
    error: error as Error | null,
    refetch,
  };

  // Show loading screen only on initial load
  if (isLoading && !settings) {
    return <LoadingScreen text={t("loading.loadingSettings")} />;
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
