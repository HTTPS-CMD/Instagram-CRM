// src/components/GlobalCalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Chip, Stack, alpha, useTheme } from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    Videocam as FilmingIcon,
    PostAdd as PostIcon,
    Groups as MeetingIcon,
    ChevronLeft as LeftIcon,
    ChevronRight as RightIcon
} from '@mui/icons-material';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import momentPlugin from "@fullcalendar/moment";
import 'moment/locale/fa';
import { getAllCalendarEvents } from '../api';
import { useNavigate } from 'react-router-dom';

function GlobalCalendarPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const theme = useTheme();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await getAllCalendarEvents();
            const formattedEvents = response.data.map(event => {
                let color = theme.palette.info.main;
                let icon = 'post';

                if (event.event_type === 'filming') {
                    color = theme.palette.warning.main;
                    icon = 'film';
                } else if (event.event_type === 'meeting') {
                    color = theme.palette.secondary.main;
                    icon = 'meet';
                }

                return {
                    id: event.id,
                    title: `${event.project_name}: ${event.title}`,
                    start: event.event_date,
                    backgroundColor: alpha(color, 0.2), // پس‌زمینه شفاف
                    borderColor: color,
                    textColor: color, // متن رنگی
                    extendedProps: {
                        projectId: event.project,
                        type: event.event_type,
                        icon: icon
                    },
                    classNames: ['modern-event'] // کلاس سفارشی برای استایل
                };
            });
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (clickInfo) => {
        const projectId = clickInfo.event.extendedProps.projectId;
        if (projectId) {
            navigate(`/project/${projectId}`);
        }
    };

    // رندر سفارشی برای محتوای رویداد (اضافه کردن آیکون)
    const renderEventContent = (eventInfo) => {
        const type = eventInfo.event.extendedProps.type;
        let Icon = PostIcon;
        if (type === 'filming') Icon = FilmingIcon;
        if (type === 'meeting') Icon = MeetingIcon;

        return (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 0.5, py: 0.2, overflow: 'hidden' }}>
                <Icon sx={{ fontSize: 14, opacity: 0.8 }} />
                <Typography variant="caption" noWrap fontWeight="bold">
                    {eventInfo.event.title}
                </Typography>
            </Stack>
        );
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Box>
            {/* هدر صفحه */}
            <Paper
                elevation={0}
                sx={{
                    p: 3, mb: 3, borderRadius: 4,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    color: 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}
            >
                <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon fontSize="large" /> تقویم کاری جامع
                </Typography>

                <Stack direction="row" spacing={1}>
                    <Chip
                        icon={<FilmingIcon sx={{color: '#ff9800 !important'}}/>}
                        label="آفیش"
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(10px)' }}
                    />
                    <Chip
                        icon={<MeetingIcon sx={{color: '#ce93d8 !important'}}/>}
                        label="جلسه"
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(10px)' }}
                    />
                    <Chip
                        icon={<PostIcon sx={{color: '#90caf9 !important'}}/>}
                        label="پست"
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(10px)' }}
                    />
                </Stack>
            </Paper>

            {/* بدنه تقویم */}
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    borderRadius: 4,
                    direction: 'ltr', // ساختار داخلی LTR برای تقویم
                    bgcolor: 'background.paper',
                    '& .fc': { fontFamily: 'inherit' }, // ارث‌بری فونت فارسی
                }}
            >
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, momentPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek'
                    }}

                    buttonText={{
                        today: 'امروز',
                        month: 'ماهانه',
                        week: 'هفتگی',
                        list: 'لیست',
                    }}
                    events={events}
                    locale="fa"
                    direction="rtl"
                    firstDay={6}
                    height="auto"
                    contentHeight="auto"
                    dayHeaderClassNames="calendar-header-rtl"
                    eventClick={handleEventClick}
                    eventContent={renderEventContent} // ✅ استفاده از رندر سفارشی
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false
                    }}
                />
            </Paper>
        </Box>
    );
}

export default GlobalCalendarPage;