// src/components/UserProfilePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button, Avatar, Stack, Divider, Alert, CircularProgress
} from '@mui/material';
import { Save as SaveIcon, Lock as LockIcon, UploadFile as UploadIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { getUserProfile, updateUserProfile, changePassword } from '../api';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';

function UserProfilePage() {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    // const { setUser } = useContext(UserContext); // اگر بخواهید عکس هدر را هم آپدیت کنید

    const [profile, setProfile] = useState({
        username: '',
        full_name: '',
        email: '',
        avatar: null,
        role: ''
    });
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // استیت‌های تغییر رمز
    const [passData, setPassData] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [passLoading, setPassLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getUserProfile();
            setProfile(res.data);
            setPreviewAvatar(res.data.avatar); // نمایش عکس فعلی
        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در دریافت اطلاعات پروفایل', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            // اگر فایل انتخاب شد، پیش‌نمایش آن را بساز
            setProfile(prev => ({ ...prev, avatar: files[0] }));
            setPreviewAvatar(URL.createObjectURL(files[0]));
        } else {
            setProfile(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        const formData = new FormData();
        formData.append('full_name', profile.full_name || '');
        formData.append('email', profile.email || '');

        // فقط اگر عکس جدیدی انتخاب شده باشد، آن را بفرست
        if (profile.avatar instanceof File) {
            formData.append('avatar', profile.avatar);
        }

        try {
            await updateUserProfile(formData);
            enqueueSnackbar('پروفایل با موفقیت بروزرسانی شد', { variant: 'success' });
            // اینجا می‌توانید کانتکست را هم آپدیت کنید تا عکس هدر عوض شود
        } catch (err) {
            enqueueSnackbar('خطا در ویرایش پروفایل', { variant: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        if (passData.new_password !== passData.confirm_password) {
            enqueueSnackbar('تکرار رمز عبور با رمز جدید مطابقت ندارد', { variant: 'warning' });
            return;
        }
        setPassLoading(true);
        try {
            await changePassword({
                old_password: passData.old_password,
                new_password: passData.new_password
            });
            enqueueSnackbar('رمز عبور با موفقیت تغییر کرد', { variant: 'success' });
            setPassData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            let msg = 'خطا در تغییر رمز.';
            if (err.response && err.response.data) {
                // نمایش پیام خطای دقیق از سمت سرور (مثلاً رمز اشتباه است)
                msg = Object.values(err.response.data).flat().join('\n');
            }
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setPassLoading(false);
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">پروفایل کاربری</Typography>
                <Button variant="outlined" color="inherit" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}>
                    بازگشت
                </Button>
            </Stack>

            <Grid container spacing={4}>
                {/* --- بخش ۱: اطلاعات فردی --- */}
                <Grid item xs={12} md={7}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom color="primary">اطلاعات حساب کاربری</Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Stack direction="row" spacing={3} alignItems="center" mb={4}>
                            <Avatar
                                src={previewAvatar}
                                sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 40 }}
                            >
                                {profile.full_name ? profile.full_name.charAt(0) : profile.username.charAt(0)}
                            </Avatar>
                            <Box>
                                <Button component="label" variant="contained" size="small" startIcon={<UploadIcon />}>
                                    آپلود عکس جدید
                                    <input type="file" hidden accept="image/*" onChange={handleProfileChange} />
                                </Button>
                                <Typography variant="caption" display="block" mt={1} color="text.secondary">
                                    فرمت‌های مجاز: JPG, PNG
                                </Typography>
                            </Box>
                        </Stack>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField label="نام کاربری" value={profile.username} fullWidth disabled helperText="غیرقابل تغییر" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="نقش کاربری" value={profile.role} fullWidth disabled />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="نام و نام خانوادگی"
                                    name="full_name"
                                    value={profile.full_name}
                                    onChange={handleProfileChange}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="ایمیل"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleProfileChange}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>

                        <Box mt={3} textAlign="left">
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleUpdateProfile}
                                disabled={updating}
                            >
                                {updating ? <CircularProgress size={24} color="inherit" /> : 'ذخیره تغییرات'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* --- بخش ۲: تغییر رمز --- */}
                <Grid item xs={12} md={5}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom color="warning.main" sx={{display:'flex', alignItems:'center', gap:1}}>
                            <LockIcon /> امنیت و رمز عبور
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Stack spacing={3}>
                            <TextField
                                label="رمز عبور فعلی" type="password" fullWidth
                                value={passData.old_password}
                                onChange={(e) => setPassData({...passData, old_password: e.target.value})}
                            />
                            <TextField
                                label="رمز عبور جدید" type="password" fullWidth
                                value={passData.new_password}
                                onChange={(e) => setPassData({...passData, new_password: e.target.value})}
                            />
                            <TextField
                                label="تکرار رمز عبور جدید" type="password" fullWidth
                                value={passData.confirm_password}
                                onChange={(e) => setPassData({...passData, confirm_password: e.target.value})}
                            />

                            <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                onClick={handleChangePassword}
                                disabled={passLoading || !passData.old_password || !passData.new_password}
                            >
                                {passLoading ? <CircularProgress size={24} color="inherit"/> : 'تغییر رمز عبور'}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default UserProfilePage;