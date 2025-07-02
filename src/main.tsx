import "./index.css";
import "./i18n"; // Initialize i18n

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { adminSidebarConfig, appSidebarConfig } from "./lib/sidebar-config.ts";

import AdminPage from "./pages/Admin/index.tsx";
import AppPage from "./pages/App/index.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import CarPage from "./pages/Admin/Fleet/Car.tsx";
import FleetPage from "./pages/Admin/Fleet/index.tsx";
import Forgot from "./pages/Auth/Forgot.tsx";
import Login from "./pages/Auth/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProfilePage from "./pages/Profile.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import ReservationsPage from "./pages/Admin/Reservations.tsx";
import Reset from "./pages/Auth/Reset.tsx";
import SettingsPage from "./pages/Admin/Settings.tsx";
import SidebarLayout from "./layouts/Sidebar.tsx";
import { StrictMode } from "react";
import { Toaster } from "@/components/ui/sonner";
import UserReservationsPage from "./pages/App/Reservations.tsx";
import UsersPage from "./pages/Admin/Users/index.tsx";
import UserPage from "./pages/Admin/Users/User.tsx";
import { createRoot } from "react-dom/client";
import { SettingsProvider } from "@/contexts/SettingsContext";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot",
    element: <Forgot />,
  },
  {
    path: "/reset",
    element: <Reset />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin">
        <SidebarLayout config={adminSidebarConfig} />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "users/:userId",
        element: <UserPage />,
      },
      {
        path: "fleet",
        element: <FleetPage />,
      },
      {
        path: "fleet/:carId",
        element: <CarPage />,
      },
      {
        path: "reservations",
        element: <ReservationsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <SidebarLayout config={appSidebarConfig} />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AppPage />,
      },
      {
        path: "reservations",
        element: <UserReservationsPage />,
      },
    ],
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <SidebarLayout config={appSidebarConfig} />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <RouterProvider router={router} />
          <Toaster />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
