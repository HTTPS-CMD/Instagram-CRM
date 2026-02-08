// src/components/BreadcrumbsNav.jsx
import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';

// 1. نقشه ترجمه مسیرها (هر مسیر جدیدی ساختی اینجا اسم فارسیش رو اضافه کن)
const routeNameMap = {
    'dashboard': 'داشبورد',
    'projects': 'مدیریت پروژه‌ها',
    'new': 'ایجاد جدید',
    'edit': 'ویرایش',
    'calendar': 'تقویم جامع',
    'meetings': 'جلسات',
    'filming': 'آفیش فیلمبرداری',
    'posts': 'برنامه محتوایی',
    'financials': 'امور مالی',
    'users': 'مشتریان',
    'personnel': 'پرسنل',
    'tasks': 'کارتابل وظایف',
    'automation': 'اتوماسیون',
    'gantt': 'نمای زمانی (گانت)',
    'leads': 'کاریز فروش',
    'target-audience': 'مخاطبین هدف',
    'services': 'خدمات اضافه',
    'logs': 'گزارشات سیستم',
    'chat': 'گفتگوها',
    'trash': 'زباله‌دان',
    'settings': 'تنظیمات',
    'profile': 'پروفایل کاربری'
};

const BreadcrumbsNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // مسیر جاری را می‌گیریم و تکه تکه می‌کنیم (مثلاً /projects/new می‌شود ['projects', 'new'])
    const pathnames = location.pathname.split('/').filter((x) => x);

    // اگر در صفحه اصلی داشبورد هستیم، نان‌خرده نشان نده (چون لازم نیست)
    if (location.pathname === '/dashboard' || location.pathname === '/') {
        return null;
    }

    return (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" sx={{color: 'text.secondary', opacity: 0.5}} />}
                aria-label="breadcrumb"
            >
                {/* 2. لینک خانه (داشبورد) همیشه اول هست */}
                <Link
                    underline="hover"
                    color="inherit"
                    onClick={() => navigate('/dashboard')}
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', color: 'text.secondary' }}
                >
                    <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
                    خانه
                </Link>

                {/* 3. حلقه روی بخش‌های آدرس برای ساخت لینک‌ها */}
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                    // اگر اسم ترجمه شده داشتیم بذار، وگرنه خود کلمه انگلیسی رو نشون بده (برای ID ها و ...)
                    // اگر عدد بود (مثل ID پروژه) کلمه "جزئیات" رو نشون بده
                    let displayName = routeNameMap[value];
                    if (!displayName) {
                        displayName = !isNaN(value) ? 'جزئیات' : value;
                    }

                    return last ? (
                        // آخرین آیتم (صفحه فعلی) - لینک نیست، متنه
                        <Typography key={to} color="text.primary" sx={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            fontFamily: 'Peyda',
                            color: 'primary.main'
                        }}>
                            {displayName}
                        </Typography>
                    ) : (
                        // آیتم‌های وسط - لینک هستند
                        <Link
                            key={to}
                            underline="hover"
                            color="inherit"
                            onClick={() => navigate(to)}
                            sx={{ cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Peyda', color: 'text.secondary' }}
                        >
                            {displayName}
                        </Link>
                    );
                })}
            </Breadcrumbs>
        </Box>
    );
};

export default BreadcrumbsNav;