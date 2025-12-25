// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { getProjects, getAllCalendarEvents, getDashboardStats, getActivityLogs, getUsers, getDashboardConfig } from "../api";
import {
  Typography, Box, CircularProgress, Paper, Avatar, Button, Stack, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, useTheme, alpha, Skeleton
} from "@mui/material";
import {
  Folder as ProjectIcon, AttachMoney as MoneyIcon, TrendingUp as ProfitIcon,
  Event as EventIcon, Add as AddIcon, ArrowBack as ArrowIcon,
  Videocam as VideoIcon, PostAdd as PostIcon,
  PersonAdd as PersonAddIcon, Settings as SettingsIcon, Description as TicketIcon,
  ChevronLeft as LeftIcon, ChevronRight as RightIcon, AutoAwesome as SmartIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import moment from 'jalali-moment';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from "framer-motion";
import StickyWall from './StickyWall';
import WidgetManager from './WidgetManager';

// --- تعریف ویجت‌های قابل مدیریت ---
const ALL_WIDGETS = [
    { key: 'briefing', label: 'دستیار هوشمند', desc: 'پیام خوش‌آمدگویی و خلاصه وضعیت روزانه' },
    { key: 'stats', label: 'کارت‌های آمار', desc: 'نمایش خلاصه درآمد، پروژه‌ها و سود' },
    { key: 'calendar', label: 'تقویم کاری', desc: 'نمایش تقویم تعاملی و رویدادها' },
    { key: 'chart', label: 'نمودار مالی', desc: 'نمودار میله‌ای درآمد و هزینه' },
    { key: 'projects', label: 'پروژه‌های اخیر', desc: 'جدول آخرین پروژه‌های فعال' },
    { key: 'team', label: 'اعضای تیم', desc: 'لیست پرسنل آنلاین و فعال' },
    { key: 'logs', label: 'گزارش فعالیت‌ها', desc: 'لاگ کارهای انجام شده در سیستم' },
    { key: 'sticky', label: 'دیوار یادداشت', desc: 'یادداشت‌های چسبان شخصی' },
];

// ✅ تنظیمات انیمیشن
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } }
};

// --- استایل مشترک ویجت‌ها ---
const getWidgetStyle = (theme) => ({
    p: 3, borderRadius: 5,
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(20px)',
    boxShadow: theme.shadows[2],
    border: `1px solid ${theme.palette.divider}`,
    height: '100%',
    color: theme.palette.text.primary,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.shadows[8],
        borderColor: theme.palette.primary.main
    }
});

// --- کامپوننت کارت آمار (خارج از تابع اصلی برای جلوگیری از رندر تکراری) ---
const StatCard = ({ title, value, icon, color, subtitle, trend, loading }) => {
    const theme = useTheme();
    const style = getWidgetStyle(theme);

    return (
        <Paper sx={{ ...style, position: 'relative', overflow: 'hidden', bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
            {loading ? (
                <Stack spacing={2}>
                    <Skeleton variant="rounded" width={60} height={60} sx={{borderRadius: 3}} />
                    <Box>
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="80%" height={40} />
                    </Box>
                    <Skeleton variant="text" width="40%" />
                </Stack>
            ) : (
                <>
                    <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1, transform: 'rotate(15deg)' }}>
                        {React.cloneElement(icon, { sx: { fontSize: 100, color: color } })}
                    </Box>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Avatar sx={{ bgcolor: alpha(color, 0.15), color: color, width: 60, height: 60, borderRadius: 3, mb: 2 }}>
                            {icon}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" fontWeight="bold" mb={0.5}>{title}</Typography>
                        <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: -1, color: theme.palette.text.primary }}>{value}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                            {trend && <Chip label={trend} size="small" sx={{ bgcolor: alpha(color, 0.15), color: color, fontWeight: 'bold', height: 24, borderRadius: 2 }} />}
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">{subtitle}</Typography>
                        </Stack>
                    </Box>
                </>
            )}
        </Paper>
    );
};

