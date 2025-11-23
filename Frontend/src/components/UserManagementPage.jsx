// src/components/UserManagementPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    Stack, CircularProgress, Alert, Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    SupervisorAccount as AdminIcon,
    Brush as DesignIcon,
    Movie as VideoIcon,
    EditNote as WriterIcon,
    ContentCut as EditorIcon,
    Instagram as SocialIcon
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

function UserManagementPage({ mode }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const defaultRole = mode === 'clients' ? 'client' : 'writer';

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: defaultRole
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const { user: currentUser } = useContext(UserContext);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        fetchUsers();
    }, [mode]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await getUsers();

            // ✅✅✅ اصلاحیه مهم: هندل کردن Pagination
            // اگر پاسخ سرور آرایه بود، خودش را بردار. اگر آبجکت بود (Pagination)، بخش results را بردار.
            const allUsers = Array.isArray(response.data) ? response.data : (response.data.results || []);

            if (mode === 'clients') {
                setUsers(allUsers.filter(u => u.role === 'client'));
            } else {
                setUsers(allUsers.filter(u => u.role !== 'client'));
            }
        } catch (err) {
            console.error("Error fetching users:", err);
            enqueueSnackbar('خطا در دریافت لیست کاربران', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '',
                full_name: user.full_name || '',
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                full_name: '',
                role: defaultRole
            });
        }
        setOpenModal(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingUser(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            const dataToSend = { ...formData };
            if (editingUser && !dataToSend.password) {
                delete dataToSend.password;
            }

            if (editingUser) {
                await updateUser(editingUser.id, dataToSend);
                enqueueSnackbar('ویرایش موفقیت‌آمیز بود', { variant: 'success' });
            } else {
                await createUser(dataToSend);
                enqueueSnackbar('ایجاد موفقیت‌آمیز بود', { variant: 'success' });
            }
            handleCloseModal();
            fetchUsers();
        } catch (err) {
            console.error("Action failed:", err);
            let msg = "خطا در ذخیره اطلاعات.";
            if (err.response && err.response.data) {
                msg = Object.entries(err.response.data).map(([key, val]) => `${key}: ${val}`).join('\n');
            }
            setError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('آیا مطمئن هستید؟')) {
            try {
                await deleteUser(userId);
                setUsers(prev => prev.filter(u => u.id !== userId));
                enqueueSnackbar('حذف شد', { variant: 'info' });
            } catch (err) {
                enqueueSnackbar('خطا در حذف', { variant: 'error' });
            }
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;

    const pageTitle = mode === 'clients' ? 'مدیریت مشتریان' : 'مدیریت پرسنل و ادمین‌ها';

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold">{pageTitle}</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenModal(null)}
                >
                    {mode === 'clients' ? 'تعریف مشتری جدید' : 'تعریف پرسنل جدید'}
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell align="left">نام کاربری</TableCell>
                            <TableCell align="left">نام کامل</TableCell>
                            <TableCell align="center">نقش</TableCell>
                            <TableCell align="center">عملیات</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => {
                            const roleConfig = ROLE_CONFIG[user.role] || { label: user.role, color: 'default', icon: <PersonIcon /> };
                            return (
                                <TableRow key={user.id} hover>
                                    <TableCell sx={{ fontWeight: 'bold', direction: 'ltr', textAlign: 'left' }}>{user.username}</TableCell>
                                    <TableCell align="left">{user.full_name || '---'}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            icon={roleConfig.icon}
                                            label={roleConfig.label}
                                            color={roleConfig.color}
                                            size="small"
                                            variant="outlined"
                                            sx={{ minWidth: 100, justifyContent: 'flex-start', pl: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="info" onClick={() => handleOpenModal(user)}><EditIcon /></IconButton>
                                        {user.id !== currentUser?.id && (
                                            <IconButton color="error" onClick={() => handleDelete(user.id)}><DeleteIcon /></IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">موردی یافت نشد.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    {editingUser ? 'ویرایش' : 'ایجاد جدید'}
                </DialogTitle>
                <DialogContent dividers>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{error}</Alert>}
                        <Stack spacing={3}>
                            <TextField
                                name="username"
                                label="نام کاربری (انگلیسی)"
                                value={formData.username}
                                onChange={handleChange}
                                fullWidth required disabled={!!editingUser}
                                inputProps={{ style: { textAlign: 'left', direction: 'ltr' } }}
                            />
                            <TextField
                                name="full_name"
                                label="نام و نام خانوادگی (فارسی)"
                                value={formData.full_name}
                                onChange={handleChange}
                                fullWidth
                            />

                            <FormControl fullWidth>
                                <InputLabel>نقش کاربر</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role}
                                    label="نقش کاربر"
                                    onChange={handleChange}
                                >
                                    {mode === 'clients' ? (
                                        <MenuItem value="client">مشتری (Client)</MenuItem>
                                    ) : (
                                        [
                                            <MenuItem key="admin" value="admin">مدیر کل (Admin)</MenuItem>,
                                            <Divider key="div" />,
                                            <MenuItem key="writer" value="writer">سناریو نویس</MenuItem>,
                                            <MenuItem key="videographer" value="videographer">فیلم‌بردار</MenuItem>,
                                            <MenuItem key="editor" value="editor">تدوین‌گر</MenuItem>,
                                            <MenuItem key="designer" value="designer">گرافیست (UI/UX)</MenuItem>,
                                            <MenuItem key="social_admin" value="social_admin">ادمین پیج</MenuItem>
                                        ]
                                    )}
                                </Select>
                            </FormControl>

                            <TextField
                                name="password"
                                label={editingUser ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                fullWidth required={!editingUser}
                                inputProps={{ style: { textAlign: 'left', direction: 'ltr' } }}
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseModal} color="inherit">انصراف</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'ذخیره'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UserManagementPage;