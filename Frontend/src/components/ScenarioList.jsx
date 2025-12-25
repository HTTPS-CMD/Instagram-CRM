// src/components/ScenarioList.jsx
import React, { useState, useEffect, useContext } from "react";
import { getScenarios, deleteScenario, updateScenario, createScenario, generateScenarioAI } from "../api";
import {
  Box, Typography, CircularProgress, Paper, List,
  ListItem, Stack, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Tooltip, Divider,
  useTheme, alpha
} from "@mui/material";
import {
    Visibility as VisibilityIcon,
    Close as CloseIcon,
    FiberManualRecord as FiberManualRecordIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    CloudUpload as UploadIcon,
    FileDownload as DownloadIcon,
    AutoAwesome as AIIcon,
    MovieCreation as ReelsIcon,
    HistoryEdu as StoryIcon
} from '@mui/icons-material';

import { useSnackbar } from 'notistack';
import { UserContext } from "../App";
import ScenarioComments from './ScenarioComments';

const SCENARIO_STYLES = [
    { value: 'educational', label: 'آموزشی' },
    { value: 'challenge', label: 'چالشی' },
    { value: 'fun', label: 'فان/سرگرمی' },
    { value: 'product', label: 'معرفی محصول' },
];
const SCENARIO_GOALS = [
    { value: 'engagement', label: 'افزایش تعامل' },
    { value: 'followers', label: 'جذب فالوور' },
    { value: 'sale', label: 'فروش/تبدیل' },
    { value: 'branding', label: 'برندسازی' },
];

const SCENARIO_STATUSES = [
    { value: 'idea', label: 'ایده اولیه (منتظر تایید)'},
    { value: 'approved', label: 'تایید شده (در صف تولید)'},
    { value: 'rejected', label: 'نیازمند اصلاح'},
    { value: 'filmed', label: 'فیلمبرداری شده'},
    { value: 'posted', label: 'منتشر شده'},
];

// ✅✅✅ نکته مهم: اضافه شدن export در اینجا باعث رفع صفحه سفید می‌شود
export const ScenarioForm = ({ projectId, initialData, onScenarioSaved, onCancel, defaultType }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '', summary: '', full_scenario_text: '',
    style: 'educational', goal: 'engagement', status: 'idea',
    scenario_type: defaultType || 'reels'
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const [localError, setLocalError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    try {
      let response;
      if (initialData && initialData.id) {
        response = await updateScenario(initialData.id, formData, projectId);
        enqueueSnackbar('سناریو ویرایش شد', { variant: 'success' });
      } else {
        response = await createScenario(projectId, formData);
        enqueueSnackbar('سناریو ایجاد شد', { variant: 'success' });
      }
      onScenarioSaved(response.data);
    } catch (err) {
      console.error('Save failed:', err);
      setLocalError('خطا در ذخیره سناریو.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
      if (!aiPrompt.trim()) return;
      setAiLoading(true);
      try {
          const res = await generateScenarioAI(projectId, {
              topic: aiPrompt,
              style: formData.style
          });

          const { title, summary, full_script } = res.data;

          setFormData(prev => ({
              ...prev,
              title: title || prev.title,
              summary: summary || prev.summary,
              full_scenario_text: full_script || prev.full_scenario_text
          }));

          enqueueSnackbar('سناریو با موفقیت تولید شد! ✨', { variant: 'success' });
          setAiModalOpen(false);
      } catch (err) {
          console.error(err);
          enqueueSnackbar('خطا در تولید سناریو', { variant: 'error' });
      } finally {
          setAiLoading(false);
      }
  };

  const inputStyle = {
      '& .MuiInputBase-input': { color: theme.palette.text.primary, textAlign: 'right', direction: 'rtl' },
      '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
      '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.primary },
      '& .MuiSelect-select': { color: theme.palette.text.primary }
  };

  return (
    <Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}

        <Box mb={3} display="flex" justifyContent="center">
            <Button
                variant="outlined"
                color="secondary"
                startIcon={<AIIcon />}
                onClick={() => setAiModalOpen(true)}
                sx={{
                    borderStyle: 'dashed', borderWidth: 2,
                    fontWeight: 'bold', px: 4, py: 1,
                    '&:hover': { borderWidth: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1) }
                }}
            >
                تولید خودکار با هوش مصنوعی
            </Button>
        </Box>

        <Grid container spacing={3}>
            <Grid item xs={12}>
            <TextField name="title" label="عنوان سناریو" value={formData.title} onChange={handleChange} fullWidth required sx={inputStyle} />
            </Grid>
            <Grid item xs={12}>
            <TextField name="summary" label="خلاصه" value={formData.summary} onChange={handleChange} fullWidth multiline rows={2} sx={inputStyle} />
            </Grid>
            <Grid item xs={12} md={4}>
            <FormControl fullWidth sx={inputStyle}>
                <InputLabel>سبک</InputLabel>
                <Select name="style" value={formData.style} label="سبک" onChange={handleChange} sx={{textAlign:'right'}}>
                {SCENARIO_STYLES.map(s => <MenuItem key={s.value} value={s.value} sx={{direction:'rtl'}}>{s.label}</MenuItem>)}
                </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
            <FormControl fullWidth sx={inputStyle}>
                <InputLabel>هدف</InputLabel>
                <Select name="goal" value={formData.goal} label="هدف" onChange={handleChange} sx={{textAlign:'right'}}>
                {SCENARIO_GOALS.map(g => <MenuItem key={g.value} value={g.value} sx={{direction:'rtl'}}>{g.label}</MenuItem>)}
                </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
            <FormControl fullWidth sx={inputStyle}>
                <InputLabel>وضعیت</InputLabel>
                <Select name="status" value={formData.status} label="وضعیت" onChange={handleChange} sx={{textAlign:'right'}}>
                {SCENARIO_STATUSES.map(s => <MenuItem key={s.value} value={s.value} sx={{direction:'rtl'}}>{s.label}</MenuItem>)}
                </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12}>
            <TextField name="full_scenario_text" label="متن کامل سناریو" value={formData.full_scenario_text} onChange={handleChange} fullWidth multiline rows={8} required sx={inputStyle} />
            </Grid>
            <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={onCancel} color="inherit">انصراف</Button>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'ذخیره'}</Button>
            </Stack>
            </Grid>
        </Grid>
        </Box>

        <Dialog open={aiModalOpen} onClose={() => setAiModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: theme.palette.background.paper } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main' }}>
                <AIIcon /> تولید سناریو با هوش مصنوعی
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" mb={2} color="text.secondary">
                    موضوع یا ایده کلی را بنویسید، هوش مصنوعی عنوان، خلاصه و متن کامل سناریو را برای شما می‌نویسد.
                </Typography>
                <TextField
                    autoFocus
                    label="موضوع سناریو (مثلاً: معرفی محصول جدید قهوه)"
                    fullWidth
                    multiline
                    rows={2}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    sx={inputStyle}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setAiModalOpen(false)} color="inherit">لغو</Button>
                <Button
                    onClick={handleGenerateAI}
                    variant="contained"
                    color="secondary"
                    disabled={aiLoading || !aiPrompt}
                    startIcon={aiLoading ? <CircularProgress size={20} color="inherit"/> : <AIIcon />}
                >
                    {aiLoading ? 'در حال نوشتن...' : 'تولید کن'}
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
  );
};

