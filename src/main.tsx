import "./index.css";
import "./i18n"; // Initialize i18n

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { adminSidebarConfig, appSidebarConfig } from "./lib/sidebar-config.ts";

import AdminPage from "./pages/Admin/index.tsx";
import AdminReservationPage from "./pages/Admin/Reservations/Reservation.tsx";
import AllowedEmailsPage from "./pages/Admin/Users/AllowedEmails.tsx";
import AppPage from "./pages/App/index.tsx";
import AppReservationPage from "./pages/App/Reservations/Reservation.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import CarPage from "./pages/Admin/Fleet/Car.tsx";
import Email from "./pages/Auth/Email.tsx";
import FleetPage from "./pages/Admin/Fleet/index.tsx";
import Forgot from "./pages/Auth/Forgot.tsx";
import Login from "./pages/Auth/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import OnboardingLayout from "./layouts/Onboarding.tsx";
import OnboardingPage from "./pages/App/Onboarding.tsx";
import { PWAProvider } from "./contexts/PWAContext.tsx";
import ProfilePage from "./pages/Profile.tsx";
import Protected from "./layouts/Protected.tsx";
import Register from "./pages/Auth/Register.tsx";
import ReservationsPage from "./pages/Admin/Reservations/index.tsx";
import Reset from "./pages/Auth/Reset.tsx";
import SettingsPage from "./pages/Admin/Settings.tsx";
import SidebarLayout from "./layouts/Sidebar.tsx";
import { StrictMode } from "react";
import { Toaster } from "@/components/ui/sonner";
import UserFleetPage from "./pages/App/Fleet.tsx";
import UserPage from "./pages/Admin/Users/User.tsx";
import UserReservationsPage from "./pages/App/Reservations/index.tsx";
import UsersPage from "./pages/Admin/Users/index.tsx";
import Verify from "./pages/Auth/Verify.tsx";
import { createRoot } from "react-dom/client";

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
    path: "/auth",
    children: [
      {
        index: true,
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "forgot",
        element: <Forgot />,
      },
      {
        path: "reset",
        element: <Reset />,
      },
      {
        path: "verify",
        element: <Verify />,
      },
      {
        path: "email",
        element: <Email />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <Protected requiredRole="admin">
        <SidebarLayout config={adminSidebarConfig} />
      </Protected>
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
        path: "users/allowed-emails",
        element: <AllowedEmailsPage />,
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
        path: "reservations/:reservationId",
        element: <AdminReservationPage />,
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
      <Protected>
        <SidebarLayout config={appSidebarConfig} />
      </Protected>
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
      {
        path: "reservations/:reservationId",
        element: <AppReservationPage />,
      },
      {
        path: "browse",
        element: <UserFleetPage />,
      },
    ],
  },
  {
    path: "/profile",
    element: (
      <Protected>
        <SidebarLayout config={appSidebarConfig} />
      </Protected>
    ),
    children: [
      {
        index: true,
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: "onboarding",
    element: (
      <Protected>
        <OnboardingLayout />
      </Protected>
    ),
    children: [
      {
        index: true,
        element: <OnboardingPage />,
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
      <PWAProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </PWAProvider>
    </QueryClientProvider>
  </StrictMode>
);
