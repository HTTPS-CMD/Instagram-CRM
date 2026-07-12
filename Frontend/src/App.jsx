// src/App.jsx
import React, {createContext, lazy, Suspense, useContext, useEffect, useMemo, useState} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import {Box, CircularProgress, createTheme, CssBaseline, ThemeProvider, Typography} from '@mui/material';
import {SnackbarProvider} from 'notistack';
import {ColorModeContext} from './themeContext';
import PrivateRoute from './components/PrivateRoute'; // ✅ این خط را اضافه کن
import PersonnelPerformancePage from './components/PersonnelPerformancePage'; // ✅

// --- 🚀 Lazy Loading Imports ---
const LoginPage = lazy(() => import('./components/LoginPage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const MainLayout = lazy(() => import('./components/MainLayout'));
const ProjectDetailPage = lazy(() => import('./components/ProjectDetailPage'));
const ProjectCreatePage = lazy(() => import('./components/ProjectCreatePage'));
const UserManagementPage = lazy(() => import('./components/UserManagementPage'));
const AgencyFinancialsPage = lazy(() => import('./components/AgencyFinancialsPage'));
const UserProfilePage = lazy(() => import('./components/UserProfilePage'));
const ActivityLogsPage = lazy(() => import('./components/ActivityLogsPage'));
const ChatPage = lazy(() => import('./components/ChatPage.jsx'));
const ProjectTypeSelection = lazy(() => import('./components/ProjectTypeSelection'));
const SystemSettingsPage = lazy(() => import('./components/SystemSettingsPage'));
const ExtraServicesPage = lazy(() => import('./components/ExtraServicesPage'));
const TrashPage = lazy(() => import('./components/TrashPage.jsx'));
const TargetAudiencePage = lazy(() => import('./components/TargetAudiencePage'));
const GanttPage = lazy(() => import('./components/GanttPage'));
const AutomationPage = lazy(() => import('./components/AutomationPage.jsx'));
const PublicFileView = lazy(() => import('./components/PublicFileView'));
const ProjectsPage = lazy(() => import('./components/ProjectsPage'));
const LeadsPage = lazy(() => import('./components/LeadsPage'));
const PersonnelTasksPage = lazy(() => import('./components/PersonnelTasksPage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const UnifiedCalendarPage = lazy(() => import('./components/UnifiedCalendarPage'));
const SupportPage = lazy(() => import('./components/SupportPage'));
const HelpPage = lazy(() => import('./components/HelpPage'));


export const UserContext = createContext(null);

// کامپوننت لودینگ
const PageLoader = () => (
    <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary'
    }}>
        <CircularProgress size={60} thickness={4} sx={{color: 'primary.main', mb: 2}}/>
        <Typography variant="body2" color="text.secondary">در حال بارگذاری...</Typography>
    </Box>
);

// محافظت از صفحات
function ProtectedRoute({children}) {
    const {user, loading} = useContext(UserContext);
    if (loading) return <PageLoader/>;
    if (!user) return <Navigate to="/login" replace/>;
    return <Suspense fallback={<PageLoader/>}><MainLayout>{children}</MainLayout></Suspense>;
}

function AdminRoute({children}) {
    const {user, loading} = useContext(UserContext);
    if (loading) return <PageLoader/>;
    if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace/>;
    return <Suspense fallback={<PageLoader/>}><MainLayout>{children}</MainLayout></Suspense>;
}

function UserProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const forceLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        if (window.location.pathname !== '/login') window.location.href = '/login';
    };

    useEffect(() => {
        const checkToken = () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const decodedToken = jwtDecode(token);
                    if (decodedToken.exp < Date.now() / 1000) forceLogout();
                    else setUser({
                        id: decodedToken.user_id,
                        role: decodedToken.is_superuser ? 'admin' : (decodedToken.role || 'client'),
                        full_name: decodedToken.full_name || decodedToken.username,
                        username: decodedToken.username,
                        avatar: decodedToken.avatar
                    });
                } catch (error) {
                    forceLogout();
                }
            } else setUser(null);
            setLoading(false);
        };
        checkToken();
        const interval = setInterval(() => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    if (jwtDecode(token).exp < Date.now() / 1000) forceLogout();
                } catch (e) {
                    forceLogout();
                }
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const value = useMemo(() => ({user, setUser, loading, forceLogout}), [user, loading]);
    if (loading) return <PageLoader/>;
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

