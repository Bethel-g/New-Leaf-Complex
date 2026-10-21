import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Login from './pages/auth/Login';
import Layout from './components/Layout';
import StaffDashboard from './pages/staff/StaffDashboard';
import SubmitITRequest from './pages/staff/SubmitITRequest';
import SubmitMaintenanceRequest from './pages/staff/SubmitMaintenanceRequest';
import SubmitSuggestion from './pages/staff/SubmitSuggestion';
import MyRequests from './pages/staff/MyRequests';
import ITDashboard from './pages/it/ITDashboard';
import ITTicketList from './pages/it/ITTicketList';
import ITTicketDetail from './pages/it/ITTicketDetail';
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';
import MaintenanceTicketList from './pages/maintenance/MaintenanceTicketList';
import MaintenanceTicketDetail from './pages/maintenance/MaintenanceTicketDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AllRequests from './pages/admin/AllRequests';
import SuggestionsReview from './pages/admin/SuggestionsReview';
import Reports from './pages/admin/Reports';
import UserManagement from './pages/admin/UserManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import NotificationList from './pages/common/NotificationList';
import NotificationDetail from './pages/common/NotificationDetail';
import MyAssignedTickets from './pages/common/MyAssignedTickets';
import Profile from './pages/common/Profile';
import ActivityLog from './pages/admin/ActivityLog';
import SystemSettings from './pages/admin/SystemSettings';
import MultimediaDashboard from './pages/multimedia/MultimediaDashboard';
import MultimediaDevices from './pages/multimedia/MultimediaDevices';
import MultimediaDeviceDetail from './pages/multimedia/MultimediaDeviceDetail';
import MultimediaGroups from './pages/multimedia/MultimediaGroups';
import MultimediaLocations from './pages/multimedia/MultimediaLocations';
import MultimediaMedia from './pages/multimedia/MultimediaMedia';
import MultimediaBroadcast from './pages/multimedia/MultimediaBroadcast';
import MultimediaSchedules from './pages/multimedia/MultimediaSchedules';
import MultimediaHistory from './pages/multimedia/MultimediaHistory';
import MultimediaCommands from './pages/multimedia/MultimediaCommands';
import MultimediaSettings from './pages/multimedia/MultimediaSettings';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function RoleRoute({ roles, children }) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) return <Navigate to="/" />;
  return children;
}

// The landing page doubles as the app home: signed-out visitors get the
// welcome/sign-in screen, signed-in ones go straight to their workspace.
function HomeRoute() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <Navigate to={homeRouteFor(user)} replace />;
}

function homeRouteFor(user) {
  switch (user.role_name) {
    case 'it_staff':
    case 'it_supervisor':
      return '/it';
    case 'maintenance_staff':
    case 'maintenance_supervisor':
      return '/maintenance';
    case 'admin':
    case 'sys_admin':
      return '/admin';
    default:
      return '/dashboard';
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRoute />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Staff */}
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="submit-it" element={<SubmitITRequest />} />
        <Route path="submit-maintenance" element={<SubmitMaintenanceRequest />} />
        <Route path="submit-suggestion" element={<SubmitSuggestion />} />
        <Route path="my-requests" element={<MyRequests />} />
        <Route path="my-suggestions" element={<MyRequests initialTab="suggestion" />} />
        {/* IT */}
        <Route path="it" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><ITDashboard /></RoleRoute>} />
        <Route path="it/tickets" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><ITTicketList /></RoleRoute>} />
        <Route path="it/my-assigned" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MyAssignedTickets type="it" /></RoleRoute>} />
        <Route path="it/tickets/:id" element={<ITTicketDetail />} />
        {/* Maintenance */}
        <Route path="maintenance" element={<RoleRoute roles={['maintenance_staff', 'maintenance_supervisor', 'admin', 'sys_admin']}><MaintenanceDashboard /></RoleRoute>} />
        <Route path="maintenance/tickets" element={<RoleRoute roles={['maintenance_staff', 'maintenance_supervisor', 'admin', 'sys_admin']}><MaintenanceTicketList /></RoleRoute>} />
        <Route path="maintenance/my-assigned" element={<RoleRoute roles={['maintenance_staff', 'maintenance_supervisor', 'admin', 'sys_admin']}><MyAssignedTickets type="maintenance" /></RoleRoute>} />
        <Route path="maintenance/tickets/:id" element={<MaintenanceTicketDetail />} />
        {/* Admin */}
        <Route path="admin" element={<RoleRoute roles={['admin', 'sys_admin']}><AdminDashboard /></RoleRoute>} />
        <Route path="admin/all-requests" element={<RoleRoute roles={['admin', 'sys_admin']}><AllRequests /></RoleRoute>} />
        <Route path="admin/suggestions" element={<RoleRoute roles={['admin', 'sys_admin']}><SuggestionsReview /></RoleRoute>} />
        <Route path="admin/reports" element={<RoleRoute roles={['admin', 'sys_admin']}><Reports /></RoleRoute>} />
        <Route path="admin/users" element={<RoleRoute roles={['sys_admin']}><UserManagement /></RoleRoute>} />
        <Route path="admin/departments" element={<RoleRoute roles={['sys_admin']}><DepartmentManagement /></RoleRoute>} />
        <Route path="admin/categories" element={<RoleRoute roles={['sys_admin']}><CategoryManagement /></RoleRoute>} />
        <Route path="admin/settings" element={<RoleRoute roles={['sys_admin']}><SystemSettings /></RoleRoute>} />
        <Route path="admin/activity-log" element={<RoleRoute roles={['sys_admin']}><ActivityLog /></RoleRoute>} />
        {/* Common */}
        <Route path="suggestions/:id" element={<SuggestionsReview />} />
        <Route path="notifications" element={<NotificationList />} />
        <Route path="notifications/:id" element={<NotificationDetail />} />
        <Route path="profile" element={<Profile />} />
        {/* Multimedia */}
        <Route path="multimedia" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaDashboard /></RoleRoute>} />
        <Route path="multimedia/devices" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaDevices /></RoleRoute>} />
        <Route path="multimedia/devices/:id" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaDeviceDetail /></RoleRoute>} />
        <Route path="multimedia/broadcast" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaBroadcast /></RoleRoute>} />
        <Route path="multimedia/media" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaMedia /></RoleRoute>} />
        <Route path="multimedia/groups" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaGroups /></RoleRoute>} />
        <Route path="multimedia/locations" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaLocations /></RoleRoute>} />
        <Route path="multimedia/schedules" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaSchedules /></RoleRoute>} />
        <Route path="multimedia/history" element={<RoleRoute roles={['it_staff', 'it_supervisor', 'admin', 'sys_admin']}><MultimediaHistory /></RoleRoute>} />
        <Route path="multimedia/commands" element={<RoleRoute roles={['it_supervisor', 'admin', 'sys_admin']}><MultimediaCommands /></RoleRoute>} />
        <Route path="multimedia/settings" element={<RoleRoute roles={['it_supervisor', 'admin', 'sys_admin']}><MultimediaSettings /></RoleRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Toaster position="top-right" />
          <AppRoutes />
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}
