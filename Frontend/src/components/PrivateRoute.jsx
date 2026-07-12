// src/components/PrivateRoute.jsx
import React, {useContext} from 'react';
import {Navigate, Outlet} from 'react-router-dom';
import {UserContext} from '../App';
import {Box, CircularProgress, useTheme} from '@mui/material';

const PrivateRoute = ({children, allowedRoles}) => { // 👈 اضافه کردن children به پروپ‌ها
    const {user, loading} = useContext(UserContext);
    const theme = useTheme();

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                height: '100vh',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'background.default',
            }}>
                <CircularProgress/>
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace/>;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace/>;
    }

    // ✅ اصلاح اصلی اینجاست:
    // اگر children وجود داشت (مثل استفاده در App.jsx شما) آن را نشان بده
    // در غیر این صورت از Outlet استفاده کن
    return children ? children : <Outlet/>;
};

export default PrivateRoute;