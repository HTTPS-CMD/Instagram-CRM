// src/components/TargetAudiencePage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, IconButton, Button, Stack, Chip, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
    Avatar, Divider, useTheme, alpha, Collapse, CardContent, CardActions
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Psychology as BrainIcon, Person as PersonIcon, LocalHospital as DoctorIcon,
    Restaurant as FoodIcon, Store as ShopIcon, School as SchoolIcon,
    FitnessCenter as GymIcon, BusinessCenter as BusinessIcon, Computer as TechIcon,
    Lightbulb as IdeaIcon, ReportProblem as PainIcon, CheckCircle as SolutionIcon,
    Close as CloseIcon, ExpandMore as ExpandMoreIcon, Star as StarIcon,
    AutoAwesome as AIIcon // آیکون AI
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getTargetAudiences, createTargetAudience, updateTargetAudience, deleteTargetAudience, generateTargetAudienceAI } from '../api';

const ICON_MAP = {
    group: { icon: <PersonIcon fontSize="large" />, label: 'عمومی', color: '#2979ff' },
    doctor: { icon: <DoctorIcon fontSize="large" />, label: 'پزشکی', color: '#00e676' },
    food: { icon: <FoodIcon fontSize="large" />, label: 'رستوران', color: '#ff9100' },
    shop: { icon: <ShopIcon fontSize="large" />, label: 'فروشگاه', color: '#f50057' },
    school: { icon: <SchoolIcon fontSize="large" />, label: 'آموزشی', color: '#651fff' },
    gym: { icon: <GymIcon fontSize="large" />, label: 'ورزشی', color: '#00b0ff' },
    business: { icon: <BusinessIcon fontSize="large" />, label: 'شرکتی', color: '#607d8b' },
    tech: { icon: <TechIcon fontSize="large" />, label: 'تکنولوژی', color: '#3d5afe' }
};

