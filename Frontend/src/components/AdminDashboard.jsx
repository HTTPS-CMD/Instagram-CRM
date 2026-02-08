// src/components/AdminDashboard.jsx
import React, {useContext, useEffect, useState} from "react";
import {
    getActivityLogs,
    getAllCalendarEvents,
    getDashboardConfig,
    getDashboardStats,
    getProjects,
    getUsers,
} from "../api";
import {
    alpha,
    Avatar,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";

// آیکون‌های استاندارد
import {
    AccountBalanceWallet as MoneyIcon,
    Add as AddIcon,
    ArrowForward as ArrowForwardIcon,
    CalendarMonth as EventIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Dashboard as DashboardIcon,
    Folder as ProjectIcon,
    GroupAdd as PersonAddIcon,
    MoreHoriz as MoreIcon,
    Receipt as TicketIcon,
    Settings as SettingsIcon,
    ShowChart as ProfitIcon,
} from "@mui/icons-material";

import CountUp from 'react-countup';
import {useNavigate} from "react-router-dom";
import {UserContext} from "../App.jsx";
import moment from "jalali-moment";
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis,} from "recharts";
import {motion} from "framer-motion";
import StickyWall from "./StickyWall";
import WidgetManager from "./WidgetManager";

// ✅ ایمپورت لوگو از پوشه assets
import logoImage from "../assets/LOGO.PNG";

// --- تنظیمات ویجت‌ها ---
const ALL_WIDGETS = [{key: "briefing", label: "خوش‌آمدگویی", desc: "پنل اصلی وضعیت"}, {
    key: "stats",
    label: "آمار کلیدی",
    desc: "کارت‌های اطلاعاتی کوچک"
}, {key: "chart", label: "نمودار مالی", desc: "تحلیل درآمد"}, {
    key: "calendar",
    label: "تقویم",
    desc: "لیست رویدادها"
}, {key: "projects", label: "پروژه‌ها", desc: "جدول پروژه‌های فعال"}, {
    key: "team",
    label: "تیم",
    desc: "همکاران من"
}, {key: "logs", label: "فعالیت‌ها", desc: "لاگ سیستم"}, {key: "sticky", label: "یادداشت", desc: "استیکی نوت"},];

const containerVariants = {
    hidden: {opacity: 0}, visible: {opacity: 1, transition: {staggerChildren: 0.08}},
};

const itemVariants = {
    hidden: {y: 20, opacity: 0, scale: 0.95}, visible: {
        y: 0, opacity: 1, scale: 1, transition: {type: "spring", stiffness: 80, damping: 15},
    },
};

// --- استایل‌های سینمایی / هولوگرافیک ---

// 1. پس‌زمینه فضایی (Nebula)
const NebulaBackground = ({theme}) => (<Box
    sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: "hidden",
        bgcolor: theme.palette.mode === "dark" ? "#09090b" : "#f0f4f8",
        backgroundImage: theme.palette.mode === "dark" ? "radial-gradient(circle at 50% 0%, #1e1b4b 0%, #000000 100%)" : "radial-gradient(circle at 50% 0%, #e0e7ff 0%, #ffffff 100%)",
    }}
