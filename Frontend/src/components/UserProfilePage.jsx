// src/components/UserProfilePage.jsx
import React, {useEffect, useState} from 'react';
import {
    alpha,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Lock as LockIcon,
    Save as SaveIcon,
    UploadFile as UploadIcon
} from '@mui/icons-material';
import {changePassword, getUserProfile, updateUserProfile} from '../api';
import {useSnackbar} from 'notistack';
import {useNavigate} from 'react-router-dom';

function UserProfilePage() {
    const navigate = useNavigate();
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم

    const [profile, setProfile] = useState({username: '', full_name: '', email: '', avatar: null, role: ''});
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [passData, setPassData] = useState({old_password: '', new_password: '', confirm_password: ''});
    const [passLoading, setPassLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getUserProfile();
            setProfile(res.data);
            setPreviewAvatar(res.data.avatar);
        } catch (err) {
            enqueueSnackbar('خطا در دریافت پروفایل', {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const {name, value, files} = e.target;
        if (files) {
            setProfile(prev => ({...prev, avatar: files[0]}));
            setPreviewAvatar(URL.createObjectURL(files[0]));
        } else {
            setProfile(prev => ({...prev, [name]: value}));
        }
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        const formData = new FormData();
        formData.append('full_name', profile.full_name || '');
        formData.append('email', profile.email || '');
        if (profile.avatar instanceof File) formData.append('avatar', profile.avatar);

        try {
            await updateUserProfile(formData);
            enqueueSnackbar('پروفایل بروزرسانی شد', {variant: 'success'});
        } catch (err) {
            enqueueSnackbar('خطا در ویرایش', {variant: 'error'});
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        if (passData.new_password !== passData.confirm_password) {
            enqueueSnackbar('تکرار رمز عبور مطابقت ندارد', {variant: 'warning'});
            return;
        }
        setPassLoading(true);
        try {
            await changePassword({old_password: passData.old_password, new_password: passData.new_password});
            enqueueSnackbar('رمز عبور تغییر کرد', {variant: 'success'});
            setPassData({old_password: '', new_password: '', confirm_password: ''});
        } catch (err) {
            enqueueSnackbar('خطا در تغییر رمز', {variant: 'error'});
        } finally {
            setPassLoading(false);
        }
    };

    // استایل‌های داینامیک
    const glassCardSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4],
        p: 3
    };

    const textFieldSx = {
        '& .MuiInputLabel-root': {color: theme.palette.text.secondary},
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': {borderColor: theme.palette.divider},
            '&:hover fieldset': {borderColor: theme.palette.text.primary},
            '&.Mui-focused fieldset': {borderColor: theme.palette.primary.main},
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress/></Box>;

    return (
        <Box sx={{width: '100%', maxWidth: '1600px', mx: 'auto'}}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold" sx={{
                    color: theme.palette.text.primary,
                    textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>پروفایل کاربری</Typography>
                <Button variant="outlined" sx={{color: theme.palette.text.primary, borderColor: theme.palette.divider}}
                        startIcon={<ArrowBackIcon/>} onClick={() => navigate('/dashboard')}>
                    بازگشت
                </Button>
            </Stack>

            <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                    <Paper sx={glassCardSx}>
                        <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">اطلاعات حساب
                            کاربری</Typography>
                        <Divider sx={{mb: 3, borderColor: theme.palette.divider}}/>

                        <Stack direction="row" spacing={3} alignItems="center" mb={4}>
                            <Avatar src={previewAvatar} sx={{
                                width: 100,
                                height: 100,
                                bgcolor: 'primary.main',
                                fontSize: 40,
                                border: `4px solid ${theme.palette.divider}`
                            }}>
                                {profile.full_name ? profile.full_name.charAt(0) : profile.username.charAt(0)}
                            </Avatar>
                            <Box>
                                <Button component="label" variant="contained" size="small" startIcon={<UploadIcon/>}
                                        sx={{bgcolor: 'primary.main', fontWeight: 'bold'}}>
                                    آپلود عکس جدید
                                    <input type="file" hidden accept="image/*" onChange={handleProfileChange}/>
                                </Button>
                                <Typography variant="caption" display="block" mt={1} color="text.secondary">
                                    فرمت‌های مجاز: JPG, PNG
                                </Typography>
                            </Box>
                        </Stack>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}><TextField sx={textFieldSx} label="نام کاربری"
                                                                 value={profile.username} fullWidth disabled/></Grid>
                            <Grid item xs={12} md={6}><TextField sx={textFieldSx} label="نقش کاربری"
                                                                 value={profile.role} fullWidth disabled/></Grid>
                            <Grid item xs={12} md={6}><TextField sx={textFieldSx} label="نام و نام خانوادگی"
                                                                 name="full_name" value={profile.full_name}
                                                                 onChange={handleProfileChange} fullWidth/></Grid>
                            <Grid item xs={12} md={6}><TextField sx={textFieldSx} label="ایمیل" name="email"
                                                                 value={profile.email} onChange={handleProfileChange}
                                                                 fullWidth/></Grid>
                        </Grid>

                        <Box mt={3} textAlign="left">
                            <Button variant="contained" sx={{bgcolor: 'primary.main', fontWeight: 'bold'}}
                                    startIcon={<SaveIcon/>} onClick={handleUpdateProfile} disabled={updating}>
                                {updating ? <CircularProgress size={24} color="inherit"/> : 'ذخیره تغییرات'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Paper sx={glassCardSx}>
                        <Typography variant="h6" gutterBottom color="warning.main" fontWeight="bold"
                                    sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <LockIcon/> امنیت و رمز عبور
                        </Typography>
                        <Divider sx={{mb: 3, borderColor: theme.palette.divider}}/>

                        <Stack spacing={3}>
                            <TextField sx={textFieldSx} label="رمز عبور فعلی" type="password" fullWidth
                                       value={passData.old_password}
                                       onChange={(e) => setPassData({...passData, old_password: e.target.value})}/>
                            <TextField sx={textFieldSx} label="رمز عبور جدید" type="password" fullWidth
                                       value={passData.new_password}
                                       onChange={(e) => setPassData({...passData, new_password: e.target.value})}/>
                            <TextField sx={textFieldSx} label="تکرار رمز عبور جدید" type="password" fullWidth
                                       value={passData.confirm_password}
                                       onChange={(e) => setPassData({...passData, confirm_password: e.target.value})}/>

                            <Button variant="contained" color="warning" fullWidth onClick={handleChangePassword}
                                    disabled={passLoading || !passData.old_password || !passData.new_password}>
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