import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import EmployeeList from '../pages/employees/EmployeeList';
import EmployeeProfile from '../pages/employees/EmployeeProfile';
import DepartmentList from '../pages/departments/DepartmentList';
import DesignationList from '../pages/designations/DesignationList';
import AttendanceList from '../pages/attendance/AttendanceList';
import LeaveList from '../pages/leaves/LeaveList';
import Reports from '../pages/reports/Reports';
import Settings from '../pages/settings/Settings';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/employees"
          element={
            <ProtectedRoute roles={['admin', 'hr']}>
              <EmployeeList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute roles={['admin', 'hr']}>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<EmployeeProfile />} />

        <Route
          path="/departments"
          element={
            <ProtectedRoute roles={['admin', 'hr']}>
              <DepartmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designations"
          element={
            <ProtectedRoute roles={['admin', 'hr']}>
              <DesignationList />
            </ProtectedRoute>
          }
        />

        <Route path="/attendance" element={<AttendanceList />} />
        <Route path="/leaves" element={<LeaveList />} />

        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['admin', 'hr']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={['admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
