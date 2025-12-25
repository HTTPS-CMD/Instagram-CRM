// src/components/ScenarioComments.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, IconButton, Paper, Avatar, Stack, CircularProgress, useTheme, alpha } from '@mui/material';
import { Send as SendIcon, Person as PersonIcon } from '@mui/icons-material';
import { getScenarioComments, createScenarioComment } from '../api';
import moment from 'jalali-moment';

function ScenarioComments({ scenarioId, currentUser }) {
    const theme = useTheme(); // ✅ استفاده از تم
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchComments();
        // (اختیاری) برای رفرش خودکار پیام‌ها هر ۱۰ ثانیه
        const interval = setInterval(fetchComments, 10000);
        return () => clearInterval(interval);
    }, [scenarioId]);

    const fetchComments = async () => {
        try {
            const response = await getScenarioComments(scenarioId);
            setComments(response.data);
            if (loading) scrollToBottom();
        } catch (error) {
            console.error("Error fetching comments", error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSend = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            await createScenarioComment({
                scenario: scenarioId,
                text: newComment
            });
            setNewComment('');
            const response = await getScenarioComments(scenarioId);
            setComments(response.data);
            scrollToBottom();
        } catch (error) {
            console.error("Error sending comment", error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) return <Box sx={{display:'flex', justifyContent:'center', p:2}}><CircularProgress size={20} /></Box>;

    return (
        <Box sx={{ mt: 3, borderTop: `1px solid ${theme.palette.divider}`, pt: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">💬 گفتگو و اصلاحات</Typography>

            {/* لیست پیام‌ها */}
            <Paper elevation={0} sx={{
                height: 250,
                overflowY: 'auto',
                p: 2,
                mb: 2,
                // ✅ پس‌زمینه داینامیک برای باکس چت
                bgcolor: alpha(theme.palette.action.hover, 0.05),
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`
            }}>
                {comments.length === 0 ? (
                    <Box sx={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.5}}>
                        <Typography variant="caption" color="text.secondary">هنوز پیامی ثبت نشده است.</Typography>
                    </Box>
                ) : (
                    comments.map((msg) => {
                        const isMe = msg.author === currentUser.id;
                        return (
                            <Box key={msg.id} sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-start' : 'flex-end', // در RTL: استارت=راست (من)، اند=چپ (دیگران)
                                mb: 1.5
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isMe ? 'row' : 'row-reverse' }}>
                                    <Avatar sx={{ width: 24, height: 24, bgcolor: isMe ? 'primary.main' : 'secondary.main', fontSize: 10 }}>
                                        {msg.author_name ? msg.author_name.charAt(0) : <PersonIcon fontSize="inherit"/>}
                                    </Avatar>
                                    <Typography variant="caption" color="text.secondary" sx={{fontSize:'0.7rem'}}>
                                        {msg.author_name || msg.author_username}
                                    </Typography>
                                </Box>

                                <Paper sx={{
                                    p: 1.5, px: 2, mt: 0.5,
                                    // ✅ رنگ حباب پیام (برای من رنگی، برای دیگران خاکستری)
                                    bgcolor: isMe ? 'primary.main' : alpha(theme.palette.background.paper, 1),
                                    color: isMe ? '#fff' : theme.palette.text.primary,
                                    borderRadius: 2,
                                    borderTopRightRadius: isMe ? 0 : 2,
                                    borderTopLeftRadius: isMe ? 2 : 0,
                                    maxWidth: '80%',
                                    position: 'relative',
                                    border: isMe ? 'none' : `1px solid ${theme.palette.divider}`
                                }}>
                                    <Typography variant="body2" sx={{whiteSpace:'pre-wrap', lineHeight: 1.6}}>{msg.text}</Typography>
                                    <Typography variant="caption" sx={{display:'block', textAlign:'left', mt:0.5, opacity:0.7, fontSize:'0.6rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'text.disabled'}}>
                                        {moment(msg.created_at).locale('fa').format('HH:mm')}
                                    </Typography>
                                </Paper>
                            </Box>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </Paper>

            {/* ورودی پیام */}
            <Stack direction="row" spacing={1} alignItems="flex-end">
                <TextField
                    fullWidth
                    size="small"
                    placeholder="پیام خود را بنویسید..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={sending}
                    multiline
                    maxRows={3}
                    inputProps={{ style: { textAlign: 'right', direction: 'rtl' } }}
                    sx={{
                        // ✅ استایل داینامیک اینپوت
                        bgcolor: theme.palette.background.paper,
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: theme.palette.divider },
                            '&:hover fieldset': { borderColor: theme.palette.text.primary }
                        }
                    }}
                />
                <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={sending || !newComment.trim()}
                    sx={{
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'primary.dark' },
                        borderRadius: 2, height: 40, width: 40
                    }}
                >
                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} />}
                </IconButton>
            </Stack>
        </Box>
    );
}

export default ScenarioComments;