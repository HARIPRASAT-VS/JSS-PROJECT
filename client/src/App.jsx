import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AttendancePage from './pages/AttendancePage';
import AttendanceDetail from './pages/AttendanceDetail';
import LeaveManagementPage from './pages/LeaveManagementPage';
import FacultyLeaveApproval from './pages/FacultyLeaveApproval';

import ProtectedRoute from './components/ProtectedRoute';
import { SocketProvider } from './context/SocketContext';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyMarks from './pages/FacultyMarks';
import FacultyReports from './pages/FacultyReports';
import AssignFaculty from './pages/AssignFaculty';
import BlockedUsersPage from './pages/BlockedUsersPage';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
          
          <Route path="/dashboard" element={
              <ProtectedRoute>
                  {user?.role === 'admin' ? <AdminDashboard /> : 
                   user?.role === 'faculty' ? <FacultyDashboard /> : 
                   <Dashboard />}
              </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/assign" element={
              <ProtectedRoute allowedRoles={['admin']}>
                  <AssignFaculty />
              </ProtectedRoute>
          } />
          
          <Route path="/admin/blocked" element={
              <ProtectedRoute allowedRoles={['admin']}>
                  <BlockedUsersPage />
              </ProtectedRoute>
          } />

          <Route path="/attendance" element={
              <ProtectedRoute allowedRoles={['student']}>
                  <AttendancePage />
              </ProtectedRoute>
          } />

          <Route path="/attendance/detail" element={
              <ProtectedRoute allowedRoles={['student']}>
                  <AttendanceDetail />
              </ProtectedRoute>
          } />

          {/* Role-based /leave: faculty see Leave Approval, all others see Leave Request form */}
          <Route path="/leave" element={
              <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
                  {user?.role === 'faculty' ? <FacultyLeaveApproval /> : <LeaveManagementPage />}
              </ProtectedRoute>
          } />
          
          <Route path="/faculty/marks" element={
              <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyMarks />
              </ProtectedRoute>
          } />

          <Route path="/faculty/reports" element={
              <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyReports />
              </ProtectedRoute>
          } />
          <Route path="/faculty/reports/:type" element={
              <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyReports />
              </ProtectedRoute>
          } />
          <Route path="/faculty/reports/:type/:testId" element={
              <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyReports />
              </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;

