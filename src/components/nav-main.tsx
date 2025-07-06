"use client"

import { type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
  }[]
}) {
  const { t } = useTranslation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("common.navigation")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const translatedTitle = t(item.title)
          
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.isActive} tooltip={translatedTitle}>
                <Link to={item.url}>
                  <item.icon />
                  <span>{translatedTitle}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
