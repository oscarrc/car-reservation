import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { adminSidebarConfig, appSidebarConfig } from "./lib/sidebar-config";

import AdminPage from "./pages/Admin";
import FleetPage from "./pages/Admin/Fleet";
import ReservationsPage from "./pages/Admin/Reservations";
import UsersPage from "./pages/Admin/Users";
import SettingsPage from "./pages/Admin/Settings";
import AppPage from "./pages/App";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import SidebarLayout from "./layouts/Sidebar";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin" fallbackPath="/app">
                <SidebarLayout config={adminSidebarConfig} />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminPage />} />
            <Route path="fleet" element={<FleetPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/app"
            element={
              <ProtectedRoute requiredRole="teacher">
                <SidebarLayout config={appSidebarConfig} />
              </ProtectedRoute>
            }
          >
            <Route index element={<AppPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
