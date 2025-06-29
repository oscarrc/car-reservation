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

import { Command } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import type { SidebarConfig } from "@/lib/sidebar-config";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  config?: SidebarConfig;
}

export function AppSidebar({ config, ...props }: AppSidebarProps) {
  // Default data for when no config is provided
  const defaultData = {
    user: {
      name: "User",
      email: "user@example.com",
    },
    company: {
      name: "Company Name",
    },
    items: [],
  };

  const data = config || defaultData;

  // Convert config items to navMain format (simple items without sub-items)
  const navMainItems = data.items.map((item) => ({
    title: item.title,
    url: item.url,
    icon: item.icon,
    isActive: item.isActive || false,
  }));

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {data.company.name}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Internal System
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
      </SidebarFooter>
    </Sidebar>
  );
}
