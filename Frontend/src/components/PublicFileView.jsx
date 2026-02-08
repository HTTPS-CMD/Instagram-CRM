// src/components/PublicFileView.jsx
import React, {useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import {
    Download as DownloadIcon,
    Error as ErrorIcon,
    LocationOn as PinIcon,
    Send as SendIcon
} from '@mui/icons-material';
import {getPublicFile, postPublicComment} from '../api';
import moment from 'jalali-moment';

function PublicFileView() {
    const {token} = useParams();
    const theme = useTheme(); // ✅ استفاده از تم
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Comment States
    const [comments, setComments] = useState([]);
    const [tempPoint, setTempPoint] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [commentText, setCommentText] = useState('');
    const [openNameDialog, setOpenNameDialog] = useState(false);

    const imageRef = useRef(null);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const res = await getPublicFile(token);
                setData(res.data);
                setComments(res.data.comments || []);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
    }, [token]);

    const handleImageClick = (e) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setTempPoint({x, y});

        // اگر هنوز نام وارد نکرده، بپرس
        if (!guestName) {
            setOpenNameDialog(true);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentText || !tempPoint) return;

        try {
            const payload = {
                guest_name: guestName || 'مهمان',
                text: commentText,
                x_position: tempPoint.x,
                y_position: tempPoint.y
            };

            const res = await postPublicComment(token, payload);
            setComments([...comments, res.data]);
            setTempPoint(null);
            setCommentText('');
        } catch (err) {
            alert('خطا در ثبت نظر');
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" height="100vh" alignItems="center"
                             bgcolor={theme.palette.background.default}><CircularProgress/></Box>;
    if (error) return <Box display="flex" flexDirection="column" justifyContent="center" height="100vh"
                           alignItems="center" bgcolor={theme.palette.background.default}
                           color="text.primary"><ErrorIcon sx={{fontSize: 60, mb: 2, color: 'error.main'}}/><Typography
        variant="h5">لینک نامعتبر یا منقضی شده است.</Typography></Box>;

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#121212',
            color: 'white',
            display: 'flex',
            flexDirection: {xs: 'column', md: 'row'}
        }}>

            {/* --- بخش نمایش فایل --- */}
            <Box sx={{
                flex: 1,
                position: 'relative',
                bgcolor: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {data.file_type === 'image' ? (
                    <div style={{position: 'relative', maxWidth: '100%', maxHeight: '100vh'}}>
                        <img
                            ref={imageRef}
                            src={data.file_url}
                            alt="Preview"
                            style={{maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain', cursor: 'crosshair'}}
                            onClick={handleImageClick}
                        />
                        {/* نمایش کامنت‌ها */}
                        {comments.map((c, i) => (
                            <Tooltip key={i} title={`${c.author_name}: ${c.text}`} arrow open={true}>
                                <Box sx={{
                                    position: 'absolute',
                                    left: `${c.x_position}%`,
                                    top: `${c.y_position}%`,
                                    transform: 'translate(-50%, -100%)',
                                    color: '#ff1744',
                                    filter: 'drop-shadow(0 2px 4px black)'
                                }}>
                                    <PinIcon fontSize="large"/>
                                </Box>
                            </Tooltip>
                        ))}
                        {/* پین موقت */}
                        {tempPoint && (
                            <Box sx={{
                                position: 'absolute',
                                left: `${tempPoint.x}%`,
                                top: `${tempPoint.y}%`,
                                transform: 'translate(-50%, -100%)',
                                color: '#00e676',
                                animation: 'bounce 1s infinite'
                            }}>
                                <PinIcon fontSize="large"/>
                            </Box>
                        )}
                    </div>
                ) : (
                    <video src={data.file_url} controls style={{maxWidth: '100%', maxHeight: '100vh'}}/>
                )}
            </Box>

            {/* --- سایدبار نظرات --- */}
            {/* نکته: سایدبار همیشه تیره است تا با بخش مدیا هماهنگ باشد (حتی در لایت مود) */}
            <Box sx={{
                width: {xs: '100%', md: 350},
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#1e1e2d'
            }}>
                <Box p={3} borderBottom="1px solid rgba(255,255,255,0.1)">
                    <Typography variant="h6" fontWeight="bold"
                                color="white">{data.file_name || 'بدون عنوان'}</Typography>
                    <Typography variant="caption" color="gray">برای ثبت نظر، روی تصویر کلیک کنید.</Typography>
                    <Button startIcon={<DownloadIcon/>} href={data.file_url} target="_blank" fullWidth
                            variant="outlined" sx={{mt: 2, color: 'white', borderColor: 'rgba(255,255,255,0.2)'}}>
                        دانلود فایل
                    </Button>
                </Box>

                <Box sx={{flex: 1, overflowY: 'auto', p: 2}}>
                    {comments.length === 0 ? (
                        <Typography align="center" color="gray" mt={4}>هنوز نظری ثبت نشده.</Typography>
                    ) : (
                        comments.map((c, i) => (
                            <Paper key={i} sx={{p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.05)', color: 'white'}}>
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography variant="subtitle2" fontWeight="bold"
                                                color="primary.light">{c.author_name}</Typography>
                                    <Typography variant="caption"
                                                color="gray">{moment(c.created_at).format('jYYYY/jMM/jDD')}</Typography>
                                </Stack>
                                <Typography variant="body2">{c.text}</Typography>
                            </Paper>
                        ))
                    )}
                </Box>

                {/* ورودی متن */}
                {tempPoint && (
                    <Box p={2} borderTop="1px solid rgba(255,255,255,0.1)" bgcolor="rgba(0,0,0,0.3)">
                        <Typography variant="caption" color="success.main" mb={1} display="block">نقطه انتخاب شد
                            ({guestName})</Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                fullWidth size="small" placeholder="نوشتن نظر..."
                                value={commentText} onChange={e => setCommentText(e.target.value)}
                                sx={{
                                    '& input': {color: 'white'},
                                    '& fieldset': {borderColor: 'rgba(255,255,255,0.3)'},
                                    '& .MuiOutlinedInput-root:hover fieldset': {borderColor: 'white'}
                                }}
                            />
                            <IconButton color="primary" onClick={handleSubmitComment}><SendIcon/></IconButton>
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* دیالوگ دریافت نام */}
            <Dialog open={openNameDialog} onClose={() => {
                if (guestName) setOpenNameDialog(false);
            }}>
                <DialogTitle>لطفاً نام خود را وارد کنید</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="نام شما" fullWidth variant="outlined"
                        value={guestName} onChange={e => setGuestName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNameDialog(false)} disabled={!guestName}>تایید</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}

export default PublicFileView;