// src/components/HelpPage.jsx
import React, {useState} from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    alpha,
    Box,
    Chip,
    Container,
    Grid,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    HelpOutline as HelpIcon,
    School as SchoolIcon,
    Search as SearchIcon,
    SupportAgent as SupportIcon,
    VideoLibrary as VideoIcon
} from '@mui/icons-material';

const faqs = [
    {
        category: 'عمومی',
        question: 'چطور می‌توانم رمز عبور خود را تغییر دهم؟',
        answer: 'به بخش "پروفایل کاربری" در منوی بالا سمت چپ بروید و روی گزینه "تغییر رمز عبور" کلیک کنید.'
    },
    {
        category: 'پروژه‌ها',
        question: 'چگونه یک پروژه جدید ایجاد کنم؟',
        answer: 'از منوی سمت راست وارد "مدیریت پروژه‌ها" شوید و دکمه "پروژه جدید" را بزنید. یا از کلید میانبر Ctrl+K استفاده کنید.'
    },
    {
        category: 'پروژه‌ها',
        question: 'تفاوت "پروژه فعال" و "آرشیو شده" چیست؟',
        answer: 'پروژه‌های فعال در داشبورد نمایش داده می‌شوند. پروژه‌هایی که قراردادشان تمام شده یا پرداخت انجام نشده، به صورت خودکار یا دستی آرشیو می‌شوند.'
    },
    {
        category: 'مالی',
        question: 'آیا فاکتورها به صورت خودکار برای مشتری ارسال می‌شوند؟',
        answer: 'خیر، اما شما می‌توانید از بخش "امور مالی" لینک فاکتور را کپی کرده و برای مشتری بفرستید.'
    },
    {
        category: 'تسک‌ها',
        question: 'چطور ساعت کاری‌ام را ثبت کنم؟',
        answer: 'در بالای تمام صفحات یک ویجت تایمر وجود دارد. کافیست روی دکمه "شروع" کلیک کنید و تسک مربوطه را انتخاب نمایید.'
    },
];

const HelpPage = () => {
    const theme = useTheme();
    const [search, setSearch] = useState('');

    const filteredFaqs = faqs.filter(f =>
        f.question.includes(search) || f.answer.includes(search)
    );

    return (
        <Container maxWidth="lg" sx={{py: 5}}>
            {/* هدر صفحه */}
            <Box textAlign="center" mb={6}>
                <Typography variant="h3" fontWeight="900" gutterBottom sx={{
                    background: 'linear-gradient(45deg, #3da9fc, #a16eff)',
                    backgroundClip: 'text', textFillColor: 'transparent'
                }}>
                    مرکز آموزش و پشتیبانی
                </Typography>
                <Typography variant="h6" color="text.secondary" mb={4}>
                    چطور می‌توانیم به شما کمک کنیم؟
                </Typography>

                {/* باکس جستجو */}
                <Paper sx={{
                    p: 1, display: 'flex', alignItems: 'center', width: '100%', maxWidth: 600, mx: 'auto',
                    borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[4]
                }}>
                    <TextField
                        fullWidth
                        placeholder="جستجو در سوالات..."
                        variant="standard"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            disableUnderline: true,
                            startAdornment: (
                                <InputAdornment position="start"><SearchIcon color="primary"/></InputAdornment>)
                        }}
                        sx={{px: 2}}
                    />
                </Paper>
            </Box>

            {/* کارت‌های دسترسی سریع */}
            <Grid container spacing={3} mb={6}>
                {[
                    {
                        title: 'راهنمای شروع',
                        icon: <SchoolIcon/>,
                        color: '#4caf50',
                        desc: 'آموزش گام‌به‌گام برای تازه‌واردها'
                    },
                    {
                        title: 'ویدیوهای آموزشی',
                        icon: <VideoIcon/>,
                        color: '#f44336',
                        desc: 'ویدیوهای کوتاه از نحوه کار با پنل'
                    },
                    {
                        title: 'پشتیبانی فنی',
                        icon: <SupportIcon/>,
                        color: '#ff9800',
                        desc: 'تماس با تیم فنی در صورت بروز مشکل'
                    },
                ].map((item, i) => (
                    <Grid item xs={12} md={4} key={i}>
                        <Paper sx={{
                            p: 3, borderRadius: 4, textAlign: 'center', cursor: 'pointer',
                            transition: '0.3s', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: theme.shadows[6],
                                borderColor: item.color
                            }
                        }}>
                            <Box sx={{
                                width: 60, height: 60, borderRadius: '50%', mx: 'auto', mb: 2,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: alpha(item.color, 0.1), color: item.color
                            }}>
                                {item.icon}
                            </Box>
                            <Typography variant="h6" fontWeight="bold">{item.title}</Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>{item.desc}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* بخش سوالات متداول (FAQ) */}
            <Typography variant="h5" fontWeight="bold" mb={3} display="flex" alignItems="center">
                <HelpIcon sx={{mr: 1, color: 'primary.main'}}/> سوالات متداول
            </Typography>

            <Box>
                {filteredFaqs.map((faq, index) => (
                    <Accordion key={index} sx={{
                        mb: 2, borderRadius: '16px !important',
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        backdropFilter: 'blur(10px)', border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none', '&:before': {display: 'none'}
                    }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Chip label={faq.category} size="small" sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                    fontWeight: 'bold'
                                }}/>
                                <Typography fontWeight="bold">{faq.question}</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography color="text.secondary" sx={{lineHeight: 1.8}}>
                                {faq.answer}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
                {filteredFaqs.length === 0 && (
                    <Typography textAlign="center" color="text.secondary" py={5}>
                        موردی یافت نشد.
                    </Typography>
                )}
            </Box>
        </Container>
    );
};

export default HelpPage;