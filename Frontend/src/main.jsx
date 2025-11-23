// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMomentJalaali } from '@mui/x-date-pickers/AdapterMomentJalaali';

// --- ✅ تغییرات در این بخش اعمال شد ---
const rtlTheme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'dark',
    primary: {
      main: '#3da9fc',
      light: '#e1f5fe',
      dark: '#0a7bc2',
    },
    secondary: {
      main: '#ffab40',
    },
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
    text: {
      primary: '#c9d1d9',
      secondary: '#8b949e',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: 'Tahoma, Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 'bold',
    }
  },
  components: {
    // استایل پیش‌فرض برای تمام Paper ها
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    // استایل پیش‌فرض برای دکمه‌های اصلی
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: '#ffffff',
        },
      },
    },

    // --- ✅✅✅ بخش کلیدی اضافه شده ---
    // این بخش به صورت خودکار تمام متن‌های داخل لیست‌ها را راست‌چین می‌کند
    MuiListItemText: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        }
      }
    },
    // این بخش تمام متن‌های عادی را راست‌چین می‌کند
    MuiTypography: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        }
      }
    },
    // این بخش تیتر دیالوگ‌ها (پاپ‌آپ‌ها) را راست‌چین می‌کند
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        }
      }
    },
    // --- ✅✅✅ پایان بخش اضافه شده ---
  },
  shape: {
    borderRadius: 8,
  },
});
// --- پایان تم جدید ---

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={rtlTheme}>
            <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
              <CssBaseline />
              <App />
            </LocalizationProvider>
          </ThemeProvider>
        </CacheProvider>
      </SnackbarProvider>
    </BrowserRouter>
  </React.StrictMode>
);