function App() {
    // مدیریت تم (Dark/Light) و رنگ اصلی (Primary Color)
    const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');
    // ✅ استیت جدید برای رنگ اصلی
    const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('themeColor') || '#4f46e5');

    const colorMode = React.useMemo(() => ({
        toggleColorMode: () => {
            setMode((prevMode) => {
                const newMode = prevMode === 'light' ? 'dark' : 'light';
                localStorage.setItem('themeMode', newMode);
                return newMode;
            });
        },
        // ✅ تابع تغییر رنگ که در context قرار می‌گیرد
        changePrimaryColor: (color) => {
            setPrimaryColor(color);
            localStorage.setItem('themeColor', color);
        },
        primaryColor // ✅ مقدار فعلی رنگ برای استفاده در کامپوننت‌ها
    }), [primaryColor]);

    // ✅ ساخت تم با استفاده از رنگ انتخاب شده
    const theme = React.useMemo(() => createTheme({
        direction: 'rtl',
        typography: {
            fontFamily: 'Peyda, sans-serif',
            h1: {fontWeight: 900, fontFamily: 'Peyda'},
            h2: {fontWeight: 800, fontFamily: 'Peyda'},
            h3: {fontWeight: 800, fontFamily: 'Peyda'},
            h4: {fontWeight: 700, fontFamily: 'Peyda'},
            h5: {fontWeight: 700, fontFamily: 'Peyda'},
            h6: {fontWeight: 700, fontFamily: 'Peyda'},
            button: {fontWeight: 700, fontFamily: 'Peyda'},
        },
        shape: {borderRadius: 12},
        palette: {
            mode,
            primary: {
                main: primaryColor, // ✅ رنگ اصلی داینامیک شد
            },
            secondary: {main: '#06b6d4'},
            ...(mode === 'light' ? {
                background: {default: '#f1f5f9', paper: '#ffffff'},
                text: {primary: '#1e293b', secondary: '#64748b'},
                divider: 'rgba(0, 0, 0, 0.08)',
            } : {
                background: {default: '#0f172a', paper: '#1e293b'},
                text: {primary: '#f8fafc', secondary: '#94a3b8'},
                divider: 'rgba(148, 163, 184, 0.15)',
            }),
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {textTransform: 'none', boxShadow: 'none'},
                    contained: {boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'}
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {backgroundImage: 'none'}
                }
            }
        }
    }), [mode, primaryColor]); // ✅ وابستگی به primaryColor اضافه شد

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <UserProvider>
                    <SnackbarProvider maxSnack={3} anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}>
                        <div className="App" dir="rtl">
                            <Suspense fallback={<PageLoader/>}>
                                <Routes>
                                    <Route path="/login" element={<LoginPage/>}/>
                                    <Route path="/dashboard"
                                           element={<ProtectedRoute> <DashboardPage/> </ProtectedRoute>}/>
                                    <Route path="/project/:projectId"
                                           element={<ProtectedRoute> <ProjectDetailPage/> </ProtectedRoute>}/>
                                    <Route path="/calendar"
                                           element={<ProtectedRoute> <UnifiedCalendarPage/> </ProtectedRoute>}/>
                                    <Route path="/profile"
                                           element={<ProtectedRoute> <UserProfilePage/> </ProtectedRoute>}/>
                                    <Route path="/chat" element={<ProtectedRoute> <ChatPage/> </ProtectedRoute>}/>
                                    <Route path="/tasks"
                                           element={<ProtectedRoute><PersonnelTasksPage/></ProtectedRoute>}/>
                                    <Route path="/support" element={<ProtectedRoute><SupportPage/></ProtectedRoute>}/>
                                    <Route path="/help" element={<ProtectedRoute> <HelpPage/> </ProtectedRoute>}/>
                                    <Route path="/share/:token" element={<PublicFileView/>}/>

                                    {/* ادمین */}
                                    <Route path="/project/new"
                                           element={<AdminRoute> <ProjectTypeSelection/> </AdminRoute>}/>
                                    <Route path="/project/create"
                                           element={<AdminRoute> <ProjectCreatePage/> </AdminRoute>}/>
                                    <Route path="/projects" element={<AdminRoute><ProjectsPage/></AdminRoute>}/>
                                    <Route path="/users"
                                           element={<AdminRoute> <UserManagementPage mode="clients"/> </AdminRoute>}/>
                                    <Route path="/personnel"
                                           element={<AdminRoute> <UserManagementPage mode="personnel"/> </AdminRoute>}/>
                                    <Route path="/financials"
                                           element={<AdminRoute> <AgencyFinancialsPage/> </AdminRoute>}/>
                                    <Route path="/services" element={<AdminRoute> <ExtraServicesPage/> </AdminRoute>}/>
                                    <Route path="/logs" element={<AdminRoute> <ActivityLogsPage/> </AdminRoute>}/>
                                    <Route path="/settings" element={<AdminRoute> <SystemSettingsPage/> </AdminRoute>}/>
                                    <Route path="/trash" element={<AdminRoute> <TrashPage/> </AdminRoute>}/>
                                    <Route path="/target-audience"
                                           element={<AdminRoute> <TargetAudiencePage/> </AdminRoute>}/>
                                    <Route path="/gantt" element={<AdminRoute><GanttPage/></AdminRoute>}/>
                                    <Route path="/automation" element={<AdminRoute><AutomationPage/></AdminRoute>}/>
                                    <Route path="/leads" element={<AdminRoute><LeadsPage/></AdminRoute>}/>
                                    <Route path="/calendar/meetings"
                                           element={<AdminRoute> <UnifiedCalendarPage filterType="meeting"/>
                                           </AdminRoute>}/>
                                    <Route path="/calendar/filming"
                                           element={<AdminRoute> <UnifiedCalendarPage filterType="filming"/>
                                           </AdminRoute>}/>
                                    <Route path="/calendar/posts"
                                           element={<AdminRoute> <UnifiedCalendarPage filterType="post"/>
                                           </AdminRoute>}/>

                                    <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                                    <Route path="*" element={<NotFoundPage/>}/>

                                    <Route
                                        path="/performance"
                                        element={
                                            <PrivateRoute>
                                                <MainLayout>
                                                    <PersonnelPerformancePage/>
                                                </MainLayout>
                                            </PrivateRoute>
                                        }
                                    />

                                </Routes>
                            </Suspense>
                        </div>
                    </SnackbarProvider>
                </UserProvider>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;