>
    <Box
        sx={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "60vw",
            height: "60vw",
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
            filter: "blur(80px)",
            animation: "pulse 10s infinite alternate",
            willChange: "transform",
        }}
    />
    <Box
        sx={{
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "50vw",
            height: "50vw",
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 70%)`,
            filter: "blur(100px)",
            animation: "pulse 15s infinite alternate-reverse",
            willChange: "transform",
        }}
    />
    <style>{`@keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.1); opacity: 0.8; } }`}</style>
</Box>);

// ✅ کامپوننت لودینگ فوق‌العاده نرم (مثل اسپلش اسکرین دیجی‌کالا)
const LogoLoading = () => {
    const theme = useTheme();
    return (<Box
        sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.background.default, // هماهنگ با تم
            zIndex: 9999,
        }}
    >
        <motion.div
            initial={{opacity: 0, scale: 0.8}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: 0.8, ease: "easeOut"}}
        >
            <motion.img
                src={logoImage}
                alt="Loading..."
                style={{
                    width: "140px",
                    height: "auto",
                    filter: theme.palette.mode === "dark" ? "drop-shadow(0 0 30px rgba(255,255,255,0.2))" : "drop-shadow(0 10px 20px rgba(0,0,0,0.1))",
                }}
                animate={{scale: [1, 1.08, 1]}}
                transition={{
                    repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.8,
                }}
            />
        </motion.div>
    </Box>);
};

// 2. استایل کارت‌های هولوگرافیک
const getCinematicStyle = (theme, color) => ({
    p: 3,
    borderRadius: "24px",
    bgcolor: theme.palette.mode === "dark" ? alpha("#18181b", 0.6) : alpha("#ffffff", 0.8),
    backdropFilter: "blur(16px) saturate(140%)",
    border: `1px solid ${alpha(color || theme.palette.common.white, theme.palette.mode === "dark" ? 0.1 : 0.6)}`,
    boxShadow: theme.palette.mode === "dark" ? `0 20px 40px -10px #000000, inset 0 1px 0 rgba(255,255,255,0.1)` : `0 20px 40px -15px rgba(0,0,0,0.1), inset 0 1px 0 #fff`,
    height: "100%",
    color: theme.palette.text.primary,
    position: "relative",
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    fontFamily: "Peyda, sans-serif",
    "&:hover": {
        transform: "translateY(-6px) scale(1.02)",
        boxShadow: theme.palette.mode === "dark" ? `0 30px 60px -15px ${alpha(color || theme.palette.primary.main, 0.2)}` : `0 30px 60px -20px ${alpha(color || theme.palette.primary.main, 0.3)}`,
        borderColor: alpha(color || theme.palette.primary.main, 0.5),
    },
});

