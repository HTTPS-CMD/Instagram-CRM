// src/components/UnifiedCalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, IconButton, Chip, useTheme, alpha, Fade, Stack } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import faLocale from '@fullcalendar/core/locales/fa';
import { getAllCalendarEvents, deleteGlobalEvent } from '../api';
import CalendarEventForm from './CalendarEventForm';
import {
    Add as AddIcon,
    EventNote as EventIcon,
    Circle as DotIcon,
    Delete as DeleteIcon,
    OpenInNew as OpenIcon,
    ChevronLeft, ChevronRight
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import moment from 'jalali-moment';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_COLORS = {
    meeting: '#FFD700', // طلایی
    filming: '#F50057', // صورتی نئونی
    post: '#00E5FF',    // آبی فیروزه‌ای
    deadline: '#FF3D00', // نارنجی آتشین
    other: '#7C4DFF'    // بنفش رویایی
};

const EVENT_TITLES = {
    meeting: 'جلسه',
    filming: 'آفیش',
    post: 'پست',
    deadline: 'ددلاین',
    other: 'سایر'
};

const UnifiedCalendarPage = ({ filterType = null }) => {
    const navigate = useNavigate();
    const theme = useTheme(); // ✅ استفاده از تم

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dayEvents, setDayEvents] = useState([]);

    useEffect(() => {
        fetchEvents();
    }, [filterType]);

    useEffect(() => {
        updateDayEvents(selectedDate, events);
    }, [selectedDate, events]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await getAllCalendarEvents();
            let formattedEvents = res.data.map(e => ({
                id: e.id,
                title: e.title,
                start: e.start_time || e.event_date,
                backgroundColor: EVENT_COLORS[e.event_type],
                extendedProps: {
                    type: e.event_type,
                    projectName: e.project_name,
                    projectId: e.project
                }
            }));

            if (filterType) {
                formattedEvents = formattedEvents.filter(e => e.extendedProps.type === filterType);
            }
            setEvents(formattedEvents);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateDayEvents = (date, allEvents) => {
        const selectedMoment = moment(date);
        const filtered = allEvents.filter(e =>
            moment(e.start).isSame(selectedMoment, 'day')
        );
        setDayEvents(filtered);
    };

    const handleDateClick = (arg) => {
        setSelectedDate(arg.date);
    };

    const handleEventCreated = () => {
        fetchEvents();
        setOpenModal(false);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if(window.confirm("حذف شود؟")) {
            try {
                await deleteGlobalEvent(id);
                setEvents(prev => prev.filter(ev => ev.id !== id));
            } catch (err) { console.error(err); }
        }
    };

    // رنگ متن برای اعداد تقویم (داینامیک)
    const calendarTextColor = theme.palette.text.primary;
    const calendarBorderColor = theme.palette.divider;

    return (
        <Box sx={{ p: 3, height: '88vh', display: 'flex', gap: 3, overflow: 'hidden' }}>

            {/* استایل‌های CSS برای کاستوم کردن FullCalendar (داینامیک) */}
            <style>
                {`
                    .fc-theme-standard td, .fc-theme-standard th { border: none !important; }
                    .fc-theme-standard .fc-scrollgrid { border: none !important; }
                    .fc-daygrid-day-number { color: ${calendarTextColor}; opacity: 0.8; font-size: 0.9rem; padding: 8px !important; z-index: 2; position: relative; }
                    .fc-col-header-cell-cushion { color: ${theme.palette.text.secondary}; font-weight: normal; padding-bottom: 15px !important; text-decoration: none !important; }
                    
                    /* سلول روز */
                    .fc-daygrid-day-frame { 
                        display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
                        cursor: pointer; border-radius: 18px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        margin: 4px; min-height: 80px; position: relative; overflow: hidden;
                    }
                    /* افکت هاور روی روز */
                    .fc-daygrid-day:hover .fc-daygrid-day-frame { 
                        background: ${alpha(theme.palette.action.hover, 0.1)}; 
                        transform: translateY(-2px);
                        box-shadow: ${theme.shadows[2]};
                    }
                    
                    /* روز امروز */
                    .fc-day-today .fc-daygrid-day-frame { 
                        background: ${alpha(theme.palette.primary.main, 0.1)} !important;
                        border: 1px solid ${theme.palette.primary.main};
                    }
                    .fc-day-today .fc-daygrid-day-number { color: ${theme.palette.primary.main}; font-weight: bold; font-size: 1.1rem; }

                    /* مخفی کردن ایونت‌های متنی */
                    .fc-daygrid-event { display: none !important; }

                    /* دکمه‌های هدر */
                    .fc-button { 
                        background: transparent !important; 
                        border: 1px solid ${theme.palette.divider} !important; 
                        border-radius: 12px !important; 
                        color: ${theme.palette.text.primary} !important;
                    }
                    .fc-button:hover { background: ${alpha(theme.palette.action.hover, 0.1)} !important; }
                    .fc-icon { font-size: 1.2rem !important; }
                `}
            </style>

            {/* --- بخش ۱: تقویم (راست) --- */}
            <Paper sx={{
                flex: 2, borderRadius: 5, p: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[4],
                display: 'flex', flexDirection: 'column', position: 'relative'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                         <Typography variant="h4" fontWeight="900" sx={{
                             background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                             backgroundClip: 'text', textFillColor: 'transparent'
                         }}>
                            {moment(selectedDate).locale('fa').format('MMMM')}
                        </Typography>
                        <Typography variant="h4" fontWeight="300" sx={{ color: theme.palette.text.disabled }}>
                            {moment(selectedDate).locale('fa').format('YYYY')}
                        </Typography>
                    </Stack>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenModal(true)}
                        sx={{
                            borderRadius: 4, px: 3, py: 1,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                            fontWeight: 'bold', color: '#fff'
                        }}
                    >
                        رویداد جدید
                    </Button>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{ left: 'prev,next', center: '', right: '' }}
                        locale={faLocale}
                        events={events}
                        dateClick={handleDateClick}
                        height="100%"
                        dayCellContent={(arg) => {
                            const dateEvents = events.filter(e => moment(e.start).isSame(moment(arg.date), 'day'));
                            return (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', pt: 1.5 }}>
                                    <Typography color="text.primary">{arg.dayNumberText}</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 45 }}>
                                        {dateEvents.slice(0, 5).map((ev, i) => (
                                            <Box key={i} sx={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                bgcolor: ev.backgroundColor,
                                                boxShadow: `0 0 5px ${ev.backgroundColor}`
                                            }} />
                                        ))}
                                        {dateEvents.length > 5 && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: theme.palette.action.disabled }} />}
                                    </Box>
                                </Box>
                            );
                        }}
                    />
                </Box>
            </Paper>

            {/* --- بخش ۲: سایدبار جزئیات (چپ) --- */}
            <Paper sx={{
                flex: 1, borderRadius: 5, overflow: 'hidden',
                bgcolor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex', flexDirection: 'column',
                position: 'relative'
            }}>
                {/* هدر رنگی متحرک */}
                <Box sx={{
                    p: 4, pb: 6, position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: '#fff', textAlign: 'center'
                }}>
                    <Box sx={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                    <Box sx={{ position: 'absolute', bottom: -30, right: -10, width: 150, height: 150, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />

                    <Typography variant="h1" fontWeight="900" sx={{ fontSize: '4rem', mb: -1, textShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>
                        {moment(selectedDate).locale('fa').format('D')}
                    </Typography>
                    <Typography variant="h5" sx={{ opacity: 0.9, letterSpacing: 1 }}>
                        {moment(selectedDate).locale('fa').format('dddd')}
                    </Typography>
                </Box>

                {/* لیست رویدادها با انیمیشن */}
                <Box sx={{ p: 2, mt: -3, flexGrow: 1, overflowY: 'auto', zIndex: 2 }}>
                    <AnimatePresence mode="wait">
                        {dayEvents.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, opacity: 0.5 }}
                            >
                                <EventIcon sx={{ fontSize: 60, mb: 2, color: theme.palette.text.disabled }} />
                                <Typography color="text.secondary">هیچ برنامه‌ای نیست</Typography>
                            </motion.div>
                        ) : (
                            <Stack spacing={2}>
                                {dayEvents.map((ev, index) => (
                                    <motion.div
                                        key={ev.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Paper sx={{
                                            p: 2, borderRadius: 3,
                                            bgcolor: theme.palette.background.paper,
                                            border: `1px solid ${theme.palette.divider}`,
                                            position: 'relative', overflow: 'hidden',
                                            transition: '0.2s',
                                            '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1), transform: 'translateY(-2px)' }
                                        }}>
                                            {/* نوار رنگی کنار */}
                                            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: ev.backgroundColor }} />

                                            <Box sx={{ pl: 2, display: 'flex', justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{ev.title}</Typography>
                                                    <Stack direction="row" spacing={1} mt={1} alignItems="center">
                                                        <Chip
                                                            label={EVENT_TITLES[ev.extendedProps.type]}
                                                            size="small"
                                                            sx={{
                                                                height: 20, fontSize: '0.7rem',
                                                                bgcolor: alpha(ev.backgroundColor, 0.15),
                                                                color: ev.backgroundColor, // برای چیپ‌ها بهتر است از رنگ خودش استفاده شود
                                                                border: `1px solid ${alpha(ev.backgroundColor, 0.3)}`
                                                            }}
                                                        />
                                                        {ev.extendedProps.projectName && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {ev.extendedProps.projectName}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </Box>

                                                <Stack>
                                                    <IconButton size="small" onClick={(e) => handleDelete(ev.id, e)} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.error.main } }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                    {ev.extendedProps.projectId && (
                                                        <IconButton size="small" onClick={() => navigate(`/project/${ev.extendedProps.projectId}`)} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.info.main } }}>
                                                            <OpenIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                ))}
                            </Stack>
                        )}
                    </AnimatePresence>
                </Box>
            </Paper>

            <CalendarEventForm
                open={openModal}
                onClose={() => setOpenModal(false)}
                onEventCreated={handleEventCreated}
                defaultType={filterType}
                initialDate={selectedDate ? moment(selectedDate).format('YYYY-MM-DD HH:mm') : ''}
            />
        </Box>
    );
};

export default UnifiedCalendarPage;