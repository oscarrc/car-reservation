import { Outlet, useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarConfig } from "@/lib/sidebar-config";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function SidebarLayout({ config }: { config: SidebarConfig }) {
  const location = useLocation();
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const updatedConfig = {
    ...config,
    items: config.items.map((item) => ({
      ...item,
      isActive: item.url === location.pathname,
    })),
    // Use Firestore profile name and email
    user: userProfile
      ? {
          name: userProfile.name,
          email: userProfile.email,
        }
      : config.user,
  };

  const companyName = t(config.company.name);
  const homePageUrl = userProfile?.role === "admin" ? "/admin" : "/app";

  return (
    <div className="h-screen overflow-hidden">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar config={updatedConfig} variant="inset" />
        <SidebarInset className="overflow-hidden h-[calc(100vh-1rem)] my-4 mr-4 flex flex-col">
          {/* Fixed Header at top */}
          <div className="flex-shrink-0 bg-background border-b">
            <SiteHeader companyName={companyName} homePageUrl={homePageUrl} />
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <Outlet />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
