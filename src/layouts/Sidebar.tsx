import { Outlet, useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarConfig } from "@/lib/sidebar-config";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/contexts/AuthContext";

export default function SidebarLayout({ config }: { config: SidebarConfig }) {
  const location = useLocation();
  const { userProfile, currentUser } = useAuth();

  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    const currentItem = config.items.find((item) => item.url === currentPath);
    return currentItem ? currentItem.title : "Dashboard";
  };

  const updatedConfig = {
    ...config,
    items: config.items.map((item) => ({
      ...item,
      isActive: item.url === location.pathname,
    })),
    // Use Firestore profile name and Firebase auth email
    user: userProfile && currentUser
      ? {
          name: userProfile.name,
          email: currentUser.email || "",
        }
      : config.user,
  };

  const currentPageTitle = getCurrentPageTitle();
  const companyName = config.company.name;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar config={updatedConfig} variant="inset" />
      <SidebarInset>
        <SiteHeader 
          companyName={companyName} 
          currentPageTitle={currentPageTitle} 
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
