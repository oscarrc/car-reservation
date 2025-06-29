import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { adminSidebarConfig, appSidebarConfig } from "./lib/sidebar-config";

import AdminPage from "./pages/Admin";
import AppPage from "./pages/App";
import LoginPage from "./pages/Login";
import SidebarLayout from "./layouts/Sidebar";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/admin"
          element={<SidebarLayout config={adminSidebarConfig} />}
        >
          <Route index element={<AdminPage />} />
        </Route>

        <Route
          path="/app"
          element={<SidebarLayout config={appSidebarConfig} />}
        >
          <Route index element={<AppPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
