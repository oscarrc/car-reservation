import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import { Outlet, useLocation } from "react-router-dom";
import type { SidebarConfig } from "@/lib/sidebar-config";
import { SiteHeader } from "@/components/site-header";

export default function SidebarLayout({ config }: { config: SidebarConfig }) {
  const location = useLocation();

  // Find the current page title based on the route
  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    
    // Find matching item in sidebar config
    const currentItem = config.items.find(item => item.url === currentPath);
    
    return currentItem ? currentItem.title : "Dashboard";
  };

  // Update config to set active state based on current route
  const updatedConfig = {
    ...config,
    items: config.items.map(item => ({
      ...item,
      isActive: item.url === location.pathname
    }))
  };

  const currentPageTitle = getCurrentPageTitle();
  const companyName = config.company.name;

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader 
          companyName={companyName} 
          currentPageTitle={currentPageTitle} 
        />
        <div className="flex flex-1">
          <AppSidebar config={updatedConfig} />
          <SidebarInset>
            <Outlet />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