// --- هدر خوش‌آمدگویی ---
const HeroSection = ({user, stats, events}) => {
    const theme = useTheme();
    const hours = new Date().getHours();
    let greeting = hours >= 5 && hours < 12 ? "صبح بخیر" : hours >= 12 && hours < 17 ? "ظهر بخیر" : hours >= 17 && hours < 21 ? "عصر بخیر" : "شب بخیر";
    const todayEvents = events.filter((ev) => moment(ev.event_date).isSame(moment(), "day")).length;
    const activeProjects = stats?.project_stats?.find((s) => s.name === "فعال")?.value || 0;

    return (<Paper
        sx={{
            ...getCinematicStyle(theme, theme.palette.primary.main),
            p: 0,
            overflow: "hidden",
            mb: 4,
            background: theme.palette.mode === "dark" ? `linear-gradient(120deg, #1e1b4b, #312e81)` : `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            border: "none",
            boxShadow: `0 30px 80px -20px ${alpha(theme.palette.primary.main, 0.5)}`,
        }}
    >
        <Box
            sx={{
                p: {xs: 3, md: 5},
                position: "relative",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 3,
            }}
        >
            <Stack direction="row" alignItems="center" spacing={3}>
                <Avatar
                    src={user?.avatar}
                    sx={{
                        width: 88,
                        height: 88,
                        border: "4px solid rgba(255,255,255,0.3)",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                    }}
                >
                    {user?.full_name?.[0]}
                </Avatar>
                <Box>
                    <Typography
                        variant="h3"
                        fontWeight="900"
                        sx={{
                            fontFamily: "Peyda", mb: 0.5, color: "#fff", letterSpacing: -1,
                        }}
                    >
                        {greeting}، {user?.full_name}!
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            fontFamily: "Peyda", opacity: 0.9, color: "rgba(255,255,255,0.8)", fontSize: "1.1rem",
                        }}
                    >
                        سیستم آنلاین است. امروز{" "}
                        <span style={{fontWeight: "900", color: "#fff"}}>
                {todayEvents}
              </span>{" "}
                        رویداد مهم دارید.
                    </Typography>
                </Box>
            </Stack>

            {/* استاتوس‌های واقعی */}
            <Stack direction="row" spacing={2}>
                <Box
                    sx={{
                        bgcolor: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                        p: 2,
                        borderRadius: "20px",
                        minWidth: 120,
                        textAlign: "center",
                        border: "1px solid rgba(255,255,255,0.2)",
                    }}
                >
                    <Typography
                        variant="h4"
                        fontWeight="900"
                        sx={{fontFamily: "Peyda", color: "#fff"}}
                    >
                        {activeProjects}
                    </Typography>
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{fontFamily: "Peyda", color: "rgba(255,255,255,0.7)"}}
                    >
                        پروژه فعال
                    </Typography>
                </Box>
            </Stack>
        </Box>

        <Box
            sx={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 300,
                height: 300,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
                filter: "blur(60px)",
            }}
        />
    </Paper>);
};

// --- کارت آمار ---
const StatCard = ({title, value, icon, color, trend, loading}) => {
    const theme = useTheme();
    const style = getCinematicStyle(theme, color);

    return (<Paper sx={style}>
        {loading ? (<Stack spacing={2}>
            <Skeleton
                variant="rounded"
                width={50}
                height={50}
                sx={{borderRadius: 3}}
            />
            <Skeleton width="60%"/>
            <Skeleton width="80%" height={40}/>
        </Stack>) : (<Stack justifyContent="space-between" height="100%">
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
            >
                <Box
                    sx={{
                        width: 54,
                        height: 54,
                        borderRadius: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `linear-gradient(135deg, ${alpha(color, 0.2)}, ${alpha(color, 0.05)})`,
                        color: color,
                        border: `1px solid ${alpha(color, 0.2)}`,
                        boxShadow: `0 0 20px ${alpha(color, 0.15)}`,
                    }}
                >
                    {React.cloneElement(icon, {sx: {fontSize: 26}})}
                </Box>
                {trend && (<Chip
                    label={trend}
                    size="small"
                    sx={{
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        fontWeight: "900",
                        borderRadius: "8px",
                        height: 26,
                        fontFamily: "Peyda",
                        border: `1px solid ${alpha(color, 0.2)}`,
                    }}
                />)}
            </Stack>
            <Box mt={3}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight="bold"
                    sx={{fontFamily: "Peyda", mb: 0.5, opacity: 0.8}}
                >
                    {title}
                </Typography>
                <Typography
                    variant="h3"
                    fontWeight="900"
                    sx={{
                        fontFamily: "Peyda",
                        letterSpacing: -1,
                        background: theme.palette.mode === "dark" ? `linear-gradient(to right, #fff, ${alpha("#fff", 0.6)})` : theme.palette.text.primary,
                        backgroundClip: "text",
                        textFillColor: theme.palette.mode === "dark" ? "transparent" : "inherit",
                    }}
                >
                    {typeof value === 'number' || !isNaN(Number(value.toString().replace(/,/g, ''))) ? (
                        <CountUp end={Number(value.toString().replace(/,/g, ''))} duration={8} separator=","/>
                    ) : value}
                </Typography>
            </Box>
        </Stack>)}
    </Paper>);
};

