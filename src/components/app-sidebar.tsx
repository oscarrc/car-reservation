import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { CarFront } from "lucide-react";
import { InstallApp } from "@/components/install-app";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import type { SidebarConfig } from "@/lib/sidebar-config";
import { useTranslation } from "react-i18next";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  config?: SidebarConfig;
  variant?: "sidebar" | "floating" | "inset";
}

export function AppSidebar({
  config,
  variant = "sidebar",
  ...props
}: AppSidebarProps) {
  const { t } = useTranslation();

  // Default data for when no config is provided
  const defaultData = {
    user: {
      name: "User",
      email: "user@example.com",
    },
    company: {
      name: "brand.name",
      access: "navigation.userPortal",
    },
    items: [],
  };

  const data = config || defaultData;

  // Pass the config items to navMain
  const navMainItems = data.items.map((item) => ({
    title: item.title,
    url: item.url,
    icon: item.icon,
    isActive: item.isActive || false,
  }));

  return (
    <Sidebar variant={variant} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <CarFront className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {t(data.company.name)}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {t(data.company.access)}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
        <InstallApp />
      </SidebarFooter>
    </Sidebar>
  );
}
