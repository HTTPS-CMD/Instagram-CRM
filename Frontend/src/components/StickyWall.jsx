// src/components/StickyWall.jsx
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, TextField, Grid, Button, alpha, useTheme } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, PushPin } from '@mui/icons-material';
import { getStickyNotes, createStickyNote, deleteStickyNote } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#FFD700', '#FF4081', '#00E5FF', '#76FF03', '#AA00FF'];

const StickyWall = () => {
    const theme = useTheme(); // ✅ استفاده از تم
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await getStickyNotes();
            setNotes(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAdd = async () => {
        if (!newNote.trim()) return;
        try {
            const res = await createStickyNote({ content: newNote, color: selectedColor });
            setNotes([...notes, res.data]);
            setNewNote('');
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        try {
            await deleteStickyNote(id);
            setNotes(notes.filter(n => n.id !== id));
        } catch (err) { console.error(err); }
    };

    return (
        <Paper sx={{
            p: 3, borderRadius: 4,
            // ✅ استایل داینامیک کانتینر
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(10px)',
            boxShadow: theme.shadows[4]
        }}>
            <Typography variant="h6" fontWeight="bold" color="text.primary" mb={2} display="flex" alignItems="center" gap={1}>
                <PushPin sx={{ color: '#FFD700', transform: 'rotate(45deg)' }} /> دیوار یادداشت‌ها
            </Typography>

            <Box display="flex" gap={2} mb={3}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="یک یادداشت بنویسید..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    sx={{
                        // ✅ استایل داینامیک اینپوت
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                            color: theme.palette.text.primary,
                            '& fieldset': { border: 'none' }
                        },
                        '& input::placeholder': {
                            color: theme.palette.text.secondary,
                            opacity: 1,
                        },
                    }}
                />
                <Box display="flex" gap={0.5} alignItems="center" bgcolor={alpha(theme.palette.action.active, 0.05)} p={1} borderRadius={2}>
                    {COLORS.map(c => (
                        <Box
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            sx={{
                                width: 24, height: 24, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                                border: selectedColor === c ? `2px solid ${theme.palette.text.primary}` : 'none',
                                transition: '0.2s', '&:hover': { transform: 'scale(1.2)' },
                                boxShadow: selectedColor === c ? theme.shadows[3] : 'none'
                            }}
                        />
                    ))}
                </Box>
                <Button variant="contained" onClick={handleAdd} sx={{ borderRadius: 2, minWidth: 50, bgcolor: 'primary.main', color: '#fff' }}>
                    <AddIcon />
                </Button>
            </Box>

            <Grid container spacing={2}>
                <AnimatePresence>
                    {notes.map((note) => (
                        <Grid item xs={12} sm={6} md={4} key={note.id}>
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                <Paper sx={{
                                    p: 2, minHeight: 120, position: 'relative',
                                    // ✅ استایل داینامیک یادداشت
                                    // در لایت مود پاستلی می‌شود، در دارک مود نئونی تیره
                                    bgcolor: alpha(note.color || '#FFD700', theme.palette.mode === 'dark' ? 0.15 : 0.25),
                                    border: `1px solid ${note.color}`,
                                    borderRadius: '4px 20px 4px 20px',
                                    boxShadow: `0 4px 15px ${alpha(note.color, 0.15)}`,
                                    transition: '0.2s', '&:hover': { transform: 'rotate(1deg) scale(1.02)', boxShadow: `0 8px 20px ${alpha(note.color, 0.3)}` }
                                }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(note.id)}
                                        sx={{
                                            position: 'absolute', top: 5, left: 5,
                                            color: theme.palette.text.secondary,
                                            '&:hover': { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1) }
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                    {/* ✅ رنگ متن باید بر اساس تم باشد تا در حالت لایت روی رنگ‌های روشن خوانا باشد */}
                                    <Typography variant="body1" color="text.primary" sx={{ mt: 2, fontWeight: 500 }} style={{whiteSpace: 'pre-wrap'}}>
                                        {note.content}
                                    </Typography>
                                </Paper>
                            </motion.div>
                        </Grid>
                    ))}
                </AnimatePresence>
            </Grid>
        </Paper>
    );
};

export default StickyWall;