// --- جدول پروژه‌ها ---
const ProjectsTable = ({projects, navigate, loading}) => {
    const theme = useTheme();
    const style = getCinematicStyle(theme, theme.palette.info.main);
    return (<Paper sx={{...style, p: 0, minHeight: 400}}>
        <Box
            p={4}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`1px solid ${alpha(theme.palette.divider, 0.1)}`}
        >
            <Box>
                <Typography variant="h6" fontWeight="900" sx={{fontFamily: "Peyda"}}>
                    پروژه‌های اخیر
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{fontFamily: "Peyda"}}
                >
                    وضعیت لحظه‌ای
                </Typography>
            </Box>
            <IconButton
                onClick={() => navigate("/projects")}
                sx={{bgcolor: alpha(theme.palette.text.primary, 0.05)}}
            >
                <ArrowForwardIcon/>
            </IconButton>
        </Box>
        <TableContainer sx={{px: 2}}>
            <Table>
                <TableHead>
                    <TableRow
                        sx={{
                            "& th": {
                                borderBottom: `1px dashed ${theme.palette.divider}`,
                                color: "text.secondary",
                                fontFamily: "Peyda",
                                fontWeight: "bold",
                            },
                        }}
                    >
                        <TableCell>پروژه</TableCell>
                        <TableCell>مشتری</TableCell>
                        <TableCell>وضعیت</TableCell>
                        <TableCell align="left"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? [...Array(4)].map((_, i) => (<TableRow key={i}>
                        <TableCell colSpan={4}>
                            <Skeleton height={50}/>
                        </TableCell>
                    </TableRow>)) : projects.map((project) => (<TableRow
                        key={project.id}
                        hover
                        sx={{
                            "& td": {
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`, py: 2.5,
                            },
                        }}
                    >
                        <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    src={project.page_logo}
                                    variant="rounded"
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: "14px",
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                    }}
                                >
                                    {project.project_name[0]}
                                </Avatar>
                                <Typography
                                    variant="body1"
                                    fontWeight="bold"
                                    sx={{fontFamily: "Peyda"}}
                                >
                                    {project.project_name}
                                </Typography>
                            </Stack>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2" sx={{fontFamily: "Peyda"}}>
                                {project.page_username || "---"}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Chip
                                label={project.is_started ? "فعال" : "خاموش"}
                                size="small"
                                sx={{
                                    bgcolor: project.is_started ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
                                    color: project.is_started ? "success.main" : "text.secondary",
                                    fontWeight: "bold",
                                    borderRadius: "8px",
                                    fontFamily: "Peyda",
                                }}
                            />
                        </TableCell>
                        <TableCell align="left">
                            <IconButton
                                size="small"
                                onClick={() => navigate(`/project/${project.id}`)}
                            >
                                <ArrowForwardIcon sx={{fontSize: 16}}/>
                            </IconButton>
                        </TableCell>
                    </TableRow>))}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>);
};

// --- تقویم کوچک ---
const CalendarWidget = ({events, navigate}) => {
    const theme = useTheme();
    const style = getCinematicStyle(theme, theme.palette.warning.main);

    const [currentDate, setCurrentDate] = useState(moment());
    const [selectedDate, setSelectedDate] = useState(moment());

    const handlePrev = () => setCurrentDate(currentDate.clone().subtract(1, "jMonth"));
    const handleNext = () => setCurrentDate(currentDate.clone().add(1, "jMonth"));

    const startOfMonth = currentDate.clone().startOf("jMonth");
    const endOfMonth = currentDate.clone().endOf("jMonth");
    const startDayOfWeek = (startOfMonth.day() + 1) % 7;
    const daysInMonth = Array.from({length: endOfMonth.jDate()}, (_, i) => i + 1);
    const blanks = Array.from({length: startDayOfWeek}, (_, i) => i);
    const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

    const selectedEvents = events.filter((ev) => moment(ev.event_date).isSame(selectedDate, "day"));
    const hasEvent = (day) => events.some((ev) => moment(ev.event_date).isSame(currentDate.clone().jDate(day), "day"));

    return (<Paper sx={{...style, p: 3, display: "flex", flexDirection: "column"}}>
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
        >
            <Typography variant="h6" fontWeight="900" sx={{fontFamily: "Peyda"}}>
                {currentDate.locale("fa").format("jMMMM jYYYY")}
            </Typography>
            <Stack direction="row" spacing={1}>
                <IconButton
                    size="small"
                    onClick={handlePrev}
                    sx={{
                        border: `1px solid ${theme.palette.divider}`, borderRadius: 2,
                    }}
                >
                    <ChevronLeftIcon fontSize="small"/>
                </IconButton>
                <IconButton
                    size="small"
                    onClick={handleNext}
                    sx={{
                        border: `1px solid ${theme.palette.divider}`, borderRadius: 2,
                    }}
                >
                    <ChevronRightIcon fontSize="small"/>
                </IconButton>
            </Stack>
        </Stack>

        <Box
            sx={{
                display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, mb: 3,
            }}
        >
            {weekDays.map((d) => (<Typography
                key={d}
                variant="caption"
                align="center"
                color="text.secondary"
                fontWeight="bold"
                sx={{fontFamily: "Peyda"}}
            >
                {d}
            </Typography>))}
            {blanks.map((b, i) => (<Box key={`blank-${i}`}/>))}
            {daysInMonth.map((day) => {
                const date = currentDate.clone().jDate(day);
                const isSelected = date.isSame(selectedDate, "day");
                const isToday = date.isSame(moment(), "day");
                return (<Box
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    sx={{
                        height: 32,
                        borderRadius: "8px",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isSelected ? "primary.main" : "transparent",
                        color: isSelected ? "#fff" : isToday ? "primary.main" : "text.primary",
                        fontWeight: isSelected || isToday ? "bold" : "500",
                        fontFamily: "Peyda",
                        border: isToday && !isSelected ? `1px solid ${theme.palette.primary.main}` : "none",
                        "&:hover": {
                            bgcolor: !isSelected && alpha(theme.palette.primary.main, 0.1),
                        },
                    }}
                >
                    {day}
                    {hasEvent(day) && !isSelected && (<Box
                        sx={{
                            position: "absolute",
                            bottom: 4,
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            bgcolor: "secondary.main",
                        }}
                    />)}
                </Box>);
            })}
        </Box>

        <Box
            flexGrow={1}
            sx={{overflowY: "auto", pr: 1, maxHeight: 150}}
            className="custom-scrollbar"
        >
            {selectedEvents.length === 0 ? (<Typography
                variant="caption"
                color="text.secondary"
                align="center"
                display="block"
                sx={{mt: 2, fontFamily: "Peyda"}}
            >
                رویدادی برای {selectedDate.locale("fa").format("jD jMMMM")} ثبت نشده
            </Typography>) : (<Stack spacing={1.5}>
                {selectedEvents.map((ev, i) => (<Box
                    key={i}
                    sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        borderLeft: `3px solid ${ev.event_type === "filming" ? "#fb923c" : "#38bdf8"}`,
                    }}
                >
                    <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{fontFamily: "Peyda"}}
                    >
                        {ev.title}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        fontFamily="Peyda"
                    >
                        {ev.project_name}
                    </Typography>
                </Box>))}
            </Stack>)}
        </Box>
        <Button
            fullWidth
            variant="outlined"
            sx={{
                mt: 2, borderRadius: "12px", borderStyle: "dashed", fontFamily: "Peyda", fontWeight: "bold",
            }}
            onClick={() => navigate("/calendar")}
        >
            تقویم کامل
        </Button>
    </Paper>);
};

function AdminDashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
    const {user} = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState(null);
    const [recentProjects, setRecentProjects] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [chartTimeframe, setChartTimeframe] = useState("month");
    const [activeWidgets, setActiveWidgets] = useState(ALL_WIDGETS.map((w) => w.key));

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const configRes = await getDashboardConfig();
                if (configRes.data && configRes.data.active_widgets?.length > 0) setActiveWidgets(configRes.data.active_widgets);

                const [projRes, eventRes, statsRes, logRes, usersRes] = await Promise.all([getProjects(), getAllCalendarEvents(), getDashboardStats(), getActivityLogs(), getUsers(),]);

                setStats(statsRes.data);
                setRecentProjects(projRes.data.slice(0, 5));
                setAllEvents(eventRes.data);
                setRecentLogs(logRes.data.slice(0, 5));
                const personnel = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results;
                setTeamMembers(personnel.filter((u) => u.role !== "client").slice(0, 7));
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (error) throw error;

    // ✅ نمایش لوگو لودینگ
    if (loading) return <LogoLoading/>;

    const income = stats?.financial_stats?.find((s) => s.name === "درآمد")?.amount || 0;
    const expense = stats?.financial_stats?.find((s) => s.name === "هزینه")?.amount || 0;
    const profit = stats?.financial_stats?.find((s) => s.name === "سود")?.amount || 0;

    // دیتای چارت
    const chartData = [{name: "درآمد", value: income, fill: theme.palette.success.main}, {
        name: "هزینه",
        value: expense,
        fill: theme.palette.error.main
    }, {name: "سود", value: profit, fill: theme.palette.warning.main},];

    const show = (key) => activeWidgets.includes(key);
    const formatPrice = (p) => Number(p).toLocaleString("fa-IR");

    return (<Box
        sx={{
            width: "100%", pb: 8, fontFamily: "Peyda, sans-serif", minHeight: "100vh", position: "relative",
        }}
    >
        {/* ✅ پس‌زمینه زنده و بدون لگ */}
        <NebulaBackground theme={theme}/>

        <Box sx={{maxWidth: "1700px", mx: "auto", px: {xs: 2, md: 5}, pt: 4}}>
            {/* هدر: حذف آیکون‌های اضافی */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={5}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            p: 1,
                            borderRadius: "14px",
                            color: "#fff",
                            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                        }}
                    >
                        <DashboardIcon/>
                    </Box>
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight="900"
                            sx={{
                                fontFamily: "Peyda", letterSpacing: -1, color: "text.primary",
                            }}
                        >
                            داشبورد مدیریت
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{fontFamily: "Peyda"}}
                        >
                            پنل مدیریت آژانس
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    <WidgetManager
                        availableWidgets={ALL_WIDGETS}
                        activeWidgets={activeWidgets}
                        onUpdate={setActiveWidgets}
                    />
                </Stack>
            </Stack>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {show("briefing") && (<motion.div variants={itemVariants}>
                    <HeroSection user={user} stats={stats} events={allEvents}/>
                </motion.div>)}

                {/* ✅ دکمه‌های دسترسی سریع (GRID بزرگ و عریض) */}
                <Stack direction={{xs: "column", sm: "row"}} spacing={2} mb={5}>
                    {[{
                        label: "پروژه جدید",
                        icon: <AddIcon/>,
                        color: theme.palette.primary.main,
                        action: () => navigate("/project/new"),
                    }, {
                        label: "مشتری جدید",
                        icon: <PersonAddIcon/>,
                        color: theme.palette.secondary.main,
                        action: () => navigate("/users"),
                    }, {
                        label: "ثبت فاکتور",
                        icon: <TicketIcon/>,
                        color: theme.palette.success.main,
                        action: () => navigate("/financials"),
                    }, {
                        label: "تنظیمات",
                        icon: <SettingsIcon/>,
                        color: theme.palette.info.main,
                        action: () => navigate("/settings"),
                    },].map((act, i) => (<motion.div variants={itemVariants} key={i} style={{flex: 1}}>
                        <Button
                            fullWidth
                            onClick={act.action}
                            startIcon={act.icon}
                            sx={{
                                py: 2,
                                borderRadius: "20px",
                                bgcolor: alpha(theme.palette.background.paper, 0.6),
                                color: "text.primary",
                                border: `1px solid ${theme.palette.divider}`,
                                fontFamily: "Peyda",
                                fontWeight: "bold",
                                fontSize: "1rem",
                                backdropFilter: "blur(5px)",
                                transition: "0.2s",
                                "&:hover": {
                                    bgcolor: act.color,
                                    color: "#fff",
                                    borderColor: act.color,
                                    transform: "translateY(-3px)",
                                    boxShadow: `0 10px 25px ${alpha(act.color, 0.4)}`,
                                },
                            }}
                        >
                            {act.label}
                        </Button>
                    </motion.div>))}
                </Stack>

                {show("stats") && (<Stack direction={{xs: "column", md: "row"}} spacing={2} mb={5}>
                    {[{
                        title: "پروژه‌های فعال",
                        value: stats?.project_stats?.find((s) => s.name === "فعال")?.value || 0,
                        icon: <ProjectIcon/>,
                        color: "#3da9fc",
                        subtitle: "در حال اجرا",
                        trend: "+12%",
                    }, {
                        title: "درآمد کل",
                        value: formatPrice(income),
                        icon: <MoneyIcon/>,
                        color: "#00e676",
                        subtitle: "تومان",
                        trend: "+5%",
                    }, {
                        title: "سود خالص",
                        value: formatPrice(profit),
                        icon: <ProfitIcon/>,
                        color: "#ff9100",
                        subtitle: "تومان",
                    }, {
                        title: "تسک‌های تقویم",
                        value: allEvents.length,
                        icon: <EventIcon/>,
                        color: "#ff4081",
                        subtitle: "رویداد ثبت شده",
                    },].map((stat, i) => (<motion.div variants={itemVariants} key={i} style={{flex: 1}}>
                        <StatCard loading={loading} {...stat} />
                    </motion.div>))}
                </Stack>)}

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                        <Stack spacing={3}>
                            {show("chart") && (<motion.div variants={itemVariants}>
                                <Paper
                                    sx={{
                                        ...getCinematicStyle(theme, theme.palette.primary.main),
                                        height: 400,
                                        p: 4,
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        mb={4}
                                    >
                                        <Box>
                                            <Typography
                                                variant="h5"
                                                fontWeight="900"
                                                sx={{fontFamily: "Peyda"}}
                                            >
                                                تحلیل مالی
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                fontWeight="bold"
                                                sx={{fontFamily: "Peyda"}}
                                            >
                                                درآمد، هزینه و سود
                                            </Typography>
                                        </Box>
                                        <IconButton>
                                            <MoreIcon/>
                                        </IconButton>
                                    </Stack>
                                    <ResponsiveContainer width="100%" height="80%">
                                        <BarChart
                                            data={chartData}
                                            margin={{top: 20, right: 10, left: 0, bottom: 0}}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                stroke={alpha(theme.palette.divider, 0.1)}
                                                strokeDasharray="3 3"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fontFamily: "Peyda", fill: theme.palette.text.secondary,
                                                }}
                                                dy={10}
                                            />
                                            <Tooltip
                                                cursor={{
                                                    fill: alpha(theme.palette.text.primary, 0.05),
                                                }}
                                                contentStyle={{
                                                    borderRadius: "16px",
                                                    border: "none",
                                                    boxShadow: theme.shadows[10],
                                                    fontFamily: "Peyda",
                                                    backgroundColor: theme.palette.background.paper,
                                                }}
                                            />
                                            <Bar
                                                dataKey="value"
                                                radius={[12, 12, 0, 0]}
                                                barSize={50}
                                                animationDuration={1500}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </motion.div>)}
                            {show("projects") && (<motion.div variants={itemVariants}>
                                <ProjectsTable
                                    projects={recentProjects}
                                    navigate={navigate}
                                    loading={loading}
                                />
                            </motion.div>)}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Stack spacing={3}>
                            {show("calendar") && (<motion.div variants={itemVariants}>
                                <CalendarWidget events={allEvents} navigate={navigate}/>
                            </motion.div>)}

                            {show("team") && (<motion.div variants={itemVariants}>
                                <Paper
                                    sx={{
                                        ...getCinematicStyle(theme, theme.palette.secondary.main), p: 3,
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        mb={3}
                                    >
                                        <Typography
                                            variant="h6"
                                            fontWeight="900"
                                            sx={{fontFamily: "Peyda"}}
                                        >
                                            تیم من
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate("/personnel")}
                                        >
                                            <ArrowForwardIcon/>
                                        </IconButton>
                                    </Stack>
                                    <Stack direction="row" spacing={-1.5} sx={{pl: 1.5}}>
                                        {teamMembers.map((m, i) => (<Tooltip key={m.id} title={m.full_name}>
                                            <Avatar
                                                src={m.avatar}
                                                sx={{
                                                    width: 56,
                                                    height: 56,
                                                    border: `4px solid ${theme.palette.background.paper}`,
                                                    zIndex: 10 - i,
                                                    transition: "0.2s",
                                                    "&:hover": {
                                                        transform: "translateY(-5px)", zIndex: 20,
                                                    },
                                                }}
                                            >
                                                {m.username[0]}
                                            </Avatar>
                                        </Tooltip>))}
                                        <Avatar
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                border: `4px solid ${theme.palette.background.paper}`,
                                                bgcolor: "primary.main",
                                                fontSize: "1rem",
                                                fontWeight: "bold",
                                                zIndex: 0,
                                                fontFamily: "Peyda",
                                            }}
                                        >
                                            +4
                                        </Avatar>
                                    </Stack>
                                </Paper>
                            </motion.div>)}

                            {show("sticky") && (<motion.div variants={itemVariants}>
                                <Box mt={1}>
                                    <StickyWall/>
                                </Box>
                            </motion.div>)}
                        </Stack>
                    </Grid>
                </Grid>
            </motion.div>
        </Box>
    </Box>);
}

export default AdminDashboard;