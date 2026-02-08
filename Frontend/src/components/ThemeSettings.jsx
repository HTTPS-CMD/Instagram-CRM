// src/components/ThemeSettings.jsx
import React, {useContext} from 'react';
import {Box, Grid, Paper, Tooltip, Typography, Zoom} from '@mui/material';
import {Check as CheckIcon, Palette as PaletteIcon} from '@mui/icons-material';
import {ColorModeContext} from '../themeContext';

const brandColors = [
    {name: 'نیلی (پیش‌فرض)', color: '#4f46e5'},
    {name: 'سبز زمردی', color: '#10b981'},
    {name: 'آبی آسمانی', color: '#0ea5e9'},
    {name: 'بنفش سلطنتی', color: '#8b5cf6'},
    {name: 'قرمز آتشین', color: '#ef4444'},
    {name: 'نارنجی غروب', color: '#f97316'},
    {name: 'صورتی جیغ', color: '#ec4899'},
    {name: 'سبز ارتشی', color: '#65a30d'},
    {name: 'توسی کلاسیک', color: '#64748b'},
];

const ThemeSettings = () => {
    const {primaryColor, changePrimaryColor} = useContext(ColorModeContext);

    return (
        <Paper elevation={0} sx={{p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4}}>
            <Box display="flex" alignItems="center" mb={2}>
                <PaletteIcon sx={{mr: 1, color: 'primary.main'}}/>
                <Typography variant="h6" fontWeight="bold">تم رنگی سیستم</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={3}>
                رنگ سازمانی پنل را بر اساس سلیقه یا برند خود انتخاب کنید. این تغییر روی تمام دکمه‌ها و آیکون‌ها اعمال
                می‌شود.
            </Typography>

            <Grid container spacing={2}>
                {brandColors.map((item) => (
                    <Grid item key={item.color}>
                        <Tooltip title={item.name} TransitionComponent={Zoom} arrow>
                            <Box
                                onClick={() => changePrimaryColor(item.color)}
                                sx={{
                                    width: 45,
                                    height: 45,
                                    bgcolor: item.color,
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: primaryColor === item.color
                                        ? `0 0 0 4px white, 0 0 0 7px ${item.color}`
                                        : '0 4px 6px rgba(0,0,0,0.1)',
                                    '&:hover': {transform: 'scale(1.15)'}
                                }}
                            >
                                {primaryColor === item.color && (
                                    <CheckIcon sx={{
                                        color: '#fff',
                                        fontSize: 28,
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                    }}/>
                                )}
                            </Box>
                        </Tooltip>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default ThemeSettings;