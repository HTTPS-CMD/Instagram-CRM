// src/components/DashboardPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { getProjects, getAllCalendarEvents } from "../api";
import {
  Typography, Box, CircularProgress, List, ListItemButton,
  Paper, Avatar, IconButton, Button, Stack, Grid, TextField, InputAdornment, Divider,
  ListItemText, ListItemAvatar, useTheme, alpha
} from "@mui/material";
import {
  Folder as FolderIcon,
  ChevronLeft as ChevronLeftIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Event as EventIcon,
  Videocam as VideoIcon,
  PostAdd as PostIcon,
  AccessTime as TimeIcon,
  WavingHand as HandIcon,
  CalendarMonth as CalendarIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import moment from 'jalali-moment';

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const isAdmin = user && user.role === 'admin';
  const theme = useTheme();

  const todayDate = moment().locale('fa').format('dddd، D jMMMM jYYYY');

  // ✅ استایل شیشه‌ای لوکس (Glassmorphism Premium)
  const glassCardStyle = {
      bgcolor: alpha(theme.palette.background.paper, 0.7), // شفافیت پس‌زمینه
      backdropFilter: 'blur(12px)', // تاری پس‌زمینه
      borderRadius: 4,
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, // حاشیه بسیار نازک
      boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.05)}`, // سایه نرم
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, eventsRes] = await Promise.all([
            getProjects(),
            getAllCalendarEvents()
        ]);

        setProjects(projectsRes.data);
        setFilteredProjects(projectsRes.data);

        const today = moment().startOf('day');
        const futureEvents = eventsRes.data
            .map(ev => ({...ev, momentDate: moment(ev.event_date)}))
            .filter(ev => ev.momentDate.isSameOrAfter(today))
            .sort((a, b) => a.momentDate - b.momentDate)
            .slice(0, 5);

        setUpcomingEvents(futureEvents);

      } catch (err) {
        console.error("Error:", err);
        if (err.response && err.response.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
      const results = projects.filter(project =>
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.page_username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(results);
  }, [searchTerm, projects]);

  const handleProjectClick = (projectId) => navigate(`/project/${projectId}`);
  const handleAddNewProject = () => navigate('/project/new');

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

      {/* --- بخش ۱: هدر خوش‌آمدگویی (Hero Banner) --- */}
      <Paper
        elevation={0}
        sx={{
            p: {xs: 3, md: 4}, mb: 5, borderRadius: 5,
            // گرادینت زنده‌تر و جذاب‌تر
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`
        }}
      >
        {/* المان‌های تزئینی پس‌زمینه با شفافیت بیشتر */}
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', filter: 'blur(10px)' }} />
        <Box sx={{ position: 'absolute', bottom: -70, left: 30, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)', filter: 'blur(20px)' }} />

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            <Box>
                <Typography variant="h3" fontWeight="900" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, letterSpacing: -1 }}>
                    <HandIcon sx={{ animation: 'wave 2s infinite', transformOrigin: '70% 70%', fontSize: '1.2em' }} />
                    سلام، {user?.username || 'کاربر'}!
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 'normal' }}>
                    به پنل مدیریت خوش آمدید. امروز چه می‌کنیم؟
                </Typography>
            </Box>
            <Box textAlign={{ xs: 'left', md: 'right' }} sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 2, borderRadius: 3, backdropFilter: 'blur(5px)' }}>
                <Typography variant="h5" fontWeight="800" sx={{display:'flex', alignItems:'center', gap: 1}}>
                    <CalendarIcon /> {todayDate}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: {xs:'flex-start', md:'flex-end'}, gap: 0.5 }}>
                    <TimeIcon fontSize="small" /> شما {upcomingEvents.length} رویداد در برنامه آینده دارید.
                </Typography>
            </Box>
        </Stack>
      </Paper>

      <Grid container spacing={4}>

          {/* --- ستون اصلی: لیست پروژه‌ها --- */}
          <Grid item xs={12} md={8}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight="800" color="text.primary" sx={{display:'flex', alignItems:'center', gap: 1}}>
                    <FolderIcon color="primary" /> پروژه‌های فعال
                  </Typography>
                  {isAdmin && (
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddNewProject} sx={{ borderRadius: 3, px: 3, boxShadow: theme.shadows[4] }}>
                        پروژه جدید
                    </Button>
                  )}
              </Stack>

              {/* فیلتر جستجو (شیشه‌ای) */}
              <TextField
                  fullWidth
                  placeholder="جستجو در پروژه‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                          ...glassCardStyle,
                          borderRadius: 3,
                          paddingRight: 1,
                          '& fieldset': { border: 'none' }, // حذف بوردر
                          '&.Mui-focused': {
                              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`, // درخشش هنگام فوکوس
                          }
                      }
                  }}
                  InputProps={{
                      startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                      endAdornment: searchTerm && (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm("")}><ClearIcon fontSize="small" /></IconButton></InputAdornment>)
                  }}
              />

              <Stack spacing={2}>
                {filteredProjects.length === 0 ? (
                    <Paper sx={{ ...glassCardStyle, p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
                        <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                        <Typography color="text.secondary" variant="h6">هیچ پروژه‌ای یافت نشد.</Typography>
                    </Paper>
                ) : (
                    filteredProjects.map((project, index) => (
                      <Paper
                        key={project.id}
                        component={motion.div}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.08, type: 'spring', stiffness: 100 }}
                        elevation={0}
                        sx={{
                            ...glassCardStyle,
                            p: 2.5,
                            cursor: 'pointer',
                            position: 'relative',
                            '&:hover': {
                                transform: 'translateY(-5px) scale(1.01)',
                                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`, // درخشش هاور
                                borderColor: alpha(theme.palette.primary.main, 0.3)
                            },
                            '&::before': { // نوار وضعیت رنگی کناری
                                content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
                                bgcolor: project.is_started ? 'success.main' : 'error.main',
                                opacity: 0.8
                            }
                        }}
                        onClick={() => handleProjectClick(project.id)}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={2.5}>
                                <Avatar src={project.page_logo} sx={{ width: 60, height: 60, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', borderRadius: 3, boxShadow: theme.shadows[2] }}>
                                    <FolderIcon fontSize="large" />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight="800" sx={{mb: 0.5}}>{project.project_name}</Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {/* تگ آیدی شیشه‌ای */}
                                        <Box sx={{ bgcolor: alpha(theme.palette.action.active, 0.05), px: 1, py: 0.2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                                            <Typography variant="caption" color="text.secondary" sx={{fontFamily:'monospace', fontWeight: 'bold'}}>@{project.page_username}</Typography>
                                        </Box>

                                        <Typography variant="caption" color={project.is_started ? 'success.main' : 'error.main'} fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: project.is_started ? 'success.main' : 'error.main' }} />
                                            {project.is_started ? 'فعال' : 'متوقف'}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                            <IconButton sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}>
                                <ChevronLeftIcon color="primary" />
                            </IconButton>
                        </Stack>
                      </Paper>
                    ))
                )}
              </Stack>
          </Grid>

          {/* --- ستون کناری: رویدادهای آینده (شیشه‌ای) --- */}
          <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="800" color="text.primary" mb={3} sx={{display:'flex', alignItems:'center', gap: 1}}>
                <EventIcon color="secondary" /> برنامه پیش‌رو
              </Typography>

              <Paper elevation={0} sx={{ ...glassCardStyle, p: 0 }}>
                  {upcomingEvents.length === 0 ? (
                      <Box p={4} textAlign="center" sx={{ opacity: 0.7 }}>
                          <EventIcon sx={{ fontSize: 70, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                          <Typography color="text.secondary" fontWeight="bold">هیچ رویدادی در راه نیست.</Typography>
                          <Typography variant="caption" color="text.secondary">برای افزودن، به صفحه پروژه بروید.</Typography>
                      </Box>
                  ) : (
                      <List sx={{ p: 0 }}>
                          {upcomingEvents.map((event, index) => {
                              const isFilming = event.event_type === 'filming';
                              const isMeeting = event.event_type === 'meeting';
                              const iconColor = isFilming ? theme.palette.warning.main : (isMeeting ? theme.palette.secondary.main : theme.palette.info.main);

                              return (
                              <React.Fragment key={event.id}>
                                  <ListItemButton
                                    onClick={() => navigate(`/project/${event.project}`)}
                                    sx={{
                                        px: 3, py: 2.5,
                                        transition: 'all 0.2s',
                                        '&:hover': { bgcolor: alpha(iconColor, 0.08) } // هاور رنگی ملایم
                                    }}
                                  >
                                      <ListItemAvatar>
                                          <Avatar sx={{
                                              bgcolor: alpha(iconColor, 0.1),
                                              color: iconColor,
                                              borderRadius: 3,
                                              width: 45, height: 45
                                          }}>
                                              {isFilming ? <VideoIcon /> : (isMeeting ? <EventIcon/> : <PostIcon />)}
                                          </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                          primary={<Typography fontWeight="bold" variant="body1" sx={{mb: 0.5}}>{event.title}</Typography>}
                                          secondary={
                                              <Stack direction="column" spacing={0.5}>
                                                  <Typography variant="caption" color="text.secondary" fontWeight="medium">{event.project_name}</Typography>
                                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <TimeIcon fontSize="inherit" color="action" sx={{opacity: 0.7}} />
                                                    <Typography variant="caption" color={iconColor} fontWeight="bold">
                                                        {moment(event.event_date).locale('fa').format('dddd، D jMMMM | HH:mm')}
                                                    </Typography>
                                                  </Stack>
                                              </Stack>
                                          }
                                      />
                                  </ListItemButton>
                                  {index < upcomingEvents.length - 1 && <Divider variant="middle" sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />}
                              </React.Fragment>
                          )})}
                      </List>
                  )}
                  <Box p={2.5} borderTop={`1px solid ${alpha(theme.palette.divider, 0.1)}`} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                      <Button fullWidth variant="text" color="primary" onClick={() => navigate('/calendar')} sx={{ fontWeight: 'bold' }} endIcon={<ChevronLeftIcon />}>
                          مشاهده تقویم کامل
                      </Button>
                  </Box>
              </Paper>
          </Grid>

      </Grid>
    </motion.div>
  );
}

export default DashboardPage;