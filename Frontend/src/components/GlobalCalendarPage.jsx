// src/components/GlobalCalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Chip, Stack } from '@mui/material';
import { CalendarMonth as CalendarIcon, Circle as CircleIcon } from '@mui/icons-material';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import momentPlugin from "@fullcalendar/moment";
import 'moment/locale/fa';
import { getAllCalendarEvents } from '../api';
import { useNavigate } from 'react-router-dom';
import moment from 'jalali-moment';

function GlobalCalendarPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await getAllCalendarEvents();
            const formattedEvents = response.data.map(event => ({
                id: event.id,
                title: `${event.project_name}: ${event.title}`, // ترکیب نام پروژه و عنوان
                start: event.event_date,
                color: event.event_type === 'filming' ? '#ff9800' : '#2196f3', // نارنجی برای آفیش، آبی برای پست
                extendedProps: {
                    projectId: event.project,
                    type: event.event_type
                }
            }));
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

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="large" color="primary"/> تقویم کاری جامع
                </Typography>

                {/* راهنما */}
                <Stack direction="row" spacing={2}>
                    <Chip icon={<CircleIcon sx={{color:'#ff9800 !important'}}/>} label="آفیش فیلمبرداری" variant="outlined" />
                    <Chip icon={<CircleIcon sx={{color:'#2196f3 !important'}}/>} label="انتشار پست" variant="outlined" />
                </Stack>
            </Stack>

            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, direction: 'ltr' }}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, momentPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        start: 'title',
                        center: 'dayGridMonth,timeGridWeek,listWeek', // دکمه‌های تغییر نما
                        end: 'today prev,next'
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
                    eventClick={handleEventClick} // کلیک روی رویداد -> رفتن به پروژه
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