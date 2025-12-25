// src/components/WidgetManager.jsx
import React, { useState } from 'react';
import {
    Box, Drawer, Typography, FormControlLabel, Switch, Button,
    Stack, IconButton, Tooltip, Divider, useTheme, alpha
} from '@mui/material';
import {
    Widgets as WidgetsIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    RestartAlt as ResetIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { saveDashboardConfig } from '../api';

function WidgetManager({ availableWidgets, activeWidgets, onUpdate }) {
    const theme = useTheme(); // ✅ استفاده از تم
    const [open, setOpen] = useState(false);
    const [localWidgets, setLocalWidgets] = useState(activeWidgets);
    const { enqueueSnackbar } = useSnackbar();

    // وقتی کشو باز میشه، استیت لوکال رو آپدیت کن
    const handleOpen = () => {
        setLocalWidgets(activeWidgets);
        setOpen(true);
    };

    const handleToggle = (widgetKey) => {
        if (localWidgets.includes(widgetKey)) {
            setLocalWidgets(prev => prev.filter(w => w !== widgetKey));
        } else {
            setLocalWidgets(prev => [...prev, widgetKey]);
        }
    };

    const handleSave = async () => {
        try {
            await saveDashboardConfig(localWidgets);
            onUpdate(localWidgets); // آپدیت استیت پدر
            setOpen(false);
            enqueueSnackbar('چیدمان داشبورد ذخیره شد ✅', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar('خطا در ذخیره تنظیمات', { variant: 'error' });
        }
    };

    return (
        <>
            {/* دکمه شناور برای باز کردن مدیریت ویجت */}
            <Tooltip title="مدیریت ویجت‌ها">
                <Button
                    variant="contained"
                    onClick={handleOpen}
                    startIcon={<WidgetsIcon />}
                    sx={{
                        // ✅ استایل شیشه‌ای داینامیک برای دکمه
                        bgcolor: alpha(theme.palette.background.paper, 0.4),
                        color: theme.palette.text.primary,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[2],
                        '&:hover': {
                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                            borderColor: theme.palette.primary.main
                        }
                    }}
                >
                    شخصی‌سازی میزکار
                </Button>
            </Tooltip>

            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    // ✅ پس‌زمینه و رنگ متن دراور داینامیک
                    sx: {
                        width: 320,
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        p: 3,
                        borderLeft: `1px solid ${theme.palette.divider}`
                    }
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight="bold" sx={{ display:'flex', alignItems:'center', gap:1, color: theme.palette.primary.main }}>
                        <WidgetsIcon color="inherit" /> مدیریت ویجت‌ها
                    </Typography>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>

                <Typography variant="caption" color="text.secondary" mb={3} display="block">
                    ویجت‌هایی که می‌خواهید در داشبورد نمایش داده شوند را انتخاب کنید.
                </Typography>

                <Stack spacing={2}>
                    {availableWidgets.map((widget) => {
                        const isSelected = localWidgets.includes(widget.key);
                        return (
                            <Box
                                key={widget.key}
                                sx={{
                                    p: 1.5, borderRadius: 2,
                                    // ✅ استایل داینامیک آیتم‌های لیست
                                    bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.action.hover, 0.05),
                                    border: isSelected ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                                    transition: '0.2s',
                                    '&:hover': { borderColor: theme.palette.primary.main }
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isSelected}
                                            onChange={() => handleToggle(widget.key)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box ml={1}>
                                            <Typography variant="body2" fontWeight="bold" color="text.primary">{widget.label}</Typography>
                                            <Typography variant="caption" color="text.secondary">{widget.desc}</Typography>
                                        </Box>
                                    }
                                    sx={{ m: 0, width: '100%', alignItems:'flex-start' }}
                                />
                            </Box>
                        );
                    })}
                </Stack>

                <Box mt="auto" pt={3}>
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        sx={{
                            bgcolor: theme.palette.success.main,
                            color: '#fff',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: theme.palette.success.dark }
                        }}
                    >
                        ذخیره تغییرات
                    </Button>
                </Box>
            </Drawer>
        </>
    );
}

export default WidgetManager;