import { Calendar, CarFront, HelpCircle, Home, Mail, Settings, Users } from "lucide-react"

import type { LucideIcon } from "lucide-react"

export interface SidebarItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

export interface SidebarConfig {
  user: {
    name: string
    email: string
  }
  items: SidebarItem[]
  company: {
    name: string
    access: string
  }
}

export const adminSidebarConfig: SidebarConfig = {
  user: {
    name: "Admin User",
    email: "admin@company.com"
  },
  company: {
    name: "brand.name",
    access: "navigation.administrativePortal"
  },
  items: [
    {
      title: "navigation.dashboard",
      url: "/admin",
      icon: Home
    },
    {
      title: "navigation.reservations",
      url: "/admin/reservations",
      icon: Calendar
    },
    {
      title: "navigation.fleet",
      url: "/admin/fleet",
      icon: CarFront
    },
    {
      title: "navigation.users",
      url: "/admin/users",
      icon: Users
    },
    {
      title: "navigation.allowedEmails",
      url: "/admin/users/allowed-emails",
      icon: Mail
    },
    {
      title: "navigation.settings",
      url: "/admin/settings",
      icon: Settings
    },
    {
      title: "navigation.help",
      url: "/admin/help",
      icon: HelpCircle
    }
  ]
}

export const appSidebarConfig: SidebarConfig = {
  user: {
    name: "John Doe",
    email: "john@example.com"
  },
  company: {
    name: "brand.name",
    access: "navigation.userPortal"
  },
  items: [
    {
      title: "navigation.dashboard",
      url: "/app",
      icon: Home
    },
    {
      title: "navigation.myReservations",
      url: "/app/reservations",
      icon: Calendar
    },
    {
      title: "navigation.browseCars",
      url: "/app/browse",
      icon: CarFront
    },
    {
      title: "navigation.help",
      url: "/app/help",
      icon: HelpCircle
    }
  ]
} 