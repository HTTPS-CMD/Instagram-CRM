// src/components/LoginPage.jsx
import React, {useContext, useState} from "react";
import {loginUser} from "../api";
import {
    Alert,
    alpha,
    Avatar,
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    useTheme
} from "@mui/material";
import {
    LockOutlined as LockIcon,
    Person as PersonIcon,
    Visibility,
    VisibilityOff,
    VpnKey as KeyIcon
} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {UserContext} from "../App";
import {jwtDecode} from 'jwt-decode';
import {motion} from "framer-motion";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const {setUser} = useContext(UserContext);
    const theme = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await loginUser(username, password);
            const {access, refresh} = response.data;

            localStorage.setItem("access_token", access);
            localStorage.setItem("refresh_token", refresh);

            const decodedToken = jwtDecode(access);
            setUser({
                id: decodedToken.user_id,
                role: decodedToken.is_superuser ? 'admin' : (decodedToken.role || 'client')
            });

            navigate("/dashboard");
        } catch (err) {
            console.error("Login Failed:", err);
            setError("نام کاربری یا رمز عبور اشتباه است.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                // ✅ گرادینت داینامیک: در لایت مود روشن و در دارک مود تیره
                background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)`
                    : `linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)`,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* --- المان‌های تزئینی پس‌زمینه --- */}
            <Box
                component={motion.div}
                animate={{y: [0, -20, 0], rotate: [0, 10, 0]}}
                transition={{duration: 6, repeat: Infinity, ease: "easeInOut"}}
                sx={{
                    position: 'absolute', top: '10%', left: '15%',
                    width: 300, height: 300,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    filter: 'blur(80px)'
                }}
            />
            <Box
                component={motion.div}
                animate={{y: [0, 30, 0], rotate: [0, -10, 0]}}
                transition={{duration: 8, repeat: Infinity, ease: "easeInOut"}}
                sx={{
                    position: 'absolute', bottom: '10%', right: '15%',
                    width: 250, height: 250,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    filter: 'blur(60px)'
                }}
            />

            {/* --- کارت لاگین --- */}
            <Paper
                component={motion.div}
                initial={{opacity: 0, scale: 0.9}}
                animate={{opacity: 1, scale: 1}}
                transition={{duration: 0.5}}
                elevation={24}
                sx={{
                    p: 5,
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 4,
                    // ✅ پس‌زمینه شیشه‌ای داینامیک
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: theme.shadows[10],
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 1
                }}
            >
                <Avatar
                    sx={{
                        m: 1, mb: 2,
                        bgcolor: 'primary.main',
                        width: 60, height: 60,
                        boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}`
                    }}
                >
                    <LockIcon fontSize="large"/>
                </Avatar>

                <Typography component="h1" variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                    ورود به پنل مدیریت
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={4}>
                    لطفاً اطلاعات کاربری خود را وارد کنید
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{width: '100%'}}>

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="نام کاربری"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon color="primary"/>
                                </InputAdornment>
                            ),
                            // ✅ رنگ متن اینپوت داینامیک شد (حذف color: white ثابت)
                            style: {color: theme.palette.text.primary}
                        }}
                        sx={{
                            // ✅ استایل‌های داینامیک برای بوردر و لیبل
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {borderColor: alpha(theme.palette.text.primary, 0.2)},
                                '&:hover fieldset': {borderColor: alpha(theme.palette.text.primary, 0.5)},
                                '&.Mui-focused fieldset': {borderColor: theme.palette.primary.main},
                            },
                            '& .MuiInputLabel-root': {color: theme.palette.text.secondary},
                            '& .MuiInputLabel-root.Mui-focused': {color: theme.palette.primary.main}
                        }}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="رمز عبور"
                        type={showPassword ? "text" : "password"}
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <KeyIcon color="primary"/>
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        sx={{color: theme.palette.text.secondary}}
                                    >
                                        {showPassword ? <VisibilityOff/> : <Visibility/>}
                                    </IconButton>
                                </InputAdornment>
                            ),
                            // ✅ رنگ متن اینپوت داینامیک شد
                            style: {color: theme.palette.text.primary}
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {borderColor: alpha(theme.palette.text.primary, 0.2)},
                                '&:hover fieldset': {borderColor: alpha(theme.palette.text.primary, 0.5)},
                                '&.Mui-focused fieldset': {borderColor: theme.palette.primary.main},
                            },
                            '& .MuiInputLabel-root': {color: theme.palette.text.secondary},
                            '& .MuiInputLabel-root.Mui-focused': {color: theme.palette.primary.main}
                        }}
                    />

                    {error && (
                        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}}>
                            <Alert severity="error" variant="filled" sx={{width: "100%", mt: 2, borderRadius: 2}}>
                                {error}
                            </Alert>
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{
                            mt: 4, mb: 2, py: 1.5,
                            fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 3,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                            boxShadow: `0 5px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                            color: '#fff', // متن دکمه همیشه سفید باشد (چون دکمه رنگی است)
                            '&:hover': {
                                background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.6)}`
                            },
                            transition: 'all 0.3s ease'
                        }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={26} color="inherit"/> : "ورود به سیستم"}
                    </Button>
                </Box>
            </Paper>

            {/* کپی‌رایت */}
            <Typography variant="caption"
                        sx={{position: 'absolute', bottom: 20, color: theme.palette.text.secondary, opacity: 0.7}}>
                © 2025 loremipsum.ads Management System
            </Typography>
        </Box>
    );
}

export default LoginPage;