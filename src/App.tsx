import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { adminSidebarConfig, appSidebarConfig } from "./lib/sidebar-config";

import ActionPage from "./pages/Auth/Action";
import AdminFaq from "./pages/Admin/Faq";
import AdminPage from "./pages/Admin";
import AdminReservationPage from "./pages/Admin/Reservations/Reservation";
import AllowedEmailsPage from "./pages/Admin/Users/AllowedEmails";
import AppFaq from "./pages/App/Faq";
import AppPage from "./pages/App";
import AppReservationPage from "./pages/App/Reservations/Reservation";
import { AuthProvider } from "./contexts/AuthContext";
import CarPage from "./pages/Admin/Fleet/Car";
import FleetPage from "./pages/Admin/Fleet";
import ForgotPage from "./pages/Auth/Forgot";
import LoginPage from "./pages/Auth/Login";
import NotFoundPage from "./pages/NotFound";
import OnboardingLayout from "./layouts/Onboarding";
import OnboardingPage from "./pages/Onboarding";
import { PWAProvider } from "./contexts/PWAContext";
import ProfilePage from "./pages/Profile";
import Protected from "./layouts/Protected";
import RegisterPage from "./pages/Auth/Register";
import ReservationsPage from "./pages/Admin/Reservations";
import SettingsPage from "./pages/Admin/Settings";
import SidebarLayout from "./layouts/Sidebar";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "sonner";
import UserFleetPage from "./pages/App/Fleet";
import UserPage from "./pages/Admin/Users/User";
import UserReservationsPage from "./pages/App/Reservations";
import UsersPage from "./pages/Admin/Users";

const App = () => {
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
      element: <LoginPage />,
    },
    {
      path: "/auth",
      children: [
        {
          index: true,
          element: <LoginPage />,
        },
        {
          path: "register",
          element: <RegisterPage />,
        },
        {
          path: "forgot",
          element: <ForgotPage />,
        },
        {
          path: "action",
          element: <ActionPage />,
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
        {
          path: "help",
          element: <AdminFaq />,
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
        {
          path: "help",
          element: <AppFaq />,
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
      element: <NotFoundPage />,
    },
  ]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="car-reservation-theme">
      <QueryClientProvider client={queryClient}>
        <PWAProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </PWAProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
