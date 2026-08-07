import { Routes, Route, Navigate } from 'react-router-dom'
import EmployeeLogin from '../pages/EmployeeLogin'
import EmployeeDashboard from '../pages/EmployeeDashboard'
import AdminLogin from '../pages/AdminLogin'
import AdminDashboard from '../pages/AdminDashboard'
import ScanPage from '../pages/ScanPage'
import ProtectedRoute from '../components/ProtectedRoute'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default → Employee Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Employee */}
      <Route path="/login" element={<EmployeeLogin />} />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute role="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* QR Scan page — public, opened on employee's phone */}
      <Route path="/scan" element={<ScanPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
