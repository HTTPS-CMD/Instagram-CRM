// src/components/ProjectTypeSelection.jsx
import React from 'react';
import { Box, Typography, Paper, Stack, Button, useTheme, alpha } from '@mui/material';
import { Instagram as InstaIcon, MovieCreation as MovieIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function ProjectTypeSelection() {
    const navigate = useNavigate();
    const theme = useTheme();

    const glassStyle = {
        p: 4, borderRadius: 5, cursor: 'pointer',
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'all 0.3s ease',
        textAlign: 'center',
        height: 300,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        '&:hover': {
            transform: 'translateY(-10px)',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderColor: theme.palette.primary.main,
            boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.2)}`
        }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

            <Typography variant="h3" fontWeight="900" gutterBottom sx={{ mb: 1 }}>نوع پروژه را انتخاب کنید</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 6, opacity: 0.8 }}>
                برای شروع، مشخص کنید که چه نوع قراردادی با مشتری دارید
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>

                {/* کارت ۱: اینستاگرام */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Paper
                        sx={glassStyle}
                        onClick={() => navigate('/project/create?type=instagram')}
                    >
                        <InstaIcon sx={{ fontSize: 80, mb: 2, color: '#E1306C' }} />
                        <Typography variant="h5" fontWeight="bold">مدیریت اینستاگرام</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 250 }}>
                            قرارداد ماهانه، تقویم محتوایی، مدیریت پیج، تولید ریلز و پست
                        </Typography>
                    </Paper>
                </motion.div>

                {/* کارت ۲: تیزر / پروژه تکی */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Paper
                        sx={glassStyle}
                        onClick={() => navigate('/project/create?type=teaser')}
                    >
                        <MovieIcon sx={{ fontSize: 80, mb: 2, color: '#ff9800' }} />
                        <Typography variant="h5" fontWeight="bold">پروژه تکی / تیزر</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 250 }}>
                            فیلم‌برداری تیزر تبلیغاتی، عکاسی، طراحی لوگو (بدون مدیریت پیج)
                        </Typography>
                    </Paper>
                </motion.div>

            </Stack>

            <Button
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 6, opacity: 0.7 }}
                color="inherit"
                onClick={() => navigate('/dashboard')}
            >
                بازگشت به داشبورد
            </Button>
        </Box>
    );
}

export default ProjectTypeSelection;