// src/components/NotFoundPage.jsx
import React from 'react';
import {Box, Button, Container, Paper, Stack, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Explore as ExploreIcon, KeyboardBackspace as BackIcon} from '@mui/icons-material';
import {keyframes} from '@emotion/react';

// 1. تعریف انیمیشن شناور (Floating Animation)
const float = keyframes`
    0% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-20px);
    }
    100% {
        transform: translateY(0px);
    }
`;

// 2. تعریف انیمیشن درخشش (Glow Animation)
const pulse = keyframes`
    0% {
        opacity: 0.4;
        transform: scale(1);
    }
    50% {
        opacity: 0.6;
        transform: scale(1.05);
    }
    100% {
        opacity: 0.4;
        transform: scale(1);
    }
`;

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // پس‌زمینه تاریک و عمیق
                background: 'radial-gradient(circle at center, #1a2a3a 0%, #0f2027 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                p: 3
            }}
        >
            {/* --- المان‌های نوری پس‌زمینه (Ambient Light Orbs) --- */}
            <Box sx={{
                position: 'absolute', top: '20%', left: '20%',
                width: '300px', height: '300px',
                background: 'linear-gradient(45deg, #3da9fc, #8e44ad)',
                filter: 'blur(120px)', opacity: 0.4, borderRadius: '50%',
                animation: `${pulse} 8s infinite ease-in-out`, zIndex: 0
            }}/>
            <Box sx={{
                position: 'absolute', bottom: '10%', right: '10%',
                width: '250px', height: '250px',
                background: 'linear-gradient(45deg, #ff4081, #ff6b6b)',
                filter: 'blur(100px)', opacity: 0.3, borderRadius: '50%',
                animation: `${pulse} 10s infinite ease-in-out reverse`, zIndex: 0
            }}/>


            <Container maxWidth="md" sx={{position: 'relative', zIndex: 1}}>
                {/* --- باکس شیشه‌ای محتوا (Glassmorphism Card) --- */}
                <Paper
                    elevation={0}
                    sx={{
                        p: {xs: 4, md: 6},
                        textAlign: 'center',
                        // افکت شیشه‌ای
                        backdropFilter: 'blur(16px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 5,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    <Stack spacing={3} alignItems="center">
                        {/* --- عدد 404 بزرگ و گرادینت --- */}
                        <Typography
                            variant="h1"
                            sx={{
                                fontSize: {xs: '8rem', md: '12rem'},
                                fontWeight: 900,
                                lineHeight: 1,
                                // ساختن متن گرادینت
                                background: 'linear-gradient(135deg, #3da9fc 20%, #ff4081 80%)',
                                backgroundClip: 'text',
                                textFillColor: 'transparent',
                                // سایه نوری دور متن
                                textShadow: '0 0 40px rgba(61, 169, 252, 0.4)',
                                animation: `${float} 6s ease-in-out infinite`,
                                fontFamily: 'sans-serif', // فونت انگلیسی برای عدد بهتر است
                                letterSpacing: -5
                            }}
                        >
                            404
                        </Typography>

                        <Box>
                            <Typography variant="h4" fontWeight="bold" textAlign={"center"} gutterBottom
                                        sx={{color: '#fff'}}>
                                اوپس! اینجا بن‌بسته.
                            </Typography>
                            <Typography variant="h6" textAlign={"center"} sx={{
                                color: 'rgba(255,255,255,0.6)',
                                fontWeight: 'normal',
                                maxWidth: 500,
                                mx: 'auto'
                            }}>
                                به نظر می‌رسه صفحه‌ای که دنبالش می‌گردی وجود نداره یا آدرس رو اشتباه تایپ کردی.
                            </Typography>
                        </Box>

                        {/* --- دکمه‌ها --- */}
                        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} mt={2}>
                            {/* دکمه بازگشت (صفحه قبل) */}
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<BackIcon/>}
                                onClick={() => navigate(-1)}
                                sx={{
                                    borderRadius: 3,
                                    px: 3, py: 1.5,
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    color: 'rgba(255,255,255,0.8)',
                                    '&:hover': {
                                        borderColor: 'white',
                                        color: 'white',
                                        bgcolor: 'rgba(255,255,255,0.05)'
                                    }
                                }}
                            >
                                بازگشت به قبل
                            </Button>

                            {/* دکمه اصلی (داشبورد) */}
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<ExploreIcon/>}
                                onClick={() => navigate('/dashboard')}
                                sx={{
                                    borderRadius: 3,
                                    px: 4, py: 1.5,
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    background: 'linear-gradient(90deg, #3da9fc, #0077c2)',
                                    boxShadow: '0 0 20px rgba(61, 169, 252, 0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #2c8bb9, #005c99)',
                                        boxShadow: '0 0 30px rgba(61, 169, 252, 0.6)',
                                    }
                                }}
                            >
                                رفتن به داشبورد
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default NotFoundPage;