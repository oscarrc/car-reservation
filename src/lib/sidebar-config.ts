import { BarChart3, Calendar, CarFront, FileText, HelpCircle, Home, Settings, Users } from "lucide-react"

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
    name: "Car Reservation System",
    access: "Administrative portal"
  },
  items: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Home
    },
    {
      title: "Users Management",
      url: "/admin/users",
      icon: Users
    },
    {
      title: "Car Fleet",
      url: "/admin/fleet",
      icon: CarFront
    },
    {
      title: "Reservations",
      url: "/admin/reservations",
      icon: Calendar
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: BarChart3
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings
    }
  ]
}

export const appSidebarConfig: SidebarConfig = {
  user: {
    name: "John Doe",
    email: "john@example.com"
  },
  company: {
    name: "Car Reservation System",
    access: "User portal"
  },
  items: [
    {
      title: "Dashboard",
      url: "/app",
      icon: Home
    },
    {
      title: "My Reservations",
      url: "/app/reservations",
      icon: Calendar
    },
    {
      title: "Browse Cars",
      url: "/app/browse",
      icon: CarFront
    },
    {
      title: "History",
      url: "/app/history",
      icon: FileText
    },
    {
      title: "Support",
      url: "/app/support",
      icon: HelpCircle
    }
  ]
} 