function ScenarioList({ projectId, isAdmin }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  const [currentType, setCurrentType] = useState('reels');

  const [openModal, setOpenModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const [openFormModal, setOpenFormModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);

  const [uploading, setUploading] = useState(false);

  const { user } = useContext(UserContext);
  const canApprove = user && (user.role === 'client' || user.role === 'admin');
  const canUpload = user && user.role !== 'client';

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setLoading(true);
    getScenarios(projectId)
      .then(res => { setScenarios(res.data); setError(null); })
      .catch(() => setError("خطا در دریافت سناریوها."))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleOpenModal = (scenario) => {
    setSelectedScenario(scenario);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedScenario(null);
  };

  // ✅ فقط برای ویرایش استفاده می‌شود، دکمه ایجاد در ScenarioManager است
  const handleOpenFormModal = (scenario = null) => {
    setEditingScenario(scenario);
    setOpenFormModal(true);
  };

  const handleCloseFormModal = () => {
    setOpenFormModal(false);
    setEditingScenario(null);
  };

  const handleScenarioSaved = (savedScenario) => {
    if (editingScenario) {
      setScenarios(prev => prev.map(s => s.id === savedScenario.id ? savedScenario : s));
    } else {
      setScenarios(prev => [...prev, savedScenario]);
    }
    handleCloseFormModal();
  };

  const handleDeleteScenario = async (scenarioId) => {
    if (window.confirm('حذف شود؟')) {
      try {
        await deleteScenario(scenarioId, projectId);
        setScenarios(prev => prev.filter(s => s.id !== scenarioId));
        enqueueSnackbar('حذف شد', { variant: 'info' });
      } catch (err) {
        enqueueSnackbar('خطا در حذف', { variant: 'error' });
      }
    }
  };

  const handleClientAction = async (scenario, action) => {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const confirmMsg = action === 'approve' ? 'تایید می‌کنید؟' : 'نیاز به اصلاح دارد؟';

      if (window.confirm(confirmMsg)) {
          try {
              const response = await updateScenario(scenario.id, { status: newStatus }, projectId);
              setScenarios(prev => prev.map(s => s.id === scenario.id ? response.data : s));
              setSelectedScenario(response.data);
              enqueueSnackbar(action === 'approve' ? 'تایید شد ✅' : 'درخواست اصلاح ثبت شد ❌', { variant: action === 'approve' ? 'success' : 'info' });
          } catch (err) {
              enqueueSnackbar('خطا', { variant: 'error' });
          }
      }
  };

  const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file || !selectedScenario) return;

      setUploading(true);
      const formData = new FormData();
      formData.append('final_file', file);

      try {
          const response = await updateScenario(selectedScenario.id, formData, projectId);
          setSelectedScenario(response.data);
          setScenarios(prev => prev.map(s => s.id === selectedScenario.id ? response.data : s));
          enqueueSnackbar('فایل نهایی با موفقیت آپلود شد', { variant: 'success' });
      } catch (err) {
          console.error(err);
          enqueueSnackbar('خطا در آپلود فایل', { variant: 'error' });
      } finally {
          setUploading(false);
      }
  };

  const getStatusChip = (status) => {
    const statusInfo = SCENARIO_STATUSES.find(s => s.value === status) || SCENARIO_STATUSES[0];
    const colorMap = { idea: 'warning', approved: 'success', rejected: 'error', filmed: 'secondary', posted: 'primary' };
    return <Chip label={statusInfo.label} color={colorMap[statusInfo.value] || 'default'} size="small" variant={status === 'idea' ? 'filled' : 'outlined'} />;
  };

  const filteredScenarios = scenarios.filter(s => (s.scenario_type || 'reels') === currentType);

  const typeCardStyle = (type) => ({
      flex: 1, p: 2, borderRadius: 3, border: '1px solid',
      borderColor: currentType === type ? '#3da9fc' : theme.palette.divider,
      bgcolor: currentType === type ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.background.paper, 0.5),
      color: currentType === type ? theme.palette.text.primary : theme.palette.text.secondary,
      cursor: 'pointer', transition: '0.3s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05), borderColor: '#3da9fc' }
  });

  if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={4}>
          <Paper onClick={() => setCurrentType('reels')} sx={typeCardStyle('reels')} elevation={0}>
              <ReelsIcon sx={{ fontSize: 30, color: currentType === 'reels' ? '#e1306c' : 'inherit' }} />
              <Box>
                  <Typography variant="subtitle1" fontWeight="bold">سناریوهای ریلز</Typography>
                  <Typography variant="caption">محتوای ویدیویی کوتاه (Reels)</Typography>
              </Box>
          </Paper>

          <Paper onClick={() => setCurrentType('story')} sx={typeCardStyle('story')} elevation={0}>
              <StoryIcon sx={{ fontSize: 30, color: currentType === 'story' ? theme.palette.warning.main : 'inherit' }} />
              <Box>
                  <Typography variant="subtitle1" fontWeight="bold">سناریوهای استوری</Typography>
                  <Typography variant="caption">استوری‌تلاینگ و تعاملی</Typography>
              </Box>
          </Paper>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{ textAlign: 'right', mb: 0, display:'flex', alignItems:'center', gap:1, color: theme.palette.text.primary }}>
            {currentType === 'reels' ? <ReelsIcon color="secondary"/> : <StoryIcon color="warning"/>}
            لیست {currentType === 'reels' ? 'ریلزها' : 'استوری‌ها'} ({filteredScenarios.length})
        </Typography>
        {/* دکمه ایجاد در ScenarioManager است، اینجا فقط ویرایش داریم */}
      </Stack>

      <Paper elevation={3} sx={{p:0, borderRadius:2, overflow:'hidden', bgcolor: theme.palette.background.paper}}>
        <List sx={{p:0}}>
          {filteredScenarios.length === 0 ? (
            <Box p={4} textAlign="center">
                <Typography color="text.secondary">هنوز سناریویی در بخش {currentType === 'reels' ? 'ریلز' : 'استوری'} ثبت نشده است.</Typography>
            </Box>
          ) : (
            filteredScenarios.map((scenario, index) => (
              <ListItem
                key={scenario.id}
                divider
                sx={{
                    py: 2, px: 3,
                    '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography fontWeight="bold" variant="h6" color="primary.main">
                            {index + 1}. {scenario.title}
                        </Typography>
                        {getStatusChip(scenario.status)}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{maxWidth: '80%'}}>
                        {scenario.summary || "بدون خلاصه"}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                    {scenario.final_file && (
                        <Tooltip title="دانلود فایل نهایی">
                            <IconButton component="a" href={scenario.final_file} target="_blank" color="success" size="small">
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Divider orientation="vertical" flexItem sx={{mx:1}} />

                    {canApprove && scenario.status === 'idea' && (
                        <>
                            <Tooltip title="تایید"><IconButton size="small" onClick={() => handleClientAction(scenario, 'approve')} sx={{bgcolor: theme.palette.success.main, color:'#fff', '&:hover':{bgcolor: theme.palette.success.dark}}}><CheckIcon fontSize="small"/></IconButton></Tooltip>
                            <Tooltip title="اصلاح"><IconButton size="small" onClick={() => handleClientAction(scenario, 'reject')} sx={{bgcolor: theme.palette.error.main, color:'#fff', '&:hover':{bgcolor: theme.palette.error.dark}}}><CancelIcon fontSize="small"/></IconButton></Tooltip>
                            <Divider orientation="vertical" flexItem sx={{mx:1}} />
                        </>
                    )}

                    <Tooltip title="مشاهده و گفتگو">
                        <Button variant="outlined" size="small" startIcon={<VisibilityIcon/>} onClick={() => handleOpenModal(scenario)} sx={{minWidth: 'auto', px: 2}}>
                            جزییات
                        </Button>
                    </Tooltip>

                    {isAdmin && (
                        <>
                            <IconButton onClick={() => handleOpenFormModal(scenario)} color="info"><EditIcon /></IconButton>
                            <IconButton onClick={() => handleDeleteScenario(scenario.id)} color="error"><DeleteIcon /></IconButton>
                        </>
                    )}
                </Stack>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* --- مودال جزییات و چت --- */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
          {selectedScenario?.title}
          <IconButton onClick={handleCloseModal} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>

            <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.05), border:`1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                    <Chip icon={<FiberManualRecordIcon />} label={`سبک: ${selectedScenario?.style}`} size="small" />
                    <Chip icon={<FiberManualRecordIcon />} label={`هدف: ${selectedScenario?.goal}`} size="small" />
                    <Chip icon={<FiberManualRecordIcon />} label={`نوع: ${selectedScenario?.scenario_type === 'story' ? 'استوری' : 'ریلز'}`} size="small" color="secondary" variant="outlined" />
                    {getStatusChip(selectedScenario?.status)}

                    {canApprove && selectedScenario?.status === 'idea' && (
                        <Stack direction="row" spacing={1} ml="auto">
                             <Button variant="contained" color="success" size="small" startIcon={<CheckIcon/>} onClick={() => handleClientAction(selectedScenario, 'approve')}>تایید</Button>
                             <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon/>} onClick={() => handleClientAction(selectedScenario, 'reject')}>اصلاح</Button>
                        </Stack>
                    )}
                </Stack>
            </Paper>

            <Paper elevation={3} sx={{ p: 2, borderLeft: '4px solid #2196f3', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                    📁 فایل نهایی / خروجی سناریو
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                    {selectedScenario?.final_file ? (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<DownloadIcon />}
                                href={selectedScenario.final_file}
                                target="_blank"
                            >
                                دانلود فایل آپلود شده
                            </Button>
                            <Typography variant="caption" color="text.secondary">
                                (برای جایگزینی، فایل جدید آپلود کنید)
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            هنوز فایلی برای این سناریو بارگذاری نشده است.
                        </Typography>
                    )}

                    {canUpload && (
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                            disabled={uploading}
                            sx={{ ml: 'auto' }}
                        >
                            {selectedScenario?.final_file ? 'جایگزینی فایل' : 'آپلود فایل نهایی'}
                            <input type="file" hidden onChange={handleFileUpload} />
                        </Button>
                    )}
                </Stack>
            </Paper>

            <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">متن کامل سناریو:</Typography>
                <Paper elevation={1} sx={{ p: 3, maxHeight: '300px', overflow: 'auto', lineHeight: 1.8, bgcolor: alpha(theme.palette.background.paper, 0.8), color: theme.palette.text.primary }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedScenario?.full_scenario_text || '---'}</Typography>
                </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />

            {selectedScenario && user && <ScenarioComments scenarioId={selectedScenario.id} currentUser={user} />}

          </Stack>
        </DialogContent>
      </Dialog>

      {/* مودال ویرایش (ایجاد در والد است) */}
      <Dialog open={openFormModal} onClose={handleCloseFormModal} maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary } }}
      >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff' }}>ویرایش سناریو</DialogTitle>
          <DialogContent dividers>
              <ScenarioForm
                  projectId={projectId}
                  initialData={editingScenario}
                  onScenarioSaved={handleScenarioSaved}
                  onCancel={handleCloseFormModal}
                  defaultType={currentType}
              />
          </DialogContent>
      </Dialog>
    </Box>
  );
}

export default ScenarioList;