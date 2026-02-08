// src/components/GanttPage.jsx
import React, {useEffect, useState} from 'react';
import {
    alpha,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import {CalendarMonth as CalendarIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon} from '@mui/icons-material';
import {getProjects, getTasks} from '../api';
import moment from 'jalali-moment';

// تنظیمات ظاهری گانت
const CELL_WIDTH_DAY = 60; // عرض هر سلول در حالت روزانه
const CELL_WIDTH_WEEK = 40; // عرض هر سلول در حالت هفتگی
const HEADER_HEIGHT = 100;
const SIDEBAR_WIDTH = 280;

function GanttPage() {
    const theme = useTheme(); // ✅ استفاده از تم
    const [loading, setLoading] = useState(true);
    const [ganttData, setGanttData] = useState([]);
    const [viewMode, setViewMode] = useState('day'); // 'day' or 'week'
    const [dateRange, setDateRange] = useState({start: moment().startOf('month'), end: moment().endOf('month')});
    const [scrollPos, setScrollPos] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const projRes = await getProjects();
            const projects = projRes.data;

            // دریافت تسک‌های هر پروژه به صورت موازی
            const dataPromises = projects.map(async (p) => {
                try {
                    const taskRes = await getTasks(p.id);
                    // هندل کردن صفحه‌بندی احتمالی
                    const tasks = Array.isArray(taskRes.data) ? taskRes.data : (taskRes.data.results || []);
                    return {...p, tasks};
                } catch (e) {
                    return {...p, tasks: []};
                }
            });

            const rawData = await Promise.all(dataPromises);

            // حذف پروژه‌های بدون تسک (اختیاری)
            const filteredData = rawData.filter(p => p.tasks.length > 0);

            setGanttData(filteredData);
            calculateDateRange(filteredData);
        } catch (err) {
            console.error("Gantt Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateDateRange = (data) => {
        let minDate = moment().add(-7, 'days'); // پیش‌فرض: یک هفته قبل
        let maxDate = moment().add(30, 'days'); // پیش‌فرض: یک ماه بعد

        data.forEach(p => {
            p.tasks.forEach(t => {
                // اگر تسک start_date ندارد، از created_at استفاده کن
                const start = t.start_date ? moment(t.start_date) : moment(t.created_at);
                const end = t.due_date ? moment(t.due_date) : moment(start).add(2, 'days');

                if (start.isBefore(minDate)) minDate = start;
                if (end.isAfter(maxDate)) maxDate = end;
            });
        });

        // اضافه کردن پدینگ به ابتدا و انتهای نمودار
        setDateRange({
            start: minDate.clone().subtract(5, 'days'), end: maxDate.clone().add(10, 'days')
        });
    };

    // تولید آرایه روزها برای هدر
    const generateTimeAxis = () => {
        const days = [];
        let current = dateRange.start.clone();
        const end = dateRange.end.clone();

        while (current.isSameOrBefore(end)) {
            days.push(current.clone());
            current.add(1, 'days');
        }
        return days;
    };

    const timeAxis = generateTimeAxis();
    const cellWidth = viewMode === 'day' ? CELL_WIDTH_DAY : CELL_WIDTH_WEEK;
    const totalWidth = timeAxis.length * cellWidth;

    // تابع محاسبه موقعیت و عرض هر نوار تسک
    const getTaskStyle = (task) => {
        const start = task.start_date ? moment(task.start_date) : moment(task.created_at);
        let end = task.due_date ? moment(task.due_date) : start.clone().add(1, 'days');

        // اگر تاریخ پایان قبل از شروع بود (خطای کاربری)، اصلاح کن
        if (end.isBefore(start)) end = start.clone().add(1, 'days');

        const diffDaysStart = start.diff(dateRange.start, 'days');
        const durationDays = end.diff(start, 'days') + 1;

        return {
            left: diffDaysStart * cellWidth, width: Math.max(durationDays * cellWidth, cellWidth), // حداقل عرض یک سلول
            backgroundColor: getStatusColor(task.status)
        };
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'done':
                return theme.palette.success.main;
            case 'in_progress':
                return theme.palette.warning.main;
            case 'todo':
                return theme.palette.primary.main;
            default:
                return theme.palette.grey[500];
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress/></Box>;

    return (<Box sx={{height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>

        {/* --- Toolbar --- */}
        <Paper sx={{
            p: 2,
            mb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center', // ✅ استایل داینامیک برای تولبار
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.divider}`
        }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <CalendarIcon color="primary"/>
                <Typography variant="h6" fontWeight="bold" color="text.primary">نمودار زمانی پروژه‌ها</Typography>
                <Chip label={`${ganttData.length} پروژه فعال`} size="small"
                      sx={{bgcolor: alpha(theme.palette.action.active, 0.1), color: 'text.primary'}}/>
            </Stack>

            <Stack direction="row" spacing={1}>
                <Button
                    variant={viewMode === 'day' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('day')}
                    startIcon={<ZoomInIcon/>}
                    size="small"
                    sx={{borderRadius: 2}}
                >
                    روزانه
                </Button>
                <Button
                    variant={viewMode === 'week' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('week')}
                    startIcon={<ZoomOutIcon/>}
                    size="small"
                    sx={{borderRadius: 2}}
                >
                    هفتگی
                </Button>
            </Stack>
        </Paper>

        {/* --- Gantt Container --- */}
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            bgcolor: theme.palette.background.default,
            overflow: 'hidden'
        }}>

            {/* 1. Sidebar (Projects & Tasks Names) */}
            <Box sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                borderRight: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                overflowY: 'hidden',
                pt: `${HEADER_HEIGHT}px` // فضای خالی برای هدر
            }}>
                <Box sx={{overflowY: 'auto', height: 'calc(100% - 10px)', pr: 1}}>
                    {ganttData.map(project => (<Box key={project.id} mb={1}>
                        {/* نام پروژه */}
                        <Box sx={{
                            p: 1.5,
                            pl: 2,
                            bgcolor: alpha(theme.palette.action.hover, 0.05),
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            fontWeight: 'bold',
                            color: theme.palette.primary.main
                        }}>
                            {project.project_name}
                        </Box>
                        {/* لیست تسک‌ها */}
                        {project.tasks.map(task => (<Box key={task.id} sx={{
                            p: 1,
                            pl: 4,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            fontSize: '0.85rem',
                            color: theme.palette.text.secondary
                        }}>
                            <Typography noWrap variant="body2">{task.title}</Typography>
                        </Box>))}
                    </Box>))}
                </Box>
            </Box>

            {/* 2. Timeline Area */}
            <Box sx={{flexGrow: 1, overflowX: 'auto', position: 'relative'}}>
                <Box sx={{minWidth: totalWidth, position: 'relative'}}>

                    {/* Header (Dates) */}
                    <Box sx={{
                        height: HEADER_HEIGHT,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        bgcolor: theme.palette.background.paper,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'flex-end'
                    }}>
                        {timeAxis.map((day, index) => {
                            const isMonthStart = day.date() === 1 || index === 0;
                            return (<Box key={index} sx={{
                                width: cellWidth,
                                minWidth: cellWidth,
                                borderRight: `1px solid ${theme.palette.divider}`,
                                textAlign: 'center',
                                pb: 1,
                                position: 'relative'
                            }}>
                                {/* نمایش ماه (فقط در شروع ماه) */}
                                {isMonthStart && (<Typography variant="caption" sx={{
                                    position: 'absolute',
                                    top: 5,
                                    left: 5,
                                    fontWeight: 'bold',
                                    color: theme.palette.primary.main,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {day.locale('fa').format('MMMM YYYY')}
                                </Typography>)}
                                {/* نمایش روز */}
                                <Typography variant="caption" display="block" color="text.secondary">
                                    {day.locale('fa').format('dd')}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="text.primary">
                                    {day.format('D')}
                                </Typography>
                            </Box>);
                        })}
                    </Box>

                    {/* Grid & Bars */}
                    <Box sx={{position: 'relative'}}>
                        {/* خطوط عمودی گرید */}
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            pointerEvents: 'none',
                            zIndex: 0
                        }}>
                            {timeAxis.map((_, i) => (<Box key={i} sx={{
                                width: cellWidth,
                                minWidth: cellWidth,
                                borderRight: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                            }}/>))}
                        </Box>

                        {/* ردیف‌های دیتا */}
                        <Box sx={{pt: 0}}>
                            {ganttData.map(project => (<Box key={project.id} mb={1}>
                                {/* فضای خالی برای ردیف پروژه (چون در سایدبار است) */}
                                <Box sx={{
                                    height: 42,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    bgcolor: alpha(theme.palette.action.hover, 0.05)
                                }}/>

                                {/* ردیف تسک‌ها */}
                                {project.tasks.map(task => {
                                    const style = getTaskStyle(task);
                                    return (<Box key={task.id} sx={{
                                        height: 40,
                                        position: 'relative',
                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                    }}>
                                        <Tooltip
                                            title={`${task.title} (${moment(task.start_date || task.created_at).locale('fa').format('jD jMMM')} - ${task.due_date ? moment(task.due_date).locale('fa').format('jD jMMM') : '?'})`}
                                            arrow placement="top"
                                        >
                                            <Box sx={{
                                                position: 'absolute',
                                                left: style.left,
                                                width: style.width,
                                                height: 24,
                                                top: 8,
                                                bgcolor: style.backgroundColor,
                                                borderRadius: 4,
                                                boxShadow: theme.shadows[2],
                                                cursor: 'pointer',
                                                opacity: 0.9,
                                                '&:hover': {opacity: 1, transform: 'scaleY(1.1)'},
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                px: 1,
                                                overflow: 'hidden'
                                            }}>
                                                {/* نمایش آواتار مسئول */}
                                                {task.assignee_avatar && (<Avatar src={task.assignee_avatar} sx={{
                                                    width: 18, height: 18, mr: 0.5, border: '1px solid white'
                                                }}/>)}
                                                <Typography variant="caption" color="white" noWrap
                                                            fontWeight="bold" sx={{
                                                    fontSize: '0.7rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                                }}>
                                                    {task.title}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    </Box>);
                                })}
                            </Box>))}
                        </Box>
                    </Box>

                    {/* خط نشانگر امروز */}
                    <Box sx={{
                        position: 'absolute',
                        left: moment().diff(dateRange.start, 'days') * cellWidth + (cellWidth / 2),
                        top: 0,
                        bottom: 0,
                        width: 2,
                        bgcolor: theme.palette.error.main,
                        zIndex: 5,
                        pointerEvents: 'none'
                    }}>
                        <Box sx={{
                            position: 'absolute',
                            top: -10,
                            left: -24,
                            bgcolor: theme.palette.error.main,
                            color: 'white',
                            px: 0.5,
                            borderRadius: 1,
                            fontSize: '0.6rem'
                        }}>
                            امروز
                        </Box>
                    </Box>

                </Box>
            </Box>
        </Box>
    </Box>);
}

export default GanttPage;