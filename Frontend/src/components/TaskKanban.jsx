// src/components/TaskKanban.jsx
import React, {useEffect, useState} from 'react';
import {DragDropContext, Draggable, Droppable} from '@hello-pangea/dnd';
import {
    alpha,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    EmojiEvents as TrophyIcon,
    Star as StarIcon,
    Whatshot as FireIcon,
    AccessTime as AccessTimeIcon,
    AssignmentInd as AssignmentIndIcon
} from '@mui/icons-material';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import moment from 'jalali-moment';
import {useSnackbar} from 'notistack';
import {createTask, deleteTask, getTasks, getUsers, updateTask} from '../api';
import TimeTracker from './TimeTracker';

const COLUMNS = {
    todo: {title: 'انجام نشده', color: '#ff5252'},
    in_progress: {title: 'در حال انجام', color: '#ff9800'},
    done: {title: 'انجام شده', color: '#4caf50'}
};

const PRIORITY_COLORS = {low: 'info', medium: 'warning', high: 'error'};

function TaskKanban({projectId, filterUser = null}) {
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);

    const [openModal, setOpenModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: null,
        status: 'todo',
        kpi_points: 10,
        difficulty_level: 1,
        is_extra_mile: false,
        period: 'project'
    });

    useEffect(() => {
        fetchData();
    }, [projectId, filterUser]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, usersRes] = await Promise.all([
                getTasks(projectId),
                getUsers()
            ]);

            let tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.results || []);

            if (filterUser) {
                tasksData = tasksData.filter(t => {
                    if (!t.assigned_to) return false;

                    if (typeof t.assigned_to === 'object') {
                        return t.assigned_to.id === filterUser;
                    }
                    return t.assigned_to === filterUser;
                });
            }

            setTasks(tasksData);
            const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.results || []);
            setAllUsers(usersData);
        } catch (err) {
            console.error("Error loading tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const {source, destination, draggableId} = result;
        if (source.droppableId !== destination.droppableId) {
            const updatedTasks = tasks.map(t =>
                t.id.toString() === draggableId ? {...t, status: destination.droppableId} : t
            );
            setTasks(updatedTasks);
            try {
                await updateTask(projectId, draggableId, {status: destination.droppableId});
            } catch (err) {
                enqueueSnackbar('خطا در تغییر وضعیت', {variant: 'error'});
                fetchData();
            }
        }
    };

    const handleOpenModal = (task = null) => {
        if (task) {
            setEditingTask(task);
            const assignedId = task.assigned_to
                ? (typeof task.assigned_to === 'object' ? task.assigned_to.id : task.assigned_to)
                : '';
            setFormData({
                title: task.title,
                description: task.description,
                priority: task.priority,
                assigned_to: assignedId,
                due_date: task.completed_at ? moment(task.completed_at) : null,
                status: task.status,
                kpi_points: task.kpi_points || 10,
                difficulty_level: task.difficulty_level || 1,
                is_extra_mile: task.is_extra_mile || false,
                period: task.period || 'project'
            });
        } else {
            setEditingTask(null);
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                assigned_to: filterUser || '',
                due_date: null,
                status: 'todo',
                kpi_points: 10,
                difficulty_level: 1,
                is_extra_mile: false,
                period: projectId ? 'project' : 'daily'
            });
        }
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            enqueueSnackbar('عنوان تسک الزامی است', {variant: 'warning'});
            return;
        }
        try {
            const dataToSend = {...formData};
            dataToSend.completed_at = dataToSend.due_date ? moment(dataToSend.due_date).locale('en').format('YYYY-MM-DD') : null;

            if (!dataToSend.assigned_to) dataToSend.assigned_to = null;
            dataToSend.project = projectId || null;

            if (editingTask) {
                const res = await updateTask(projectId, editingTask.id, dataToSend);
                setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data : t));
                enqueueSnackbar('تسک ویرایش شد', {variant: 'success'});
            } else {
                const res = await createTask(projectId, dataToSend);
                setTasks(prev => [...prev, res.data]);
                enqueueSnackbar('تسک ایجاد شد', {variant: 'success'});
            }
            setOpenModal(false);
        } catch (err) {
            console.error("Task Save Error:", err.response?.data || err);
            const msg = err.response?.data?.detail || 'خطا در ذخیره تسک';
            enqueueSnackbar(msg, {variant: 'error'});
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('آیا مطمئن هستید؟')) {
            try {
                await deleteTask(projectId, id);
                setTasks(prev => prev.filter(t => t.id !== id));
            } catch (err) {
                enqueueSnackbar('خطا در حذف', {variant: 'error'});
            }
        }
    };

    const calculateScore = (task) => {
        const base = task.kpi_points || 10;
        const diff = task.difficulty_level || 1;
        const multiplier = task.is_extra_mile ? 1.5 : 1;
        return Math.round(base * diff * multiplier);
    };

    const columnStyle = (color) => ({
        minWidth: 320, width: 320, flexShrink: 0,
        bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`, borderRadius: 4,
        display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 650
    });

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress/></Box>;

    return (
        <Box>
            <Stack direction="row" justifyContent="flex-end" mb={3}>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={() => handleOpenModal()}
                        sx={{bgcolor: 'primary.main', fontWeight: 'bold'}}>تسک جدید</Button>
            </Stack>

            <DragDropContext onDragEnd={onDragEnd}>
                <Box sx={{display: 'flex', overflowX: 'auto', gap: 3, pb: 2, height: 680}}>
                    {Object.entries(COLUMNS).map(([colId, col]) => (
                        <Paper key={colId} sx={columnStyle(col.color)}>
                            <Box p={2} borderBottom={`3px solid ${col.color}`} bgcolor={alpha(col.color, 0.1)}>
                                <Box display="flex" alignItems="center">
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{color: col.color}}>
                                        {col.title}
                                    </Typography>
                                    <Chip label={tasks.filter(t => t.status === colId).length} size="small"
                                          sx={{ml: 1, bgcolor: col.color, color: '#fff', fontWeight: 'bold'}}/>
                                </Box>
                            </Box>
                            <Droppable droppableId={colId}>
                                {(provided) => (
                                    <Box ref={provided.innerRef} {...provided.droppableProps}
                                         sx={{flexGrow: 1, overflowY: 'auto', p: 2}}>
                                        {tasks.filter(t => t.status === colId).map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                {(provided) => (
                                                    <Box
                                                        ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                        sx={{...provided.draggableProps.style, mb: 2}}>

                                                        {/* ====== طراحی جدید کارت تسک ====== */}
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                p: 2,
                                                                borderRadius: 3,
                                                                bgcolor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#ffffff',
                                                                border: task.is_extra_mile ? '2px solid #FFD700' : `1px solid ${theme.palette.divider}`,
                                                                boxShadow: task.is_extra_mile
                                                                    ? '0 4px 15px rgba(255, 215, 0, 0.3)'
                                                                    : '0 2px 8px rgba(0,0,0,0.05)',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
                                                                }
                                                            }}
                                                        >
                                                            {/* نوار رنگی اولویت کنار کارت */}
                                                            {!task.is_extra_mile && (
                                                                <Box sx={{
                                                                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                                                                    bgcolor: `${PRIORITY_COLORS[task.priority]}.main`
                                                                }} />
                                                            )}

                                                            {/* نشانگر Extra Mile */}
                                                            {task.is_extra_mile && (
                                                                <Box sx={{
                                                                    position: 'absolute', top: 0, right: 0,
                                                                    width: 0, height: 0,
                                                                    borderTop: '40px solid #FFD700',
                                                                    borderLeft: '40px solid transparent',
                                                                    zIndex: 1
                                                                }}>
                                                                    <StarIcon sx={{
                                                                        position: 'absolute',
                                                                        top: -35,
                                                                        right: 2,
                                                                        fontSize: 16,
                                                                        color: 'white'
                                                                    }}/>
                                                                </Box>
                                                            )}

                                                            {/* هدر: عنوان و دکمه‌ها */}
                                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ pr: task.is_extra_mile ? 2 : 0, lineHeight: 1.4 }}>
                                                                    {task.title}
                                                                </Typography>
                                                                <Stack direction="row">
                                                                    <IconButton size="small" onClick={() => handleOpenModal(task)} sx={{ color: 'text.secondary', p: 0.5 }}>
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton size="small" onClick={() => handleDelete(task.id)} sx={{ color: 'error.light', p: 0.5 }}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                            </Stack>

                                                            {/* توضیحات */}
                                                            {task.description && (
                                                                <Typography variant="caption" color="text.secondary" sx={{
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    mb: 2,
                                                                    whiteSpace: 'pre-wrap'
                                                                }}>
                                                                    {task.description}
                                                                </Typography>
                                                            )}

                                                            {/* نشان‌ها و امتیازها */}
                                                            <Stack direction="row" flexWrap="wrap" gap={1} mb={2} alignItems="center">
                                                                {task.period && task.period !== 'project' && (
                                                                    <Chip
                                                                        label={task.period === 'daily' ? 'روزانه' : (task.period === 'weekly' ? 'هفتگی' : 'ماهانه')}
                                                                        size="small"
                                                                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}
                                                                    />
                                                                )}
                                                                <Chip
                                                                    icon={<TrophyIcon sx={{ fontSize: 14 }}/>}
                                                                    label={`${calculateScore(task)} XP`}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20, fontSize: '0.7rem', fontWeight: 'bold',
                                                                        bgcolor: task.is_extra_mile ? 'warning.light' : alpha(theme.palette.primary.main, 0.1),
                                                                        color: task.is_extra_mile ? 'warning.dark' : 'primary.main'
                                                                    }}
                                                                />
                                                                {task.difficulty_level > 2 && (
                                                                    <Tooltip title="تسک دشوار">
                                                                        <FireIcon color="error" fontSize="small"/>
                                                                    </Tooltip>
                                                                )}
                                                            </Stack>

                                                            {/* فوتر کارت: آواتار و تاریخ */}
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center" pt={1} sx={{ borderTop: `1px dashed ${theme.palette.divider}` }}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <TimeTracker taskId={task.id}/>
                                                                    {(task.assigned_to_details || task.assigned_to_detail) ? (
                                                                        <Tooltip title={(task.assigned_to_details || task.assigned_to_detail).username}>
                                                                            <Avatar
                                                                                src={(task.assigned_to_details || task.assigned_to_detail).avatar}
                                                                                sx={{ width: 28, height: 28, border: `2px solid ${theme.palette.background.paper}` }}
                                                                            />
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Tooltip title="اختصاص داده نشده">
                                                                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'grey.300' }}>
                                                                                <AssignmentIndIcon fontSize="small" />
                                                                            </Avatar>
                                                                        </Tooltip>
                                                                    )}
                                                                </Stack>

                                                                {task.completed_at && (
                                                                    <Chip
                                                                        icon={<AccessTimeIcon sx={{ fontSize: '14px !important' }}/>}
                                                                        label={moment(task.completed_at).locale('fa').format('jD jMMMM')}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 24,
                                                                            fontSize: '0.65rem',
                                                                            bgcolor: moment(task.completed_at).isBefore(moment()) ? alpha('#f44336', 0.1) : alpha(theme.palette.text.secondary, 0.1),
                                                                            color: moment(task.completed_at).isBefore(moment()) ? '#f44336' : 'text.secondary'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Stack>
                                                        </Paper>
                                                    </Box>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        </Paper>
                    ))}
                </Box>
            </DragDropContext>

            {/* مودال ایجاد/ویرایش تسک */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth
                    PaperProps={{sx: {bgcolor: theme.palette.background.paper}}}>
                <DialogTitle sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>
                    {editingTask ? 'ویرایش تسک' : 'تسک جدید'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={2}>
                        <FormControl fullWidth sx={textFieldSx(theme)}>
                            <InputLabel>نوع وظیفه (دوره زمانی)</InputLabel>
                            <Select
                                value={formData.period || 'project'}
                                label="نوع وظیفه (دوره زمانی)"
                                onChange={e => setFormData({...formData, period: e.target.value})}
                            >
                                <MenuItem value="project">📌 مربوط به پروژه (عادی)</MenuItem>
                                <MenuItem value="daily">☀️ وظیفه روزانه (روتین)</MenuItem>
                                <MenuItem value="weekly">📅 وظیفه هفتگی</MenuItem>
                                <MenuItem value="monthly">🎯 هدف ماهانه</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField label="عنوان" fullWidth value={formData.title}
                                   onChange={e => setFormData({...formData, title: e.target.value})}
                                   sx={textFieldSx(theme)}/>
                        <TextField label="توضیحات" fullWidth multiline rows={3} value={formData.description}
                                   onChange={e => setFormData({...formData, description: e.target.value})}
                                   sx={textFieldSx(theme)}/>

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth sx={textFieldSx(theme)}>
                                <InputLabel>اولویت</InputLabel>
                                <Select value={formData.priority} label="اولویت"
                                        onChange={e => setFormData({...formData, priority: e.target.value})}>
                                    <MenuItem value="low">پایین</MenuItem>
                                    <MenuItem value="medium">متوسط</MenuItem>
                                    <MenuItem value="high">بالا</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth sx={textFieldSx(theme)}>
                                <InputLabel>مسئول انجام</InputLabel>
                                <Select value={formData.assigned_to} label="مسئول انجام"
                                        onChange={e => setFormData({...formData, assigned_to: e.target.value})}>
                                    <MenuItem value=""><em>انتخاب نشده</em></MenuItem>
                                    {allUsers.map(u => (
                                        <MenuItem key={u.id}
                                                  value={u.id}>{u.full_name || u.username} ({u.role})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>

                        <Paper variant="outlined" sx={{
                            p: 2,
                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                            borderColor: theme.palette.warning.main
                        }}>
                            <Typography variant="caption" color="warning.main" fontWeight="bold" mb={2} display="block">
                                <TrophyIcon fontSize="inherit" sx={{verticalAlign: 'middle', mr: 0.5}}/>
                                تنظیمات پاداش و عملکرد (KPI)
                            </Typography>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={6}>
                                    <TextField
                                        label="امتیاز پایه (KPI)"
                                        type="number"
                                        fullWidth
                                        size="small"
                                        value={formData.kpi_points}
                                        onChange={e => setFormData({...formData, kpi_points: Number(e.target.value)})}
                                        sx={textFieldSx(theme)}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth size="small" sx={textFieldSx(theme)}>
                                        <InputLabel>ضریب سختی</InputLabel>
                                        <Select
                                            value={formData.difficulty_level}
                                            label="ضریب سختی"
                                            onChange={e => setFormData({
                                                ...formData,
                                                difficulty_level: Number(e.target.value)
                                            })}
                                        >
                                            <MenuItem value={1}>۱ - معمولی</MenuItem>
                                            <MenuItem value={2}>۲ - کمی دشوار</MenuItem>
                                            <MenuItem value={3}>۳ - دشوار</MenuItem>
                                            <MenuItem value={5}>۵ - خیلی پیچیده</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.is_extra_mile}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    is_extra_mile: e.target.checked
                                                })}
                                                color="warning"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2"
                                                        fontWeight={formData.is_extra_mile ? "bold" : "normal"}
                                                        color={formData.is_extra_mile ? "warning.main" : "text.primary"}>
                                                این یک کار مازاد (Extra Mile) است (پاداش ۱.۵ برابر)
                                            </Typography>
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        <DatePicker label="مهلت انجام" value={formData.due_date}
                                    onChange={v => setFormData({...formData, due_date: v})}
                                    renderInput={(p) => <TextField {...p} sx={textFieldSx(theme)} fullWidth/>}/>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{p: 2}}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">لغو</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{bgcolor: 'primary.main'}}>ذخیره</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

const textFieldSx = (theme) => ({
    '& .MuiInputLabel-root': {color: theme.palette.text.secondary},
    '& .MuiOutlinedInput-root': {color: theme.palette.text.primary, '& fieldset': {borderColor: theme.palette.divider}},
    '& .MuiSelect-icon': {color: theme.palette.text.secondary}
});

export default TaskKanban;