// src/components/MainLayout.jsx
import CommandPalette from './CommandPalette';
import React, { useContext, useState, useEffect } from "react";
import {
  Box, Drawer, AppBar, Toolbar, Typography, List,
  ListItemButton, ListItemIcon, ListItemText, Divider,
  IconButton, Badge, Menu, MenuItem, Stack, Avatar, Popover, Button, useTheme, Collapse, alpha
} from "@mui/material";
import {
  Home as HomeIcon,
  ExitToApp as ExitToAppIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  SupervisorAccount as AdminIcon,
  AccountBalance as FinancialIcon,
  CalendarMonth as CalendarIcon,
  AccountCircle as ProfileIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  ShoppingCart as ServiceIcon,
  DeleteSweep as TrashIcon,
  Groups as MeetingIcon,
  Videocam as FilmingIcon,
  PostAdd as PostIcon,
  Psychology as TargetIcon,
  DoneAll as DoneAllIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  NotificationsOff as NotificationsOffIcon,
  FilterList as FilterIcon,
  Bolt as AutomationIcon,
  Folder as ProjectIcon,
  ExpandLess,
  ExpandMore,
  MonetizationOn as SalesIcon,
  Assignment as TaskIcon,
  Brightness4, // 🌙 آیکون ماه
  Brightness7  // ☀️ آیکون خورشید
} from "@mui/icons-material";
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from "../App";
import { ColorModeContext } from "../themeContext"; // ✅ کانتکست تغییر تم
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUserProfile } from "../api";
import moment from 'jalali-moment';

