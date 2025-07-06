import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { adminSidebarConfig, appSidebarConfig } from "./lib/sidebar-config";

import AdminPage from "./pages/Admin";
import AdminReservationPage from "./pages/Admin/Reservations/Reservation";
import AllowedEmailsPage from "./pages/Admin/Users/AllowedEmails";
import AppPage from "./pages/App";
import AppReservationPage from "./pages/App/Reservations/Reservation";
import { AuthProvider } from "./contexts/AuthContext";
import CarPage from "./pages/Admin/Fleet/Car";
import FleetPage from "./pages/Admin/Fleet";
import ForgotPage from "./pages/Auth/Forgot";
import LoginPage from "./pages/Auth/Login";
import NotFoundPage from "./pages/NotFound";
import OnboardingLayout from "./layouts/Onboarding";
import OnboardingPage from "./pages/App/Onboarding";
import { PWAProvider } from "./contexts/PWAContext";
import ProfilePage from "./pages/Profile";
import Protected from "./layouts/Protected";
import RegisterPage from "./pages/Auth/Register";
import ReservationsPage from "./pages/Admin/Reservations";
import ResetPage from "./pages/Auth/Reset";
import SettingsPage from "./pages/Admin/Settings";
import SidebarLayout from "./layouts/Sidebar";
import UserFleetPage from "./pages/App/Fleet";
import UserPage from "./pages/Admin/Users/User";
import UserReservationsPage from "./pages/App/Reservations";
import UsersPage from "./pages/Admin/Users";
import VerifyPage from "./pages/Auth/Verify";

const App = () => {
  return (
    <PWAProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/auth">
              <Route index element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot" element={<ForgotPage />} />
              <Route path="reset" element={<ResetPage />} />
              <Route path="verify" element={<VerifyPage />} />
            </Route>
            <Route
              path="/admin"
              element={
                <Protected requiredRole="admin" fallbackPath="/app">
                  <SidebarLayout config={adminSidebarConfig} />
                </Protected>
              }
            >
              <Route index element={<AdminPage />} />
              <Route path="fleet" element={<FleetPage />} />
              <Route path="fleet/:carId" element={<CarPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route
                path="reservations/:reservationId"
                element={<AdminReservationPage />}
              />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:userId" element={<UserPage />} />
              <Route
                path="users/allowed-emails"
                element={<AllowedEmailsPage />}
              />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route
              path="/app"
              element={
                <Protected requiredRole="teacher">
                  <SidebarLayout config={appSidebarConfig} />
                </Protected>
              }
            >
              <Route index element={<AppPage />} />
              <Route path="reservations" element={<UserReservationsPage />} />
              <Route
                path="reservations/:reservationId"
                element={<AppReservationPage />}
              />
              <Route path="browse" element={<UserFleetPage />} />
            </Route>

            <Route
              path="/profile"
              element={
                <Protected>
                  <SidebarLayout config={appSidebarConfig} />
                </Protected>
              }
            >
              <Route index element={<ProfilePage />} />
            </Route>
            <Route
              path="/onboarding"
              element={
                <Protected>
                  <OnboardingLayout />
                </Protected>
              }
            >
              <Route index element={<OnboardingPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </PWAProvider>
  );
};

export default App;
