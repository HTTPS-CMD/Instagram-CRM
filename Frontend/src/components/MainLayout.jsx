// frontend/src/components/MainLayout.jsx
import React, { useContext, useState, useEffect } from "react";
import {
  Box, Drawer, AppBar, Toolbar, Typography, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  IconButton, Badge, Menu, MenuItem, Chip
} from "@mui/material";
import {
  Home as HomeIcon,
  ExitToApp as ExitToAppIcon,
  Folder as FolderIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  DoneAll as DoneAllIcon,
  Circle as CircleIcon,
  SupervisorAccount as AdminIcon,
  AccountBalance as FinancialIcon,
  CalendarMonth as CalendarIcon,
  AccountCircle as ProfileIcon,
  SupportAgent as SupportIcon,
  History as HistoryIcon // ✅ آیکون جدید برای لاگ‌ها
} from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../App";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../api";
import moment from 'jalali-moment';

const drawerWidth = 240;

function MainLayout({ children }) {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
      if (user) {
          fetchNotifications();
      }
  }, [user]);

  const fetchNotifications = async () => {
      try {
          const response = await getNotifications();
          setNotifications(response.data);
          const unread = response.data.filter(n => !n.is_read).length;
          setUnreadCount(unread);
      } catch (error) {
          console.error("Error fetching notifications:", error);
      }
  };

  const handleNotificationClick = (event) => {
      setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
      setAnchorEl(null);
  };

  const handleReadAndNavigate = async (notif) => {
      handleNotificationClose();
      try {
          if (!notif.is_read) {
              await markNotificationAsRead(notif.id);
              fetchNotifications();
          }
          if (notif.link) {
              navigate(notif.link);
          }
      } catch (error) {
          console.error(error);
      }
  };

  const handleMarkAllAsRead = async () => {
      try {
          await markAllNotificationsAsRead();
          fetchNotifications();
          handleNotificationClose();
      } catch (error) {
          console.error(error);
      }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, textAlign: "left", direction: "rtl" }}>
            پنل مدیریت محتوا
          </Typography>

          <IconButton color="inherit" onClick={handleNotificationClick}>
              <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
              </Badge>
          </IconButton>

          <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleNotificationClose}
              PaperProps={{
                  style: { maxHeight: 400, width: '350px' },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                  <Typography fontWeight="bold">اعلانات</Typography>
                  {unreadCount > 0 && (
                      <Chip
                          label="خوانده شدن همه"
                          size="small"
                          color="primary"
                          clickable
                          onClick={handleMarkAllAsRead}
                          icon={<DoneAllIcon fontSize="small" />}
                      />
                  )}
              </Box>

              {notifications.length === 0 ? (
                  <MenuItem disabled>
                      <Typography variant="body2">هیچ پیام جدیدی نیست.</Typography>
                  </MenuItem>
              ) : (
                  notifications.map((notif) => (
                      <MenuItem
                          key={notif.id}
                          onClick={() => handleReadAndNavigate(notif)}
                          sx={{
                              whiteSpace: 'normal',
                              borderBottom: '1px solid rgba(0,0,0,0.05)',
                              bgcolor: notif.is_read ? 'transparent' : 'rgba(25, 118, 210, 0.08)'
                          }}
                      >
                          <ListItemIcon sx={{ minWidth: '30px !important' }}>
                              {!notif.is_read && <CircleIcon color="primary" sx={{ fontSize: 10 }} />}
                          </ListItemIcon>
                          <ListItemText
                              primary={notif.title}
                              secondary={
                                  <>
                                      <Typography variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                                          {notif.message}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                          {moment(notif.created_at).locale('fa').fromNow()}
                                      </Typography>
                                  </>
                              }
                          />
                      </MenuItem>
                  ))
              )}
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/dashboard')}>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="داشبورد" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/calendar')}>
                  <ListItemIcon>
                      <CalendarIcon />
                  </ListItemIcon>
                    <ListItemText primary="تقویم کاری" />
                </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/dashboard')}>
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary="پروژه‌ها" />
              </ListItemButton>
            </ListItem>

            {/* منوی مخصوص ادمین */}
            {user && user.role === 'admin' && (
                <>
                    <Divider sx={{ my: 1 }} />

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/users')}>
                            <ListItemIcon>
                                <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary="مدیریت مشتریان" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/personnel')}>
                            <ListItemIcon>
                                <AdminIcon />
                            </ListItemIcon>
                            <ListItemText primary="مدیریت پرسنل" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/financials')}>
                            <ListItemIcon>
                                <FinancialIcon />
                            </ListItemIcon>
                            <ListItemText primary="امور مالی آژانس" />
                        </ListItemButton>
                    </ListItem>

                    {/* ✅ دکمه جدید: گزارش فعالیت‌ها */}
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/logs')}>
                            <ListItemIcon>
                                <HistoryIcon />
                            </ListItemIcon>
                            <ListItemText primary="گزارش فعالیت‌ها" />
                        </ListItemButton>
                    </ListItem>

                    <Divider sx={{ my: 1 }} />
                </>
            )}

            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/profile')}>
                <ListItemIcon>
                  <ProfileIcon />
                </ListItemIcon>
                <ListItemText primary="پروفایل من" />
              </ListItemButton>
            </ListItem>

             <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/support')}>
                    <ListItemIcon><SupportIcon /></ListItemIcon>
                        <ListItemText primary="پشتیبانی" />
                </ListItemButton>
             </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToAppIcon />
                </ListItemIcon>
                <ListItemText primary="خروج" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: (theme) => theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default MainLayout;