const drawerWidth = 260;

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useContext(UserContext);

  // ✅ دریافت تابع تغییر تم از کانتکست
  const { toggleColorMode } = useContext(ColorModeContext);
  const theme = useTheme();

  // --- Notification States ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const openNotif = Boolean(notifAnchorEl);

  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);

  // ✅ استیت برای باز و بسته کردن منوی تقویم
  const [openCalendar, setOpenCalendar] = useState(false);

  // باز کردن خودکار تقویم اگر در یکی از صفحات زیرمجموعه باشیم
  useEffect(() => {
      if (location.pathname.startsWith('/calendar')) {
          setOpenCalendar(true);
      }
  }, [location.pathname]);

  const handleCalendarClick = () => {
      setOpenCalendar(!openCalendar);
  };

  useEffect(() => {
      if(user) {
          getUserProfile().then(res => {
              setUserAvatar(res.data.avatar);
          }).catch(err => console.error(err));

          fetchNotifications();
          const interval = setInterval(fetchNotifications, 60000);
          return () => clearInterval(interval);
      }
  }, [user]);

  const fetchNotifications = async () => {
      try {
          const res = await getNotifications();
          let data = [];
          if (res && Array.isArray(res.data)) {
              data = res.data;
          } else if (res && res.data && Array.isArray(res.data.results)) {
              data = res.data.results;
          }
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
      } catch (error) { console.error("Notif Error:", error); }
  };

  const handleNotificationClick = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotificationClose = () => setNotifAnchorEl(null);

  const handleReadAndGo = async (notif) => {
      if (!notif.is_read) {
          try {
              await markNotificationRead(notif.id);
              fetchNotifications();
          } catch(err) { console.error(err); }
      }
      handleNotificationClose();
      if (notif.link) navigate(notif.link);
  };

  const handleReadAll = async () => {
      try {
          await markAllNotificationsRead();
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
      } catch(err) { console.error(err); }
  };

  const handleProfileClick = (event) => setProfileAnchorEl(event.currentTarget);
  const handleProfileClose = () => setProfileAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    window.location.href = "/login";
  };

  const getPageTitle = () => {
      switch(location.pathname) {
          case '/dashboard': return 'داشبورد مدیریتی';
          case '/calendar': return 'تقویم جامع';
          case '/financials': return 'امور مالی';
          case '/projects': return 'مدیریت پروژه‌ها';
          case '/leads': return 'کاریز فروش (Leads)';
          default: return 'پنل مدیریت محتوا';
      }
  };

  // استایل دکمه‌های منو (هماهنگ با تم)
  const menuButtonStyle = {
      borderRadius: 3, mb: 0.5,
      color: theme.palette.text.secondary, // رنگ متن داینامیک
      '&.Mui-selected': {
          bgcolor: alpha(theme.palette.primary.main, 0.15),
          color: theme.palette.primary.main,
          borderRight: `3px solid ${theme.palette.primary.main}`,
          '& .MuiListItemIcon-root': { color: theme.palette.primary.main }
      },
      '&:hover': {
          bgcolor: alpha(theme.palette.text.primary, 0.05),
          color: theme.palette.text.primary,
          '& .MuiListItemIcon-root': { color: theme.palette.text.primary }
      }
  };

  return (
    <Box sx={{
        display: "flex",
        // ✅ پس‌زمینه داینامیک: در حالت لایت روشن و در حالت دارک تیره می‌شود
        bgcolor: 'background.default',
        minHeight: '100vh',
        color: 'text.primary',
        transition: 'all 0.3s ease'
    }}>

      {/* --- هدر (AppBar) --- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          // ✅ رنگ شیشه‌ای هماهنگ با تم
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>

          <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: 0.5 }}>
                {getPageTitle()}
              </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>

              {/* ✅ دکمه تغییر تم (Dark/Light Toggle) */}
              <IconButton onClick={toggleColorMode} color="inherit" sx={{ ml: 1 }}>
                  {theme.palette.mode === 'dark' ? <Brightness7 sx={{ color: '#ffea00' }} /> : <Brightness4 sx={{ color: '#3f51b5' }} />}
              </IconButton>

              <IconButton onClick={handleNotificationClick} sx={{ color: 'text.secondary' }}>
                  <Badge badgeContent={unreadCount} color="error">
                      <NotificationsIcon />
                  </Badge>
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center', mx: 2 }} />

              <Box
                onClick={handleProfileClick}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    cursor: 'pointer', p: 0.5, pr: 1, pl: 1, borderRadius: 50,
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                    transition: '0.2s',
                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.05), borderColor: 'primary.main' }
                }}
              >
                  <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                          {user?.full_name || user?.username || 'کاربر'}
                      </Typography>
                      <Typography variant="caption" sx={{ display:'block', color: 'text.secondary' }}>
                          {user?.role === 'admin' ? 'مدیر کل' : 'کاربر سیستم'}
                      </Typography>
                  </Box>
                  <Avatar
                    src={userAvatar}
                    sx={{ width: 42, height: 42, bgcolor: 'primary.main', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                      {user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
              </Box>

          </Stack>

          <Menu
              anchorEl={profileAnchorEl}
              open={Boolean(profileAnchorEl)}
              onClose={handleProfileClose}
              PaperProps={{
                  elevation: 10,
                  sx: {
                      mt: 1.5, width: 200,
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${theme.palette.divider}`,
                  },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
              <MenuItem onClick={() => { navigate('/profile'); handleProfileClose(); }}>
                  <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon> پروفایل من
              </MenuItem>
                {user?.role === 'admin' && (
                  <MenuItem onClick={() => { navigate('/settings'); setProfileAnchorEl(null); }}><ListItemIcon><SettingsIcon fontSize="small"/></ListItemIcon> تنظیمات</MenuItem>
              )}
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: '#ff5252' }}>
                  <ListItemIcon><ExitToAppIcon fontSize="small" sx={{ color: '#ff5252' }} /></ListItemIcon> خروج
              </MenuItem>
          </Menu>

          <Popover
              open={openNotif}
              anchorEl={notifAnchorEl}
              onClose={handleNotificationClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{
                  sx: {
                      width: 320, maxHeight: 400,
                      bgcolor: 'background.paper',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${theme.palette.divider}`,
                      color: 'text.primary', mt: 1, borderRadius: 3,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                  }
              }}
          >
             <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography fontWeight="bold">اعلانات ({unreadCount})</Typography>
                  {unreadCount > 0 && (
                      <Button size="small" onClick={handleReadAll} startIcon={<DoneAllIcon/>} sx={{ fontSize: '0.7rem' }}>خواندن همه</Button>
                  )}
              </Box>
              <List sx={{ p: 0 }}>
                  {notifications.length === 0 ? (
                      <Box p={4} textAlign="center" color="text.secondary">
                          <NotificationsOffIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                          <Typography variant="body2">هیچ اعلان جدیدی نیست.</Typography>
                      </Box>
                  ) : (
                      notifications.map((notif) => (
                          <ListItemButton
                              key={notif.id}
                              onClick={() => handleReadAndGo(notif)}
                              sx={{
                                  borderBottom: `1px solid ${theme.palette.divider}`,
                                  bgcolor: notif.is_read ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
                                  '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) }
                              }}
                          >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                  {notif.is_read ? <CheckIcon fontSize="small" color="disabled" /> : <InfoIcon fontSize="small" color="info" />}
                              </ListItemIcon>
                              <ListItemText
                                  primary={<Typography variant="body2" fontWeight={notif.is_read ? 'normal' : 'bold'}>{notif.title}</Typography>}
                                  secondary={
                                      <>
                                        <Typography variant="caption" display="block" color="text.secondary" noWrap>{notif.message}</Typography>
                                        <Typography variant="caption" color="text.disabled" fontSize="0.65rem">{moment(notif.created_at).fromNow()}</Typography>
                                      </>
                                  }
                              />
                          </ListItemButton>
                      ))
                  )}
              </List>
          </Popover>

        </Toolbar>
      </AppBar>

      {/* --- سایدبار --- */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            // ✅ رنگ سایدبار هماهنگ با تم
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : '#ffffff',
            backdropFilter: 'blur(15px)',
            color: 'text.primary',
            borderRight: `1px solid ${theme.palette.divider}`
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar sx={{ mb: 2, mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', justifyContent: 'center' }}>
                <DashboardIcon sx={{ fontSize: 32, color: 'primary.main', filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.5)})` }} />
                <Typography variant="h5" color="text.primary" fontWeight="900" sx={{ letterSpacing: 1 }}>
                    MK PANEL
                </Typography>
            </Stack>
        </Toolbar>

        <Box sx={{ overflow: "auto", px: 2 }}>
          <List>
            <Typography variant="caption" fontWeight="bold" sx={{ ml: 2, mb: 1, display: 'block', opacity: 0.6, fontSize: '0.75rem', color: 'text.secondary' }}>منوی اصلی</Typography>

            <ListItemButton id="nav-dashboard" onClick={() => navigate('/dashboard')} selected={location.pathname === '/dashboard'} sx={menuButtonStyle}> {/* ✅ ID اضافه شد */}
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><HomeIcon /></ListItemIcon>
                <ListItemText primary="داشبورد" />
            </ListItemButton>

            {/* ✅ فقط ادمین پروژه‌ها را ببیند */}
            {user && user.role === 'admin' && (
                <ListItemButton onClick={() => navigate('/projects')} selected={location.pathname === '/projects'} sx={menuButtonStyle}>
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><ProjectIcon /></ListItemIcon>
                    <ListItemText primary="مدیریت پروژه‌ها" />
                </ListItemButton>
            )}

                <ListItemButton onClick={() => navigate('/tasks')} selected={location.pathname === '/tasks'} sx={menuButtonStyle}>
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><TaskIcon /></ListItemIcon>
                    <ListItemText primary="کارتابل وظایف" />
                </ListItemButton>


            {/* ✅ فقط ادمین اتوماسیون را ببیند */}
            {user && user.role === 'admin' && (
                <ListItemButton onClick={() => navigate('/automation')} selected={location.pathname === '/automation'} sx={menuButtonStyle}>
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><AutomationIcon /></ListItemIcon>
                    <ListItemText primary="اتوماسیون هوشمند" />
                </ListItemButton>
            )}

            {/* ✅ فقط ادمین گانت را ببیند */}
            {user && user.role === 'admin' && (
                <ListItemButton onClick={() => navigate('/gantt')} selected={location.pathname === '/gantt'} sx={menuButtonStyle}>
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><FilterIcon sx={{ transform: 'rotate(90deg)' }} /></ListItemIcon>
                    <ListItemText primary="نمای زمانی " />
                </ListItemButton>
            )}

            {/* ✅ منوی بازشونده تقویم */}
            <ListItemButton onClick={handleCalendarClick} sx={menuButtonStyle}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><CalendarIcon /></ListItemIcon>
                <ListItemText primary="تقویم جامع" />
                {openCalendar ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            {/* ✅ زیرمنوهای تقویم (بازشو) */}
            <Collapse in={openCalendar} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ borderLeft: `2px solid ${alpha(theme.palette.divider, 0.5)}`, ml: 2.5, pl: 1, mt: 0.5, mb: 1 }}>

                    {/* لینک اصلی به خود صفحه تقویم (برای کلاینت هم باز است) */}
                    <ListItemButton onClick={() => navigate('/calendar')} selected={location.pathname === '/calendar'} sx={{ ...menuButtonStyle, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><CalendarIcon sx={{ fontSize: 18 }} /></ListItemIcon>
                        <ListItemText primary="نمای کلی" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                    </ListItemButton>

                    {/* زیرمنوهای دیگر - فقط برای ادمین */}
                    {user && user.role === 'admin' && (
                        <>
                            <ListItemButton onClick={() => navigate('/calendar/meetings')} sx={{ ...menuButtonStyle, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 30 }}><MeetingIcon sx={{ fontSize: 18, color: '#ce93d8' }} /></ListItemIcon>
                                <ListItemText primary="جلسات" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                            </ListItemButton>
                            <ListItemButton onClick={() => navigate('/calendar/filming')} sx={{ ...menuButtonStyle, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 30 }}><FilmingIcon sx={{ fontSize: 18, color: '#ffcc80' }} /></ListItemIcon>
                                <ListItemText primary="آفیش" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                            </ListItemButton>
                            <ListItemButton onClick={() => navigate('/calendar/posts')} sx={{ ...menuButtonStyle, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 30 }}><PostIcon sx={{ fontSize: 18, color: '#81d4fa' }} /></ListItemIcon>
                                <ListItemText primary="پست‌گذاری" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                            </ListItemButton>
                        </>
                    )}
                </List>
            </Collapse>

            {user && user.role === 'admin' && (
                <>
                    <Typography variant="caption" fontWeight="bold" sx={{ ml: 2, mt: 2, mb: 1, display: 'block', opacity: 0.6, fontSize: '0.75rem', color: 'text.secondary' }}>مدیریت</Typography>

                    {/* ✅ لینک کاریز فروش (جدید) */}
                    <ListItemButton onClick={() => navigate('/leads')} selected={location.pathname === '/leads'} sx={menuButtonStyle}>
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><SalesIcon /></ListItemIcon>
                        <ListItemText primary="کاریز فروش " />
                    </ListItemButton>

                    <ListItemButton onClick={() => navigate('/users')} selected={location.pathname === '/users'} sx={menuButtonStyle}>
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><PeopleIcon /></ListItemIcon>
                        <ListItemText primary="مشتریان" />
                    </ListItemButton>

                    <ListItemButton onClick={() => navigate('/target-audience')} selected={location.pathname === '/target-audience'} sx={menuButtonStyle}>
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><TargetIcon /></ListItemIcon>
                        <ListItemText primary="مشتریان هدف" />
                    </ListItemButton>

                    <ListItemButton onClick={() => navigate('/personnel')} selected={location.pathname === '/personnel'} sx={menuButtonStyle}>
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><AdminIcon /></ListItemIcon>
                        <ListItemText primary="پرسنل" />
                    </ListItemButton>

                    <ListItemButton onClick={() => navigate('/financials')} selected={location.pathname === '/financials'} sx={menuButtonStyle}>
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><FinancialIcon /></ListItemIcon>
                        <ListItemText primary="امور مالی" />
                    </ListItemButton>

                    <ListItemButton onClick={() => navigate('/services')} selected={location.pathname === '/services'} sx={menuButtonStyle}>
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><ServiceIcon /></ListItemIcon>
                        <ListItemText primary="خدمات اضافه" />
                    </ListItemButton>

                    <ListItemButton onClick={() => navigate('/logs')} selected={location.pathname === '/logs'} sx={menuButtonStyle}>
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><HistoryIcon /></ListItemIcon>
                        <ListItemText primary="گزارش فعالیت‌ها" />
                    </ListItemButton>
                </>
            )}

            <Typography variant="caption" fontWeight="bold" sx={{ ml: 2, mt: 2, mb: 1, display: 'block', opacity: 0.6, fontSize: '0.75rem', color: 'text.secondary' }}>ارتباطات</Typography>
            <ListItemButton id="nav-chat" onClick={() => navigate('/chat')} selected={location.pathname === '/chat'} sx={menuButtonStyle}> {/* ✅ ID اضافه شد */}
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><ChatIcon /></ListItemIcon>
                <ListItemText primary="مرکز گفتگو" />
            </ListItemButton>

            <ListItemButton onClick={() => navigate('/trash')} selected={location.pathname === '/trash'} sx={{...menuButtonStyle, color:'#ef9a9a', '&:hover':{bgcolor: alpha('#ef9a9a', 0.1), color:'#ef5350'}}}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><TrashIcon /></ListItemIcon>
                <ListItemText primary="زباله‌دان" />
            </ListItemButton>

          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, width: `calc(100% - ${drawerWidth}px)` }}>
        {children}
      </Box>
      <CommandPalette />
    </Box>
  );
}

export default MainLayout;