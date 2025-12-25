// src/components/SupportPage.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, List, ListItem, ListItemText,
    Chip, IconButton, Button, TextField, Stack, Avatar, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, alpha, useTheme
} from '@mui/material';
import {
    Add as AddIcon, Send as SendIcon, Person as PersonIcon, SupportAgent as SupportIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import moment from 'jalali-moment';
import { getTickets, createTicket, getTicketMessages, sendTicketMessage, updateTicket } from '../api';
import { UserContext } from '../App';

const STATUS_LABELS = { open: 'باز', in_progress: 'در حال بررسی', closed: 'بسته شده' };
const PRIORITY_LABELS = { low: 'عادی', high: 'فوری', critical: 'بحرانی' };

function SupportPage() {
    const { user } = useContext(UserContext);
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم

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

    useEffect(() => { fetchTickets(); }, []);
    useEffect(() => { if (selectedTicket) fetchMessages(selectedTicket.id); }, [selectedTicket]);

    const fetchTickets = async () => {
        try { const res = await getTickets(); setTickets(res.data); } catch (err) { console.error(err); } finally { setLoadingTickets(false); }
    };

    const fetchMessages = async (ticketId) => {
        setLoadingMessages(true);
        try { const res = await getTicketMessages(ticketId); setMessages(res.data); scrollToBottom(); } catch (err) { console.error(err); } finally { setLoadingMessages(false); }
    };

    const scrollToBottom = () => { setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100); };

    const handleCreateTicket = async () => {
        setCreating(true);
        try {
            const res = await createTicket(newTicketData);
            await sendTicketMessage({ ticket: res.data.id, text: newTicketData.description });
            enqueueSnackbar('تیکت ایجاد شد', { variant: 'success' });
            setOpenModal(false); setNewTicketData({ title: '', description: '', priority: 'low' });
            fetchTickets(); setSelectedTicket(res.data);
        } catch (err) { enqueueSnackbar('خطا در ایجاد تیکت', { variant: 'error' }); } finally { setCreating(false); }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        try {
            await sendTicketMessage({ ticket: selectedTicket.id, text: messageText });
            setMessageText(''); fetchMessages(selectedTicket.id);
        } catch (err) { console.error(err); }
    };

    const handleCloseTicket = async () => {
        if(window.confirm("تیکت بسته شود؟")) {
            try { const res = await updateTicket(selectedTicket.id, { status: 'closed' }); setTickets(prev => prev.map(t => t.id === selectedTicket.id ? res.data : t)); setSelectedTicket(res.data); }
            catch(err) { enqueueSnackbar('خطا', {variant: 'error'}); }
        }
    };

    // استایل‌های داینامیک
    const glassSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4],
        height: '100%', display: 'flex', flexDirection: 'column'
    };

    const textFieldSx = {
        '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': { borderColor: theme.palette.divider },
            '&:hover fieldset': { borderColor: theme.palette.text.primary }
        },
        '& .MuiSelect-icon': { color: theme.palette.text.primary }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', width: '100%', maxWidth: '1600px', mx: 'auto', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" sx={{
                    display:'flex', alignItems:'center', gap:1, color: theme.palette.text.primary,
                    textShadow:'0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <SupportIcon fontSize="large" sx={{color: theme.palette.success.main}}/> مرکز پشتیبانی
                </Typography>
                <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setOpenModal(true)} sx={{bgcolor: theme.palette.success.main, color:'#fff', fontWeight:'bold'}}>
                    تیکت جدید
                </Button>
            </Stack>

            <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper sx={glassSx}>
                        <Box p={2} bgcolor={alpha(theme.palette.success.main, 0.1)} color={theme.palette.success.main} borderBottom={`1px solid ${theme.palette.divider}`}>
                            <Typography fontWeight="bold">لیست درخواست‌ها</Typography>
                        </Box>
                        <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                            {tickets.map((ticket) => (
                                <ListItem key={ticket.id} button onClick={() => setSelectedTicket(ticket)} selected={selectedTicket?.id === ticket.id} divider sx={{
                                    '&.Mui-selected': { bgcolor: alpha(theme.palette.action.selected, 0.1), borderRight: `4px solid ${theme.palette.success.main}` },
                                    '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.05) },
                                    borderBottom: `1px solid ${theme.palette.divider}`
                                }}>
                                    <ListItemText
                                        primary={<Typography fontWeight="bold" color="text.primary" noWrap>{ticket.title}</Typography>}
                                        secondary={<Stack direction="row" justifyContent="space-between" mt={0.5}><Typography variant="caption" color="text.secondary">{STATUS_LABELS[ticket.status]}</Typography><Typography variant="caption" color="text.secondary">{moment(ticket.updated_at).locale('fa').fromNow()}</Typography></Stack>}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                    <Paper sx={glassSx}>
                        {selectedTicket ? (
                            <>
                                <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`} display="flex" justifyContent="space-between" alignItems="center" bgcolor={alpha(theme.palette.background.default, 0.5)}>
                                    <Box><Typography variant="h6">{selectedTicket.title}</Typography><Typography variant="caption" color="text.secondary">#{selectedTicket.id} | {STATUS_LABELS[selectedTicket.status]}</Typography></Box>
                                    {selectedTicket.status !== 'closed' && <Button variant="outlined" color="error" size="small" onClick={handleCloseTicket}>بستن</Button>}
                                </Box>
                                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
                                    {loadingMessages ? <CircularProgress /> : messages.map((msg) => {
                                        const isMe = msg.sender === user.id;
                                        return (
                                            <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', mb: 2 }}>
                                                <Paper sx={{
                                                    p: 2, maxWidth: '70%',
                                                    bgcolor: isMe ? 'primary.main' : alpha(theme.palette.background.paper, 1),
                                                    color: isMe ? '#fff' : theme.palette.text.primary,
                                                    borderRadius: 2,
                                                    border: isMe ? 'none' : `1px solid ${theme.palette.divider}`
                                                }}>
                                                    <Typography variant="body1" sx={{whiteSpace:'pre-wrap'}}>{msg.text}</Typography>
                                                </Paper>
                                                <Typography variant="caption" sx={{mt:0.5, opacity:0.6, color:'text.secondary'}}>{moment(msg.created_at).locale('fa').format('HH:mm')}</Typography>
                                            </Box>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </Box>
                                <Box p={2} borderTop={`1px solid ${theme.palette.divider}`} bgcolor={alpha(theme.palette.background.default, 0.5)}>
                                    {selectedTicket.status === 'closed' ? <Alert severity="info" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>این تیکت بسته شده است.</Alert> : (
                                        <Stack direction="row" spacing={2}>
                                            <TextField fullWidth placeholder="پیام..." value={messageText} onChange={(e) => setMessageText(e.target.value)} multiline maxRows={3} sx={textFieldSx} />
                                            <Button variant="contained" onClick={handleSendMessage} disabled={!messageText.trim()} sx={{bgcolor:'primary.main'}}><SendIcon sx={{ transform: 'rotate(180deg)' }} /></Button>
                                        </Stack>
                                    )}
                                </Box>
                            </>
                        ) : (
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" opacity={0.5}><SupportIcon sx={{ fontSize: 80, mb: 2, color: theme.palette.text.secondary }} /><Typography color="text.secondary">یک تیکت را انتخاب کنید.</Typography></Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm"
                PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary } }}
            >
                <DialogTitle sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>ایجاد تیکت جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} mt={2}>
                        <TextField label="موضوع" fullWidth value={newTicketData.title} onChange={(e) => setNewTicketData({...newTicketData, title: e.target.value})} sx={textFieldSx} />
                        <FormControl fullWidth sx={textFieldSx}>
                            <InputLabel>اولویت</InputLabel>
                            <Select value={newTicketData.priority} label="اولویت" onChange={(e) => setNewTicketData({...newTicketData, priority: e.target.value})}>
                                <MenuItem value="low">عادی</MenuItem><MenuItem value="high">فوری</MenuItem><MenuItem value="critical">بحرانی</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="توضیحات" fullWidth multiline rows={4} value={newTicketData.description} onChange={(e) => setNewTicketData({...newTicketData, description: e.target.value})} sx={textFieldSx} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">انصراف</Button>
                    <Button variant="contained" onClick={handleCreateTicket} disabled={creating || !newTicketData.title} sx={{bgcolor: theme.palette.success.main, color:'#fff'}}>ایجاد</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default SupportPage;