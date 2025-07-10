import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import { adminSidebarConfig, appSidebarConfig } from "./lib/sidebar-config";

// Auth routes (not lazy loaded)
import ActionPage from "./pages/Auth/Action";
// Index pages (not lazy loaded)
import AdminPage from "./pages/Admin";
import AppPage from "./pages/App";
// Layouts and contexts (not lazy loaded)
import { AuthProvider } from "./contexts/AuthContext";
import ErrorPage from "./pages/Error";
import ForgotPage from "./pages/Auth/Forgot";
import { LoadingScreen } from "./components/ui/loading-screen";
import LoginPage from "./pages/Auth/Login";
import OnboardingLayout from "./layouts/Onboarding";
import OnboardingPage from "./pages/Onboarding";
import { PWAProvider } from "./contexts/PWAContext";
import ProfilePage from "./pages/Profile";
import Protected from "./layouts/Protected";
import RegisterPage from "./pages/Auth/Register";
import SidebarLayout from "./layouts/Sidebar";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "sonner";

// Lazy loaded components
const AdminFaq = lazy(() => import("./pages/Admin/Faq"));
const AdminReservationPage = lazy(
  () => import("./pages/Admin/Reservations/Reservation")
);
const AllowedEmailsPage = lazy(
  () => import("./pages/Admin/Users/AllowedEmails")
);
const AppFaq = lazy(() => import("./pages/App/Faq"));
const AppReservationPage = lazy(
  () => import("./pages/App/Reservations/Reservation")
);
const CarPage = lazy(() => import("./pages/Admin/Fleet/Car"));
const FleetPage = lazy(() => import("./pages/Admin/Fleet"));
const LicensePage = lazy(() => import("./pages/Admin/License"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));
const ReservationsPage = lazy(() => import("./pages/Admin/Reservations"));
const SettingsPage = lazy(() => import("./pages/Admin/Settings"));
const UserFleetPage = lazy(() => import("./pages/App/Fleet"));
const UserPage = lazy(() => import("./pages/Admin/Users/User"));
const UserReservationsPage = lazy(() => import("./pages/App/Reservations"));
const UsersPage = lazy(() => import("./pages/Admin/Users"));

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
      errorElement: <ErrorPage />,
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
      errorElement: <ErrorPage />,
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
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <UsersPage />
            </Suspense>
          ),
        },
        {
          path: "users/:userId",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <UserPage />
            </Suspense>
          ),
        },
        {
          path: "users/allowed-emails",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <AllowedEmailsPage />
            </Suspense>
          ),
        },
        {
          path: "fleet",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <FleetPage />
            </Suspense>
          ),
        },
        {
          path: "fleet/:carId",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <CarPage />
            </Suspense>
          ),
        },
        {
          path: "reservations",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <ReservationsPage />
            </Suspense>
          ),
        },
        {
          path: "reservations/:reservationId",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <AdminReservationPage />
            </Suspense>
          ),
        },
        {
          path: "settings",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <SettingsPage />
            </Suspense>
          ),
        },
        {
          path: "help",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <AdminFaq />
            </Suspense>
          ),
        },
        {
          path: "license",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <LicensePage />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "/app",
      errorElement: <ErrorPage />,
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
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <UserReservationsPage />
            </Suspense>
          ),
        },
        {
          path: "reservations/:reservationId",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <AppReservationPage />
            </Suspense>
          ),
        },
        {
          path: "browse",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <UserFleetPage />
            </Suspense>
          ),
        },
        {
          path: "help",
          element: (
            <Suspense fallback={<LoadingScreen />}>
              <AppFaq />
            </Suspense>
          ),
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
      errorElement: <ErrorPage />,
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
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <OnboardingPage />,
        },
      ],
    },
    {
      path: "*",
      element: (
        <Suspense fallback={<LoadingScreen />}>
          <NotFoundPage />
        </Suspense>
      ),
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
