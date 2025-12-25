// src/components/ChatPage.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    Box, Typography, Paper, List, ListItemButton, ListItemAvatar, ListItemText,
    Avatar, IconButton, Button, TextField, Stack, CircularProgress, InputAdornment, Popover,
    useTheme, Chip, alpha
} from '@mui/material';
import {
    Send as SendIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    AttachFile as AttachIcon,
    Search as SearchIcon,
    InsertDriveFile as FileIcon,
    MoreVert as MoreVertIcon,
    Check as CheckIcon,
    DoneAll as DoneAllIcon,
    EmojiEmotions as EmojiIcon,
    Reply as ReplyIcon,
    Close as CloseIcon,
    Chat as ChatIcon,
    Mic as MicIcon,        // ✅ آیکون ضبط
    Stop as StopIcon,      // ✅ آیکون توقف
    GraphicEq as AudioIcon // ✅ آیکون فایل صوتی
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import moment from 'jalali-moment';
import EmojiPicker from 'emoji-picker-react';
import { getChatRooms, getChatMessages, sendChatMessage } from '../api';
import { UserContext } from '../App';

// تشخیص نوع فایل
const isImage = (fileUrl) => /\.(jpeg|jpg|gif|png|webp)$/i.test(fileUrl);
const isVideo = (fileUrl) => /\.(mp4|webm|ogg)$/i.test(fileUrl);
const isAudio = (fileUrl) => /\.(mp3|wav|ogg|webm|m4a)$/i.test(fileUrl); // ✅ تشخیص فایل صوتی

function ChatPage() {
    const { user } = useContext(UserContext);
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();

    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [messageText, setMessageText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- استیت‌های ضبط صدا ---
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const messagesEndRef = useRef(null);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);

    // استایل‌های داینامیک
    const glassPaperSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: theme.shadows[4],
        height: 'calc(100vh - 120px)',
        display: 'flex'
    };

    const bubbleSx = (isMe) => ({
        p: 1.5, px: 2, maxWidth: '75%', minWidth: '100px',
        bgcolor: isMe ? 'primary.main' : alpha(theme.palette.background.paper, 1),
        color: isMe ? '#fff' : theme.palette.text.primary,
        borderRadius: 2,
        borderTopRightRadius: isMe ? 0 : 16,
        borderTopLeftRadius: isMe ? 16 : 0,
        boxShadow: theme.shadows[1],
        position: 'relative',
        wordWrap: 'break-word',
        border: isMe ? 'none' : `1px solid ${theme.palette.divider}`,
        '& .reply-btn': { opacity: 0, transition: 'opacity 0.2s' },
        '&:hover .reply-btn': { opacity: 1 }
    });

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (searchTerm) {
            setFilteredRooms(rooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())));
        } else {
            setFilteredRooms(rooms);
        }
    }, [searchTerm, rooms]);

    useEffect(() => {
        if (selectedRoom) {
            fetchMessages(selectedRoom.id);
            const interval = setInterval(() => fetchMessages(selectedRoom.id, true), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedRoom]);

    const fetchRooms = async () => {
        try {
            const res = await getChatRooms();
            setRooms(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingRooms(false); }
    };

    const fetchMessages = async (roomId, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const res = await getChatMessages(roomId);
            if (res.data.length > messages.length || !silent) {
                setMessages(res.data);
                scrollToBottom();
            }
        } catch (err) { console.error(err); }
        finally { if (!silent) setLoadingMessages(false); }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // --- توابع ضبط صدا ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
                setSelectedFile(audioFile); // فایل ضبط شده را برای ارسال آماده می‌کند

                // خاموش کردن استریم میکروفون
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error:", err);
            enqueueSnackbar("دسترسی به میکروفون امکان‌پذیر نیست.", { variant: 'error' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() && !selectedFile) return;
        setSending(true);
        const formData = new FormData();
        formData.append('room', selectedRoom.id);
        formData.append('text', messageText.trim() || ''); // اگر فقط فایل بود، متن خالی بفرست
        if (selectedFile) formData.append('file', selectedFile);
        if (replyTo) formData.append('reply_to', replyTo.id);

        try {
            await sendChatMessage(formData);
            setMessageText('');
            setSelectedFile(null);
            setReplyTo(null);
            fetchMessages(selectedRoom.id, true);
        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در ارسال پیام', { variant: 'error' });
        }
        finally { setSending(false); }
    };

    const onEmojiClick = (emojiObject) => {
        setMessageText(prev => prev + emojiObject.emoji);
        setEmojiAnchorEl(null);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const pvRooms = filteredRooms.filter(r => r.type === 'pv');
    const groupRooms = filteredRooms.filter(r => r.type === 'group');

    return (
        <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>
            <Typography variant="h4" fontWeight="900" mb={3} sx={{
                color: theme.palette.text.primary,
                display:'flex', alignItems:'center', gap:1,
                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <ChatIcon fontSize="large" sx={{color: theme.palette.primary.main}}/> مرکز گفتگو
            </Typography>

            <Paper sx={glassPaperSx}>
                {/* ستون راست: لیست */}
                <Box sx={{
                    width: { xs: selectedRoom ? 0 : '100%', md: 320 },
                    borderLeft: `1px solid ${theme.palette.divider}`,
                    display: selectedRoom ? { xs: 'none', md: 'flex' } : 'flex',
                    flexDirection: 'column',
                    bgcolor: alpha(theme.palette.background.paper, 0.4)
                }}>
                    <Box p={2} pb={1}>
                        <TextField
                            fullWidth size="small" placeholder="جستجو..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{color: theme.palette.text.secondary}} /></InputAdornment>,
                                style: {
                                    color: theme.palette.text.primary,
                                    backgroundColor: alpha(theme.palette.action.hover, 0.05),
                                    borderRadius: 10
                                }
                            }}
                            sx={{ '& fieldset': { border: 'none' } }}
                        />
                    </Box>
                    <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                        {loadingRooms ? <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box> : (
                            <List>
                                {groupRooms.length > 0 && (
                                    <>
                                        <Typography variant="caption" fontWeight="bold" sx={{ px: 2, py: 1, display: 'block', color: theme.palette.text.secondary }}>گروه‌ها</Typography>
                                        {groupRooms.map((room) => (
                                            <ListItemButton
                                                key={room.id}
                                                onClick={() => setSelectedRoom(room)}
                                                selected={selectedRoom?.id === room.id}
                                                sx={{
                                                    px: 2, py: 1.5,
                                                    '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1), borderRight: `3px solid ${theme.palette.primary.main}` },
                                                    '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) }
                                                }}
                                            >
                                                <ListItemAvatar><Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2), color: theme.palette.warning.main }}><GroupIcon /></Avatar></ListItemAvatar>
                                                <ListItemText
                                                    primary={<Typography fontWeight="bold" noWrap color="text.primary">{room.name.replace('گروه پروژه: ', '')}</Typography>}
                                                    secondary={<Typography variant="caption" color="text.secondary" noWrap>{room.last_message ? room.last_message.text : '...'}</Typography>}
                                                />
                                            </ListItemButton>
                                        ))}
                                    </>
                                )}
                                {pvRooms.length > 0 && (
                                    <>
                                        <Typography variant="caption" fontWeight="bold" sx={{ px: 2, py: 1, display: 'block', mt: 1, color: theme.palette.text.secondary }}>شخصی</Typography>
                                        {pvRooms.map((room) => (
                                            <ListItemButton
                                                key={room.id}
                                                onClick={() => setSelectedRoom(room)}
                                                selected={selectedRoom?.id === room.id}
                                                sx={{
                                                    px: 2, py: 1.5,
                                                    '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1), borderRight: `3px solid ${theme.palette.primary.main}` },
                                                    '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) }
                                                }}
                                            >
                                                <ListItemAvatar><Avatar src={room.avatar} sx={{ bgcolor: alpha(theme.palette.info.main, 0.2), color: theme.palette.info.main }}><PersonIcon /></Avatar></ListItemAvatar>
                                                <ListItemText
                                                    primary={<Typography fontWeight="bold" noWrap color="text.primary">{room.name}</Typography>}
                                                    secondary={<Typography variant="caption" color="text.secondary" noWrap>{room.last_message ? room.last_message.text : '...'}</Typography>}
                                                />
                                            </ListItemButton>
                                        ))}
                                    </>
                                )}
                            </List>
                        )}
                    </Box>
                </Box>

                {/* ستون چپ: چت */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: alpha(theme.palette.background.default, 0.3) }}>
                    {selectedRoom ? (
                        <>
                            <Box sx={{
                                p: 1.5, px: 3,
                                bgcolor: alpha(theme.palette.background.paper, 0.8),
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <IconButton size="small" onClick={() => setSelectedRoom(null)} sx={{ display: { md: 'none' }, color: theme.palette.text.primary }}><SearchIcon sx={{ transform: 'rotate(180deg)' }} /></IconButton>
                                    <Avatar sx={{ bgcolor: selectedRoom.type === 'group' ? 'warning.main' : 'primary.main' }}>{selectedRoom.type === 'group' ? <GroupIcon /> : <PersonIcon />}</Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{selectedRoom.name.replace('گروه پروژه: ', '')}</Typography>
                                        <Typography variant="caption" color="text.secondary">{selectedRoom.type === 'group' ? 'گروه پروژه' : 'آنلاین'}</Typography>
                                    </Box>
                                </Stack>
                                <IconButton sx={{color: theme.palette.text.secondary}}><MoreVertIcon /></IconButton>
                            </Box>

                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {loadingMessages ? <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box> : messages.map((msg) => {
                                    const isMe = msg.sender === user.id;
                                    return (
                                        <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                                            <Paper sx={bubbleSx(isMe)}>
                                                {/* نمایش ریپلای */}
                                                {msg.reply_to_text && (
                                                    <Box sx={{
                                                        borderRight: '3px solid',
                                                        borderColor: isMe ? '#fff' : theme.palette.primary.main,
                                                        pr: 1, mb: 1, opacity: 0.8, cursor: 'pointer',
                                                        bgcolor: alpha(theme.palette.action.hover, 0.1),
                                                        borderRadius: 1, p: 0.5
                                                    }}>
                                                        <Typography variant="caption" fontWeight="bold" display="block">{msg.reply_to_sender}</Typography>
                                                        <Typography variant="caption" noWrap>{msg.reply_to_text}</Typography>
                                                    </Box>
                                                )}

                                                {!isMe && selectedRoom.type === 'group' && <Typography variant="caption" color="secondary.main" fontWeight="bold" display="block" mb={0.5}>{msg.sender_name}</Typography>}

                                                {/* نمایش فایل */}
                                                {msg.file && (
                                                    <Box sx={{ mb: 1 }}>
                                                        {isAudio(msg.file) ? (
                                                            // ✅ پلیر صوتی
                                                            <audio controls style={{ maxWidth: '100%', borderRadius: '8px', height: '40px' }}>
                                                                <source src={msg.file} />
                                                                مرورگر شما پشتیبانی نمی‌کند.
                                                            </audio>
                                                        ) : isImage(msg.file) ? (
                                                            <img src={msg.file} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer', maxHeight: 300, objectFit: 'cover' }} onClick={()=>window.open(msg.file, '_blank')} />
                                                        ) : isVideo(msg.file) ? (
                                                            <video src={msg.file} controls style={{ maxWidth: '100%', borderRadius: 8 }} />
                                                        ) : (
                                                            <Button variant="outlined" size="small" href={msg.file} target="_blank" startIcon={<FileIcon />} sx={{ color: isMe ? '#fff' : theme.palette.text.primary, borderColor: isMe ? 'rgba(255,255,255,0.5)' : theme.palette.divider }}>دانلود فایل</Button>
                                                        )}
                                                    </Box>
                                                )}

                                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.text}</Typography>

                                                <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end" mt={0.5} sx={{ opacity: 0.7 }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{moment(msg.created_at).locale('fa').format('HH:mm')}</Typography>
                                                    {isMe && (msg.is_read ? <DoneAllIcon sx={{ fontSize: 14, color: '#4fc3f7' }} /> : <CheckIcon sx={{ fontSize: 14 }} />)}
                                                </Stack>

                                                <IconButton
                                                    className="reply-btn"
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute', top: -15,
                                                        [isMe ? 'left' : 'right']: -35,
                                                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                                                        color: theme.palette.text.secondary,
                                                        '&:hover': { bgcolor: 'primary.main', color: '#fff' },
                                                    }}
                                                    onClick={() => setReplyTo(msg)}
                                                >
                                                    <ReplyIcon fontSize="small" />
                                                </IconButton>
                                            </Paper>
                                        </Box>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* بنر ریپلای */}
                            {replyTo && (
                                <Box sx={{
                                    p: 1, px: 3,
                                    bgcolor: alpha(theme.palette.action.hover, 0.05),
                                    borderTop: `1px solid ${theme.palette.divider}`,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <Box sx={{ borderRight: '3px solid', borderColor: 'primary.main', pr: 1 }}>
                                        <Typography variant="caption" color="primary.main" fontWeight="bold">پاسخ به {replyTo.sender_name}</Typography>
                                        <Typography variant="body2" color="text.secondary" noWrap>{replyTo.text || 'فایل ضمیمه'}</Typography>
                                    </Box>
                                    <IconButton size="small" onClick={() => setReplyTo(null)} sx={{color: theme.palette.text.secondary}}><CloseIcon /></IconButton>
                                </Box>
                            )}

                            {/* ورودی متن */}
                            <Box p={2} bgcolor={alpha(theme.palette.background.paper, 0.8)} borderTop={`1px solid ${theme.palette.divider}`}>
                                {selectedFile && (
                                    <Box mb={1}>
                                        <Chip
                                            label={selectedFile.name}
                                            onDelete={() => setSelectedFile(null)}
                                            color="primary"
                                            variant="outlined"
                                            icon={selectedFile.type.startsWith('audio') ? <AudioIcon/> : <AttachIcon/>}
                                        />
                                    </Box>
                                )}

                                <Stack direction="row" spacing={1} alignItems="flex-end">
                                    <IconButton onClick={(e) => setEmojiAnchorEl(e.currentTarget)}><EmojiIcon color="warning" /></IconButton>
                                    <IconButton component="label" sx={{color: theme.palette.text.secondary}}><input hidden type="file" onChange={(e) => setSelectedFile(e.target.files[0])} /><AttachIcon /></IconButton>

                                    {/* ✅ دکمه ضبط صدا */}
                                    <IconButton
                                        onClick={isRecording ? stopRecording : startRecording}
                                        sx={{
                                            color: isRecording ? theme.palette.error.main : theme.palette.text.secondary,
                                            animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                                            bgcolor: isRecording ? alpha(theme.palette.error.main, 0.1) : 'transparent'
                                        }}
                                    >
                                        {isRecording ? <StopIcon /> : <MicIcon />}
                                    </IconButton>

                                    <TextField
                                        fullWidth placeholder={isRecording ? "درحال ضبط صدا..." : "پیام..."}
                                        value={messageText} onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={handleKeyPress} multiline maxRows={4} variant="outlined" size="small"
                                        disabled={isRecording}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                bgcolor: alpha(theme.palette.action.hover, 0.05),
                                                color: theme.palette.text.primary,
                                                '& fieldset': {border:'none'}
                                            }
                                        }}
                                    />

                                    <IconButton color="primary" onClick={handleSendMessage} disabled={sending || (!messageText.trim() && !selectedFile)} sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': {bgcolor: 'primary.dark'}, width: 45, height: 45, mb: 0.5 }}>
                                        {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(180deg)', ml: 0.5 }} />}
                                    </IconButton>
                                </Stack>
                            </Box>

                            <Popover
                                open={Boolean(emojiAnchorEl)}
                                anchorEl={emojiAnchorEl}
                                onClose={() => setEmojiAnchorEl(null)}
                                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            >
                                <EmojiPicker onEmojiClick={onEmojiClick} theme={theme.palette.mode} />
                            </Popover>
                        </>
                    ) : (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" opacity={0.5}>
                            <ChatIcon sx={{ fontSize: 80, mb: 2, color: theme.palette.text.disabled }} />
                            <Typography variant="h6" color="text.secondary">یک گفتگو را انتخاب کنید</Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

export default ChatPage;