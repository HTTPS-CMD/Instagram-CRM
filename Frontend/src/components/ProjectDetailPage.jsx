// src/components/ProjectDetailPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProjectDetails, getCalendarEvents, updateMonthlyReport,
  getWeeklyReports, updateOrCreateWeeklyReport, deleteCalendarEvent,
  updateProject, deleteProject
} from "../api";
import {
  Box, Typography, CircularProgress, Tabs, Tab,
  Grid, Paper, Stack, Avatar, Chip, Button, List, ListItem, ListItemText, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  ToggleButton, ToggleButtonGroup // ✅ اضافه شد
} from "@mui/material";
import { motion } from "framer-motion";
import { useSnackbar } from 'notistack';

import ScenarioList from "./ScenarioList";
import ReportEditor from "./ReportEditor";
import MediaManagement from "./MediaManagement";
import CalendarEventForm from "./CalendarEventForm";
import FinancialManagement from "./FinancialManagement";
import ScenarioKanban from "./ScenarioKanban"; // ✅ اضافه شد

import moment from 'jalali-moment';
import { UserContext } from "../App";

// آیکون‌ها
import {
    Info as InfoIcon,
    CalendarMonth as CalendarMonthIcon,
    Description as DescriptionIcon,
    Analytics as AnalyticsIcon,
    Assessment as AssessmentIcon,
    PermMedia as PermMediaIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    Edit as EditIcon,
    AttachMoney as AttachMoneyIcon,
    Badge as BadgeIcon,
    DateRange as DateRangeIcon,
    Flag as FlagIcon,
    ViewList as ViewListIcon, // ✅ اضافه شد
    ViewKanban as ViewKanbanIcon // ✅ اضافه شد
} from "@mui/icons-material";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import momentPlugin from "@fullcalendar/moment";
import 'moment/locale/fa';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// کامپوننت پنل تب
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Box sx={{ p: 3 }}>{children}</Box>
        </motion.div>
      )}
    </div>
  );
}

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  // استیت‌های گزارش‌ها
  const [isSavingMonthly, setIsSavingMonthly] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [weeklySavingStatus, setWeeklySavingStatus] = useState({});

  // استیت مودال‌ها
  const [openEventModal, setOpenEventModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  // استیت فرم ویرایش پروژه
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // ✅ استیت جدید برای حالت نمایش سناریوها
  const [scenarioViewMode, setScenarioViewMode] = useState('list');

  const { user } = useContext(UserContext);
  const { enqueueSnackbar } = useSnackbar();

  const isAdmin = user && (user.role === 'admin');

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
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

        const formattedEvents = eventsResponse.data.map(event => ({
            id: event.id,
            type: event.event_type,
            title: event.title,
            dateJalali: moment(event.event_date).locale('fa').format('jYYYY/jMM/jDD'),
            dateGregorian: moment(event.event_date).format('YYYY-MM-DD'),
        }));
        setEvents(formattedEvents);
        setWeeklyReports(weeklyReportsResponse.data);
        setError(null);
      } catch (err)
      {
        setError("خطا در دریافت جزییات پروژه");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectData();
  }, [projectId]);

  const handleOpenEditModal = () => {
      setEditFormData({
          project_name: project.project_name,
          page_username: project.page_username,
          page_slogan: project.page_slogan || '',
          page_bio: project.page_bio || '',
          monthly_post_goal: project.monthly_post_goal,
          start_date: project.start_date ? moment(project.start_date) : null,
          end_date: project.end_date ? moment(project.end_date) : null,
      });
      setOpenEditModal(true);
  };

  const handleEditChange = (e) => {
      const { name, value } = e.target;
      setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, newValue) => {
      setEditFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleEditSubmit = async () => {
      setEditLoading(true);
      try {
          const dataToSend = { ...editFormData };
          if (dataToSend.start_date) dataToSend.start_date = dataToSend.start_date.locale('en').format('YYYY-MM-DD');
          if (dataToSend.end_date) dataToSend.end_date = dataToSend.end_date.locale('en').format('YYYY-MM-DD');

          const response = await updateProject(projectId, dataToSend);
          setProject(response.data);
          setOpenEditModal(false);
          enqueueSnackbar('اطلاعات پروژه با موفقیت به‌روزرسانی شد', { variant: 'success' });
      } catch (err) {
          console.error("Update failed:", err);
          enqueueSnackbar('خطا در ویرایش پروژه', { variant: 'error' });
      } finally {
          setEditLoading(false);
      }
  };

  const handleDeleteProject = async () => {
      if (window.confirm('آیا کاملاً مطمئن هستید؟ این عملیات غیرقابل بازگشت است و تمام سناریوها و گزارش‌های این پروژه حذف خواهند شد.')) {
          try {
              await deleteProject(projectId);
              enqueueSnackbar('پروژه با موفقیت حذف شد', { variant: 'info' });
              navigate('/dashboard');
          } catch (err) {
              console.error("Delete failed:", err);
              enqueueSnackbar('خطا در حذف پروژه', { variant: 'error' });
          }
      }
  };

  const handleEventCreated = (newEvent) => {
    const formattedEvent = {
        id: newEvent.id,
        type: newEvent.event_type,
        title: newEvent.title,
        dateJalali: moment(newEvent.event_date).locale('fa').format('jYYYY/jMM/jDD'),
        dateGregorian: moment(newEvent.event_date).format('YYYY-MM-DD'),
    };
    setEvents(prev => [...prev, formattedEvent]);
    setOpenEventModal(false);
    enqueueSnackbar('رویداد جدید با موفقیت ایجاد شد', { variant: 'success' });
  }

  const handleSaveMonthly = async (newContent) => {
    setIsSavingMonthly(true);
    try {
      await updateMonthlyReport(projectId, newContent);
      setProject(prev => ({ ...prev, monthly_report_text: newContent }));
      enqueueSnackbar('گزارش ماهانه با موفقیت ذخیره شد', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('خطا در ذخیره گزارش ماهانه', { variant: 'error' });
      console.error("Save error:", err);
    } finally {
      setIsSavingMonthly(false);
    }
  };

  const handleSaveWeekly = async (weekNumber, newContent) => {
      setWeeklySavingStatus(prev => ({ ...prev, [weekNumber]: true }));
      const existingReport = weeklyReports.find(r => r.week_number === weekNumber);
      const reportId = existingReport ? existingReport.id : null;

      try {
          const response = await updateOrCreateWeeklyReport(projectId, weekNumber, reportId, newContent);

          if (existingReport) {
              setWeeklyReports(prev => prev.map(r => r.id === response.data.id ? response.data : r));
          } else {
              setWeeklyReports(prev => [...prev, response.data]);
          }
          enqueueSnackbar(`گزارش هفته ${weekNumber} با موفقیت ذخیره شد`, { variant: 'success' });
      } catch (err) {
          enqueueSnackbar(`خطا در ذخیره گزارش هفته ${weekNumber}`, { variant: 'error' });
          console.error(`Save error for week ${weekNumber}:`, err);
      } finally {
          setWeeklySavingStatus(prev => ({ ...prev, [weekNumber]: false }));
      }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('آیا از حذف این رویداد مطمئن هستید؟')) {
      try {
        await deleteCalendarEvent(projectId, eventId);
        setEvents(prev => prev.filter(event => event.id !== eventId));
        enqueueSnackbar('رویداد با موفقیت حذف شد', { variant: 'info' });
      } catch (err) {
        enqueueSnackbar('خطا در حذف رویداد', { variant: 'error' });
        console.error('Delete event failed:', err);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getWeeklyContent = (weekNumber) => {
      return weeklyReports.find(r => r.week_number === weekNumber)?.report_text || '';
  };

  const formatEventForCalendar = () => {
      return events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.dateGregorian,
          color: event.type === 'filming' ?  '#FFA500' : '#1976D2',
      }));
  };

  // ✅ هندلر تغییر ویو سناریو
  const handleScenarioViewChange = (event, newMode) => {
      if (newMode !== null) {
          setScenarioViewMode(newMode);
      }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* هدر صفحه */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2} sx={{ justifyContent: 'space-between'}}>
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={project.page_logo}
              sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
            >
              {project.project_name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom component="div">
                {project.project_name}
              </Typography>
              <Chip
                label={`@${project.page_username}`}
                variant="outlined"
                size="small"
              />
            </Box>
        </Stack>

        {isAdmin && (
            <Stack direction="row" spacing={1}>
                <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<SettingsIcon />}
                    onClick={handleOpenEditModal}
                >
                    تنظیمات پروژه
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteProject}
                >
                    حذف پروژه
                </Button>
            </Stack>
        )}
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="اطلاعات پروژه" icon={<InfoIcon />} />
          <Tab label="تقویم محتوایی" icon={<CalendarMonthIcon />} />
          <Tab label="سناریوها" icon={<DescriptionIcon />} />
          <Tab label="تحلیل هفتگی" icon={<AnalyticsIcon />} />
          <Tab label="گزارش ماهانه" icon={<AssessmentIcon />} />
          <Tab label="مدیریت رسانه" icon={<PermMediaIcon />} />
          <Tab label="امور مالی" icon={<AttachMoneyIcon />} />
        </Tabs>
      </Box>

      {/* --- تب ۱: اطلاعات پروژه --- */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3} sx={{ width: '100%' }}>
          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{ p: 3, height: '100%'}}>
              <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BadgeIcon /> هویت بصری و برند
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                             <Typography variant="subtitle2" color="text.secondary">شعار برند:</Typography>
                             <Chip label={project.page_slogan || "---"} variant="outlined" sx={{ mt: 0.5, fontSize: '1rem' }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                             <Typography variant="subtitle2" color="text.secondary">آیدی صفحه:</Typography>
                             <Typography variant="body1" dir="ltr" sx={{ textAlign: 'right', mt: 0.5, fontWeight: 'bold' }}>
                                @{project.page_username}
                             </Typography>
                        </Grid>
                        <Grid item xs={12}>
                             <Typography variant="subtitle2" color="text.secondary">بیوگرافی:</Typography>
                             <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default', borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                                    {project.page_bio || "توضیحاتی ثبت نشده است."}
                                </Typography>
                             </Paper>
                        </Grid>
                    </Grid>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: 'primary.dark', color: 'white' }}>
                    <Typography variant="h6" gutterBottom sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <FlagIcon fontSize="small"/> تعهد ماهانه
                    </Typography>
                    <Typography variant="h2" fontWeight="bold">{project.monthly_post_goal}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>پست / ریلز در ماه</Typography>
                </Paper>

                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateRangeIcon /> زمان‌بندی قرارداد
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">تاریخ شروع:</Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {project.start_date ? moment(project.start_date).locale('fa').format('jD jMMMM jYYYY') : '---'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">تاریخ پایان:</Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {project.end_date ? moment(project.end_date).locale('fa').format('jD jMMMM jYYYY') : '---'}
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Stack>
          </Grid>
        </Grid>
      </TabPanel>

      {/* --- تب ۱: تقویم محتوایی --- */}
      <TabPanel value={currentTab} index={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" sx={{ textAlign: 'right', mb: 0 }}>
                تقویم محتوایی پروژه
            </Typography>
            {isAdmin && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenEventModal(true)}
                      sx={{ borderRadius: 2, fontWeight: 'bold' }}
                  >
                      ایجاد رویداد
                  </Button>
              </motion.div>
            )}
        </Stack>

        <Paper elevation={2} sx={{ p: 2, direction: 'ltr' }}>
            <FullCalendar
                plugins={[dayGridPlugin, momentPlugin]}
                initialView="dayGridMonth"
                events={formatEventForCalendar()}
                locale="fa"
                direction="rtl"
                firstDay={6}
                headerToolbar={{
                    start: 'title',
                    center: '',
                    end: 'today prev,next'
                }}
                buttonText={{
                    today: 'امروز',
                }}
                height="auto"
                contentHeight="auto"
                dayHeaderClassNames="calender-header-rtl"
            />
        </Paper>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            لیست رویدادها (برای مدیریت)
        </Typography>
        <Paper elevation={2} sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
             <List>
                {events.length === 0 ? (
                    <Typography variant="body1" sx={{textAlign: 'center'}}>رویدادی برای این پروژه ثبت نشده است.</Typography>
                ) : (
                    events.map((event) => (
                        <ListItem key={event.id} divider sx={{
                            background: event.type === 'filming' ? 'rgba(255, 165, 0, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                            borderRadius: 1,
                            mb: 1,
                        }}>
                             <ListItemText
                                primary={event.title}
                                secondary={`تاریخ: ${event.dateJalali}`}
                                sx={{ textAlign: 'right' }}
                            />
                            <Chip
                                label={event.type === 'filming' ? 'آفیش' : 'آپلود پست'}
                                size="small"
                                color={event.type === 'filming' ? 'warning' : 'info'}
                            />
                            {isAdmin && (
                              <IconButton
                                edge="end"
                                onClick={() => handleDeleteEvent(event.id)}
                                sx={{ color: 'error.light', ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                        </ListItem>
                    ))
                )}
             </List>
        </Paper>
      </TabPanel>

      {/* --- ✅ تب ۲: سناریوها (با دکمه تغییر ویو) --- */}
      <TabPanel value={currentTab} index={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <ToggleButtonGroup
                value={scenarioViewMode}
                exclusive
                onChange={handleScenarioViewChange}
                size="small"
                color="primary"
            >
                <ToggleButton value="list" sx={{ gap: 1 }}><ViewListIcon /> لیست</ToggleButton>
                <ToggleButton value="board" sx={{ gap: 1 }}><ViewKanbanIcon /> بورد کانبان</ToggleButton>
            </ToggleButtonGroup>
        </Stack>

        {scenarioViewMode === 'list' ? (
            <ScenarioList projectId={projectId} isAdmin={isAdmin} />
        ) : (
            <ScenarioKanban projectId={projectId} />
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <Stack spacing={3}>
            <Typography variant="h5" gutterBottom>تحلیل هفتگی (۵ هفته)</Typography>
            {[1, 2, 3, 4, 5].map(week => (
                <ReportEditor
                    key={week}
                    title={`هفته ${week}`}
                    initialContent={getWeeklyContent(week)}
                    onSave={(content) => handleSaveWeekly(week, content)}
                    isSaving={weeklySavingStatus[week] || false}
                    isAdmin={isAdmin}
                />
            ))}
        </Stack>
      </TabPanel>

      <TabPanel value={currentTab} index={4}>
        <ReportEditor
            title="گزارش نهایی ماهانه"
            initialContent={project.monthly_report_text}
            onSave={handleSaveMonthly}
            isSaving={isSavingMonthly}
            isAdmin={isAdmin}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={5}>
        <MediaManagement project={project} />
      </TabPanel>

      {/* ✅ تب پنل جدید برای امور مالی */}
      <TabPanel value={currentTab} index={6}>
          <FinancialManagement
              project={project}
              isAdmin={isAdmin}
              onProjectUpdate={handleProjectUpdate}
          />
      </TabPanel>

      {/* --- مودال‌ها --- */}
      <Dialog
        open={openEventModal}
        onClose={() => setOpenEventModal(false)}
        maxWidth="sm"
        fullWidth
      >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              ایجاد رویداد تقویمی جدید
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
              <CalendarEventForm
                  projectId={projectId}
                  onEventCreated={handleEventCreated}
                  onCancel={() => setOpenEventModal(false)}
              />
          </DialogContent>
      </Dialog>

      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="md"
        fullWidth
      >
          <DialogTitle sx={{ bgcolor: 'warning.dark', color: 'white' }}>
              ویرایش تنظیمات پروژه
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
              <Grid container spacing={3} sx={{ mt: 0 }}>
                  <Grid item xs={12} md={6}>
                      <TextField
                          label="نام پروژه"
                          name="project_name"
                          value={editFormData.project_name || ''}
                          onChange={handleEditChange}
                          fullWidth
                          required
                      />
                  </Grid>
                  <Grid item xs={12} md={6}>
                      <TextField
                          label="آیدی صفحه"
                          name="page_username"
                          value={editFormData.page_username || ''}
                          onChange={handleEditChange}
                          fullWidth
                          required
                      />
                  </Grid>
                  <Grid item xs={12}>
                      <TextField
                          label="شعار برند"
                          name="page_slogan"
                          value={editFormData.page_slogan || ''}
                          onChange={handleEditChange}
                          fullWidth
                      />
                  </Grid>
                  <Grid item xs={12}>
                      <TextField
                          label="بیوگرافی"
                          name="page_bio"
                          value={editFormData.page_bio || ''}
                          onChange={handleEditChange}
                          fullWidth
                          multiline
                          rows={3}
                      />
                  </Grid>
                   <Grid item xs={12} md={4}>
                        <TextField
                          label="تعهد پست در ماه"
                          name="monthly_post_goal"
                          type="number"
                          value={editFormData.monthly_post_goal || ''}
                          onChange={handleEditChange}
                          fullWidth
                        />
                  </Grid>
                   <Grid item xs={12} md={4}>
                        <DatePicker
                          label="تاریخ شروع"
                          value={editFormData.start_date}
                          onChange={(newValue) => handleDateChange('start_date', newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                  </Grid>
                   <Grid item xs={12} md={4}>
                        <DatePicker
                          label="تاریخ پایان"
                          value={editFormData.end_date}
                          onChange={(newValue) => handleDateChange('end_date', newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                  </Grid>
              </Grid>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'background.default', p: 2 }}>
              <Button onClick={() => setOpenEditModal(false)} color="inherit">
                  انصراف
              </Button>
              <Button
                  onClick={handleEditSubmit}
                  color="warning"
                  variant="contained"
                  disabled={editLoading}
              >
                  {editLoading ? <CircularProgress size={24} color="inherit" /> : "ذخیره تغییرات"}
              </Button>
          </DialogActions>
      </Dialog>

    </motion.div>
  );
}

export default ProjectDetailPage;