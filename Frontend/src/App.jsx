// frontend/src/App.jsx
import React, { createContext, useState, useEffect, useMemo } from 'react';
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
import AgencyFinancialsPage from './components/AgencyFinancialsPage'; // ✅ صفحه امور مالی آژانس
import GlobalCalendarPage from './components/GlobalCalendarPage';
import UserProfilePage from './components/UserProfilePage';
import SupportPage from './components/SupportPage';
import ActivityLogsPage from './components/ActivityLogsPage';

// ایجاد Context برای دسترسی به اطلاعات کاربر در کل برنامه
export const UserContext = createContext(null);

// کامپوننت محافظت از روت‌ها (فقط کاربران لاگین شده)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout>{children}</MainLayout>;
}

// ارائه‌دهنده اطلاعات کاربر
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser({
          id: decodedToken.user_id,
          role: decodedToken.is_superuser ? 'admin' : (decodedToken.role || 'client')
        });
      } catch (error) {
        console.error("Token invalid:", error);
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, []);

  const value = useMemo(() => ({ user, setUser }), [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

function App() {
  return (
    <UserProvider>
      <div className="App">
        {/* ✅✅✅ تمام Route ها باید داخل Routes باشند */}
        <Routes>

          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/project/new"
            element={ <ProtectedRoute> <ProjectCreatePage /> </ProtectedRoute> }
          />

          <Route
            path="/project/:projectId"
            element={ <ProtectedRoute> <ProjectDetailPage /> </ProtectedRoute> }
          />

          <Route
            path="/dashboard"
            element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> }
          />

          {/* ✅ مسیر مدیریت مشتریان */}
          <Route
            path="/users"
            element={ <ProtectedRoute> <UserManagementPage mode="clients" /> </ProtectedRoute> }
          />

          {/* ✅ مسیر مدیریت پرسنل */}
          <Route
            path="/personnel"
            element={ <ProtectedRoute> <UserManagementPage mode="personnel" /> </ProtectedRoute> }
          />

          {/* ✅ مسیر امور مالی آژانس */}
          <Route
            path="/financials"
            element={ <ProtectedRoute> <AgencyFinancialsPage /> </ProtectedRoute> }
          />

          {/* ریدایرکت پیش‌فرض */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/calendar"
            element={ <ProtectedRoute> <GlobalCalendarPage /> </ProtectedRoute> }
          />

          <Route
            path="/profile"
            element={ <ProtectedRoute> <UserProfilePage /> </ProtectedRoute> }
          />

          <Route
            path="/support"
            element={<ProtectedRoute> <SupportPage /> </ProtectedRoute> }
          />

          <Route
            path="/logs"
            element={ <ProtectedRoute> <ActivityLogsPage /> </ProtectedRoute> }
          />

        </Routes>
      </div>
    </UserProvider>
  );
}

export default App;