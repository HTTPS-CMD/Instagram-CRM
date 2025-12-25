// src/main.jsx
import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

// ✅ ایمپورت‌های مربوط به مدیریت تم پویا
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { getDesignTokens } from './theme'; // تابعی که در مرحله قبل ساختیم
import { ColorModeContext } from './themeContext'; // کانتکست جدید

// تنظیمات راست‌چین
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMomentJalaali } from '@mui/x-date-pickers/AdapterMomentJalaali';

// کش برای RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

function Main() {
  // ✅ استیت برای ذخیره حالت فعلی (پیش‌فرض روی دارک)
  const [mode, setMode] = useState('dark');

  // ✅ تابع تغییر تم که به کل برنامه پاس داده می‌شود
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode]
  );

  // ✅ ساخت تم بر اساس مود انتخاب شده
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <CacheProvider value={cacheRtl}>
          {/* پروایدر کانتکست رنگ برای دسترسی دکمه تغییر تم */}
          <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
              <CssBaseline /> {/* ریست استایل‌ها بر اساس تم جدید */}
              <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
                <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </SnackbarProvider>
              </LocalizationProvider>
            </ThemeProvider>
          </ColorModeContext.Provider>
        </CacheProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />);