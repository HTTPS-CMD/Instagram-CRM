// src/components/PersonnelTasksPage.jsx
import React, {useContext, useEffect, useState} from 'react';
import {
    alpha,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Assignment as TaskIcon,
    CheckCircle as CheckIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    RadioButtonUnchecked as UncheckIcon
} from '@mui/icons-material';
// ✅ ایمپورت توابع جدید API
import {
    createPersonnelTask,
    deletePersonnelTask,
    getAllTasks,
    getProjects,
    getUsers,
    updatePersonnelTask
} from '../api';
import {UserContext} from '../App';
import {useSnackbar} from 'notistack';
import jMoment from 'jalali-moment';
// ✅ ایمپورت تقویم استاندارد پروژه
import {DatePicker} from '@mui/x-date-pickers/DatePicker';

function PersonnelTasksPage() {
    const {user} = useContext(UserContext);
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم

    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterUser, setFilterUser] = useState('all');

    const [openModal, setOpenModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', assigned_to: '', project: '', status: 'todo', due_date: null
    });

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const isUserAdmin = user?.role?.toLowerCase() === 'admin';

            const [tasksRes, usersRes, projRes] = await Promise.all([
                getAllTasks(),
                isUserAdmin ? getUsers() : Promise.resolve({data: []}),
                getProjects()
            ]);

            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data.results || [];
            setTasks(tasksData);

            if (isUserAdmin) {
                const userList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results || [];
                // حذف مشتریان از لیست انتخاب پرسنل
                const personnelList = userList.filter(u => u.role !== 'client');
                setUsers(personnelList);
            }

            const projList = Array.isArray(projRes.data) ? projRes.data : projRes.data.results || [];
            setProjects(projList);

        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOpen = () => {
        setEditingTask(null);
        setFormData({title: '', description: '', assigned_to: '', project: '', status: 'todo', due_date: null});
        setOpenModal(true);
    };

    const handleEditOpen = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title || '',
            description: task.description || '',
            assigned_to: task.assigned_to || '',
            project: task.project || '',
            status: task.status || 'todo',
            // تبدیل تاریخ استرینگ به آبجکت moment برای نمایش در تقویم
            due_date: task.due_date ? jMoment(task.due_date) : null
        });
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            enqueueSnackbar('عنوان تسک الزامی است', {variant: 'warning'});
            return;
        }

        // تبدیل داده‌ها برای ارسال به سرور
        const dataToSend = {
            ...formData,
            // تبدیل تاریخ به فرمت استاندارد دیتابیس (YYYY-MM-DD)
            due_date: formData.due_date ? formData.due_date.locale('en').format('YYYY-MM-DD') : null,
            // تبدیل رشته خالی به null برای پروژه (جلوگیری از ارور بک‌اند)
            project: formData.project === "" ? null : formData.project
        };

        try {
            if (editingTask) {
                const res = await updatePersonnelTask(editingTask.id, dataToSend);
                setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data : t));
                enqueueSnackbar('تسک ویرایش شد', {variant: 'success'});
            } else {
                const res = await createPersonnelTask(dataToSend);
                setTasks(prev => [res.data, ...prev]);
                enqueueSnackbar('تسک جدید ایجاد شد', {variant: 'success'});
            }
            setOpenModal(false);
        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در ذخیره سازی', {variant: 'error'});
        }
    };

    const handleStatusToggle = async (task) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        try {
            const res = await updatePersonnelTask(task.id, {status: newStatus});
            setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
            enqueueSnackbar(newStatus === 'done' ? 'تسک انجام شد ✅' : 'بازگشت به لیست کارها', {variant: 'success'});
        } catch (err) {
            enqueueSnackbar('خطا در تغییر وضعیت', {variant: 'error'});
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('آیا مطمئن هستید؟')) {
            try {
                await deletePersonnelTask(id);
                setTasks(prev => prev.filter(t => t.id !== id));
                enqueueSnackbar('تسک حذف شد', {variant: 'info'});
            } catch (err) {
                enqueueSnackbar('خطا در حذف', {variant: 'error'});
            }
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (!isAdmin) return true;
        if (filterUser === 'all') return true;
        return t.assigned_to === filterUser;
    });

    // استایل‌های داینامیک فرم
    const textFieldSx = {
        '& .MuiInputLabel-root': {color: theme.palette.text.secondary},
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': {borderColor: theme.palette.divider},
            '&:hover fieldset': {borderColor: theme.palette.text.primary},
        },
        '& .MuiSelect-select': {color: theme.palette.text.primary}
    };

    return (
        <Box>
            <Stack direction={{xs: 'column', md: 'row'}} justifyContent="space-between" alignItems="center" mb={4}
                   spacing={2}>
                <Box>
                    <Typography variant="h5" fontWeight="bold"
                                sx={{display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.primary}}>
                        <TaskIcon color="primary"/> کارتابل وظایف
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {isAdmin ? 'مدیریت وظایف پرسنل' : 'لیست کارهای من'}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2} alignItems="center">
                    {isAdmin && (
                        <TextField
                            select
                            size="small"
                            label="فیلتر پرسنل"
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            sx={{minWidth: 150, ...textFieldSx}}
                        >
                            <MenuItem value="all">همه پرسنل</MenuItem>
                            {users.map(u => (
                                <MenuItem key={u.id} value={u.id}>{u.full_name || u.username}</MenuItem>
                            ))}
                        </TextField>
                    )}

                    {isAdmin && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon/>}
                            onClick={handleCreateOpen}
                            sx={{bgcolor: 'primary.main', fontWeight: 'bold'}}
                        >
                            تسک جدید
                        </Button>
                    )}
                </Stack>
            </Stack>

            {loading ? <Box display="flex" justifyContent="center" mt={10}><CircularProgress/></Box> : (
                <Grid container spacing={2}>
                    {filteredTasks.length === 0 ? (
                        <Box width="100%" textAlign="center" mt={5} color="text.secondary">
                            <Typography>لیست خالی است.</Typography>
                        </Box>
                    ) : filteredTasks.map((task) => (
                        <Grid item xs={12} md={6} lg={4} key={task.id}>
                            <Paper sx={{
                                p: 2,
                                borderRadius: 3,
                                position: 'relative',
                                bgcolor: task.status === 'done' ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.background.paper, 0.4),
                                border: task.status === 'done' ? `1px solid ${alpha(theme.palette.success.main, 0.3)}` : `1px solid ${theme.palette.divider}`,
                                transition: '0.2s',
                                '&:hover': {transform: 'translateY(-3px)', boxShadow: theme.shadows[4]}
                            }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Checkbox
                                            checked={task.status === 'done'}
                                            onChange={() => handleStatusToggle(task)}
                                            icon={<UncheckIcon color="action"/>}
                                            checkedIcon={<CheckIcon color="success"/>}
                                        />
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="bold"
                                            sx={{
                                                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                                color: task.status === 'done' ? 'text.disabled' : 'text.primary'
                                            }}
                                        >
                                            {task.title}
                                        </Typography>
                                    </Box>
                                    {task.status === 'done' &&
                                        <Chip label="انجام شد" size="small" color="success" variant="outlined"/>}
                                </Stack>

                                <Typography variant="body2" color="text.secondary"
                                            sx={{ml: 5, mb: 2, whiteSpace: 'pre-wrap'}}>
                                    {task.description || 'بدون توضیحات'}
                                </Typography>

                                <Stack direction="row" alignItems="center" justifyContent="space-between"
                                       sx={{borderTop: `1px solid ${theme.palette.divider}`, pt: 2, ml: 1}}>
                                    <Stack direction="row" spacing={1}>
                                        {task.project_details && (
                                            <Tooltip title={`پروژه: ${task.project_details.project_name}`}>
                                                <Chip label={task.project_details.project_name} size="small" sx={{
                                                    fontSize: '0.65rem',
                                                    maxWidth: 100,
                                                    bgcolor: alpha(theme.palette.action.active, 0.1)
                                                }}/>
                                            </Tooltip>
                                        )}
                                        {task.due_date && (
                                            <Chip label={jMoment(task.due_date).format('jYYYY/jMM/jDD')} size="small"
                                                  variant="outlined" sx={{
                                                fontSize: '0.65rem',
                                                color: 'text.secondary',
                                                borderColor: theme.palette.divider
                                            }}/>
                                        )}
                                    </Stack>

                                    <Box>
                                        <IconButton size="small" onClick={() => handleEditOpen(task)}
                                                    color="info"><EditIcon fontSize="small"/></IconButton>
                                        {isAdmin && (
                                            <IconButton size="small" onClick={() => handleDelete(task.id)}
                                                        color="error"><DeleteIcon fontSize="small"/></IconButton>
                                        )}
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth
                    PaperProps={{sx: {bgcolor: theme.palette.background.paper, color: theme.palette.text.primary}}}
            >
                <DialogTitle
                    sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>{editingTask ? 'ویرایش تسک' : 'تعریف تسک جدید'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} mt={1}>
                        <TextField
                            label="عنوان کار" fullWidth sx={textFieldSx}
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                            disabled={!isAdmin && editingTask}
                        />
                        <TextField
                            label="توضیحات / گزارش کار" fullWidth multiline rows={4} sx={textFieldSx}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />

                        {isAdmin && (
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    select label="مسئول انجام" fullWidth sx={textFieldSx}
                                    value={formData.assigned_to || ''}
                                    onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                                >
                                    <MenuItem value=""><em>انتخاب کنید</em></MenuItem>
                                    {users.map(u => <MenuItem key={u.id}
                                                              value={u.id}>{u.full_name || u.username}</MenuItem>)}
                                </TextField>

                                <TextField
                                    select label="پروژه (اختیاری)" fullWidth sx={textFieldSx}
                                    value={formData.project || ''}
                                    onChange={e => setFormData({...formData, project: e.target.value})}
                                >
                                    <MenuItem value=""><em>عمومی (بدون پروژه)</em></MenuItem>
                                    {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.project_name}</MenuItem>)}
                                </TextField>
                            </Stack>
                        )}

                        {/* ✅ استفاده از تقویم MUI (هماهنگ با پروژه) */}
                        {isAdmin && (
                            <DatePicker
                                label="مهلت انجام"
                                value={formData.due_date}
                                onChange={(newValue) => setFormData({...formData, due_date: newValue})}
                                renderInput={(params) => <TextField {...params} fullWidth sx={textFieldSx}/>}
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{borderTop: `1px solid ${theme.palette.divider}`}}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">لغو</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{bgcolor: 'primary.main'}}>ذخیره</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default PersonnelTasksPage;