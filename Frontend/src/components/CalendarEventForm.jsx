// src/components/CalendarEventForm.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Button, CircularProgress, Alert, Grid, Select, MenuItem,
    InputLabel, FormControl, Stack, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import jMoment from 'jalali-moment';
import { createCalendarEvent, createGlobalEvent, getProjects } from '../api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// ✅ پراپ‌های open و onClose اضافه شدند برای مدیریت پاپ‌آپ
function CalendarEventForm({ open, onClose, projectId, onEventCreated, defaultType }) {

    const [formData, setFormData] = useState({
        title: '',
        event_date: null,
        event_type: defaultType || 'post',
        project: projectId || ''
    });

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    // دریافت لیست پروژه‌ها
    useEffect(() => {
        if (!projectId) {
            getProjects().then(res => setProjects(res.data)).catch(err => console.error(err));
        }
    }, [projectId]);

    // ✅ ریست کردن فرم وقتی پنجره باز می‌شود
    useEffect(() => {
        if (open) {
            setFormData({
                title: '',
                event_date: null,
                event_type: defaultType || 'post',
                project: projectId || ''
            });
            setLocalError(null);
        }
    }, [open, defaultType, projectId]);

    const EVENT_TYPES = [
        { value: 'post', label: 'آپلود پست/ریلز' },
        { value: 'filming', label: 'آفیش فیلمبرداری' },
        { value: 'meeting', label: 'جلسه (حضوری/آنلاین)' },
    ];

    const handleChange = (e) => {
        let { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (newDate) => {
        setFormData(prev => ({ ...prev, event_date: newDate }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // اگر فرم سابمیت شد
        handleSave();
    };

    const handleSave = async () => {
        setLoading(true);
        setLocalError(null);

        if (!formData.event_date || !jMoment(formData.event_date).isValid()) {
            setLocalError('لطفاً یک تاریخ معتبر از تقویم انتخاب کنید.');
            setLoading(false);
            return;
        }

        if (!projectId && !formData.project) {
            setLocalError('لطفاً پروژه مورد نظر را انتخاب کنید.');
            setLoading(false);
            return;
        }

        // بررسی عنوان
        if (!formData.title) {
            setLocalError('عنوان رویداد الزامی است.');
            setLoading(false);
            return;
        }

        const sendData = {
            title: formData.title,
            event_type: formData.event_type,
            event_date: formData.event_date.locale('en').format('YYYY-MM-DDT12:00:00')
        };

        try {
            let response;
            if (projectId) {
                // حالت تکی (داخل پروژه)
                response = await createCalendarEvent(projectId, sendData);
            } else {
                // حالت گلوبال (تقویم‌های جداگانه)
                sendData.project = formData.project;
                response = await createGlobalEvent(sendData);
            }
            onEventCreated(response.data); // رفرش کردن تقویم والد
            onClose(); // بستن مودال
        } catch (err) {
            console.error('Event creation failed:', err);
            setLocalError('خطا در ایجاد رویداد.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // ✅ تبدیل به Dialog (پاپ‌آپ)
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#1e1e2d',
                    color: 'white',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.1)'
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
                {defaultType ? 'افزودن رویداد جدید' : 'تعریف رویداد جدید'}
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                {localError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{localError}</Alert>}

                <Grid container spacing={3} sx={{ mt: 0 }}>
                    {/* انتخاب پروژه */}
                    {!projectId && (
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>انتخاب پروژه</InputLabel>
                                <Select
                                    name="project"
                                    value={formData.project}
                                    label="انتخاب پروژه"
                                    onChange={handleChange}
                                    sx={{textAlign:'right', direction:'rtl', '& .MuiSelect-select': {textAlign:'right', paddingRight: 2}}}
                                >
                                    {projects.map(p => (
                                        <MenuItem key={p.id} value={p.id}>{p.project_name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <TextField
                            name="title"
                            label="عنوان رویداد"
                            value={formData.title}
                            onChange={handleChange}
                            fullWidth
                            required
                            sx={{ input: { color: 'white' } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <DatePicker
                            label="تاریخ رویداد"
                            value={formData.event_date}
                            onChange={handleDateChange}
                            renderInput={(params) => <TextField {...params} fullWidth required />}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>نوع رویداد</InputLabel>
                            <Select
                                name="event_type"
                                value={formData.event_type}
                                label="نوع رویداد"
                                onChange={handleChange}
                                required
                                disabled={!!defaultType}
                                sx={{textAlign:'right', direction:'rtl', '& .MuiSelect-select': {textAlign:'right', paddingRight: 2}}}
                            >
                                {EVENT_TYPES.map(type => (
                                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button onClick={onClose} variant="outlined" color="secondary" sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.3)' }}>
                    انصراف
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    disabled={loading}
                    sx={{ bgcolor: '#3da9fc' }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'ذخیره رویداد'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CalendarEventForm;