// src/components/ProjectTypeSelection.jsx
import React from 'react';
import {alpha, Box, Button, Paper, Stack, Typography, useTheme} from '@mui/material';
import {ArrowBack as ArrowBackIcon, Instagram as InstaIcon, MovieCreation as MovieIcon} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';

function ProjectTypeSelection() {
    const navigate = useNavigate();
    const theme = useTheme(); // ✅ استفاده از تم

    // ✅ استایل شیشه‌ای داینامیک (سازگار با لایت و دارک)
    const glassStyle = {
        p: 5, borderRadius: 6, cursor: 'pointer',
        bgcolor: alpha(theme.palette.background.paper, 0.6), // پس‌زمینه شیشه‌ای داینامیک
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        textAlign: 'center',
        height: 320,
        width: 300,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        boxShadow: theme.shadows[4],
        color: theme.palette.text.primary,
        '&:hover': {
            transform: 'translateY(-10px)',
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            borderColor: theme.palette.primary.main,
            boxShadow: `0 20px 50px ${alpha(theme.palette.primary.main, 0.2)}`
        }
    };

    return (
        <Box sx={{
            height: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>

            <Typography variant="h3" fontWeight="900" gutterBottom sx={{
                mb: 1,
                color: theme.palette.text.primary,
                textShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : 'none'
            }}>
                نوع پروژه را انتخاب کنید
            </Typography>
            <Typography variant="h6" sx={{mb: 6, opacity: 0.7, color: theme.palette.text.secondary}}>
                برای شروع، مشخص کنید که چه نوع قراردادی با مشتری دارید
            </Typography>

            <Stack direction={{xs: 'column', md: 'row'}} spacing={4}>

                {/* کارت ۱: اینستاگرام */}
                <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                    <Paper
                        sx={glassStyle}
                        onClick={() => navigate('/project/create?type=instagram')}
                    >
                        <InstaIcon sx={{
                            fontSize: 90,
                            mb: 3,
                            color: '#E1306C',
                            filter: 'drop-shadow(0 0 10px rgba(225, 48, 108, 0.4))'
                        }}/>
                        <Typography variant="h5" fontWeight="bold">مدیریت اینستاگرام</Typography>
                        <Typography variant="body2" sx={{mt: 2, color: theme.palette.text.secondary}}>
                            قرارداد ماهانه، تقویم محتوایی، مدیریت پیج، تولید ریلز و پست
                        </Typography>
                    </Paper>
                </motion.div>

                {/* کارت ۲: تیزر / پروژه تکی */}
                <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                    <Paper
                        sx={glassStyle}
                        onClick={() => navigate('/project/create?type=teaser')}
                    >
                        <MovieIcon sx={{
                            fontSize: 90,
                            mb: 3,
                            color: theme.palette.warning.main,
                            filter: `drop-shadow(0 0 10px ${alpha(theme.palette.warning.main, 0.4)})`
                        }}/>
                        <Typography variant="h5" fontWeight="bold">پروژه تکی / تیزر</Typography>
                        <Typography variant="body2" sx={{mt: 2, color: theme.palette.text.secondary}}>
                            فیلم‌برداری تیزر تبلیغاتی، عکاسی، طراحی لوگو (بدون مدیریت پیج)
                        </Typography>
                    </Paper>
                </motion.div>

            </Stack>

            <Button
                startIcon={<ArrowBackIcon/>}
                sx={{
                    mt: 8,
                    opacity: 0.8,
                    color: theme.palette.text.primary,
                    borderColor: theme.palette.divider,
                    '&:hover': {borderColor: theme.palette.text.primary}
                }}
                variant="outlined"
                onClick={() => navigate('/dashboard')}
            >
                بازگشت به داشبورد
            </Button>
        </Box>
    );
}

export default ProjectTypeSelection;