function TargetAudiencePage() {
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم
    const [audiences, setAudiences] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [openModal, setOpenModal] = useState(false);
    const [openAIModal, setOpenAIModal] = useState(false); // مودال AI
    const [aiTopic, setAiTopic] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '', icon_name: 'group', age_range: '', gender: '',
        job_title: '', income_level: '', pain_points: '', goals: '', our_solution: ''
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getTargetAudiences();
            setAudiences(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await updateTargetAudience(editingId, formData);
                enqueueSnackbar('پرسونا ویرایش شد', { variant: 'success' });
            } else {
                await createTargetAudience(formData);
                enqueueSnackbar('پرسونا ایجاد شد', { variant: 'success' });
            }
            setOpenModal(false);
            fetchData();
        } catch (err) { enqueueSnackbar('خطا در ذخیره', { variant: 'error' }); }
    };

    const handleGenerateAI = async () => {
        if(!aiTopic) return;
        setAiLoading(true);
        try {
            const res = await generateTargetAudienceAI(aiTopic);
            setFormData(res.data); // پر کردن فرم با دیتای AI
            setOpenAIModal(false);
            setOpenModal(true); // باز کردن فرم اصلی برای بازبینی
            enqueueSnackbar('تحلیل هوشمند انجام شد! ✨', { variant: 'success' });
        } catch(err) {
            console.error(err);
            enqueueSnackbar('خطا در ارتباط با هوش مصنوعی', { variant: 'error' });
        } finally {
            setAiLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('آیا از حذف اطمینان دارید؟')) {
            await deleteTargetAudience(id);
            setAudiences(prev => prev.filter(a => a.id !== id));
        }
    };

    const openEdit = (item) => {
        setEditingId(item.id);
        setFormData(item);
        setOpenModal(true);
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({ title: '', icon_name: 'group', age_range: '', gender: '', job_title: '', income_level: '', pain_points: '', goals: '', our_solution: '' });
        setOpenModal(true);
    };

    const textFieldSx = {
        '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
        '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main },
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': { borderColor: theme.palette.divider },
            '&:hover fieldset': { borderColor: theme.palette.text.primary },
            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
        },
        '& .MuiSelect-icon': { color: theme.palette.text.primary }
    };

    if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

    return (
        <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={5}>
                <Typography variant="h4" fontWeight="900" sx={{
                    color: theme.palette.text.primary, display:'flex', alignItems:'center', gap:2,
                    textShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <BrainIcon sx={{ fontSize: 40, color: '#f06292' }}/> شناسایی مشتریان هدف
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<AIIcon />}
                        onClick={() => setOpenAIModal(true)}
                        sx={{
                            color: theme.palette.success.main, borderColor: theme.palette.success.main, fontWeight: 'bold',
                            '&:hover':{ bgcolor: alpha(theme.palette.success.main, 0.1), borderColor: theme.palette.success.main }
                        }}
                    >
                        تولید با هوش مصنوعی
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openCreate}
                        sx={{
                            bgcolor: '#f06292', color: '#fff', fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(240, 98, 146, 0.4)',
                            '&:hover':{ bgcolor: '#ec407a' }
                        }}
                    >
                        افزودن دستی
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={3}>
                {audiences.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{
                            p: 5, textAlign: 'center',
                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                            border: `1px dashed ${theme.palette.divider}`,
                            borderRadius: 4
                        }}>
                            <Typography color="text.secondary">هنوز هیچ پرسونایی تعریف نشده است.</Typography>
                        </Paper>
                    </Grid>
                ) : (
                    audiences.map((item) => (
                        <Grid item xs={12} md={6} lg={4} key={item.id}>
                            <ExpandableCard item={item} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
                        </Grid>
                    ))
                )}
            </Grid>

            {/* مودال فرم */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, backdropFilter: 'blur(10px)' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    {editingId ? 'ویرایش پرسونا' : 'تعریف پرسونای مخاطب'}
                    <IconButton onClick={() => setOpenModal(false)} sx={{ color: theme.palette.text.secondary }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: theme.palette.divider }}>
                    <Grid container spacing={3} mt={0}>
                        <Grid item xs={12} md={6}><TextField sx={textFieldSx} fullWidth label="عنوان (مثلاً: پزشکان زیبایی)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></Grid>
                        <Grid item xs={12} md={6}>
                            <TextField sx={textFieldSx} select fullWidth label="آیکون مرتبط" value={formData.icon_name} onChange={e => setFormData({...formData, icon_name: e.target.value})}>
                                {Object.entries(ICON_MAP).map(([key, val]) => (
                                    <MenuItem key={key} value={key} sx={{ display: 'flex', gap: 1 }}>
                                        {val.icon} {val.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}><TextField sx={textFieldSx} fullWidth label="بازه سنی" value={formData.age_range} onChange={e => setFormData({...formData, age_range: e.target.value})} /></Grid>
                        <Grid item xs={6}><TextField sx={textFieldSx} fullWidth label="جنسیت" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} /></Grid>
                        <Grid item xs={6}><TextField sx={textFieldSx} fullWidth label="شغل/سمت" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} /></Grid>
                        <Grid item xs={6}><TextField sx={textFieldSx} fullWidth label="درآمد" value={formData.income_level} onChange={e => setFormData({...formData, income_level: e.target.value})} /></Grid>
                        <Grid item xs={12}><TextField sx={textFieldSx} fullWidth multiline rows={3} label="دغدغه‌ها (Pain Points)" value={formData.pain_points} onChange={e => setFormData({...formData, pain_points: e.target.value})} /></Grid>
                        <Grid item xs={12}><TextField sx={textFieldSx} fullWidth multiline rows={3} label="اهداف" value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} /></Grid>
                        <Grid item xs={12}><TextField sx={textFieldSx} fullWidth multiline rows={3} label="راه‌حل ما" value={formData.our_solution} onChange={e => setFormData({...formData, our_solution: e.target.value})} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">انصراف</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#f06292', color:'#fff', fontWeight: 'bold' }}>ذخیره</Button>
                </DialogActions>
            </Dialog>

            {/* مودال هوش مصنوعی */}
            <Dialog open={openAIModal} onClose={() => setOpenAIModal(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: 3, border: `1px solid ${theme.palette.divider}` } }}
            >
                <DialogTitle sx={{ color: theme.palette.success.main, display:'flex', gap:1 }}><AIIcon/> تولید هوشمند پرسونا</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{color: theme.palette.text.secondary, mb:2}}>
                        مخاطب هدف خود را در یک کلمه بنویسید (مثلاً: "کافه‌دارها" یا "فروشندگان لباس"). هوش مصنوعی تمام جزئیات را برای شما تحلیل می‌کند.
                    </Typography>
                    <TextField
                        sx={textFieldSx}
                        fullWidth
                        autoFocus
                        label="موضوع / شغل مخاطب"
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenAIModal(false)} color="inherit">بستن</Button>
                    <Button
                        onClick={handleGenerateAI}
                        variant="contained"
                        disabled={aiLoading || !aiTopic}
                        sx={{ bgcolor: theme.palette.success.main, color: '#fff', fontWeight: 'bold', '&:hover':{bgcolor: theme.palette.success.dark} }}
                    >
                        {aiLoading ? <CircularProgress size={24} color="inherit"/> : 'شروع تحلیل'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// --- کامپوننت کارت بازشونده ---
const ExpandableCard = ({ item, onEdit, onDelete }) => {
    const theme = useTheme(); // ✅ استفاده از تم
    const [expanded, setExpanded] = useState(false);
    const themeColor = ICON_MAP[item.icon_name]?.color || '#2979ff';

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    return (
        <Paper sx={{
            borderRadius: 6,
            background: `linear-gradient(135deg, ${alpha(themeColor, 0.15)} 0%, ${alpha(themeColor, 0.02)} 100%)`,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${alpha(themeColor, 0.3)}`,
            boxShadow: theme.shadows[4],
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: `0 12px 40px 0 ${alpha(themeColor, 0.3)}`,
                borderColor: themeColor
            }
        }}>
            <Box sx={{ height: 6, bgcolor: themeColor, width: '100%' }} />

            <Box p={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(themeColor, 0.2), color: themeColor, border: `2px solid ${alpha(themeColor, 0.5)}`, boxShadow: `0 0 15px ${alpha(themeColor, 0.4)}` }}>
                            {ICON_MAP[item.icon_name]?.icon || <PersonIcon fontSize="large" />}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="900" color="text.primary" sx={{ lineHeight: 1.2 }}>
                                {item.title}
                            </Typography>
                            <Chip
                                label={item.job_title || 'بدون عنوان شغلی'}
                                size="small"
                                sx={{ mt: 0.5, bgcolor: alpha(themeColor, 0.2), color: themeColor, fontWeight: 'bold', border: `1px solid ${alpha(themeColor, 0.3)}` }}
                            />
                        </Box>
                    </Stack>

                    <Stack direction="row">
                        <IconButton size="small" onClick={onEdit} color="info"><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={onDelete} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                </Stack>

                <Divider sx={{ my: 2, borderColor: alpha(themeColor, 0.2) }} />

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <InfoBox label="سن" value={item.age_range} theme={theme} />
                    </Grid>
                    <Grid item xs={6}>
                        <InfoBox label="جنسیت" value={item.gender} theme={theme} />
                    </Grid>
                    <Grid item xs={12}>
                        <InfoBox label="سطح درآمد" value={item.income_level} fullWidth theme={theme} />
                    </Grid>
                </Grid>
            </Box>

            <CardActions disableSpacing sx={{ bgcolor: alpha(themeColor, 0.05), borderTop: `1px solid ${alpha(themeColor, 0.1)}`, justifyContent: 'center', p: 0.5 }}>
                <Button
                    onClick={handleExpandClick}
                    endIcon={<ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />}
                    sx={{ color: theme.palette.text.secondary, width: '100%', borderRadius: 0 }}
                >
                    {expanded ? 'بستن تحلیل' : 'مشاهده تحلیل استراتژی'}
                </Button>
            </CardActions>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), p: 3 }}>
                    <Stack spacing={2}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderRight: `4px solid ${theme.palette.error.main}` }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PainIcon fontSize="small" /> دغدغه‌ها و دردها:
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.primary, mt: 1, lineHeight: 1.6 }}>
                                {item.pain_points || '---'}
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRight: `4px solid ${theme.palette.warning.main}` }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StarIcon fontSize="small" /> اهداف اصلی:
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.primary, mt: 1, lineHeight: 1.6 }}>
                                {item.goals || '---'}
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRight: `4px solid ${theme.palette.success.main}` }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SolutionIcon fontSize="small" /> راه‌حل پیشنهادی ما:
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.primary, mt: 1, lineHeight: 1.6 }}>
                                {item.our_solution || '---'}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Collapse>
        </Paper>
    );
};

const InfoBox = ({ label, value, theme }) => (
    <Box sx={{
        bgcolor: alpha(theme.palette.action.hover, 0.05),
        borderRadius: 2,
        p: 1.5,
        textAlign: 'center',
        border: `1px solid ${theme.palette.divider}`,
        width: '100%'
    }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{label}</Typography>
        <Typography variant="body2" fontWeight="bold" color="text.primary">{value || '---'}</Typography>
    </Box>
);

export default TargetAudiencePage;