// --- کامپوننت مینی تقویم ---
const MiniCalendar = ({ events, navigate }) => {
    const theme = useTheme(); // ✅ استفاده از تم
    const [currentDate, setCurrentDate] = useState(moment());
    const [selectedDate, setSelectedDate] = useState(moment());

    const handlePrev = () => setCurrentDate(currentDate.clone().subtract(1, 'jMonth'));
    const handleNext = () => setCurrentDate(currentDate.clone().add(1, 'jMonth'));

    const startOfMonth = currentDate.clone().startOf('jMonth');
    const endOfMonth = currentDate.clone().endOf('jMonth');
    const startDayOfWeek = (startOfMonth.day() + 1) % 7;

    const daysInMonth = Array.from({ length: endOfMonth.jDate() }, (_, i) => i + 1);
    const blanks = Array.from({ length: startDayOfWeek }, (_, i) => i);

    const weekDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

    const selectedEvents = events.filter(ev =>
        moment(ev.event_date).isSame(selectedDate, 'day')
    );

    const hasEvent = (day) => {
        const dateToCheck = currentDate.clone().jDate(day);
        return events.some(ev => moment(ev.event_date).isSame(dateToCheck, 'day'));
    };

    return (
        <Box display="flex" flexDirection="column" height="100%">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} px={1}>
                <Typography variant="h5" fontWeight="900" sx={{
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, #fff, #a5b4fc)'
                        : 'linear-gradient(45deg, #1e293b, #3b82f6)', // ✅ گرادینت تیره برای لایت مود
                    backgroundClip: 'text', textFillColor: 'transparent'
                }}>
                    📅 {currentDate.locale('fa').format('jMMMM jYYYY')}
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" onClick={() => setSelectedDate(moment())}
                        sx={{ borderColor: theme.palette.divider, color: 'text.primary', borderRadius: 2 }}>
                        امروز
                    </Button>
                    <IconButton size="small" onClick={handlePrev} sx={{ border: `1px solid ${theme.palette.divider}`, color: 'text.primary' }}>
                        <RightIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleNext} sx={{ border: `1px solid ${theme.palette.divider}`, color: 'text.primary' }}>
                        <LeftIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>

            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid item xs={12} md={8} lg={9}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, height: '100%' }}>
                        {weekDays.map(d => (
                            <Typography key={d} variant="caption" align="center" color="text.secondary" sx={{ pb: 1 }}>{d}</Typography>
                        ))}
                        {blanks.map((b, i) => <Box key={`blank-${i}`} />)}
                        {daysInMonth.map(day => {
                            const date = currentDate.clone().jDate(day);
                            const isSelected = date.isSame(selectedDate, 'day');
                            const isToday = date.isSame(moment(), 'day');
                            const dayHasEvent = hasEvent(day);

                            return (
                                <Box
                                    key={day}
                                    onClick={() => setSelectedDate(date)}
                                    sx={{
                                        borderRadius: 3, cursor: 'pointer', position: 'relative',
                                        bgcolor: isSelected ? 'primary.main' : isToday ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                        color: isSelected ? '#fff' : 'text.primary', // ✅ متن داینامیک
                                        border: isToday && !isSelected ? `1px solid ${theme.palette.primary.main}` : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        '&:hover': { bgcolor: isSelected ? 'primary.dark' : alpha(theme.palette.action.hover, 0.1), transform: 'scale(1.1)' }
                                    }}
                                >
                                    <Typography variant="body1" fontWeight={isSelected ? "bold" : "normal"}>{day}</Typography>
                                    {dayHasEvent && (
                                        <Box sx={{
                                            position: 'absolute', bottom: 6,
                                            width: 5, height: 5, borderRadius: '50%',
                                            bgcolor: isSelected ? '#fff' : theme.palette.success.main,
                                            boxShadow: isSelected ? 'none' : `0 0 5px ${theme.palette.success.main}`
                                        }} />
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Grid>

                <Grid item xs={12} md={4} lg={3}>
                    <Paper sx={{
                        height: '100%', bgcolor: alpha(theme.palette.background.default, 0.5),
                        borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column',
                        border: `1px solid ${theme.palette.divider}`
                    }}>
                        <Typography variant="subtitle2" color="text.secondary" mb={2}>
                            {selectedDate.locale('fa').format('dddd jD jMMMM')}:
                        </Typography>

                        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                            {selectedEvents.length === 0 ? (
                                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" opacity={0.5}>
                                    <EventIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.disabled">بدون رویداد</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1}>
                                    {selectedEvents.map((ev, idx) => (
                                        <motion.div key={ev.id} initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} transition={{delay: idx * 0.05}}>
                                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRight: `4px solid ${ev.event_type === 'filming' ? '#ed6c02' : '#3da9fc'}` }}>
                                                <Typography variant="body2" fontWeight="bold" noWrap color="text.primary">{ev.title}</Typography>
                                                <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                                                    {ev.event_type === 'filming' ? <VideoIcon sx={{fontSize:14, color:'#ed6c02'}}/> : <PostIcon sx={{fontSize:14, color:'#3da9fc'}}/>}
                                                    <Typography variant="caption" color="text.secondary" noWrap>{ev.project_name}</Typography>
                                                </Stack>
                                            </Box>
                                        </motion.div>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                        <Button variant="text" size="small" fullWidth onClick={() => navigate('/calendar')} sx={{ mt: 2, color: 'primary.main' }}>
                            مدیریت تقویم
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// --- کامپوننت دستیار هوشمند ---
const SmartBriefing = ({ user, stats, events }) => {
    const theme = useTheme(); // ✅ استفاده از تم
    const hours = new Date().getHours();
    let greeting = 'سلام';
    if (hours >= 5 && hours < 12) greeting = 'صبح بخیر';
    else if (hours >= 12 && hours < 17) greeting = 'ظهر بخیر';
    else if (hours >= 17 && hours < 21) greeting = 'عصر بخیر';
    else greeting = 'شب بخیر';

    const todayEvents = events.filter(ev => moment(ev.event_date).isSame(moment(), 'day')).length;
    const activeProjects = stats?.project_stats?.find(s => s.name === 'فعال')?.value || 0;
    const profit = stats?.financial_stats?.find(s => s.name === 'سود')?.amount || 0;

    const randomMsg = [
        `امروز ${todayEvents} رویداد در تقویم داری. پرقدرت ادامه بده! 💪`,
        `در حال حاضر ${activeProjects} پروژه فعال داری. مدیریتت عالیه! 🚀`,
        `سود خالصت تا الان ${Number(profit).toLocaleString('fa-IR')} تومانه. 💰`,
        "یادت نره تسک‌های عقب‌افتاده رو چک کنی. 😉"
    ][Math.floor(Math.random() * 4)];

    return (
        <Paper sx={{
            p: 3, borderRadius: 5, mb: 4,
            background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', // ✅ گرادینت روشن
            color: theme.palette.mode === 'dark' ? 'white' : 'text.primary', // ✅ متن داینامیک
            position: 'relative', overflow: 'hidden',
            boxShadow: theme.shadows[4],
            border: `1px solid ${theme.palette.divider}`
        }}>
            <Box sx={{ position: 'absolute', right: -20, top: -30, opacity: 0.15, transform: 'rotate(10deg)' }}>
                <SmartIcon sx={{ fontSize: 200, color: 'inherit' }} />
            </Box>

            <Stack direction="row" alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                <Avatar src={user?.avatar} sx={{ width: 72, height: 72, border: '3px solid rgba(255,255,255,0.3)', bgcolor: 'primary.main', boxShadow: theme.shadows[2] }}>
                    {user?.full_name?.[0] || <SmartIcon />}
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="900" mb={0.5}>
                        {greeting}، {user?.full_name || 'مدیر عزیز'}! 👋
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.85, lineHeight: 1.6, fontSize: '1.05rem' }}>
                        {todayEvents > 0 ? `امروز ${todayEvents} برنامه داری. ` : "امروز برنامه‌ای نداری. "}
                        {randomMsg}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
};

function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme(); // ✅ استفاده از تم
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

  // ✅ استیت خطا
  const [error, setError] = useState(null);

  // داده‌ها
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [chartMode, setChartMode] = useState('bar');
  const [chartTimeframe, setChartTimeframe] = useState('month');
  // ✅ مقداردهی اولیه با تمام ویجت‌ها تا اسکلتون‌ها دیده شوند
  const [activeWidgets, setActiveWidgets] = useState(ALL_WIDGETS.map(w => w.key));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const configRes = await getDashboardConfig();
        if (configRes.data && configRes.data.active_widgets && configRes.data.active_widgets.length > 0) {
            setActiveWidgets(configRes.data.active_widgets);
        }

        const [projRes, eventRes, statsRes, logRes, usersRes] = await Promise.all([
            getProjects(),
            getAllCalendarEvents(),
            getDashboardStats(),
            getActivityLogs(),
            getUsers()
        ]);

        setStats(statsRes.data);
        setRecentProjects(projRes.data.slice(0, 5));
        setAllEvents(eventRes.data);
        setRecentLogs(logRes.data.slice(0, 5));
        const personnel = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results;
        setTeamMembers(personnel.filter(u => u.role !== 'client').slice(0, 7));

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err); // ✅ ثبت خطا
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ پرتاب خطا برای ErrorBoundary
  if (error) {
      throw error;
  }

  // ✅ استایل ویجت‌ها با توجه به تم (داینامیک)
  const widgetStyle = getWidgetStyle(theme);

  const formatPrice = (p) => Number(p).toLocaleString('fa-IR');

  const income = stats?.financial_stats?.find(s => s.name === 'درآمد')?.amount || 0;
  const expense = stats?.financial_stats?.find(s => s.name === 'هزینه')?.amount || 0;
  const profit = stats?.financial_stats?.find(s => s.name === 'سود')?.amount || 0;
  const chartData = [
      { name: 'درآمد', value: income, fill: '#00e676' },
      { name: 'هزینه', value: expense, fill: '#f44336' },
      { name: 'سود', value: profit, fill: '#ff9100' },
  ];

  const show = (key) => activeWidgets.includes(key);

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', pb: 5 }}>
      <Box sx={{ width: '100%', maxWidth: '1600px' }}>

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
                <Typography variant="h4" fontWeight="900" sx={{
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, #fff, #94a3b8)'
                        : 'linear-gradient(45deg, #1e293b, #64748b)', // ✅ گرادینت تیره
                    backgroundClip: 'text', textFillColor: 'transparent'
                }}>داشبورد مدیریت</Typography>
                <Typography variant="caption" color="text.secondary">خوش آمدید، {user?.full_name}</Typography>
            </Box>
            <WidgetManager
                availableWidgets={ALL_WIDGETS}
                activeWidgets={activeWidgets}
                onUpdate={setActiveWidgets}
            />
        </Stack>

        {/* ✅ انیمیشن برای کل کانتینر */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {show('briefing') && (
                <motion.div variants={itemVariants}>
                    <SmartBriefing user={user} stats={stats} events={allEvents} />
                </motion.div>
            )}

            <Grid container spacing={3} mb={4}>
                {[
                    { title: 'پروژه جدید', icon: <AddIcon />, color: theme.palette.primary.main, onClick: () => navigate('/project/new') },
                    { title: 'مشتری جدید', icon: <PersonAddIcon />, color: theme.palette.info.main, onClick: () => navigate('/users') },
                    { title: 'ثبت فاکتور', icon: <TicketIcon />, color: theme.palette.secondary.main, onClick: () => navigate('/financials') },
                    { title: 'تنظیمات', icon: <SettingsIcon />, color: theme.palette.text.secondary, onClick: () => navigate('/settings') }
                ].map((btn, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button fullWidth variant="contained" size="large" startIcon={btn.icon} onClick={btn.onClick}
                                sx={{ py: 2, borderRadius: 4, bgcolor: btn.color, color: '#fff', fontSize: '1rem', fontWeight: 'bold', boxShadow: theme.shadows[4], '&:hover': { bgcolor: alpha(btn.color, 0.8) } }}>
                                {btn.title}
                            </Button>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {show('stats') && (
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} lg={3}>
                        <motion.div variants={itemVariants} style={{height:'100%'}}>
                            <StatCard loading={loading} title="پروژه‌های فعال" value={stats?.project_stats?.find(s => s.name === 'فعال')?.value || 0} icon={<ProjectIcon />} color="#3da9fc" subtitle="در حال اجرا" trend="+12%" />
                        </motion.div>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <motion.div variants={itemVariants} style={{height:'100%'}}>
                            <StatCard loading={loading} title="درآمد کل" value={formatPrice(income)} icon={<MoneyIcon />} color="#00e676" subtitle="تومان" trend="+5%" />
                        </motion.div>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <motion.div variants={itemVariants} style={{height:'100%'}}>
                            <StatCard loading={loading} title="سود خالص" value={formatPrice(profit)} icon={<ProfitIcon />} color="#ff9100" subtitle="تومان" />
                        </motion.div>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <motion.div variants={itemVariants} style={{height:'100%'}}>
                            <StatCard loading={loading} title="تسک‌های تقویم" value={allEvents.length} icon={<EventIcon />} color="#ff4081" subtitle="رویداد ثبت شده" />
                        </motion.div>
                    </Grid>
                </Grid>
            )}

            {(show('calendar') || show('chart')) && (
                <Grid container spacing={3} mb={4}>
                    {show('calendar') && (
                        <Grid item xs={12} lg={show('chart') ? 8 : 12}>
                            <motion.div variants={itemVariants} style={{height:'100%'}}>
                                {loading ? (
                                    <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 5, bgcolor: alpha(theme.palette.background.paper, 0.6) }} />
                                ) : (
                                    <Paper sx={{ ...widgetStyle, minHeight: 450, display: 'flex', flexDirection: 'column' }}>
                                        <MiniCalendar events={allEvents} navigate={navigate} />
                                    </Paper>
                                )}
                            </motion.div>
                        </Grid>
                    )}

                    {show('chart') && (
                        <Grid item xs={12} lg={show('calendar') ? 4 : 12}>
                             <motion.div variants={itemVariants} style={{height:'100%'}}>
                                {loading ? (
                                    <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 5, bgcolor: alpha(theme.palette.background.paper, 0.6) }} />
                                ) : (
                                    <Paper sx={{ ...widgetStyle, minHeight: 450, display: 'flex', flexDirection: 'column' }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6" fontWeight="bold" color="text.primary">📊 تحلیل مالی</Typography>
                                            <Box bgcolor={alpha(theme.palette.text.primary, 0.05)} borderRadius={2} p={0.5}>
                                                {['week', 'month'].map(mode => (
                                                    <Button key={mode} size="small" onClick={() => setChartTimeframe(mode)}
                                                        sx={{ minWidth: 40, color: chartTimeframe === mode ? '#fff' : 'text.secondary', bgcolor: chartTimeframe === mode ? 'success.main' : 'transparent', borderRadius: 1.5, fontSize: '0.7rem' }}>
                                                        {mode === 'week' ? 'هفتگی' : 'ماهانه'}
                                                    </Button>
                                                ))}
                                            </Box>
                                        </Stack>
                                        <Box flexGrow={1}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartTimeframe === 'week' ? chartData : chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{fontSize: 10}} />
                                                    <YAxis hide />
                                                    <ChartTooltip cursor={{fill: alpha(theme.palette.text.primary, 0.05)}} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: theme.shadows[4], backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }} />
                                                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40} animationDuration={1500} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </Paper>
                                )}
                            </motion.div>
                        </Grid>
                    )}
                </Grid>
            )}

            <Grid container spacing={3}>
                {show('projects') && (
                    <Grid item xs={12} lg={6}>
                        <motion.div variants={itemVariants} style={{height:'100%'}}>
                            <Paper sx={{ ...widgetStyle, p: 0, overflow: 'hidden', minHeight: 400 }}>
                                <Box p={3} display="flex" justifyContent="space-between" alignItems="center" borderBottom={`1px solid ${theme.palette.divider}`}>
                                    <Typography variant="h6" fontWeight="bold" color="text.primary">📌 پروژه‌های اخیر</Typography>
                                    <Button size="small" onClick={() => navigate('/projects')}>مشاهده همه</Button>
                                </Box>
                                <TableContainer sx={{ maxHeight: 350 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ '& th': { bgcolor: alpha(theme.palette.action.hover, 0.05), color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` } }}>
                                                <TableCell>پروژه</TableCell>
                                                <TableCell>مشتری</TableCell>
                                                <TableCell>وضعیت</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Stack direction="row" spacing={2}><Skeleton variant="rounded" width={32} height={32} /><Skeleton width={100} /></Stack></TableCell>
                                                        <TableCell><Skeleton width={80} /></TableCell>
                                                        <TableCell><Skeleton width={60} /></TableCell>
                                                        <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                recentProjects.map((project) => (
                                                    <TableRow key={project.id} hover sx={{ '& td': { color: 'text.primary', borderBottom: `1px solid ${theme.palette.divider}` } }}>
                                                        <TableCell>
                                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                                <Avatar src={project.page_logo} variant="rounded" sx={{ width: 32, height: 32 }}>{project.project_name[0]}</Avatar>
                                                                <Typography variant="body2" fontWeight="bold">{project.project_name}</Typography>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>{project.page_username || '---'}</TableCell>
                                                        <TableCell>
                                                            <Chip label={project.is_started ? 'فعال' : 'خاموش'} size="small" color={project.is_started ? 'success' : 'default'} variant="filled" sx={{height:20, fontSize:'0.6rem'}} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton size="small" onClick={() => navigate(`/project/${project.id}`)}><ArrowIcon sx={{transform: 'rotate(360deg)', fontSize:16, color: 'text.secondary'}}/></IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </motion.div>
                    </Grid>
                )}

                {show('team') && (
                    <Grid item xs={12} md={6} lg={3}>
                        <motion.div variants={itemVariants} style={{height:'100%'}}>
                            <Paper sx={widgetStyle}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6" fontWeight="bold" color="text.primary">اعضای تیم</Typography>
                                    <IconButton size="small" onClick={() => navigate('/personnel')}><ArrowIcon sx={{transform:'rotate(360deg)', color: 'text.secondary'}}/></IconButton>
                                </Stack>
                                <Stack spacing={2}>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <Stack key={i} direction="row" spacing={2} sx={{ p: 1 }}>
                                                <Skeleton variant="circular" width={36} height={36} />
                                                <Box>
                                                    <Skeleton width={100} />
                                                    <Skeleton width={60} height={10} />
                                                </Box>
                                            </Stack>
                                        ))
                                    ) : (
                                        teamMembers.map((member) => (
                                            <Stack key={member.id} direction="row" alignItems="center" spacing={2} sx={{ p: 1, borderRadius: 2, '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) }, cursor: 'pointer' }} onClick={() => navigate('/personnel')}>
                                                <Avatar src={member.avatar} sx={{ width: 36, height: 36 }}>{member.username[0]}</Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold" color="text.primary">{member.full_name || member.username}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{member.role}</Typography>
                                                </Box>
                                            </Stack>
                                        ))
                                    )}
                                </Stack>
                            </Paper>
                        </motion.div>
                    </Grid>
                )}

                {show('logs') && (
                    <Grid item xs={12} md={6} lg={3}>
                        <motion.div variants={itemVariants} style={{height:'100%'}}>
                            <Paper sx={widgetStyle}>
                                <Typography variant="h6" fontWeight="bold" mb={3} color="text.primary">فعالیت‌ها</Typography>
                                <Stack spacing={0}>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <Box key={i} sx={{ pl: 3, pb: 2 }}>
                                                <Skeleton width={50} height={10} />
                                                <Skeleton width={200} />
                                            </Box>
                                        ))
                                    ) : (
                                        recentLogs.map((log, index) => (
                                            <Box key={log.id} sx={{ position: 'relative', pl: 3, pb: 2, borderLeft: index !== recentLogs.length - 1 ? `2px solid ${theme.palette.divider}` : 'none' }}>
                                                <Box sx={{ position: 'absolute', left: -5, top: 0, width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {moment(log.created_at).fromNow()}
                                                </Typography>
                                                <Typography variant="body2" fontSize="0.8rem" color="text.primary">
                                                    {log.user_name} {log.action_type} کرد: {log.model_name}
                                                </Typography>
                                            </Box>
                                        ))
                                    )}
                                </Stack>
                            </Paper>
                        </motion.div>
                    </Grid>
                )}
            </Grid>

            {show('sticky') && (
                <motion.div variants={itemVariants}>
                    <Box mt={5}>
                        <StickyWall />
                    </Box>
                </motion.div>
            )}

        </motion.div>

      </Box>
    </Box>
  );
}

export default AdminDashboard;