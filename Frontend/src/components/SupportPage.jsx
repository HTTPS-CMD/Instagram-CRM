// src/components/SupportPage.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, List, ListItem, ListItemText,
    Chip, IconButton, Button, TextField, Stack, Avatar, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Send as SendIcon,
    Person as PersonIcon,
    SupportAgent as SupportIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import moment from 'jalali-moment';
import { getTickets, createTicket, getTicketMessages, sendTicketMessage, updateTicket } from '../api';
import { UserContext } from '../App';

const STATUS_COLORS = {
    open: 'success',
    in_progress: 'warning',
    closed: 'default'
};

const STATUS_LABELS = {
    open: 'باز',
    in_progress: 'در حال بررسی',
    closed: 'بسته شده'
};

const PRIORITY_LABELS = {
    low: 'عادی',
    high: 'فوری',
    critical: 'بحرانی'
};

function SupportPage() {
    const { user } = useContext(UserContext);
    const { enqueueSnackbar } = useSnackbar();

    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messageText, setMessageText] = useState('');

    const [openModal, setOpenModal] = useState(false);
    const [newTicketData, setNewTicketData] = useState({ title: '', description: '', priority: 'low' });
    const [creating, setCreating] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        if (selectedTicket) {
            fetchMessages(selectedTicket.id);
        }
    }, [selectedTicket]);

    const fetchTickets = async () => {
        try {
            const res = await getTickets();
            setTickets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchMessages = async (ticketId) => {
        setLoadingMessages(true);
        try {
            const res = await getTicketMessages(ticketId);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleCreateTicket = async () => {
        setCreating(true);
        try {
            const res = await createTicket({
                title: newTicketData.title,
                description: newTicketData.description,
                priority: newTicketData.priority
            });

            await sendTicketMessage({
                ticket: res.data.id,
                text: newTicketData.description
            });

            enqueueSnackbar('تیکت با موفقیت ایجاد شد', { variant: 'success' });
            setOpenModal(false);
            setNewTicketData({ title: '', description: '', priority: 'low' });
            fetchTickets();
            setSelectedTicket(res.data);
        } catch (err) {
            enqueueSnackbar('خطا در ایجاد تیکت', { variant: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        try {
            await sendTicketMessage({
                ticket: selectedTicket.id,
                text: messageText
            });
            setMessageText('');
            const res = await getTicketMessages(selectedTicket.id);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    // ✅ تابع اصلاح شده بستن تیکت
    const handleCloseTicket = async () => {
        if(window.confirm("آیا از بستن این تیکت مطمئن هستید؟")) {
            try {
                const res = await updateTicket(selectedTicket.id, { status: 'closed' });

                // آپدیت لیست تیکت‌ها
                setTickets(prev => prev.map(t => t.id === selectedTicket.id ? res.data : t));

                // آپدیت تیکت انتخاب شده (ایمن)
                setSelectedTicket(res.data);

                enqueueSnackbar('تیکت بسته شد', {variant: 'info'});
            } catch(err) {
                console.error(err);
                enqueueSnackbar('خطا در بستن تیکت', {variant: 'error'});
            }
        }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" sx={{display:'flex', alignItems:'center', gap:1}}>
                    <SupportIcon fontSize="large" color="primary"/> مرکز پشتیبانی
                </Typography>
                <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}>
                    تیکت جدید
                </Button>
            </Stack>

            <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>

                <Grid item xs={12} md={4} sx={{ height: '100%', overflowY: 'auto' }}>
                    <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Box p={2} bgcolor="primary.main" color="white">
                            <Typography fontWeight="bold">لیست درخواست‌ها</Typography>
                        </Box>
                        <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                            {tickets.length === 0 ? (
                                <Typography p={3} align="center" color="text.secondary">تیکتی وجود ندارد.</Typography>
                            ) : (
                                tickets.map((ticket) => (
                                    <ListItem
                                        key={ticket.id}
                                        button
                                        onClick={() => setSelectedTicket(ticket)}
                                        selected={selectedTicket?.id === ticket.id}
                                        divider
                                        sx={{
                                            borderRight: selectedTicket?.id === ticket.id ? '4px solid #3da9fc' : '4px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography fontWeight="bold" noWrap sx={{maxWidth: '70%'}}>{ticket.title}</Typography>
                                                    <Chip
                                                        label={STATUS_LABELS[ticket.status]}
                                                        size="small"
                                                        color={STATUS_COLORS[ticket.status]}
                                                        variant={selectedTicket?.id === ticket.id ? "filled" : "outlined"}
                                                        sx={{height: 20, fontSize: '0.7rem'}}
                                                    />
                                                </Stack>
                                            }
                                            secondary={
                                                <Stack direction="row" justifyContent="space-between" mt={0.5}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        اولویت: {PRIORITY_LABELS[ticket.priority]}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {moment(ticket.updated_at).locale('fa').fromNow()}
                                                    </Typography>
                                                </Stack>
                                            }
                                        />
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {selectedTicket ? (
                            <>
                                <Box p={2} borderBottom="1px solid rgba(255,255,255,0.1)" display="flex" justifyContent="space-between" alignItems="center" bgcolor="background.paper">
                                    <Box>
                                        <Typography variant="h6">{selectedTicket.title}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            شماره تیکت: #{selectedTicket.id} | وضعیت: {STATUS_LABELS[selectedTicket.status]}
                                        </Typography>
                                    </Box>
                                    {selectedTicket.status !== 'closed' && (
                                        <Button variant="outlined" color="error" size="small" onClick={handleCloseTicket}>
                                            بستن تیکت
                                        </Button>
                                    )}
                                </Box>

                                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: 'rgba(0,0,0,0.2)' }}>
                                    {loadingMessages ? (
                                        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.sender === user.id;
                                            return (
                                                <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', mb: 2 }}>
                                                    <Stack direction={isMe ? 'row' : 'row-reverse'} spacing={1} alignItems="center" mb={0.5}>
                                                        <Typography variant="caption" color="text.secondary">{msg.sender_name || 'کاربر'}</Typography>
                                                        <Avatar sx={{ width: 24, height: 24, bgcolor: isMe ? 'primary.main' : 'secondary.main', fontSize: 12 }}>
                                                            {msg.sender_name ? msg.sender_name.charAt(0) : <PersonIcon fontSize="inherit"/>}
                                                        </Avatar>
                                                    </Stack>
                                                    <Paper sx={{
                                                        p: 2, maxWidth: '70%',
                                                        bgcolor: isMe ? 'primary.dark' : 'rgba(255,255,255,0.08)',
                                                        borderRadius: 2,
                                                        borderTopRightRadius: isMe ? 0 : 2,
                                                        borderTopLeftRadius: isMe ? 2 : 0
                                                    }}>
                                                        <Typography variant="body1" sx={{whiteSpace:'pre-wrap'}}>{msg.text}</Typography>
                                                    </Paper>
                                                    <Typography variant="caption" color="text.secondary" sx={{mt:0.5, opacity:0.6}}>
                                                        {moment(msg.created_at).locale('fa').format('jD jMMMM HH:mm')}
                                                    </Typography>
                                                </Box>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </Box>

                                <Box p={2} borderTop="1px solid rgba(255,255,255,0.1)" bgcolor="background.paper">
                                    {selectedTicket.status === 'closed' ? (
                                        <Alert severity="info" sx={{ width: '100%' }}>این تیکت بسته شده است.</Alert>
                                    ) : (
                                        <Stack direction="row" spacing={2}>
                                            <TextField
                                                fullWidth
                                                placeholder="پیام خود را بنویسید..."
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                                multiline maxRows={3}
                                            />
                                            <Button variant="contained" onClick={handleSendMessage} disabled={!messageText.trim()}>
                                                <SendIcon sx={{ transform: 'rotate(180deg)' }} />
                                            </Button>
                                        </Stack>
                                    )}
                                </Box>
                            </>
                        ) : (
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" opacity={0.5}>
                                <SupportIcon sx={{ fontSize: 60, mb: 2 }} />
                                <Typography>یک تیکت را انتخاب کنید.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>ایجاد تیکت پشتیبانی جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} mt={1}>
                        <TextField
                            label="عنوان تیکت (موضوع)"
                            fullWidth
                            value={newTicketData.title}
                            onChange={(e) => setNewTicketData({...newTicketData, title: e.target.value})}
                        />
                        <FormControl fullWidth>
                            <InputLabel>اولویت</InputLabel>
                            <Select
                                value={newTicketData.priority}
                                label="اولویت"
                                onChange={(e) => setNewTicketData({...newTicketData, priority: e.target.value})}
                            >
                                <MenuItem value="low">عادی</MenuItem>
                                <MenuItem value="high">فوری</MenuItem>
                                <MenuItem value="critical">بحرانی</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="توضیحات کامل"
                            fullWidth multiline rows={4}
                            value={newTicketData.description}
                            onChange={(e) => setNewTicketData({...newTicketData, description: e.target.value})}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>انصراف</Button>
                    <Button variant="contained" onClick={handleCreateTicket} disabled={creating || !newTicketData.title}>
                        {creating ? <CircularProgress size={24}/> : 'ایجاد تیکت'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default SupportPage;