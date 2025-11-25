// src/components/ChatPage.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, List, ListItemButton, ListItemAvatar, ListItemText,
    Avatar, IconButton, Button, TextField, Stack, Divider, CircularProgress, Badge, InputAdornment, Popover,
    useTheme, Chip // ✅ چیپ اضافه شد
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
    Close as CloseIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import moment from 'jalali-moment';
import EmojiPicker from 'emoji-picker-react';
import { getChatRooms, getChatMessages, sendChatMessage } from '../api';
import { UserContext } from '../App';

const isImage = (fileUrl) => /\.(jpeg|jpg|gif|png|webp)$/i.test(fileUrl);
const isVideo = (fileUrl) => /\.(mp4|webm|ogg)$/i.test(fileUrl);

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

    const messagesEndRef = useRef(null);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);

    // استایل حباب پیام
    const getBubbleStyle = (isMe) => ({
        p: 1.5, px: 2, maxWidth: '75%', minWidth: '120px',
        bgcolor: isMe ? theme.palette.primary.main : theme.palette.background.paper,
        color: isMe ? '#fff' : theme.palette.text.primary,
        borderRadius: 2,
        borderTopRightRadius: isMe ? 0 : 16,
        borderTopLeftRadius: isMe ? 16 : 0,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        position: 'relative',
        wordWrap: 'break-word',
        // مخفی کردن دکمه ریپلای در حالت عادی و نمایش در هاور
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

    const handleSendMessage = async () => {
            if (!messageText.trim() && !selectedFile) return;

            setSending(true);
            const formData = new FormData();

            // ✅ فیلدهای ضروری
            formData.append('room', selectedRoom.id);

            // ✅ ارسال متن (اگر خالی نباشد)
            if (messageText.trim()) {
                formData.append('text', messageText);
            } else {
                // اگر فقط فایل بود، یک متن خالی بفرست تا ارور ندهد (اگر مدل required=True باشد)
                formData.append('text', '');
            }

            // ✅ ارسال فایل (نکته مهم: اسم فیلد باید file باشد)
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            // ✅ ارسال شناسه ریپلای (فقط ID، نه کل آبجکت)
            if (replyTo) {
                formData.append('reply_to', replyTo.id);
            }

            try {
                await sendChatMessage(formData);
                setMessageText('');
                setSelectedFile(null);
                setReplyTo(null); // پاک کردن حالت ریپلای
                fetchMessages(selectedRoom.id, true); // رفرش پیام‌ها
                fetchRooms(); // رفرش لیست برای آخرین پیام
            } catch (err) {
                console.error(err);
                enqueueSnackbar('خطا در ارسال پیام', { variant: 'error' });
            } finally {
                setSending(false);
            }
        };

    const onEmojiClick = (emojiObject) => {
        setMessageText(prev => prev + emojiObject.emoji);
        setEmojiAnchorEl(null); // بستن پاپ‌آپ بعد از انتخاب
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
        <Paper elevation={3} sx={{ height: 'calc(100vh - 100px)', display: 'flex', overflow: 'hidden', borderRadius: 4, bgcolor: 'background.default' }}>

            {/* ستون راست: لیست */}
            <Box sx={{ width: { xs: selectedRoom ? 0 : '100%', md: 320 }, borderLeft: '1px solid', borderColor: 'divider', display: selectedRoom ? { xs: 'none', md: 'flex' } : 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                <Box p={2} pb={1}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>گفتگوها</Typography>
                    <TextField fullWidth size="small" placeholder="جستجو..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ bgcolor: 'action.hover', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, borderRadius: 2 }} />
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {loadingRooms ? <Box display="flex" justifyContent="center" p={4}><CircularProgress size={30} /></Box> : (
                        <List>
                            {groupRooms.length > 0 && (
                                <>
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>گروه‌ها</Typography>
                                    {groupRooms.map((room) => (
                                        <ListItemButton key={room.id} onClick={() => setSelectedRoom(room)} selected={selectedRoom?.id === room.id} sx={{ px: 2, py: 1.5 }}>
                                            <ListItemAvatar><Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark' }}><GroupIcon /></Avatar></ListItemAvatar>
                                            <ListItemText primary={<Typography fontWeight="bold" noWrap>{room.name.replace('گروه پروژه: ', '')}</Typography>} secondary={<Typography variant="caption" color="text.secondary" noWrap>{room.last_message ? room.last_message.text : '...'}</Typography>} />
                                        </ListItemButton>
                                    ))}
                                </>
                            )}
                            {pvRooms.length > 0 && (
                                <>
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ px: 2, py: 1, display: 'block', mt: 1 }}>شخصی</Typography>
                                    {pvRooms.map((room) => (
                                        <ListItemButton key={room.id} onClick={() => setSelectedRoom(room)} selected={selectedRoom?.id === room.id} sx={{ px: 2, py: 1.5 }}>
                                            <ListItemAvatar><Avatar src={room.avatar} sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}><PersonIcon /></Avatar></ListItemAvatar>
                                            <ListItemText primary={<Typography fontWeight="bold" noWrap>{room.name}</Typography>} secondary={<Typography variant="caption" color="text.secondary" noWrap>{room.last_message ? room.last_message.text : '...'}</Typography>} />
                                        </ListItemButton>
                                    ))}
                                </>
                            )}
                        </List>
                    )}
                </Box>
            </Box>

            {/* ستون چپ: چت */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#141f34' }}>
                {selectedRoom ? (
                    <>
                        <Box sx={{ p: 1.5, px: 3, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <IconButton size="small" onClick={() => setSelectedRoom(null)} sx={{ display: { md: 'none' } }}><SearchIcon sx={{ transform: 'rotate(180deg)' }} /></IconButton>
                                <Avatar sx={{ bgcolor: selectedRoom.type === 'group' ? 'warning.main' : 'primary.main' }}>{selectedRoom.type === 'group' ? <GroupIcon /> : <PersonIcon />}</Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">{selectedRoom.name.replace('گروه پروژه: ', '')}</Typography>
                                    <Typography variant="caption" color="text.secondary">{selectedRoom.type === 'group' ? 'گروه پروژه' : 'آنلاین'}</Typography>
                                </Box>
                            </Stack>
                            <IconButton><MoreVertIcon /></IconButton>
                        </Box>

                        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, backgroundImage: 'url("https://web.telegram.org/img/bg_0.png")', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {loadingMessages ? <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box> : messages.map((msg) => {
                                const isMe = msg.sender === user.id;
                                return (
                                    <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                                        <Paper sx={getBubbleStyle(isMe)}>
                                            {/* نمایش ریپلای */}
                                            {msg.reply_to_text && (
                                                <Box sx={{ borderRight: '3px solid', borderColor: isMe ? 'white' : 'primary.main', pr: 1, mb: 1, opacity: 0.8, cursor: 'pointer', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1, p: 0.5 }}>
                                                    <Typography variant="caption" fontWeight="bold" display="block">{msg.reply_to_sender}</Typography>
                                                    <Typography variant="caption" noWrap>{msg.reply_to_text}</Typography>
                                                </Box>
                                            )}

                                            {!isMe && selectedRoom.type === 'group' && <Typography variant="caption" color="secondary.main" fontWeight="bold" display="block" mb={0.5}>{msg.sender_name}</Typography>}

                                            {/* نمایش فایل (عکس/ویدیو/سند) */}
                                            {msg.file && (
                                                <Box sx={{ mb: 1 }}>
                                                    {isImage(msg.file) ? (
                                                        <img src={msg.file} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer', maxHeight: 300, objectFit: 'cover' }} onClick={()=>window.open(msg.file, '_blank')} />
                                                    ) : isVideo(msg.file) ? (
                                                        <video src={msg.file} controls style={{ maxWidth: '100%', borderRadius: 8 }} />
                                                    ) : (
                                                        <Button variant="outlined" size="small" href={msg.file} target="_blank" startIcon={<FileIcon />} sx={{ color: 'inherit', borderColor: 'inherit' }}>دانلود فایل</Button>
                                                    )}
                                                </Box>
                                            )}

                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.text}</Typography>

                                            <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end" mt={0.5} sx={{ opacity: 0.7 }}>
                                                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{moment(msg.created_at).locale('fa').format('HH:mm')}</Typography>
                                                {isMe && (msg.is_read ? <DoneAllIcon sx={{ fontSize: 14, color: '#4fc3f7' }} /> : <CheckIcon sx={{ fontSize: 14 }} />)}
                                            </Stack>

                                            {/* دکمه ریپلای */}
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    position: 'absolute', top: -15,
                                                    [isMe ? 'left' : 'right']: -35,
                                                    bgcolor: 'rgba(255,255,255,0.9)', // کمی شفافیت کمتر
                                                    boxShadow: 2, // سایه بیشتر
                                                    opacity: 0,
                                                    transition: '0.2s',
                                                    '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' },
                                                    '.MuiPaper-root:hover &': { opacity: 1 },
                                                    zIndex: 10
                                                }}
                                                onClick={() => setReplyTo(msg)}
                                            >
                                                {/* ✅ رنگ آیکون را تغییر دادیم به color="primary" یا یک رنگ تیره */}
                                                <ReplyIcon fontSize="small" sx={{ color: '#1976d2' }} />
                                            </IconButton>
                                        </Paper>
                                    </Box>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* بنر ریپلای */}
                        {replyTo && (
                            <Box sx={{ p: 1, px: 3, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ borderRight: '3px solid', borderColor: 'primary.main', pr: 1 }}>
                                    <Typography variant="caption" color="primary" fontWeight="bold">پاسخ به {replyTo.sender_name}</Typography>
                                    <Typography variant="body2" color="text.secondary" noWrap>{replyTo.text || 'فایل ضمیمه'}</Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setReplyTo(null)}><CloseIcon /></IconButton>
                            </Box>
                        )}

                        {/* ورودی متن */}
                        <Box p={2} bgcolor="background.paper" borderTop="1px solid" borderColor="divider">
                            {/* ✅ چیپ نمایش فایل انتخابی */}
                            {selectedFile && (
                                <Box mb={1}>
                                    <Chip
                                        label={selectedFile.name}
                                        onDelete={() => setSelectedFile(null)}
                                        color="primary"
                                        variant="outlined"
                                        icon={<AttachIcon/>}
                                    />
                                </Box>
                            )}

                            <Stack direction="row" spacing={1} alignItems="flex-end">
                                <IconButton onClick={(e) => setEmojiAnchorEl(e.currentTarget)}><EmojiIcon color="warning" /></IconButton>
                                <IconButton component="label"><input hidden type="file" onChange={(e) => setSelectedFile(e.target.files[0])} /><AttachIcon /></IconButton>
                                <TextField fullWidth placeholder="پیام..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={handleKeyPress} multiline maxRows={4} variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.default' } }} />
                                <IconButton color="primary" onClick={handleSendMessage} disabled={sending || (!messageText.trim() && !selectedFile)} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': {bgcolor: 'primary.dark'}, width: 45, height: 45, mb: 0.5 }}>{sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(180deg)', ml: 0.5 }} />}</IconButton>
                            </Stack>
                        </Box>

                        <Popover
                            open={Boolean(emojiAnchorEl)}
                            anchorEl={emojiAnchorEl}
                            onClose={() => setEmojiAnchorEl(null)}
                            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        >
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                        </Popover>
                    </>
                ) : (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" opacity={0.6}>
                        <img src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png" alt="chat" width="120" style={{ marginBottom: 20, opacity: 0.5 }} />
                        <Typography variant="h6" color="text.secondary">یک گفتگو را انتخاب کنید</Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}

export default ChatPage;