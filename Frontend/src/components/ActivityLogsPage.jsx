// src/components/ActivityLogsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Stack, CircularProgress,
    TextField, InputAdornment
} from '@mui/material';
import {
    History as HistoryIcon,
    Search as SearchIcon,
    AddCircle as CreateIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { getActivityLogs } from '../api';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';
import moment from 'jalali-moment';

const ACTION_COLORS = {
    'ایجاد': 'success',
    'ویرایش': 'warning',
    'حذف': 'error',
    'تایید': 'info'
};

const ACTION_ICONS = {
    'ایجاد': <CreateIcon fontSize="small"/>,
    'حذف': <DeleteIcon fontSize="small"/>,
    'ویرایش': <EditIcon fontSize="small"/>
};

function ActivityLogsPage() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user && user.role !== 'admin') navigate('/dashboard');
        fetchLogs();
    }, [user]);

    const fetchLogs = async () => {
        try {
            const res = await getActivityLogs();
            setLogs(res.data);
            setFilteredLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const result = logs.filter(log =>
            log.user_name?.includes(search) ||
            log.description?.includes(search) ||
            log.model_name?.includes(search)
        );
        setFilteredLogs(result);
    }, [search, logs]);

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" sx={{display:'flex', alignItems:'center', gap:1}}>
                    <HistoryIcon fontSize="large" color="primary"/> گزارش فعالیت‌ها
                </Typography>
                <TextField
                    size="small"
                    placeholder="جستجو در لاگ‌ها..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>}}
                    sx={{bgcolor:'background.paper'}}
                />
            </Stack>

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell>کاربر</TableCell>
                            <TableCell>عملیات</TableCell>
                            <TableCell>بخش</TableCell>
                            <TableCell>توضیحات</TableCell>
                            <TableCell>پروژه</TableCell>
                            <TableCell>تاریخ و زمان</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLogs.map((log) => (
                            <TableRow key={log.id} hover>
                                <TableCell>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" fontWeight="bold">{log.user_name || 'ناشناس'}</Typography>
                                        <Chip label={log.user_role} size="small" variant="outlined" sx={{fontSize:'0.6rem', height:18}}/>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={ACTION_ICONS[log.action_type]}
                                        label={log.action_type}
                                        color={ACTION_COLORS[log.action_type] || 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{log.model_name}</TableCell>
                                <TableCell sx={{maxWidth: 300}}>{log.description}</TableCell>
                                <TableCell>{log.project_name || '---'}</TableCell>
                                <TableCell dir="ltr" align="right">
                                    {moment(log.created_at).locale('fa').format('jYYYY/jMM/jDD - HH:mm:ss')}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredLogs.length === 0 && (
                            <TableRow><TableCell colSpan={6} align="center">هیچ فعالیتی ثبت نشده است.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default ActivityLogsPage;