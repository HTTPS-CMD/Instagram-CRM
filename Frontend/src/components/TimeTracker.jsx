// src/components/TimeTracker.jsx
import React, {useEffect, useState} from 'react';
import {alpha, Box, CircularProgress, IconButton, Tooltip, Typography, useTheme} from '@mui/material';
import {PlayArrow, Stop} from '@mui/icons-material';
import {getCurrentTimeLog, startTimeLog, stopTimeLog} from '../api';
import {useSnackbar} from 'notistack';

function TimeTracker({taskId, onStatusChange}) {
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم
    const [loading, setLoading] = useState(false);
    const [activeLog, setActiveLog] = useState(null);
    const [duration, setDuration] = useState(0);

    // بررسی اینکه آیا این تسک در حال اجراست؟
    useEffect(() => {
        checkStatus();
    }, [taskId]);

    // تایمر زنده
    useEffect(() => {
        let interval;
        if (activeLog && activeLog.task === taskId) {
            interval = setInterval(() => {
                const start = new Date(activeLog.start_time).getTime();
                const now = new Date().getTime();
                setDuration(Math.floor((now - start) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeLog, taskId]);

    const checkStatus = async () => {
        try {
            const res = await getCurrentTimeLog();
            if (res.data && res.data.task === taskId) {
                setActiveLog(res.data);
            } else {
                setActiveLog(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggle = async () => {
        setLoading(true);
        try {
            if (activeLog && activeLog.task === taskId) {
                // توقف
                await stopTimeLog("پایان کار");
                setActiveLog(null);
                setDuration(0);
                enqueueSnackbar('تایمر متوقف شد', {variant: 'info'});
            } else {
                // شروع (اول چک میکنیم تایمر دیگه‌ای روشن نباشه)
                const current = await getCurrentTimeLog();
                if (current.data) {
                    enqueueSnackbar('شما روی یک تسک دیگر فعال هستید! اول آن را متوقف کنید.', {variant: 'warning'});
                    setLoading(false);
                    return;
                }
                const res = await startTimeLog(taskId);
                setActiveLog(res.data);
                enqueueSnackbar('تایمر شروع شد ⏱️', {variant: 'success'});
            }
            if (onStatusChange) onStatusChange();
        } catch (err) {
            enqueueSnackbar('خطا در تغییر وضعیت', {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isActive = activeLog && activeLog.task === taskId;

    return (
        <Box display="flex" alignItems="center">
            {isActive && (
                <Typography variant="caption"
                            sx={{fontFamily: 'monospace', color: 'success.main', mr: 1, fontWeight: 'bold'}}>
                    {formatTime(duration)}
                </Typography>
            )}
            <Tooltip title={isActive ? "توقف کار" : "شروع کار"}>
                <IconButton
                    size="small"
                    onClick={handleToggle}
                    disabled={loading}
                    sx={{
                        // ✅ استایل داینامیک دکمه (سبز برای شروع، قرمز برای توقف)
                        bgcolor: isActive ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.success.main, 0.1),
                        color: isActive ? theme.palette.error.main : theme.palette.success.main,
                        border: '1px solid',
                        borderColor: isActive ? theme.palette.error.main : theme.palette.success.main,
                        '&:hover': {
                            bgcolor: isActive ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.success.main, 0.2)
                        }
                    }}
                >
                    {loading ? <CircularProgress size={16} color="inherit"/> : (
                        isActive ? <Stop fontSize="small"/> : <PlayArrow fontSize="small"/>
                    )}
                </IconButton>
            </Tooltip>
        </Box>
    );
}

export default TimeTracker;