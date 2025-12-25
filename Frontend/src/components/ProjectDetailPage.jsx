// src/components/ProjectDetailPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProjectDetails, getCalendarEvents, updateMonthlyReport,
  getWeeklyReports, updateOrCreateWeeklyReport, deleteCalendarEvent,
  updateProject, deleteProject, getUsers, getClients
} from "../api";
import {
  Box, Typography, CircularProgress, Tabs, Tab,
  Grid, Paper, Stack, Avatar, Chip, Button, List, ListItem, ListItemText, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem,
  useTheme, alpha
} from "@mui/material";
import { motion } from "framer-motion";
import { useSnackbar } from 'notistack';
import moment from 'jalali-moment';
import { UserContext } from "../App";

// کامپوننت‌های داخلی
import ReportEditor from "./ReportEditor";
import MediaManagement from "./MediaManagement";
import CalendarEventForm from "./CalendarEventForm";
import FinancialManagement from "./FinancialManagement";
import AIAnalysisTab from "./AIAnalysisTab";
import TaskKanban from "./TaskKanban";
import ScenarioManager from './ScenarioManager';

import {
    Info as InfoIcon, CalendarMonth as CalendarMonthIcon, Description as DescriptionIcon,
    PermMedia as PermMediaIcon, Add as AddIcon, Delete as DeleteIcon, Settings as SettingsIcon,
    Edit as EditIcon, AttachMoney as AttachMoneyIcon, Badge as BadgeIcon, DateRange as DateRangeIcon,
    Flag as FlagIcon, Group as GroupIcon,
    Instagram as InstagramIcon, ArrowBack as ArrowBackIcon, Summarize as ReportIcon,
    AutoAwesome as AIIcon, ViewWeek as WeeklyIcon, CalendarViewMonth as MonthlyIcon, MovieCreation as MovieIcon, Assignment as TaskIcon,
} from "@mui/icons-material";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import momentPlugin from "@fullcalendar/moment";
import 'moment/locale/fa';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other} style={{ width: '100%' }}>
      {value === index && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}><Box sx={{ py: 3 }}>{children}</Box></motion.div>)}
    </div>
  );
}

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // استیت‌ها
  const [project, setProject] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  // لیست کاربران
  const [clients, setClients] = useState([]);
  const [writers, setWriters] = useState([]);
  const [videographers, setVideographers] = useState([]);
  const [editors, setEditors] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [socialAdmins, setSocialAdmins] = useState([]);

  // استیت‌های داخلی
  const [openEventModal, setOpenEventModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [reportViewMode, setReportViewMode] = useState('weekly');
  const [isSavingMonthly, setIsSavingMonthly] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [weeklySavingStatus, setWeeklySavingStatus] = useState({});

  const { user } = useContext(UserContext);
  const { enqueueSnackbar } = useSnackbar();
  const isAdmin = user && (user.role === 'admin');

  const handleProjectUpdate = (updatedProject) => setProject(updatedProject);

  // ✅ استایل داینامیک برای کارت‌های شیشه‌ای
  const glassCardStyle = {
      bgcolor: alpha(theme.palette.background.paper, 0.6),
      backdropFilter: 'blur(16px)',
      borderRadius: 4,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: theme.shadows[4],
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      color: theme.palette.text.primary // متن داینامیک
  };

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const [projectResponse, eventsResponse, weeklyReportsResponse] = await Promise.all([
            getProjectDetails(projectId),
            getCalendarEvents(projectId),
            getWeeklyReports(projectId)
        ]);

        setProject(projectResponse.data);

        if (isAdmin) {
            try {
                const [usersRes, clientsRes] = await Promise.all([
                    getUsers(),
                    getClients()
                ]);
                const allUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.results || []);
                const allClients = Array.isArray(clientsRes.data) ? clientsRes.data : (clientsRes.data.results || []);

                setClients(allClients);
                setWriters(allUsers.filter(u => u.role === 'writer'));
                setVideographers(allUsers.filter(u => u.role === 'videographer'));
                setEditors(allUsers.filter(u => u.role === 'editor'));
                setDesigners(allUsers.filter(u => u.role === 'designer'));
                setSocialAdmins(allUsers.filter(u => u.role === 'social_admin'));
            } catch (uErr) {
                console.error("Error fetching users:", uErr);
            }
        }

        const formattedEvents = eventsResponse.data.map(event => ({
            id: event.id, type: event.event_type, title: event.title,
            dateJalali: moment(event.event_date).locale('fa').format('jYYYY/jMM/jDD'),
            dateGregorian: moment(event.event_date).format('YYYY-MM-DD'),
        }));
        setEvents(formattedEvents);
        setWeeklyReports(weeklyReportsResponse.data);
      } catch (err) {
        setError("خطا در دریافت جزییات پروژه");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectData();
  }, [projectId, isAdmin]);

  const handleOpenEditModal = () => {
      setEditFormData({
          project_name: project.project_name,
          page_username: project.page_username,
          page_slogan: project.page_slogan || '',
          page_bio: project.page_bio || '',
          monthly_post_goal: project.monthly_post_goal,
          start_date: project.start_date ? moment(project.start_date) : null,
          end_date: project.end_date ? moment(project.end_date) : null,
          client_user: project.client_user || "",
          writers: project.writers || [],
          videographers: project.videographers || [],
          editors: project.editors || [],
          designers: project.designers || [],
          social_admins: project.social_admins || [],
      });
      setOpenEditModal(true);
  };

  const handleEditChange = (e) => setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleDateChange = (name, newValue) => setEditFormData(prev => ({ ...prev, [name]: newValue }));

  const handleEditSubmit = async () => {
      setEditLoading(true);
      try {
          const dataToSend = { ...editFormData };
          if (dataToSend.start_date) dataToSend.start_date = dataToSend.start_date.locale('en').format('YYYY-MM-DD');
          if (dataToSend.end_date) dataToSend.end_date = dataToSend.end_date.locale('en').format('YYYY-MM-DD');

          const response = await updateProject(projectId, dataToSend);
          setProject(response.data);
          setOpenEditModal(false);
          enqueueSnackbar('پروژه با موفقیت ویرایش شد', { variant: 'success' });
      } catch (err) {
          enqueueSnackbar('خطا در ویرایش', { variant: 'error' });
          console.error(err);
      } finally { setEditLoading(false); }
  };

  const handleDeleteProject = async () => { if (window.confirm('آیا مطمئن هستید؟')) { try { await deleteProject(projectId); navigate('/dashboard'); } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); } } };
  const handleEventCreated = (newEvent) => { const formattedEvent = { id: newEvent.id, type: newEvent.event_type, title: newEvent.title, dateJalali: moment(newEvent.event_date).locale('fa').format('jYYYY/jMM/jDD'), dateGregorian: moment(newEvent.event_date).format('YYYY-MM-DD'), }; setEvents(prev => [...prev, formattedEvent]); setOpenEventModal(false); }
  const handleSaveMonthly = async (newContent) => { setIsSavingMonthly(true); try { await updateMonthlyReport(projectId, newContent); setProject(prev => ({ ...prev, monthly_report_text: newContent })); enqueueSnackbar('ذخیره شد', { variant: 'success' }); } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); } finally { setIsSavingMonthly(false); } };
  const handleSaveWeekly = async (weekNumber, newContent) => { setWeeklySavingStatus(prev => ({ ...prev, [weekNumber]: true })); const existingReport = weeklyReports.find(r => r.week_number === weekNumber); const reportId = existingReport ? existingReport.id : null; try { const response = await updateOrCreateWeeklyReport(projectId, weekNumber, reportId, newContent); if (existingReport) setWeeklyReports(prev => prev.map(r => r.id === response.data.id ? response.data : r)); else setWeeklyReports(prev => [...prev, response.data]); enqueueSnackbar('ذخیره شد', { variant: 'success' }); } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); } finally { setWeeklySavingStatus(prev => ({ ...prev, [weekNumber]: false })); } };
  const handleDeleteEvent = async (eventId) => { if (window.confirm('حذف شود؟')) { try { await deleteCalendarEvent(projectId, eventId); setEvents(prev => prev.filter(event => event.id !== eventId)); } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); } } };
  const getWeeklyContent = (weekNumber) => weeklyReports.find(r => r.week_number === weekNumber)?.report_text || '';
  const formatEventForCalendar = () => events.map(event => ({ id: event.id, title: event.title, date: event.dateGregorian, color: event.type === 'filming' ? theme.palette.warning.main : (event.type === 'meeting' ? theme.palette.secondary.main : theme.palette.primary.main) }));

  const getVisibleTabs = () => {
      if (!project) return [];
      const isInsta = project.project_type === 'instagram';
      const allTabs = [
          { id: 'dashboard', label: "اطلاعات پروژه", icon: <InfoIcon />, show: true },
          { id: 'tasks', label: "مدیریت وظایف", icon: <TaskIcon />, show: true },
          { id: 'calendar', label: "تقویم محتوایی", icon: <CalendarMonthIcon />, show: isInsta },
          { id: 'scenarios', label: "سناریوها", icon: <DescriptionIcon />, show: true },
          { id: 'reports', label: "گزارش کار", icon: <ReportIcon />, show: isInsta },
          { id: 'analysis', label: "تحلیل ماهانه", icon: <AIIcon />, show: isInsta },
          { id: 'media', label: "مدیریت فایل", icon: <PermMediaIcon />, show: true },
          { id: 'financials', label: "امور مالی", icon: <AttachMoneyIcon />, show: isInsta },
      ];
      return allTabs.filter(t => t.show);
  };
  const visibleTabs = getVisibleTabs();

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;

  const selectStyle = {
    textAlign: 'right',
    direction: 'rtl',
    '& .MuiSelect-select': { textAlign: 'right', paddingRight: 2 }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>

      {/* هدر صفحه (رنگ ثابت چون گرادینت تیره دارد و متن سفید) */}
      <Paper elevation={0} sx={{
          p: 4, mb: 2, borderRadius: 5,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
          position: 'relative', overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`
      }}>
        <IconButton sx={{ position: 'absolute', top: 20, left: 20, color: theme.palette.text.secondary }} onClick={() => navigate('/dashboard')}><ArrowBackIcon /></IconButton>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
            <Stack direction="row" spacing={3} alignItems="center">
                <Avatar src={project.page_logo} sx={{ width: 100, height: 100, bgcolor: project.project_type === 'teaser' ? 'warning.main' : 'primary.main', fontSize: '2.5rem', fontWeight: 'bold', boxShadow: theme.shadows[4], border: `4px solid ${theme.palette.background.paper}` }}>
                    {project.project_type === 'teaser' ? <MovieIcon fontSize="inherit"/> : project.project_name.charAt(0)}
                </Avatar>
                <Box>
                    <Typography variant="h3" fontWeight="900" sx={{ mb: 1, letterSpacing: -1, color: theme.palette.text.primary }}>{project.project_name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {project.page_username && <Chip icon={<InstagramIcon sx={{ fontSize: 18 }} />} label={`@${project.page_username}`} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold' }} />}
                        <Chip label={project.project_type === 'teaser' ? "پروژه تیزر / تکی" : "مدیریت اینستاگرام"} color={project.project_type === 'teaser' ? "warning" : "primary"} variant="outlined" size="small" />
                    </Stack>
                </Box>
            </Stack>
            {isAdmin && (<Stack direction="row" spacing={2}><Button variant="contained" color="warning" startIcon={<SettingsIcon />} onClick={handleOpenEditModal} sx={{ borderRadius: 3, px: 3 }}>تنظیمات</Button><Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteProject} sx={{ borderRadius: 3, px: 3 }}>حذف</Button></Stack>)}
        </Stack>
      </Paper>

      {/* تب‌ها */}
      <Paper elevation={0} sx={{ bgcolor: 'transparent', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto" textColor="primary" indicatorColor="primary"
            sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 'bold', fontSize: '1rem', minHeight: 60, mr: 1, borderRadius: 2, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) }},
                '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0' }
            }}
        >
          {visibleTabs.map((tab) => (<Tab key={tab.id} label={tab.label} icon={tab.icon} iconPosition="start" disabled={tab.disabled} />))}
        </Tabs>
      </Paper>

      {visibleTabs[currentTab]?.id === 'dashboard' && (
          <TabPanel value={currentTab} index={currentTab}>
              <Grid container spacing={3}>
                  <Grid item xs={12} md={project.project_type === 'teaser' ? 12 : 8}>
                      <Paper sx={{ ...glassCardStyle, p: 4, height: '100%' }}>
                          <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}><BadgeIcon /> هویت بصری</Typography>
                          <Divider sx={{ mb: 3, borderColor: theme.palette.divider }} />
                          <Grid container spacing={4}>
                              <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary" gutterBottom>نام پروژه</Typography><Typography variant="h6" fontWeight="bold" color="text.primary">{project.project_name}</Typography></Grid>
                              <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary" gutterBottom>نوع قرارداد</Typography><Typography variant="h6" fontWeight="bold" color="text.primary">{project.project_type === 'teaser' ? 'پروژه تکی / تیزر' : 'مدیریت ماهانه'}</Typography></Grid>
                              {project.page_username && <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="text.secondary" gutterBottom>آیدی صفحه</Typography><Typography variant="h6" dir="ltr" sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.primary' }}>@{project.page_username}</Typography></Grid>}
                          </Grid>
                      </Paper>
                  </Grid>
                  {project.project_type !== 'teaser' && (
                      <Grid item xs={12} md={4}>
                          <Stack spacing={3}>
                              <Paper sx={{ ...glassCardStyle, p: 4, textAlign: 'center', background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`, color: 'white', border: 'none' }}>
                                  <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 1 }}>تعهد ماهانه</Typography>
                                  <Typography variant="h2" fontWeight="900">{project.monthly_post_goal}</Typography>
                                  <Typography variant="body2" sx={{ opacity: 0.8 }}>پست و ریلز</Typography>
                              </Paper>
                              <Paper sx={{ ...glassCardStyle, p: 3 }}>
                                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}><DateRangeIcon /> زمان‌بندی</Typography>
                                  <Divider sx={{ mb: 2 }} />
                                  <Stack spacing={2}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: alpha(theme.palette.action.hover, 0.1), p: 1.5, borderRadius: 2 }}>
                                          <Typography variant="body2" color="text.secondary">شروع</Typography>
                                          <Typography variant="body1" fontWeight="bold" color="text.primary">{project.start_date ? moment(project.start_date).locale('fa').format('jD jMMMM jYYYY') : '---'}</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: alpha(theme.palette.action.hover, 0.1), p: 1.5, borderRadius: 2 }}>
                                          <Typography variant="body2" color="text.secondary">پایان</Typography>
                                          <Typography variant="body1" fontWeight="bold" color="text.primary">{project.end_date ? moment(project.end_date).locale('fa').format('jD jMMMM jYYYY') : '---'}</Typography>
                                      </Box>
                                  </Stack>
                              </Paper>
                          </Stack>
                      </Grid>
                  )}
              </Grid>
          </TabPanel>
      )}

      {visibleTabs[currentTab]?.id === 'calendar' && (
          <TabPanel value={currentTab} index={currentTab}>
              <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                      <Paper sx={{ ...glassCardStyle, p: 2, direction: 'ltr' }}>
                          <FullCalendar plugins={[dayGridPlugin, momentPlugin]} initialView="dayGridMonth" events={formatEventForCalendar()} locale="fa" direction="rtl" firstDay={6} headerToolbar={{ start: 'title', center: '', end: 'today prev,next' }} buttonText={{ today: 'امروز' }} height="auto" contentHeight="auto" dayHeaderClassNames="calender-header-rtl" />
                      </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                      <Paper sx={{ ...glassCardStyle, p: 0, overflow: 'hidden' }}>
                          <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`}><Typography variant="h6" fontWeight="bold" color="text.primary">رویدادها</Typography></Box>
                          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                              {events.length === 0 ? <Typography p={3} align="center" color="text.secondary">خالی</Typography> : events.map((ev) => (
                                  <ListItem key={ev.id} divider>
                                      <ListItemText primary={ev.title} secondary={ev.dateJalali} sx={{textAlign:'right', color: 'text.primary'}} secondaryTypographyProps={{color: 'text.secondary'}}/>
                                      <Chip label={ev.type === 'filming' ? 'آفیش' : (ev.type === 'meeting' ? 'جلسه' : 'پست')} size="small" color={ev.type === 'filming' ? 'warning' : (ev.type === 'meeting' ? 'secondary' : 'info')} variant="outlined"/>
                                      {isAdmin && <IconButton onClick={() => handleDeleteEvent(ev.id)} size="small" color="error"><DeleteIcon/></IconButton>}
                                  </ListItem>
                              ))}
                          </List>
                          {isAdmin && <Box p={2}><Button fullWidth variant="contained" startIcon={<AddIcon/>} onClick={()=>setOpenEventModal(true)}>افزودن</Button></Box>}
                      </Paper>
                  </Grid>
              </Grid>
          </TabPanel>
      )}

      {visibleTabs[currentTab]?.id === 'scenarios' && (
          <TabPanel value={currentTab} index={currentTab}>
              <ScenarioManager projectId={projectId} />
          </TabPanel>
      )}

      {visibleTabs[currentTab]?.id === 'reports' && (
          <TabPanel value={currentTab} index={currentTab}>
              <Paper sx={{ ...glassCardStyle, p: 3, minHeight: 500 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" fontWeight="bold" color="primary">مدیریت گزارش‌ها</Typography>
                      <ToggleButtonGroup value={reportViewMode} exclusive onChange={(e, v) => v && setReportViewMode(v)} size="small" color="info">
                          <ToggleButton value="weekly" sx={{ px: 3 }}><WeeklyIcon sx={{mr:1}}/> هفتگی</ToggleButton>
                          <ToggleButton value="monthly" sx={{ px: 3 }}><MonthlyIcon sx={{mr:1}}/> ماهانه</ToggleButton>
                      </ToggleButtonGroup>
                  </Stack>
                  <Divider sx={{ mb: 3 }} />
                  {reportViewMode === 'weekly' ? (
                      <Stack spacing={3}>
                          {[1, 2, 3, 4, 5].map(week => (
                              <Paper key={week} sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), p: 0, overflow: 'hidden', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }} elevation={0}>
                                  <ReportEditor title={`گزارش هفته ${week}`} initialContent={getWeeklyContent(week)} onSave={(c) => handleSaveWeekly(week, c)} isSaving={weeklySavingStatus[week]} isAdmin={isAdmin} />
                              </Paper>
                          ))}
                      </Stack>
                  ) : (
                      <Box sx={{ mt: 2 }}><ReportEditor title="گزارش نهایی ماهانه" initialContent={project.monthly_report_text} onSave={handleSaveMonthly} isSaving={isSavingMonthly} isAdmin={isAdmin} /></Box>
                  )}
              </Paper>
          </TabPanel>
      )}

      {visibleTabs[currentTab]?.id === 'analysis' && (<TabPanel value={currentTab} index={currentTab}><AIAnalysisTab projectId={projectId} /></TabPanel>)}
      {visibleTabs[currentTab]?.id === 'media' && (<TabPanel value={currentTab} index={currentTab}><Paper sx={glassCardStyle} elevation={0}><MediaManagement project={project} /></Paper></TabPanel>)}
      {visibleTabs[currentTab]?.id === 'financials' && (<TabPanel value={currentTab} index={currentTab}><FinancialManagement project={project} isAdmin={isAdmin} onProjectUpdate={handleProjectUpdate} /></TabPanel>)}
      {visibleTabs[currentTab]?.id === 'tasks' && (<TabPanel value={currentTab} index={currentTab}><TaskKanban projectId={projectId} /></TabPanel>)}

      <Dialog open={openEventModal} onClose={() => setOpenEventModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{bgcolor:'primary.main', color:'white'}}>رویداد جدید</DialogTitle>
          <DialogContent dividers>
            <CalendarEventForm projectId={projectId} onEventCreated={handleEventCreated} onCancel={()=>setOpenEventModal(false)}/>
          </DialogContent>
      </Dialog>

      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{bgcolor:'warning.dark', color:'white'}}>ویرایش پروژه</DialogTitle>
          <DialogContent dividers>
              <Grid container spacing={3} sx={{ mt: 0 }}>
                  <Grid item xs={12} md={6}><TextField label="نام پروژه" name="project_name" value={editFormData.project_name || ''} onChange={handleEditChange} fullWidth required /></Grid>
                  <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>تغییر مشتری (مالک)</InputLabel>
                        <Select name="client_user" value={editFormData.client_user} label="تغییر مشتری (مالک)" onChange={handleEditChange} sx={selectStyle}>
                            <MenuItem value=""><em>انتخاب نشده</em></MenuItem>
                            {clients.map(c => <MenuItem key={c.id} value={c.id}>{c.username}</MenuItem>)}
                        </Select>
                      </FormControl>
                  </Grid>

                  {project && project.project_type === 'instagram' && (
                      <>
                        <Grid item xs={12} md={6}><TextField label="آیدی صفحه" name="page_username" value={editFormData.page_username || ''} onChange={handleEditChange} fullWidth /></Grid>
                        <Grid item xs={12} md={4}><TextField label="تعهد ماهانه" name="monthly_post_goal" type="number" value={editFormData.monthly_post_goal || ''} onChange={handleEditChange} fullWidth /></Grid>
                      </>
                  )}
                  <Grid item xs={12} md={4}><DatePicker label="شروع" value={editFormData.start_date} onChange={(v) => handleDateChange('start_date', v)} renderInput={(p) => <TextField {...p} fullWidth />} /></Grid>
                  <Grid item xs={12} md={4}><DatePicker label="پایان" value={editFormData.end_date} onChange={(v) => handleDateChange('end_date', v)} renderInput={(p) => <TextField {...p} fullWidth />} /></Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><GroupIcon /> ویرایش تیم اجرایی</Typography>
              <Grid container spacing={3}>
                  <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>تیم نویسندگان</InputLabel><Select name="writers" multiple value={editFormData.writers || []} label="تیم نویسندگان" onChange={handleEditChange} sx={selectStyle} renderValue={(selected) => selected.map(id => writers.find(u => u.id === id)?.username).join(', ')}>{writers.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>تیم فیلم‌برداری</InputLabel><Select name="videographers" multiple value={editFormData.videographers || []} label="تیم فیلم‌برداری" onChange={handleEditChange} sx={selectStyle} renderValue={(selected) => selected.map(id => videographers.find(u => u.id === id)?.username).join(', ')}>{videographers.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>تیم تدوین</InputLabel><Select name="editors" multiple value={editFormData.editors || []} label="تیم تدوین" onChange={handleEditChange} sx={selectStyle} renderValue={(selected) => selected.map(id => editors.find(u => u.id === id)?.username).join(', ')}>{editors.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>تیم گرافیک</InputLabel><Select name="designers" multiple value={editFormData.designers || []} label="تیم گرافیک" onChange={handleEditChange} sx={selectStyle} renderValue={(selected) => selected.map(id => designers.find(u => u.id === id)?.username).join(', ')}>{designers.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>تیم ادمین سوشال</InputLabel><Select name="social_admins" multiple value={editFormData.social_admins || []} label="تیم ادمین سوشال" onChange={handleEditChange} sx={selectStyle} renderValue={(selected) => selected.map(id => socialAdmins.find(u => u.id === id)?.username).join(', ')}>{socialAdmins.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}</Select></FormControl></Grid>
              </Grid>
          </DialogContent>
          <DialogActions><Button onClick={()=>setOpenEditModal(false)}>انصراف</Button><Button onClick={handleEditSubmit} variant="contained" color="warning">ذخیره</Button></DialogActions>
      </Dialog>
    </motion.div>
  );
}

export default ProjectDetailPage;