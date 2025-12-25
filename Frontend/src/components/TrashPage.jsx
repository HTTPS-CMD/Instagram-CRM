// src/components/TrashPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Chip, Button, Stack, CircularProgress, alpha, useTheme
} from '@mui/material';
import {
    RestoreFromTrash as RestoreIcon,
    DeleteForever as HardDeleteIcon,
    Folder as ProjectIcon,
    Person as PersonIcon,
    DeleteSweep as TrashIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
    getTrashedProjects, restoreProject, hardDeleteProject,
    getTrashedUsers, restoreUser, hardDeleteUser
} from '../api';

function TabPanel({ children, value, index }) {
    return <div hidden={value !== index} style={{ marginTop: 24, width: '100%' }}>{value === index && children}</div>;
}

function TrashPage() {
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [deletedProjects, setDeletedProjects] = useState([]);
    const [deletedUsers, setDeletedUsers] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, uRes] = await Promise.all([
                getTrashedProjects(),
                getTrashedUsers()
            ]);
            setDeletedProjects(pRes.data);
            setDeletedUsers(uRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleRestore = async (type, id) => {
        try {
            if (type === 'project') {
                await restoreProject(id);
                setDeletedProjects(prev => prev.filter(p => p.id !== id));
            } else {
                await restoreUser(id);
                setDeletedUsers(prev => prev.filter(u => u.id !== id));
            }
            enqueueSnackbar('با موفقیت بازگردانی شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا در بازگردانی', { variant: 'error' }); }
    };

    const handleHardDelete = async (type, id) => {
        if (!window.confirm("هشدار: این آیتم برای همیشه پاک خواهد شد و قابل برگشت نیست!")) return;

        try {
            if (type === 'project') {
                await hardDeleteProject(id);
                setDeletedProjects(prev => prev.filter(p => p.id !== id));
            } else {
                await hardDeleteUser(id);
                setDeletedUsers(prev => prev.filter(u => u.id !== id));
            }
            enqueueSnackbar('برای همیشه حذف شد', { variant: 'info' });
        } catch (err) { enqueueSnackbar('خطا در حذف کامل', { variant: 'error' }); }
    };

    // استایل‌های داینامیک
    const glassCardSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4],
        p: 3,
        minHeight: 400
    };

    const tableHeadSx = {
        '& th': {
            bgcolor: alpha(theme.palette.action.hover, 0.1),
            color: theme.palette.text.secondary,
            borderBottom: `1px solid ${theme.palette.divider}`
        }
    };

    const tableBodySx = {
        '& td': {
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`
        },
        '& tr:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) }
    };

    if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

    return (
        <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={4}>
                <Typography variant="h4" fontWeight="900" sx={{
                    display:'flex', alignItems:'center', gap:1,
                    color: theme.palette.text.primary,
                    textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <TrashIcon fontSize="large" color="error" /> سطل زباله
                </Typography>
            </Stack>

            <Paper sx={glassCardSx}>
                <Tabs
                    value={tabIndex}
                    onChange={(e, v) => setTabIndex(v)}
                    sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '& .MuiTab-root': { color: theme.palette.text.secondary, '&.Mui-selected': { color: theme.palette.error.main } },
                        '& .MuiTabs-indicator': { backgroundColor: theme.palette.error.main }
                    }}
                >
                    <Tab icon={<ProjectIcon />} iconPosition="start" label={`پروژه‌ها (${deletedProjects.length})`} />
                    <Tab icon={<PersonIcon />} iconPosition="start" label={`کاربران (${deletedUsers.length})`} />
                </Tabs>

                {/* تب پروژه‌ها */}
                <TabPanel value={tabIndex} index={0}>
                    {deletedProjects.length === 0 ? <Typography p={5} align="center" color="text.secondary" sx={{textAlign:"left"}}>سطل زباله خالی است.</Typography> : (
                        <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                            <Table>
                                <TableHead sx={tableHeadSx}>
                                    <TableRow>
                                        <TableCell>نام پروژه</TableCell>
                                        <TableCell>آیدی صفحه</TableCell>
                                        <TableCell align="center">عملیات</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={tableBodySx}>
                                    {deletedProjects.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell fontWeight="bold">{p.project_name}</TableCell>
                                            <TableCell sx={{opacity:0.7}}>{p.page_username}</TableCell>
                                            <TableCell align="center">
                                                <Button size="small" variant="contained" color="success" startIcon={<RestoreIcon/>} onClick={() => handleRestore('project', p.id)} sx={{mr: 1, color:'#fff'}}>
                                                    بازگردانی
                                                </Button>
                                                <Button size="small" variant="outlined" color="error" startIcon={<HardDeleteIcon/>} onClick={() => handleHardDelete('project', p.id)}>
                                                    حذف دائم
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </TabPanel>

                {/* تب کاربران */}
                <TabPanel value={tabIndex} index={1}>
                    {deletedUsers.length === 0 ? <Typography p={5} align="center" color="text.secondary" textAlign={"right"}>سطل زباله خالی است.</Typography> : (
                        <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                            <Table>
                                <TableHead sx={tableHeadSx}>
                                    <TableRow>
                                        <TableCell>نام کاربری</TableCell>
                                        <TableCell>نام کامل</TableCell>
                                        <TableCell>نقش</TableCell>
                                        <TableCell align="center">عملیات</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={tableBodySx}>
                                    {deletedUsers.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell>{u.username}</TableCell>
                                            <TableCell>{u.full_name}</TableCell>
                                            <TableCell><Chip label={u.role} size="small" sx={{bgcolor: alpha(theme.palette.action.hover, 0.1), color: theme.palette.text.primary}} /></TableCell>
                                            <TableCell align="center">
                                                <Button size="small" variant="contained" color="success" startIcon={<RestoreIcon/>} onClick={() => handleRestore('user', u.id)} sx={{mr: 1, color:'#fff'}}>
                                                    بازگردانی
                                                </Button>
                                                <Button size="small" variant="outlined" color="error" startIcon={<HardDeleteIcon/>} onClick={() => handleHardDelete('user', u.id)}>
                                                    حذف دائم
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </TabPanel>
            </Paper>
        </Box>
    );
}

export default TrashPage;