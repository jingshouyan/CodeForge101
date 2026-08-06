import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useAuthStore } from './stores/auth'
import LoginPage from './pages/LoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import AppsPage from './pages/admin/AppsPage'
import AppDetailPage from './pages/admin/AppDetailPage'
import RuntimePage from './pages/runtime/RuntimePage'

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/admin/apps" replace />} />
          <Route path="apps" element={<AppsPage />} />
          <Route path="apps/:appId" element={<AppDetailPage />} />
        </Route>
        <Route
          path="/app/:appId/:path?"
          element={
            <RequireAuth>
              <RuntimePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/admin/apps" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
