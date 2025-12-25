// src/components/PrivateRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../App';
import { Box, CircularProgress, useTheme } from '@mui/material';

const PrivateRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(UserContext);
    const theme = useTheme(); // ✅ استفاده از تم برای دسترسی به رنگ‌ها

    // ۱. حالت لودینگ: وقتی هنوز داریم چک می‌کنیم کاربر کیست
    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                height: '100vh',
                justifyContent: 'center',
                alignItems: 'center',
                // ✅ پس‌زمینه داینامیک (در لایت سفید، در دارک تیره)
                bgcolor: 'background.default',
                color: 'text.primary'
            }}>
                <CircularProgress />
            </Box>
        );
    }

    // ۲. اگر کاربر اصلا لاگین نیست -> برو به لاگین
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // ۳. اگر نقش‌های مجاز مشخص شده‌اند اما کاربر آن نقش را ندارد -> برو به داشبورد (یا صفحه ۴۰۳)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    // ۴. همه چیز اوکی است -> صفحه فرزند (Outlet) را نشان بده
    return <Outlet />;
};

export default PrivateRoute;