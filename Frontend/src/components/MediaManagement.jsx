// src/components/MediaManagement.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, Stack, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
    Tabs, Tab, CardMedia, Checkbox, useTheme, Fade, Tooltip, Avatar, Popover, MenuItem, alpha
} from '@mui/material';
import {
    CloudUpload as UploadIcon, Delete as DeleteIcon, Folder as FolderIcon,
    Image as ImageIcon, Movie as VideoIcon, InsertDriveFile as FileIcon,
    FileDownload as DownloadIcon, GridView as GridViewIcon, CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon, PlayCircleOutline as PlayIcon, PictureAsPdf as PdfIcon,
    Close as CloseIcon, Send as SendIcon, LocationOn as PinIcon, Share as ShareIcon // ✅ ShareIcon ایمپورت شد
} from '@mui/icons-material';

import { getProjectFiles, uploadProjectFile, deleteProjectFile, getFileComments, createFileComment, deleteFileComment, generateSharedLink } from '../api'; // ✅ generateSharedLink ایمپورت شد
import { useSnackbar } from 'notistack';
import { UserContext } from '../App';
import moment from 'jalali-moment';

const FOLDERS = [
    { id: 'all', label: 'همه فایل‌ها', icon: <GridViewIcon /> },
    { id: 'rush', label: 'راش و خام', icon: <VideoIcon /> },
    { id: 'edit', label: 'ادیت نهایی', icon: <ImageIcon /> },
    { id: 'docs', label: 'اسناد و متن', icon: <FileIcon /> },
    { id: 'other', label: 'سایر', icon: <FolderIcon /> },
];

const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url || '');
const isVideo = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url || '');
const isPdf = (url) => /\.(pdf)$/i.test(url || '');

