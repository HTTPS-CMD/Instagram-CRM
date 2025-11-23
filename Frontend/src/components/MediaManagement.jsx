// src/components/MediaManagement.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Stack, Button, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { getProjectFiles, uploadProjectFile, deleteProjectFile } from '../api';
import { useSnackbar } from 'notistack';
import moment from 'jalali-moment';

function MediaManagement({ project }) {
    const [extraFiles, setExtraFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    // استیت‌های آپلود
    const [openUploadModal, setOpenUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const { enqueueSnackbar } = useSnackbar();

    // دریافت لیست فایل‌های جانبی هنگام لود شدن کامپوننت
    useEffect(() => {
        fetchFiles();
    }, [project.id]);

    const fetchFiles = async () => {
        try {
            const response = await getProjectFiles(project.id);
            setExtraFiles(response.data);
        } catch (err) {
            console.error("Error fetching files:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) {
            enqueueSnackbar('لطفاً یک فایل انتخاب کنید', { variant: 'warning' });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('description', description);

        try {
            await uploadProjectFile(project.id, formData);
            enqueueSnackbar('فایل با موفقیت آپلود شد', { variant: 'success' });
            setOpenUploadModal(false);
            setUploadFile(null);
            setDescription('');
            fetchFiles(); // رفرش کردن لیست
        } catch (err) {
            console.error("Upload failed:", err);
            enqueueSnackbar('خطا در آپلود فایل', { variant: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (fileId) => {
        if (window.confirm('آیا از حذف این فایل مطمئن هستید؟')) {
            try {
                await deleteProjectFile(project.id, fileId);
                setExtraFiles(prev => prev.filter(f => f.id !== fileId));
                enqueueSnackbar('فایل حذف شد', { variant: 'info' });
            } catch (err) {
                console.error("Delete failed:", err);
                enqueueSnackbar('خطا در حذف فایل', { variant: 'error' });
            }
        }
    };

    // --- لیست فایل‌های ثابت (هویت بصری) ---
    const staticMediaMap = [
        {
            key: 'page_logo',
            label: 'لوگوی اصلی صفحه',
            icon: <ImageIcon />,
            fileName: project.page_logo, // url
            type: 'Image'
        },
        {
            key: 'cover_post_asset',
            label: 'کاور پست/ریلز (اصلی)',
            icon: <VideoFileIcon />,
            fileName: project.cover_post_asset,
            type: 'Media'
        },
        {
            key: 'cover_highlight_asset',
            label: 'کاور هایلایت (اصلی)',
            icon: <ImageIcon />,
            fileName: project.cover_highlight_asset,
            type: 'Image'
        },
    ];

    return (
        <Box>
            {/* --- بخش ۱: هویت بصری (ثابت) --- */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
                هویت بصری (ثابت)
            </Typography>
            <Grid container spacing={3} mb={4}>
                {staticMediaMap.map((media) => {
                    const isFileAvailable = !!media.fileName;
                    return (
                        <Grid item xs={12} md={4} key={media.key}>
                            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                        {media.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="bold">{media.label}</Typography>
                                        <Chip
                                            label={isFileAvailable ? 'موجود' : 'خالی'}
                                            color={isFileAvailable ? 'success' : 'default'}
                                            size="small"
                                            variant="outlined"
                                            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                </Stack>
                                <Button
                                    variant="outlined"
                                    startIcon={<FileDownloadIcon />}
                                    href={media.fileName}
                                    target="_blank"
                                    disabled={!isFileAvailable}
                                    fullWidth
                                    size="small"
                                >
                                    دانلود فایل
                                </Button>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* --- بخش ۲: فایل‌های جانبی (داینامیک) --- */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} mt={4}>
                <Typography variant="h6" sx={{ color: 'secondary.main' }}>
                    فایل‌های ضمیمه پروژه
                </Typography>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenUploadModal(true)}
                >
                    آپلود فایل جدید
                </Button>
            </Stack>

            {loading ? (
                <Box display="flex" justifyContent="center" my={3}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={2}>
                    {extraFiles.length === 0 ? (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.2)' }}>
                                <Typography variant="body2" color="text.secondary">
                                    هنوز فایل جانبی (راش، عکس ادیت شده و...) آپلود نشده است.
                                </Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        extraFiles.map((file) => (
                            <Grid item xs={12} sm={6} md={4} key={file.id}>
                                <Paper elevation={2} sx={{ p: 2, position: 'relative', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                        <InsertDriveFileIcon color="action" fontSize="large" />
                                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                            <Typography variant="subtitle2" noWrap title={file.file.split('/').pop()}>
                                                {decodeURIComponent(file.file.split('/').pop())}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                                {moment(file.uploaded_at).locale('fa').format('jYYYY/jMM/jDD - HH:mm')}
                                            </Typography>
                                            {file.description && (
                                                <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, fontSize: '0.85rem' }}>
                                                    {file.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={1} mt={2} justifyContent="flex-end">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(file.id)}
                                            title="حذف فایل"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<FileDownloadIcon />}
                                            href={file.file}
                                            target="_blank"
                                        >
                                            دانلود
                                        </Button>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* --- مودال آپلود فایل --- */}
            <Dialog open={openUploadModal} onClose={() => setOpenUploadModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    آپلود فایل جدید
                    <IconButton onClick={() => setOpenUploadModal(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} mt={1}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadFileIcon />}
                            fullWidth
                            sx={{ height: 60, borderStyle: 'dashed' }}
                        >
                            {uploadFile ? uploadFile.name : 'انتخاب فایل از سیستم'}
                            <input
                                type="file"
                                hidden
                                onChange={(e) => setUploadFile(e.target.files[0])}
                            />
                        </Button>

                        <TextField
                            label="توضیحات (اختیاری)"
                            placeholder="مثلاً: راش‌های روز اول فیلمبرداری"
                            fullWidth
                            multiline
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenUploadModal(false)} color="inherit">انصراف</Button>
                    <Button
                        onClick={handleUpload}
                        variant="contained"
                        color="secondary"
                        disabled={isUploading || !uploadFile}
                        startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
                    >
                        {isUploading ? 'در حال آپلود...' : 'آپلود کن'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default MediaManagement;