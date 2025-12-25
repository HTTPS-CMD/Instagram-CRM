// src/components/UserManagementPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Avatar, Chip, Dialog,
    DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel,
    FormControl, CircularProgress, useTheme, alpha, Stack, Divider, Alert
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Search as SearchIcon, Person as PersonIcon, SupervisorAccount as AdminIcon,
    Brush as DesignIcon, Movie as VideoIcon, EditNote as WriterIcon,
    ContentCut as EditorIcon, Instagram as SocialIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getUsers, createUser, updateUser, deleteUser } from '../api';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';

const ROLE_CONFIG = {
    admin: { label: 'مدیر کل', color: 'error', icon: <AdminIcon /> },
    client: { label: 'مشتری', color: 'primary', icon: <PersonIcon /> },
    writer: { label: 'سناریو نویس', color: 'info', icon: <WriterIcon /> },
    videographer: { label: 'فیلم‌بردار', color: 'warning', icon: <VideoIcon /> },
    editor: { label: 'تدوین‌گر', color: 'secondary', icon: <EditorIcon /> },
    designer: { label: 'گرافیست', color: 'success', icon: <DesignIcon /> },
    social_admin: { label: 'ادمین پیج', color: 'default', icon: <SocialIcon /> },
};

function UserManagementPage({ mode = 'users' }) {
    const { user: currentUser } = useContext(UserContext);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const theme = useTheme(); // ✅ استفاده از تم

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const defaultRole = mode === 'clients' ? 'client' : 'writer';

    const [formData, setFormData] = useState({
        username: '', password: '', full_name: '', role: defaultRole, phone_number: ''
    });

    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    useEffect(() => { fetchUsers(); }, [mode]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await getUsers();
            const allUsers = Array.isArray(res.data) ? res.data : (res.data.results || []);
            if (mode === 'clients') {
                setUsers(allUsers.filter(u => u.role === 'client'));
            } else {
                setUsers(allUsers.filter(u => u.role !== 'client'));
            }
        } catch (err) { enqueueSnackbar('خطا در دریافت کاربران', { variant: 'error' }); }
        finally { setLoading(false); }
    };

    const filteredUsers = users.filter(u =>
        (u.username + u.full_name).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (user = null) => {
        setError(null);
        if (user) {
            setEditingUser(user);
            setFormData({ ...user, password: '' });
        } else {
            setEditingUser(null);
            setFormData({ username: '', password: '', full_name: '', role: defaultRole, phone_number: '' });
        }
        setOpenModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);
        try {
            const dataToSend = { ...formData };
            if (editingUser && !dataToSend.password) delete dataToSend.password;

            if (editingUser) {
                await updateUser(editingUser.id, dataToSend);
                enqueueSnackbar('کاربر ویرایش شد', { variant: 'success' });
            } else {
                await createUser(dataToSend);
                enqueueSnackbar('کاربر ایجاد شد', { variant: 'success' });
            }
            setOpenModal(false);
            fetchUsers();
        } catch (err) {
            let msg = "خطا در ذخیره اطلاعات.";
            if (err.response && err.response.data) {
                msg = Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join('\n');
            }
            setError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('آیا مطمئن هستید؟')) {
            try { await deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); enqueueSnackbar('حذف شد', { variant: 'success' }); }
            catch (err) { enqueueSnackbar('خطا در حذف', { variant: 'error' }); }
        }
    };

    // استایل‌های داینامیک
    const glassCardSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4]
    };

    const textFieldSx = {
        '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': { borderColor: theme.palette.divider },
            '&:hover fieldset': { borderColor: theme.palette.text.primary },
            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
        },
        '& .MuiSelect-icon': { color: theme.palette.text.primary }
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
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="900" sx={{
                    color: theme.palette.text.primary,
                    textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    {mode === 'clients' ? 'مدیریت مشتریان' : 'مدیریت پرسنل'}
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ bgcolor: 'primary.main', fontWeight: 'bold', px: 3, py: 1 }}>
                    افزودن {mode === 'clients' ? 'مشتری' : 'پرسنل'}
                </Button>
            </Stack>

            <Paper sx={{ ...glassCardSx, p: 3 }}>
                <Box mb={3} display="flex" alignItems="center" sx={{ bgcolor: alpha(theme.palette.action.hover, 0.05), borderRadius: 2, p: 1, border:`1px solid ${theme.palette.divider}` }}>
                    <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1, ml: 1 }} />
                    <TextField
                        variant="standard"
                        placeholder="جستجو در نام، نام کاربری..."
                        fullWidth
                        InputProps={{ disableUnderline: true, style: { color: theme.palette.text.primary } }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead sx={tableHeadSx}>
                            <TableRow>
                                <TableCell>کاربر</TableCell>
                                <TableCell>نقش</TableCell>
                                <TableCell>شماره تماس</TableCell>
                                <TableCell>عملیات</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={tableBodySx}>
                            {filteredUsers.map((u) => {
                                const roleInfo = ROLE_CONFIG[u.role] || { label: u.role, color: 'default', icon: <PersonIcon/> };
                                return (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar src={u.avatar} sx={{ bgcolor: 'primary.main' }}>{u.username[0]}</Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">{u.full_name || u.username}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{u.username}</Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip icon={roleInfo.icon} label={roleInfo.label} size="small" sx={{ bgcolor: alpha(theme.palette[roleInfo.color]?.main || theme.palette.grey[500], 0.1), color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }} />
                                        </TableCell>
                                        <TableCell>{u.phone_number || '---'}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => handleOpenModal(u)} color="info"><EditIcon /></IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(u.id)} color="error"><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* مودال فرم */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, backdropFilter: 'blur(10px)' } }}
            >
                <DialogTitle sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>
                    {editingUser ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{error}</Alert>}
                        <Grid container spacing={2}>
                            <Grid item xs={6}><TextField sx={textFieldSx} fullWidth label="نام کاربری (انگلیسی)" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} disabled={!!editingUser} /></Grid>
                            <Grid item xs={6}><TextField sx={textFieldSx} fullWidth label="رمز عبور" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></Grid>
                            <Grid item xs={12}><TextField sx={textFieldSx} fullWidth label="نام و نام خانوادگی" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /></Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth sx={textFieldSx}>
                                    <InputLabel>نقش کاربری</InputLabel>
                                    <Select value={formData.role} label="نقش کاربری" onChange={e => setFormData({...formData, role: e.target.value})}>
                                        {mode === 'clients' ? <MenuItem value="client">مشتری (Client)</MenuItem> :
                                            Object.keys(ROLE_CONFIG).filter(r => r !== 'client').map(role => (
                                                <MenuItem key={role} value={role}>{ROLE_CONFIG[role].label}</MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}><TextField sx={textFieldSx} fullWidth label="شماره تماس" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">انصراف</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: 'primary.main', fontWeight:'bold' }} disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'ذخیره'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UserManagementPage;