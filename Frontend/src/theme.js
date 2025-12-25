// src/theme.js
import { createTheme } from '@mui/material/styles';

// تابعی که بر اساس حالت (mode) تم را می‌سازد
export const getDesignTokens = (mode) => ({
  direction: 'rtl', // راست‌چین بودن کل سیستم
  palette: {
    mode,
    ...(mode === 'dark'
      ? {
          // 🌑 پالت رنگی دارک (همان رنگ‌های قبلی شما)
          primary: {
            main: '#3da9fc',
            dark: '#2c8bb9',
            light: '#6ec6ff',
          },
          secondary: {
            main: '#ff4081',
          },
          background: {
            default: '#0f2027',
            paper: '#06659f', // رنگ خاصی که ست کرده بودید
          },
          text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
          },
          error: {
            main: '#ef5350',
          },
          warning: {
            main: '#ff9800',
          },
          success: {
            main: '#00e676',
          },
        }
      : {
          // ☀️ پالت رنگی لایت (برای روز)
          primary: {
            main: '#095c91', // آبی تیره‌تر برای خوانایی روی سفید
            dark: '#003c6c',
            light: '#4dabf5',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: '#f4f6f8', // خاکستری خیلی روشن
            paper: '#ffffff',   // سفید خالص
          },
          text: {
            primary: '#121212',
            secondary: 'rgba(0, 0, 0, 0.6)',
          },
          error: {
            main: '#d32f2f',
          },
          warning: {
            main: '#ed6c02',
          },
          success: {
            main: '#2e7d32',
          },
        }),
  },
  typography: {
    fontFamily: '"Vazir", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    button: { fontWeight: 'bold' },
  },
  components: {
    // شخصی‌سازی دکمه‌ها
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          boxShadow: 'none',
        },
        containedPrimary: {
          background: mode === 'dark'
            ? 'linear-gradient(45deg, #3da9fc 30%, #0077c2 90%)'
            : 'linear-gradient(45deg, #095c91 30%, #003c6c 90%)',
        },
      },
    },
    // شخصی‌سازی کارت‌ها و کاغذها
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    // شخصی‌سازی فیلدهای ورودی
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& fieldset': {
            // رنگ بوردر اینپوت‌ها بر اساس تم تنظیم می‌شود
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.23)',
          },
        },
      },
    },
  },
});