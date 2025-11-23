// src/components/CalendarEventForm.jsx
import React, { useState } from 'react';
import {
    Box, TextField, Button, CircularProgress, Alert, Grid, Select, MenuItem, InputLabel, FormControl, Typography, Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import jMoment from 'jalali-moment';
import { createCalendarEvent } from '../api';

// ✅ ایمپورت کامپوننت تقویم
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function CalendarEventForm({ projectId, onEventCreated, onCancel }) {
    const [formData, setFormData] = useState({
        title: '',
        event_date: null, // ✅ تغییر از '' به null برای DatePicker
        event_type: 'post',
    });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    const EVENT_TYPES = [
        { value: 'post', label: 'آپلود پست/ریلز' },
        { value: 'filming', label: 'آفیش فیلمبرداری' },
    ];

    const handleChange = (e) => {
        let { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ✅ یک تابع جداگانه برای مدیریت انتخاب تاریخ از تقویم
    const handleDateChange = (newDate) => {
        setFormData(prev => ({ ...prev, event_date: newDate }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        // ✅ اعتبار سنجی تاریخ جدید
        if (!formData.event_date || !jMoment(formData.event_date).isValid()) {
            setLocalError('لطفاً یک تاریخ معتبر از تقویم انتخاب کنید.');
            setLoading(false);
            return;
        }

        // ✅ چون event_date حالا یک آبجکت Moment است، فرمت کردن آن ساده‌تر است
        const sendData = {
            title: formData.title,
            event_type: formData.event_type,
            // تبدیل به میلادی برای Django (و اضافه کردن ساعت پیش‌فرض)
            event_date: formData.event_date.locale('en').format('YYYY-MM-DDT12:00:00')
        };


        try {
            // ارسال به API
            const response = await createCalendarEvent(projectId, sendData);
            onEventCreated(response.data); // موفقیت
        } catch (err) {
            console.error('Event creation failed:', err);
            let errorMsg = err.message || 'خطا در ایجاد رویداد.';
            if (err.response && err.response.data) {
                errorMsg = Object.values(err.response.data).join(' \n ');
            }
            setLocalError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {localError && <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{localError}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12}> {/* ✅ xs={12} شد */}
                    <TextField
                        name="title"
                        label="عنوان رویداد (مثلاً: ریلز معرفی محصول)"
                        value={formData.title}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                </Grid>

                <Grid item xs={12} md={6}> {/* ✅ item اضافه شد */}
                    {/* ✅ TextField با DatePicker جایگزین شد */}
                    <DatePicker
                        label="تاریخ رویداد"
                        value={formData.event_date}
                        onChange={handleDateChange}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                fullWidth
                                required
                                helperText="تاریخ را از تقویم انتخاب کنید."
                            />
                        )}
                    />
                </Grid>

                <Grid item xs={12} md={6}> {/* ✅ item اضافه شد */}
                    <FormControl fullWidth>
                        <InputLabel>نوع رویداد</InputLabel>
                        <Select
                            name="event_type"
                            value={formData.event_type}
                            label="نوع رویداد"
                            onChange={handleChange}
                            required
                        >
                            {EVENT_TYPES.map(type => (
                                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12}> {/* ✅ item اضافه شد */}
                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                        <Button onClick={onCancel} variant="outlined" color="secondary">
                            انصراف
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'ذخیره رویداد'}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}

export default CalendarEventForm;