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
import AppLayout from './components/AppLayout';
import { SocketProvider } from './context/SocketContext';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyMarks from './pages/FacultyMarks';
import FacultyReports from './pages/FacultyReports';
import AssignFaculty from './pages/AssignFaculty';
import BlockedUsersPage from './pages/BlockedUsersPage';
import ParentDashboard from './pages/ParentDashboard';
import ParentMarks from './pages/ParentMarks';
import ParentLeave from './pages/ParentLeave';
import ParentFees from './pages/ParentFees';
import FacultyUnblockPage from './pages/FacultyUnblockPage';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
          
          {/* Main App Layout wrapper for all authenticated screens */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    {user?.role === 'admin' ? <AdminDashboard /> : 
                     user?.role === 'faculty' ? <FacultyDashboard /> : 
                     user?.role === 'parent' ? <ParentDashboard /> :
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

            <Route path="/faculty/unblock" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                    <FacultyUnblockPage />
                </ProtectedRoute>
            } />

            {/* Parent Routes */}
            <Route path="/parent/marks" element={
                <ProtectedRoute allowedRoles={['parent']}>
                    <ParentMarks />
                </ProtectedRoute>
            } />
            <Route path="/parent/leave" element={
                <ProtectedRoute allowedRoles={['parent']}>
                    <ParentLeave />
                </ProtectedRoute>
            } />
            <Route path="/parent/fees" element={
                <ProtectedRoute allowedRoles={['parent']}>
                    <ParentFees />
                </ProtectedRoute>
            } />
          </Route>

          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;

