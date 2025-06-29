import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { adminSidebarConfig, appSidebarConfig } from "./lib/sidebar-config";

import AdminPage from "./pages/Admin";
import AppPage from "./pages/App";
import LoginPage from "./pages/Login";
import SidebarLayout from "./layouts/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

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
