// src/components/LeadsPage.jsx
import React, {useEffect, useState} from 'react';
import {DragDropContext, Draggable, Droppable} from '@hello-pangea/dnd';
import {
    alpha,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Phone as PhoneIcon,
    TrendingUp as StatsIcon
} from '@mui/icons-material';
import {useSnackbar} from 'notistack';
import {createLead, deleteLead, getLeads, getTargetAudiences, updateLead} from '../api';
import {useNavigate} from 'react-router-dom';

const COLUMNS = {
    new: {title: 'تماس اولیه', color: '#64b5f6'},
    meeting: {title: 'جلسه حضوری/آنلاین', color: '#ffb74d'},
    proposal: {title: 'ارسال پروپوزال', color: '#ba68c8'},
    negotiation: {title: 'در حال مذاکره', color: '#4db6ac'},
    won: {title: 'برنده شد (قرارداد)', color: '#66bb6a'},
    lost: {title: 'از دست رفت', color: '#ef5350'}
};

function LeadsPage() {
    const {enqueueSnackbar} = useSnackbar();
    const navigate = useNavigate();
    const theme = useTheme(); // ✅ استفاده از تم

    const [leads, setLeads] = useState([]);
    const [targets, setTargets] = useState([]); // لیست مشتریان هدف
    const [loading, setLoading] = useState(true);

    // Modal States
    const [openModal, setOpenModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [formData, setFormData] = useState({
        title: '', phone: '', estimated_value: '', notes: '', target_audience: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leadsRes, targetsRes] = await Promise.all([getLeads(), getTargetAudiences()]);
            setLeads(leadsRes.data);
            setTargets(targetsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Drag & Drop Logic ---
    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const {source, destination, draggableId} = result;

        if (source.droppableId !== destination.droppableId) {
            const updatedLeads = leads.map(l =>
                l.id.toString() === draggableId ? {...l, status: destination.droppableId} : l
            );
            setLeads(updatedLeads);

            try {
                await updateLead(draggableId, {status: destination.droppableId});

                if (destination.droppableId === 'won') {
                    if (window.confirm('تبریک! 🎉 این سرنخ تبدیل به مشتری شد. آیا می‌خواهید برایش پروژه بسازید؟')) {
                        navigate('/project/new');
                    }
                }
            } catch (err) {
                enqueueSnackbar('خطا در تغییر وضعیت', {variant: 'error'});
                fetchData();
            }
        }
    };

    // --- Form Handlers ---
    const handleOpenModal = (lead = null) => {
        if (lead) {
            setEditingLead(lead);
            setFormData({
                title: lead.title, phone: lead.phone,
                estimated_value: lead.estimated_value, notes: lead.notes,
                target_audience: lead.target_audience || ''
            });
        } else {
            setEditingLead(null);
            setFormData({title: '', phone: '', estimated_value: '', notes: '', target_audience: ''});
        }
        setOpenModal(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingLead) {
                const res = await updateLead(editingLead.id, formData);
                setLeads(prev => prev.map(l => l.id === editingLead.id ? res.data : l));
                enqueueSnackbar('ویرایش شد', {variant: 'success'});
            } else {
                const res = await createLead(formData);
                setLeads(prev => [...prev, res.data]);
                enqueueSnackbar('سرنخ جدید ایجاد شد', {variant: 'success'});
            }
            setOpenModal(false);
        } catch (err) {
            enqueueSnackbar('خطا', {variant: 'error'});
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('حذف شود؟')) {
            try {
                await deleteLead(id);
                setLeads(prev => prev.filter(l => l.id !== id));
            } catch (err) {
                enqueueSnackbar('خطا', {variant: 'error'});
            }
        }
    };

    const columnsData = Object.keys(COLUMNS).map(colId => ({
        id: colId,
        ...COLUMNS[colId],
        items: leads.filter(l => l.status === colId)
    }));

    // استایل‌های داینامیک فرم
    const textFieldSx = {
        '& .MuiInputLabel-root': {color: theme.palette.text.secondary},
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': {borderColor: theme.palette.divider},
            '&:hover fieldset': {borderColor: theme.palette.text.primary}
        },
        '& .MuiSelect-select': {color: theme.palette.text.primary}
    };

    return (
        <Box sx={{height: 'calc(100vh - 100px)', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">کاریز فروش (Pipeline)</Typography>
                    <Typography variant="caption" color="text.secondary">مدیریت سرنخ‌ها و تبدیل به مشتری</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={() => handleOpenModal()}
                        sx={{bgcolor: 'primary.main', fontWeight: 'bold'}}>
                    سرنخ جدید
                </Button>
            </Stack>

            {loading ? <CircularProgress sx={{m: 'auto'}}/> : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Box sx={{display: 'flex', overflowX: 'auto', gap: 2, height: '100%', pb: 2}}>
                        {columnsData.map((column) => (
                            <Box key={column.id}
                                 sx={{minWidth: 280, width: 280, display: 'flex', flexDirection: 'column'}}>
                                <Paper sx={{
                                    p: 2, flexGrow: 1,
                                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                                    borderTop: `4px solid ${column.color}`,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.divider}`
                                }}>
                                    <Stack direction="row" justifyContent="space-between" mb={2}>
                                        <Typography fontWeight="bold" variant="subtitle2"
                                                    color="text.primary">{column.title}</Typography>
                                        <Chip label={column.items.length} size="small" sx={{
                                            bgcolor: column.color,
                                            color: '#fff',
                                            height: 20,
                                            fontWeight: 'bold'
                                        }}/>
                                    </Stack>

                                    <Droppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <Box
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                sx={{
                                                    minHeight: 200, flexGrow: 1,
                                                    bgcolor: snapshot.isDraggingOver ? alpha(theme.palette.action.hover, 0.1) : 'transparent',
                                                    transition: 'background-color 0.2s', borderRadius: 2
                                                }}
                                            >
                                                {column.items.map((lead, index) => (
                                                    <Draggable key={lead.id} draggableId={lead.id.toString()}
                                                               index={index}>
                                                        {(provided, snapshot) => (
                                                            <Paper
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                sx={{
                                                                    p: 2, mb: 1.5, position: 'relative',
                                                                    bgcolor: theme.palette.background.paper,
                                                                    color: theme.palette.text.primary,
                                                                    boxShadow: snapshot.isDragging ? 10 : 2,
                                                                    border: `1px solid ${theme.palette.divider}`,
                                                                    ...provided.draggableProps.style
                                                                }}
                                                            >
                                                                <Typography fontWeight="bold"
                                                                            mb={0.5}>{lead.title}</Typography>

                                                                {lead.target_audience_name && (
                                                                    <Chip
                                                                        icon={<StatsIcon style={{fontSize: 12}}/>}
                                                                        label={lead.target_audience_name}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '0.65rem',
                                                                            mb: 1,
                                                                            color: 'text.secondary',
                                                                            borderColor: theme.palette.divider
                                                                        }}
                                                                    />
                                                                )}

                                                                <Stack direction="row" alignItems="center" spacing={1}
                                                                       mb={1}>
                                                                    <PhoneIcon
                                                                        sx={{fontSize: 14, color: 'text.secondary'}}/>
                                                                    <Typography variant="caption"
                                                                                color="text.secondary">{lead.phone || '---'}</Typography>
                                                                </Stack>

                                                                {lead.estimated_value > 0 && (
                                                                    <Typography variant="caption" color="success.main"
                                                                                display="block" mb={1}
                                                                                fontWeight="bold">
                                                                        💰 {Number(lead.estimated_value).toLocaleString()} تومان
                                                                    </Typography>
                                                                )}

                                                                <Stack direction="row" justifyContent="flex-end"
                                                                       borderTop={`1px solid ${theme.palette.divider}`}
                                                                       pt={1}>
                                                                    <IconButton size="small"
                                                                                onClick={() => handleOpenModal(lead)}
                                                                                color="info"><EditIcon
                                                                        fontSize="small"/></IconButton>
                                                                    <IconButton size="small"
                                                                                onClick={() => handleDelete(lead.id)}
                                                                                color="error"><DeleteIcon
                                                                        fontSize="small"/></IconButton>
                                                                </Stack>
                                                            </Paper>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </Box>
                                        )}
                                    </Droppable>
                                </Paper>
                            </Box>
                        ))}
                    </Box>
                </DragDropContext>
            )}

            {/* Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth
                    PaperProps={{sx: {bgcolor: theme.palette.background.paper, color: theme.palette.text.primary}}}
            >
                <DialogTitle
                    sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>{editingLead ? 'ویرایش سرنخ' : 'افزودن سرنخ جدید'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={2}>
                        <TextField
                            label="نام مشتری / سرنخ" fullWidth
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                            sx={textFieldSx}
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="شماره تماس" fullWidth
                                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                sx={textFieldSx}
                            />
                            <TextField
                                label="ارزش تخمینی (تومان)" fullWidth type="number"
                                value={formData.estimated_value}
                                onChange={e => setFormData({...formData, estimated_value: e.target.value})}
                                sx={textFieldSx}
                            />
                        </Stack>

                        <TextField
                            select
                            label="دسته مشتری هدف (استراتژی)"
                            fullWidth
                            value={formData.target_audience}
                            onChange={e => setFormData({...formData, target_audience: e.target.value})}
                            helperText="این سرنخ جزو کدام گروه از مشتریان هدف شماست؟"
                            sx={{
                                ...textFieldSx,
                                '& .MuiFormHelperText-root': {color: theme.palette.info.main}
                            }}
                        >
                            <MenuItem value=""><em>مشخص نشده</em></MenuItem>
                            {targets.map(t => (
                                <MenuItem key={t.id} value={t.id}>{t.title} ({t.niche})</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="یادداشت‌ها" fullWidth multiline rows={3}
                            value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                            sx={textFieldSx}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{p: 2, borderTop: `1px solid ${theme.palette.divider}`}}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">لغو</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">ذخیره</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default LeadsPage;