function MediaManagement({ project }) {
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useContext(UserContext);
    const theme = useTheme(); // ✅ استفاده از تم

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState('all');

    // Upload States
    const [openUpload, setOpenUpload] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [category, setCategory] = useState('other');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);

    // Selection States
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectMode, setSelectMode] = useState(false);

    // Preview & Comment States
    const [previewFile, setPreviewFile] = useState(null);
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [tempPoint, setTempPoint] = useState(null); // {x, y}
    const [loadingComments, setLoadingComments] = useState(false);
    const imageRef = useRef(null);

    // جلوگیری از کرش اگر پروژه هنوز لود نشده
    if (!project || !project.id) {
        return <Box p={3}><CircularProgress /></Box>;
    }

    useEffect(() => {
        fetchFiles();
    }, [project.id]);

    useEffect(() => {
        if (previewFile) {
            fetchComments(previewFile.id);
        }
    }, [previewFile]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await getProjectFiles(project.id);
            let rawData = [];
            if (res && Array.isArray(res.data)) rawData = res.data;
            else if (res && res.data && Array.isArray(res.data.results)) rawData = res.data.results;

            const processed = rawData.map(f => {
                const desc = f.description || '';
                const parts = desc.split('|||');
                return {
                    ...f,
                    file: f.file || '',
                    category: parts.length > 1 ? parts[0] : 'other',
                    realDesc: parts.length > 1 ? parts[1] : desc
                };
            });
            setFiles(processed);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchComments = async (fileId) => {
        setLoadingComments(true);
        try {
            const res = await getFileComments(fileId);
            setComments(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingComments(false); }
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        const finalDesc = `${category}|||${description}`;
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('description', finalDesc);

        try {
            await uploadProjectFile(project.id, formData);
            enqueueSnackbar('آپلود شد', { variant: 'success' });
            setOpenUpload(false); setUploadFile(null); setDescription('');
            fetchFiles();
        } catch (err) { enqueueSnackbar('خطا در آپلود', { variant: 'error' }); }
        finally { setUploading(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm(`حذف ${selectedIds.length} فایل؟`)) return;
        try {
            await Promise.all(selectedIds.map(id => deleteProjectFile(project.id, id)));
            setFiles(prev => prev.filter(f => !selectedIds.includes(f.id)));
            setSelectedIds([]); setSelectMode(false);
            enqueueSnackbar('حذف شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); }
    };

    const handleImageClick = (e) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setTempPoint({ x, y });
    };

    const handleAddComment = async () => {
        if (!newCommentText.trim() || !tempPoint) return;
        try {
            const res = await createFileComment({
                file: previewFile.id,
                text: newCommentText,
                x_position: tempPoint.x,
                y_position: tempPoint.y
            });
            setComments([...comments, res.data]);
            setTempPoint(null);
            setNewCommentText('');
            enqueueSnackbar('کامنت ثبت شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا در ثبت کامنت', { variant: 'error' }); }
    };

    const handleDeleteComment = async (id) => {
        try {
            await deleteFileComment(id);
            setComments(prev => prev.filter(c => c.id !== id));
        } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); }
    };

    // ✅ تابع جدید برای تولید لینک اشتراک‌گذاری
    const handleShare = async () => {
        if (!previewFile) return;
        try {
            const res = await generateSharedLink(previewFile.id);
            const link = `${window.location.origin}/share/${res.data.link_id}`; // اصلاح: استفاده از آیدی لینک از پاسخ سرور
            // اگر از React Router استفاده می‌کنید، ممکن است نیاز باشد base URL را تنظیم کنید.
            // اینجا فرض بر این است که روت '/share/:token' در اپ اصلی تعریف شده است.

            await navigator.clipboard.writeText(link);
            enqueueSnackbar('لینک عمومی کپی شد! برای مشتری ارسال کنید.', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar('خطا در ایجاد لینک اشتراک‌گذاری', { variant: 'error' });
            console.error(err);
        }
    };


    const filteredFiles = currentTab === 'all' ? files : files.filter(f => f.category === currentTab);

    // --- Styles ---
    const glassSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        boxShadow: theme.shadows[4],
        overflow: 'hidden'
    };

    const mediaCardSx = (selected) => ({
        position: 'relative', borderRadius: 3, cursor: 'pointer', overflow: 'hidden', height: 220,
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.background.paper, 0.5),
        border: selected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme.shadows[6],
            borderColor: theme.palette.text.secondary
        }
    });

    const textFieldSx = {
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': { borderColor: theme.palette.divider }
        },
        '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
        '& .MuiSelect-icon': { color: theme.palette.text.primary }
    };

    return (
        <Box>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={3} spacing={2}>
                <Tabs
                    value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': { color: theme.palette.text.secondary, borderRadius: 2, minHeight: 40, mr: 1 },
                        '& .Mui-selected': { color: `${theme.palette.primary.main} !important`, bgcolor: alpha(theme.palette.primary.main, 0.1) },
                        '& .MuiTabs-indicator': { display: 'none' }
                    }}
                >
                    {FOLDERS.map(f => <Tab key={f.id} value={f.id} label={f.label} icon={f.icon} iconPosition="start" />)}
                </Tabs>

                <Stack direction="row" spacing={1}>
                    {selectedIds.length > 0 ? (
                        <>
                            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>حذف ({selectedIds.length})</Button>
                            <Button variant="outlined" sx={{color: theme.palette.text.secondary, borderColor: theme.palette.divider}} onClick={() => { setSelectedIds([]); setSelectMode(false); }}>لغو</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outlined" sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }} onClick={() => setSelectMode(!selectMode)}>{selectMode ? 'لغو انتخاب' : 'انتخاب گروهی'}</Button>
                            <Button variant="contained" color="secondary" startIcon={<UploadIcon />} onClick={() => setOpenUpload(true)} sx={{ bgcolor: theme.palette.success.main, color: '#fff', fontWeight: 'bold' }}>آپلود</Button>
                        </>
                    )}
                </Stack>
            </Stack>

            {loading ? <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box> : filteredFiles.length === 0 ?
                <Paper sx={{ ...glassSx, p: 5, textAlign: 'center', borderStyle: 'dashed' }}><Typography color="text.secondary">فایلی یافت نشد.</Typography></Paper> : (
                <Grid container spacing={3}>
                    {filteredFiles.map((file) => {
                        const isSelected = selectedIds.includes(file.id);
                        return (
                            <Grid item xs={6} sm={4} md={3} lg={2.4} key={file.id}>
                                <Fade in={true}>
                                    <Box sx={mediaCardSx(isSelected)} onClick={() => { if (selectMode) { setSelectedIds(prev => prev.includes(file.id) ? prev.filter(x => x !== file.id) : [...prev, file.id]); } else { setPreviewFile(file); } }}>
                                        {selectMode && <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}><Checkbox checked={isSelected} icon={<UncheckedIcon sx={{color:'#fff'}} />} checkedIcon={<CheckCircleIcon color="primary" />} /></Box>}
                                        <Box sx={{ height: 160, bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position:'relative' }}>
                                            {isImage(file.file) ? <CardMedia component="img" image={file.file} sx={{ height: '100%', objectFit: 'cover' }} /> : isVideo(file.file) ? <><video src={file.file} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} /><PlayIcon sx={{ position: 'absolute', fontSize: 50, color: 'white', opacity: 0.8 }} /></> : <FileIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.5)' }} />}
                                        </Box>
                                        <Box sx={{ p: 1.5, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                                            <Typography variant="body2" fontWeight="bold" noWrap sx={{ color: 'white' }}>{file.realDesc || 'بدون عنوان'}</Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display:'block' }}>{file.uploaded_at ? moment(file.uploaded_at).locale('fa').format('jD jMMMM') : ''}</Typography>
                                        </Box>
                                    </Box>
                                </Fade>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* --- مودال پیش‌نمایش و کامنت‌گذاری --- */}
            <Dialog open={!!previewFile} onClose={() => { setPreviewFile(null); setTempPoint(null); }} maxWidth="xl" fullWidth
                PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, height: '90vh' } }}
            >
                <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography>{previewFile?.realDesc || 'پیش‌نمایش فایل'}</Typography>

                        {/* ✅ دکمه اشتراک‌گذاری اضافه شده */}
                        <Tooltip title="دریافت لینک عمومی برای مشتری">
                            <IconButton
                                onClick={handleShare}
                                sx={{
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    color: theme.palette.success.main,
                                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                                }}
                            >
                                <ShareIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <IconButton onClick={() => { setPreviewFile(null); setTempPoint(null); }} color="inherit"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
                    {/* بخش تصویر */}
                    <Box sx={{ flex: 1, bgcolor: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: isImage(previewFile?.file) ? 'crosshair' : 'default' }}>
                        {previewFile && isImage(previewFile.file) ? (
                            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
                                <img
                                    ref={imageRef}
                                    src={previewFile.file}
                                    alt="preview"
                                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                                    onClick={handleImageClick}
                                />
                                {/* نمایش پین‌های موجود */}
                                {comments.map(c => (
                                    <Tooltip key={c.id} title={`${c.author_name}: ${c.text}`} arrow open={true}>
                                        <Box sx={{
                                            position: 'absolute',
                                            left: `${c.x_position}%`,
                                            top: `${c.y_position}%`,
                                            transform: 'translate(-50%, -100%)', // نوک پین روی نقطه باشد
                                            color: theme.palette.error.main,
                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                                        }}>
                                            <PinIcon fontSize="large" />
                                            <Avatar src={c.author_avatar} sx={{ width: 20, height: 20, position: 'absolute', top: 5, left: 7, border:'1px solid white' }} />
                                        </Box>
                                    </Tooltip>
                                ))}
                                {/* نمایش پین موقت */}
                                {tempPoint && (
                                    <Box sx={{ position: 'absolute', left: `${tempPoint.x}%`, top: `${tempPoint.y}%`, transform: 'translate(-50%, -100%)', color: theme.palette.success.main, animation: 'bounce 1s infinite' }}>
                                        <PinIcon fontSize="large" />
                                    </Box>
                                )}
                            </div>
                        ) : previewFile && isVideo(previewFile.file) ? (
                            <video src={previewFile.file} controls style={{ maxWidth: '100%', maxHeight: '80vh' }} />
                        ) : (
                            <Button variant="contained" href={previewFile?.file} target="_blank">دانلود فایل</Button>
                        )}
                    </Box>

                    {/* سایدبار کامنت‌ها */}
                    <Box sx={{ width: 350, borderLeft: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                        <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`}>
                            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">نظرات و اصلاحات</Typography>
                            {isImage(previewFile?.file) && <Typography variant="caption" color="text.secondary">روی تصویر کلیک کنید تا نظر بدهید.</Typography>}
                        </Box>

                        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                            {loadingComments ? <CircularProgress size={20} sx={{display:'block', mx:'auto'}} /> : comments.length === 0 ? <Typography align="center" color="text.secondary" mt={5}>هنوز نظری ثبت نشده است.</Typography> :
                                comments.map(c => (
                                    <Paper key={c.id} sx={{ p: 1.5, mb: 2, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                            <Avatar src={c.author_avatar} sx={{ width: 24, height: 24 }}>{c.author_name?.[0]}</Avatar>
                                            <Typography variant="subtitle2" fontWeight="bold" color="primary">{c.author_name}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{moment(c.created_at).locale('fa').fromNow()}</Typography>
                                            {(user.id === c.author || user.role === 'admin') && <IconButton size="small" color="error" onClick={() => handleDeleteComment(c.id)}><DeleteIcon fontSize="small" /></IconButton>}
                                        </Stack>
                                        <Typography variant="body2" color="text.primary">{c.text}</Typography>
                                    </Paper>
                                ))
                            }
                        </Box>

                        {/* ورودی کامنت */}
                        {isImage(previewFile?.file) && tempPoint ? (
                            <Box p={2} borderTop={`1px solid ${theme.palette.divider}`} bgcolor={alpha(theme.palette.background.paper, 0.8)}>
                                <Typography variant="caption" color="success.main" mb={1} display="block">نقطه انتخاب شد. نظر خود را بنویسید:</Typography>
                                <Stack direction="row" spacing={1}>
                                    <TextField fullWidth size="small" placeholder="نوشتن نظر..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} sx={textFieldSx} />
                                    <IconButton color="primary" onClick={handleAddComment} disabled={!newCommentText}><SendIcon /></IconButton>
                                </Stack>
                            </Box>
                        ) : isImage(previewFile?.file) && (
                            <Box p={2} textAlign="center" borderTop={`1px solid ${theme.palette.divider}`}>
                                <Typography variant="caption" color="text.secondary">برای افزودن نظر، روی بخشی از تصویر کلیک کنید.</Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* مودال آپلود */}
            <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary } }}
            >
                <DialogTitle>آپلود فایل جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} mt={1}>
                        <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ height: 100, border: `2px dashed ${theme.palette.divider}`, color: theme.palette.text.secondary }}>
                            {uploadFile ? uploadFile.name : 'انتخاب فایل از سیستم'}
                            <input type="file" hidden onChange={(e) => setUploadFile(e.target.files[0])} />
                        </Button>
                        <TextField select label="پوشه / دسته‌بندی" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth sx={textFieldSx}>
                            {FOLDERS.filter(f => f.id !== 'all').map(f => <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>)}
                        </TextField>
                        <TextField label="توضیحات" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} sx={textFieldSx} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenUpload(false)} color="inherit">لغو</Button>
                    <Button onClick={handleUpload} variant="contained" color="success" disabled={uploading || !uploadFile} sx={{ color: '#fff', fontWeight: 'bold' }}>{uploading ? <CircularProgress size={24} /> : 'آپلود'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default MediaManagement;