// src/components/LoginPage.jsx
import React, { useState, useContext } from "react";
import { loginUser } from "../api";
import {
  Box, Typography, TextField, Button,
  CircularProgress, Alert, Avatar, InputAdornment, IconButton, Paper, useTheme, alpha
} from "@mui/material";
import {
    LockOutlined as LockIcon,
    Person as PersonIcon,
    Visibility,
    VisibilityOff,
    VpnKey as KeyIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import { jwtDecode } from 'jwt-decode';
import { motion } from "framer-motion";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser(username, password);
      const { access, refresh } = response.data;

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
            background: `linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)`, // تم تیره و شیک
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        {/* --- المان‌های تزئینی پس‌زمینه --- */}
        <Box
            component={motion.div}
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
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
            animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            elevation={24}
            sx={{
                p: 5,
                width: '100%',
                maxWidth: 400,
                borderRadius: 4,
                bgcolor: alpha('#fff', 0.05), // شیشه‌ای تیره
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha('#fff', 0.1)}`,
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
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
                    boxShadow: `0 0 20px ${theme.palette.primary.main}`
                }}
            >
                <LockIcon fontSize="large" />
            </Avatar>

            <Typography component="h1" variant="h5" fontWeight="bold" color="white" gutterBottom>
                ورود به پنل مدیریت
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
                لطفاً اطلاعات کاربری خود را وارد کنید
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>

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
                                <PersonIcon color="primary" />
                            </InputAdornment>
                        ),
                        style: { color: '#fff' } // رنگ متن سفید
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main }
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
                                <KeyIcon color="primary" />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                        style: { color: '#fff' }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main }
                    }}
                />

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <Alert severity="error" variant="filled" sx={{ width: "100%", mt: 2, borderRadius: 2 }}>
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
                        '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.6)}`
                        },
                        transition: 'all 0.3s ease'
                    }}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={26} color="inherit" /> : "ورود به سیستم"}
                </Button>
            </Box>
        </Paper>

        {/* کپی‌رایت */}
        <Typography variant="caption" sx={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.3)' }}>
            © 2025 loremipsum.ads Management System
        </Typography>
    </Box>
  );
}

export default LoginPage;