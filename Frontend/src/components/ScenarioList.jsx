// src/components/ScenarioList.jsx
import React, { useState, useEffect, useContext } from "react";
import { getScenarios, deleteScenario, updateScenario, createScenario } from "../api";
import {
  Box, Typography, CircularProgress, Paper, List,
  ListItem, ListItemText, Stack, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Tooltip, Divider
} from "@mui/material";
import { motion } from "framer-motion";
import {
    Visibility as VisibilityIcon,
    Close as CloseIcon,
    FiberManualRecord as FiberManualRecordIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    CloudUpload as UploadIcon, // ✅ آیکون آپلود
    FileDownload as DownloadIcon // ✅ آیکون دانلود
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

const ScenarioForm = ({ projectId, initialData, onScenarioSaved, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '', summary: '', full_scenario_text: '',
    style: 'educational', goal: 'engagement', status: 'idea',
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

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

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField name="title" label="عنوان سناریو" value={formData.title} onChange={handleChange} fullWidth required inputProps={{style:{textAlign:'right', direction:'rtl'}}} />
        </Grid>
        <Grid item xs={12}>
          <TextField name="summary" label="خلاصه" value={formData.summary} onChange={handleChange} fullWidth multiline rows={2} inputProps={{style:{textAlign:'right', direction:'rtl'}}} />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>سبک</InputLabel>
            <Select name="style" value={formData.style} label="سبک" onChange={handleChange} sx={{textAlign:'right'}}>
              {SCENARIO_STYLES.map(s => <MenuItem key={s.value} value={s.value} sx={{direction:'rtl'}}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>هدف</InputLabel>
            <Select name="goal" value={formData.goal} label="هدف" onChange={handleChange} sx={{textAlign:'right'}}>
              {SCENARIO_GOALS.map(g => <MenuItem key={g.value} value={g.value} sx={{direction:'rtl'}}>{g.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>وضعیت</InputLabel>
            <Select name="status" value={formData.status} label="وضعیت" onChange={handleChange} sx={{textAlign:'right'}}>
              {SCENARIO_STATUSES.map(s => <MenuItem key={s.value} value={s.value} sx={{direction:'rtl'}}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField name="full_scenario_text" label="متن کامل سناریو" value={formData.full_scenario_text} onChange={handleChange} fullWidth multiline rows={6} required inputProps={{style:{textAlign:'right', direction:'rtl'}}} />
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onCancel} color="inherit">انصراف</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'ذخیره'}</Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

function ScenarioList({ projectId, isAdmin }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const [openFormModal, setOpenFormModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);

  const [uploading, setUploading] = useState(false); // ✅ استیت آپلود

  const { user } = useContext(UserContext);
  const canApprove = user && (user.role === 'client' || user.role === 'admin');
  // ✅ اعضای تیم تولید (به جز مشتری) اجازه آپلود دارند
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

  // --- ✅ هندلر آپلود فایل نهایی ---
  const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file || !selectedScenario) return;

      setUploading(true);
      const formData = new FormData();
      formData.append('final_file', file);

      try {
          const response = await updateScenario(selectedScenario.id, formData, projectId);
          // آپدیت استیت‌ها
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

  if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{ textAlign: 'right', mb: 0 }}>لیست سناریوها ({scenarios.length})</Typography>
        {(isAdmin || (user && user.role === 'writer')) && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenFormModal(null)}>ایجاد سناریو</Button>
        )}
      </Stack>

      <Paper elevation={3} sx={{p:0, borderRadius:2, overflow:'hidden'}}>
        <List sx={{p:0}}>
          {scenarios.length === 0 ? <Typography p={3} align="center">هنوز سناریویی ثبت نشده است.</Typography> :
            scenarios.map((scenario, index) => (
              <ListItem
                key={scenario.id}
                divider
                sx={{
                    py: 2, px: 3,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 2
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
                    {/* اگر فایل نهایی دارد، آیکون دانلود نشان بده */}
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
                            <Tooltip title="تایید"><IconButton size="small" onClick={() => handleClientAction(scenario, 'approve')} sx={{bgcolor:'success.main', color:'white', '&:hover':{bgcolor:'success.dark'}}}><CheckIcon fontSize="small"/></IconButton></Tooltip>
                            <Tooltip title="اصلاح"><IconButton size="small" onClick={() => handleClientAction(scenario, 'reject')} sx={{bgcolor:'error.main', color:'white', '&:hover':{bgcolor:'error.dark'}}}><CancelIcon fontSize="small"/></IconButton></Tooltip>
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
          }
        </List>
      </Paper>

      {/* --- مودال جزییات و چت --- */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
          {selectedScenario?.title}
          <IconButton onClick={handleCloseModal} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
          <Stack spacing={3}>

            {/* بخش وضعیت */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                    <Chip icon={<FiberManualRecordIcon />} label={`سبک: ${selectedScenario?.style}`} size="small" />
                    <Chip icon={<FiberManualRecordIcon />} label={`هدف: ${selectedScenario?.goal}`} size="small" />
                    {getStatusChip(selectedScenario?.status)}

                    {canApprove && selectedScenario?.status === 'idea' && (
                        <Stack direction="row" spacing={1} ml="auto">
                             <Button variant="contained" color="success" size="small" startIcon={<CheckIcon/>} onClick={() => handleClientAction(selectedScenario, 'approve')}>تایید</Button>
                             <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon/>} onClick={() => handleClientAction(selectedScenario, 'reject')}>اصلاح</Button>
                        </Stack>
                    )}
                </Stack>
            </Paper>

            {/* ✅✅✅ بخش فایل نهایی (آپلود / دانلود) */}
            <Paper elevation={3} sx={{ p: 2, borderLeft: '4px solid #2196f3', bgcolor: 'background.paper' }}>
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

                    {/* دکمه آپلود فقط برای تیم تولید */}
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
                <Paper elevation={1} sx={{ p: 3, maxHeight: '300px', overflow: 'auto', lineHeight: 1.8, bgcolor: 'background.paper' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedScenario?.full_scenario_text || '---'}</Typography>
                </Paper>
            </Box>

            <Divider />

            {/* بخش چت */}
            {selectedScenario && user && <ScenarioComments scenarioId={selectedScenario.id} currentUser={user} />}

          </Stack>
        </DialogContent>
      </Dialog>

      {/* مودال فرم */}
      <Dialog open={openFormModal} onClose={handleCloseFormModal} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>{editingScenario ? 'ویرایش' : 'ایجاد'}</DialogTitle>
          <DialogContent dividers>
              <ScenarioForm projectId={projectId} initialData={editingScenario} onScenarioSaved={handleScenarioSaved} onCancel={handleCloseFormModal} />
          </DialogContent>
      </Dialog>
    </Box>
  );
}

export default ScenarioList;