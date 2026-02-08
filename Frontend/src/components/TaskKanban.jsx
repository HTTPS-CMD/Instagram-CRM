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
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import {
    AccessTime as TimeIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Flag as FlagIcon
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

function TaskKanban({projectId}) {
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);

    const [openModal, setOpenModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', priority: 'medium', assigned_to: '', due_date: null, status: 'todo'
    });

    useEffect(() => {
        if (projectId) fetchData();
    }, [projectId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, usersRes] = await Promise.all([
                getTasks(projectId),
                getUsers()
            ]);
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.results || []);
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
                due_date: task.due_date ? moment(task.due_date) : null,
                status: task.status
            });
        } else {
            setEditingTask(null);
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                assigned_to: '',
                due_date: null,
                status: 'todo'
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
            dataToSend.due_date = dataToSend.due_date ? moment(dataToSend.due_date).locale('en').format('YYYY-MM-DD') : null;
            if (!dataToSend.assigned_to) dataToSend.assigned_to = null;
            dataToSend.project = projectId;

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
                                {/* ✅ رفع ارور div inside p با تغییر تگ Typography به div */}
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
                                                        <Paper sx={{
                                                            p: 2,
                                                            borderRadius: 3,
                                                            bgcolor: alpha(theme.palette.background.default, 0.5),
                                                            border: `1px solid ${theme.palette.divider}`,
                                                            boxShadow: theme.shadows[2]
                                                        }}>
                                                            <Stack direction="row" justifyContent="space-between"
                                                                   alignItems="start">
                                                                <Typography variant="subtitle2"
                                                                            fontWeight="bold">{task.title}</Typography>
                                                                <Stack direction="row">
                                                                    <IconButton size="small"
                                                                                onClick={() => handleOpenModal(task)}
                                                                                color="info"><EditIcon
                                                                        fontSize="small"/></IconButton>
                                                                    <IconButton size="small"
                                                                                onClick={() => handleDelete(task.id)}
                                                                                color="error"><DeleteIcon
                                                                        fontSize="small"/></IconButton>
                                                                </Stack>
                                                            </Stack>
                                                            <Typography variant="caption" color="text.secondary"
                                                                        display="block" mb={2}
                                                                        sx={{whiteSpace: 'pre-wrap'}}>{task.description}</Typography>
                                                            <Stack direction="row" justifyContent="space-between"
                                                                   alignItems="center">
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <TimeTracker taskId={task.id}/>
                                                                    {(task.assigned_to_details) && (
                                                                        <Tooltip
                                                                            title={task.assigned_to_details.full_name || task.assigned_to_details.username}>
                                                                            <Avatar
                                                                                src={task.assigned_to_details.avatar}
                                                                                sx={{width: 24, height: 24}}/>
                                                                        </Tooltip>
                                                                    )}
                                                                    {task.due_date &&
                                                                        <Chip icon={<TimeIcon sx={{fontSize: 14}}/>}
                                                                              label={moment(task.due_date).format('jMM/jDD')}
                                                                              size="small"
                                                                              sx={{height: 24, fontSize: '0.7rem'}}/>}
                                                                </Stack>
                                                                <Chip icon={<FlagIcon sx={{fontSize: 14}}/>}
                                                                      label={task.priority} size="small"
                                                                      color={PRIORITY_COLORS[task.priority]}
                                                                      variant="outlined"
                                                                      sx={{height: 20, fontSize: '0.6rem'}}/>
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

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth
                    PaperProps={{sx: {bgcolor: theme.palette.background.paper}}}>
                <DialogTitle
                    sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>{editingTask ? 'ویرایش تسک' : 'تسک جدید'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={2}>
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