// src/components/ClientDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { getProjects, getDashboardStats } from "../api";
import {
  Typography, Box, CircularProgress, Paper, Avatar, Button, Stack, Grid,
  LinearProgress, Chip, useTheme, alpha, Skeleton
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  AccountBalanceWallet as WalletIcon,
  Assignment as ProjectIcon,
  WavingHand as HandIcon,
  Event as EventIcon,
  TrendingUp as TrendIcon,
  Star as StarIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import moment from 'jalali-moment';
import Joyride, { STATUS } from 'react-joyride'; // ✅ ایمپورت تور

const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
};

function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ استیت اجرای تور
  const [runTour, setRunTour] = useState(false);

  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projRes, statsRes] = await Promise.all([
          getProjects(),
          getDashboardStats()
        ]);
        setProjects(projRes.data.results || projRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ افکت جداگانه برای بررسی وضعیت تور (وابسته به user)
  useEffect(() => {
      if (user && user.id) {
          // کلید اختصاصی برای هر کاربر (مثلاً client_tour_seen_15)
          const tourKey = `client_tour_seen_${user.id}`;
          const tourSeen = localStorage.getItem(tourKey);

          // اگر قبلاً ندیده است، تور را اجرا کن
          if (!tourSeen) {
              setRunTour(true);
          }
      }
  }, [user]); // فقط وقتی کاربر لود شد اجرا شود

  // ✅ هندلر پایان تور (وقتی دکمه پایان یا رد کردن زده شود)
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    // فقط اگر "پایان" یا "رد کردن" (دیگر نشان نده) زده شد، در حافظه ذخیره کن
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (user && user.id) {
          const tourKey = `client_tour_seen_${user.id}`;
          localStorage.setItem(tourKey, 'true');
      }
      setRunTour(false);
    }
  };

  // ✅ مراحل تور
  const tourSteps = [
    {
        target: 'body',
        content: `سلام ${user?.full_name || 'عزیز'}! 👋 به پنل مدیریت خوش اومدی. یه تور کوتاه بزنیم؟`,
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '#dashboard-stats',
        content: 'اینجا می‌تونی خلاصه وضعیت مالی و پروژه‌هات رو ببینی.',
    },
    {
        target: '#dashboard-projects',
        content: 'لیست پروژه‌های فعال شما اینجاست. برای دیدن جزییات هر پروژه روی دکمه "مشاهده پنل" کلیک کن.',
    },
    {
        target: '#nav-chat', // باید در MainLayout وجود داشته باشد
        content: 'هر وقت سوالی داشتی یا خواستی با تیم صحبت کنی، از اینجا وارد چت شو.',
    },
    {
        target: '#nav-support', // باید در MainLayout وجود داشته باشد
        content: 'برای ثبت تیکت پشتیبانی یا درخواست‌های جدید هم می‌تونی از اینجا اقدام کنی.',
    }
  ];

  if (loading) return (
      <Box sx={{ p: 3 }}>
          <Stack spacing={2}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
              <Grid container spacing={3}>
                  <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 4 }} /></Grid>
                  <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 4 }} /></Grid>
                  <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 4 }} /></Grid>
              </Grid>
          </Stack>
      </Box>
  );

  if (error) return <Typography color="error">خطا در بارگذاری اطلاعات.</Typography>;

  const activeProjectsCount = stats?.stats?.active_projects || 0;
  const totalDue = stats?.stats?.total_due || 0;

  return (
    <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto', pb: 5 }}>

      {/* ✅ کامپوننت تور */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{
            options: {
                primaryColor: theme.palette.primary.main,
                textColor: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                arrowColor: theme.palette.background.paper,
                zIndex: 10000, // روی همه چیز بیاید
            },
            tooltipContainer: {
                textAlign: 'right',
                direction: 'rtl',
                fontFamily: 'inherit'
            },
            buttonNext: {
                fontFamily: 'inherit',
                fontWeight: 'bold',
                borderRadius: 8
            },
            buttonBack: {
                fontFamily: 'inherit',
                marginRight: 10 // اصلاح فاصله برای راست‌چین
            },
            buttonSkip: {
                fontFamily: 'inherit',
                color: theme.palette.error.main
            }
        }}
        // ✅ فارسی سازی دکمه‌ها
        locale={{
            back: 'قبلی',
            close: 'بستن',
            last: 'پایان تور',
            next: 'بعدی',
            skip: 'دیگر نشان نده' // تغییر متن دکمه اسکیپ
        }}
      />

      <motion.div variants={containerVariants} initial="hidden" animate="visible">

        {/* هدر خوش‌آمدگویی */}
        <Paper
          elevation={0}
          sx={{
            p: 4, mb: 4, borderRadius: 5, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
            <Box sx={{ position: 'absolute', top: -20, left: -20, opacity: 0.1 }}>
                <HandIcon sx={{ fontSize: 200 }} />
            </Box>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                <Avatar
                    src={user?.avatar}
                    sx={{ width: 90, height: 90, border: '4px solid rgba(255,255,255,0.3)', boxShadow: theme.shadows[3] }}
                >
                    {user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box textAlign={{ xs: 'center', md: 'right' }}>
                    <Typography variant="h4" fontWeight="900" mb={1}>
                        سلام {user?.full_name || user?.username} عزیز! 👋
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 'normal' }}>
                        به پنل مدیریت پروژه‌های خود خوش آمدید.
                    </Typography>
                </Box>
                <Box flexGrow={1} />
                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<ProjectIcon />}
                    onClick={() => navigate('/projects')}
                    sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 'bold', bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                    مشاهده پروژه‌ها
                </Button>
            </Stack>
        </Paper>

        {/* کارت‌های آمار */}
        <Grid container spacing={3} mb={5} id="dashboard-stats"> {/* ✅ ID اضافه شد */}
            <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants}>
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(12px)', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, borderRadius: 3 }}>
                                <ProjectIcon />
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">پروژه‌های فعال</Typography>
                        </Stack>
                        <Typography variant="h3" fontWeight="900" color="text.primary">
                            {activeProjectsCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            پروژه در حال اجرا
                        </Typography>
                    </Paper>
                </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants}>
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(12px)', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, borderRadius: 3 }}>
                                <WalletIcon />
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">مانده بدهی</Typography>
                        </Stack>
                        <Typography variant="h3" fontWeight="900" color="text.primary" sx={{ letterSpacing: -1 }}>
                            {formatPrice(totalDue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">تومان</Typography>
                    </Paper>
                </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants}>
                    <Paper sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(12px)', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, borderRadius: 3 }}>
                                <EventIcon />
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">رویداد بعدی</Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                            جلسه بررسی سناریو
                        </Typography>
                        <Chip label="فردا ساعت ۱۰:۰۰" size="small" color="info" variant="outlined" sx={{ mt: 1, fontWeight: 'bold' }} />
                    </Paper>
                </motion.div>
            </Grid>
        </Grid>

        <Typography variant="h5" fontWeight="900" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon sx={{ color: theme.palette.secondary.main }} /> پروژه‌های شما
        </Typography>

        {/* لیست پروژه‌ها */}
        <Grid container spacing={3} id="dashboard-projects"> {/* ✅ ID اضافه شد */}
            {projects.length === 0 ? (
                <Grid item xs={12}>
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.5), border: `1px dashed ${theme.palette.divider}` }}>
                        <Typography color="text.secondary">هنوز پروژه‌ای برای شما تعریف نشده است.</Typography>
                    </Paper>
                </Grid>
            ) : (
                projects.map((project) => {
                    const progress = 65; // مثال: درصد پیشرفت
                    return (
                        <Grid item xs={12} md={6} lg={4} key={project.id}>
                            <motion.div variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                                <Paper
                                    sx={{
                                        p: 3, borderRadius: 5,
                                        bgcolor: theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.divider}`,
                                        boxShadow: theme.shadows[2],
                                        position: 'relative', overflow: 'hidden',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate(`/project/${project.id}`)}
                                >
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, bgcolor: project.is_started ? 'success.main' : 'grey.300' }} />

                                    <Stack direction="row" justifyContent="space-between" alignItems="start" mb={3}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar
                                                src={project.page_logo}
                                                variant="rounded"
                                                sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}
                                            >
                                                {project.project_name[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight="bold">{project.project_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{project.project_type === 'instagram' ? 'مدیریت اینستاگرام' : 'پروژه تکی'}</Typography>
                                            </Box>
                                        </Stack>
                                    </Stack>

                                    <Box mb={3}>
                                        <Stack direction="row" justifyContent="space-between" mb={1}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary">پیشرفت ماهانه</Typography>
                                            <Typography variant="caption" fontWeight="bold" color="primary.main">{progress}%</Typography>
                                        </Stack>
                                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
                                    </Box>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Chip
                                          label={project.is_started ? "فعال" : "متوقف"}
                                          color={project.is_started ? "success" : "error"}
                                          variant={project.is_started ? "filled" : "outlined"}
                                          sx={{
                                              borderRadius: 2,
                                              fontWeight: 'bold',
                                              border: '1px solid',
                                              borderColor: project.is_started ? 'success.main' : 'error.main',
                                              height: 28
                                          }}
                                          size="small"
                                        />
                                        <Button
                                          variant="contained"
                                          endIcon={<ChevronLeftIcon />}
                                          size="small"
                                          sx={{
                                              bgcolor: alpha(theme.palette.text.primary, 0.05),
                                              color: 'text.primary',
                                              boxShadow: 'none',
                                              borderRadius: 2,
                                              '&:hover': { bgcolor: 'primary.main', color: '#fff' }
                                          }}
                                        >
                                            مشاهده پنل
                                        </Button>
                                    </Stack>
                                </Paper>
                            </motion.div>
                        </Grid>
                    );
                })
            )}
        </Grid>
      </motion.div>
    </Box>
  );
}

export default ClientDashboard;