// src/components/ErrorBoundary.jsx
import React from 'react';
import { Box, Typography, Button, Paper, alpha } from '@mui/material';
import { Refresh as RefreshIcon, BugReport as BugIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            // ✅ استفاده از رنگ پس‌زمینه تم (داینامیک)
            bgcolor: 'background.default',
            color: 'text.primary',
            p: 2,
            transition: 'background-color 0.3s ease'
          }}
        >
          <Paper
            elevation={10}
            sx={{
              p: 5,
              borderRadius: 5,
              textAlign: 'center',
              // ✅ استایل شیشه‌ای داینامیک با استفاده از تابع theme
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              color: 'text.primary',
              maxWidth: 500
            }}
          >
            <BugIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />

            <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
              اوپس! مشکلی پیش آمد.
            </Typography>

            <Typography variant="body1" sx={{ opacity: 0.7, mb: 4, color: 'text.secondary' }}>
              متاسفانه سیستم با یک خطای غیرمنتظره مواجه شد. نگران نباشید، احتمالاً با رفرش حل می‌شود.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              sx={{
                bgcolor: 'primary.main', // رنگ اصلی تم
                color: '#fff', // متن دکمه همیشه سفید
                borderRadius: 3,
                fontWeight: 'bold',
                px: 4,
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              تلاش مجدد
            </Button>

            {/* نمایش جزئیات خطا در حالت توسعه */}
            {process.env.NODE_ENV === 'development' && (
                <Box
                    mt={3}
                    p={2}
                    // ✅ باکس خطا هم با تم هماهنگ شد
                    sx={{
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                        borderRadius: 2,
                        textAlign: 'left',
                        border: (theme) => `1px dashed ${theme.palette.error.main}`
                    }}
                >
                    <Typography variant="caption" fontFamily="monospace" color="error.main">
                        {this.state.error && this.state.error.toString()}
                    </Typography>
                </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;