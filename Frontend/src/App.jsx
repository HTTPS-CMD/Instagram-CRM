// src/App.jsx
import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Box, CircularProgress } from '@mui/material';

// ایمپورت صفحات
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import MainLayout from './components/MainLayout';
import ProjectDetailPage from './components/ProjectDetailPage';
import ProjectCreatePage from './components/ProjectCreatePage';
import UserManagementPage from './components/UserManagementPage';
import AgencyFinancialsPage from './components/AgencyFinancialsPage';
import UserProfilePage from './components/UserProfilePage';
import ActivityLogsPage from './components/ActivityLogsPage';
import ChatPage from "./components/ChatPage.jsx";
import ProjectTypeSelection from './components/ProjectTypeSelection';
import SystemSettingsPage from './components/SystemSettingsPage';
import ExtraServicesPage from './components/ExtraServicesPage';
import TrashPage from "./components/TrashPage.jsx";
import TargetAudiencePage from './components/TargetAudiencePage';
import GanttPage from './components/GanttPage';
import AutomationPage from "./components/AutomationPage.jsx";
import PublicFileView from './components/PublicFileView';
import ProjectsPage from './components/ProjectsPage';
import LeadsPage from './components/LeadsPage';
import PersonnelTasksPage from './components/PersonnelTasksPage';
import NotFoundPage from './components/NotFoundPage';
import UnifiedCalendarPage from './components/UnifiedCalendarPage';

export const UserContext = createContext(null);

// کامپوننت محافظت از صفحات
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(UserContext);

  if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function AdminRoute({ children }) {
  const { user, loading } = useContext(UserContext);

  if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;

  if (!user || user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const forceLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    if (window.location.pathname !== '/login') {
       window.location.href = '/login';
    }
  };

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          if (decodedToken.exp < currentTime) {
            forceLogout();
          } else {
            setUser({
              id: decodedToken.user_id,
              role: decodedToken.is_superuser ? 'admin' : (decodedToken.role || 'client'),
              full_name: decodedToken.full_name || decodedToken.username,
              username: decodedToken.username,
              avatar: decodedToken.avatar // اگر در توکن باشد
            });
          }
        } catch (error) {
          console.error("Token invalid:", error);
          forceLogout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkToken();

    const interval = setInterval(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp < Date.now() / 1000) {
                    forceLogout();
                }
            } catch (e) { forceLogout(); }
        }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const value = useMemo(() => ({ user, setUser, loading, forceLogout }), [user, loading]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}><CircularProgress /></Box>;

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

function App() {
  return (
    <UserProvider>
      <div className="App" dir="rtl">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* صفحات عمومی */}
          <Route path="/dashboard" element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> } />
          <Route path="/project/:projectId" element={ <ProtectedRoute> <ProjectDetailPage /> </ProtectedRoute> } />
          <Route path="/calendar" element={ <ProtectedRoute> <UnifiedCalendarPage /> </ProtectedRoute> } />
          <Route path="/profile" element={ <ProtectedRoute> <UserProfilePage /> </ProtectedRoute> } />
          <Route path="/chat" element={ <ProtectedRoute> <ChatPage /> </ProtectedRoute> } />
          <Route path="/tasks" element={<ProtectedRoute><PersonnelTasksPage /></ProtectedRoute>} />
          <Route path="/share/:token" element={<PublicFileView />} />

          {/* صفحات ادمین */}
          <Route path="/project/new" element={ <AdminRoute> <ProjectTypeSelection /> </AdminRoute> } />
          <Route path="/project/create" element={ <AdminRoute> <ProjectCreatePage /> </AdminRoute> } />
          <Route path="/projects" element={<AdminRoute><ProjectsPage /></AdminRoute>} />
          <Route path="/users" element={ <AdminRoute> <UserManagementPage mode="clients" /> </AdminRoute> } />
          <Route path="/personnel" element={ <AdminRoute> <UserManagementPage mode="personnel" /> </AdminRoute> } />
          <Route path="/financials" element={ <AdminRoute> <AgencyFinancialsPage /> </AdminRoute> } />
          <Route path="/services" element={ <AdminRoute> <ExtraServicesPage /> </AdminRoute> } />
          <Route path="/logs" element={ <AdminRoute> <ActivityLogsPage /> </AdminRoute> } />
          <Route path="/settings" element={ <AdminRoute> <SystemSettingsPage /> </AdminRoute> } />
          <Route path="/trash" element={ <AdminRoute> <TrashPage /> </AdminRoute> } />
          <Route path="/target-audience" element={ <AdminRoute> <TargetAudiencePage /> </AdminRoute> } />
          <Route path="/gantt" element={<AdminRoute><GanttPage /></AdminRoute>} />
          <Route path="/automation" element={<AdminRoute><AutomationPage /></AdminRoute>} />
          <Route path="/leads" element={<AdminRoute><LeadsPage /></AdminRoute>} />

          <Route path="/calendar/meetings" element={ <AdminRoute> <UnifiedCalendarPage filterType="meeting" /> </AdminRoute> } />
          <Route path="/calendar/filming" element={ <AdminRoute> <UnifiedCalendarPage filterType="filming" /> </AdminRoute> } />
          <Route path="/calendar/posts" element={ <AdminRoute> <UnifiedCalendarPage filterType="post" /> </AdminRoute> } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </UserProvider>
  );
}

export default App;