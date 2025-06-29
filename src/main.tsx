import "./index.css";

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.tsx'
import Login from './pages/Login.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import AdminPage from './pages/Admin/index.tsx'
import UsersPage from './pages/Admin/Users.tsx'
import AppPage from './pages/App/index.tsx'
import SidebarLayout from './layouts/Sidebar.tsx'
import { adminSidebarConfig, appSidebarConfig } from './lib/sidebar-config.ts'

// Create a client
const queryClient = new QueryClient()

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
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
