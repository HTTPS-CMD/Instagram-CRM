// src/components/CommandPalette.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, TextField, List, ListItemButton, ListItemIcon, ListItemText,
    Typography, Box, InputAdornment, alpha, useTheme
} from '@mui/material';
import {
    Search as SearchIcon,
    Folder as ProjectIcon,
    Person as UserIcon,
    Description as ScenarioIcon,
    Receipt as InvoiceIcon,
    ArrowForwardIos as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../api';

const ICON_MAP = {
    project: <ProjectIcon sx={{ color: 'primary.main' }} />,
    user: <UserIcon sx={{ color: 'success.main' }} />,
    scenario: <ScenarioIcon sx={{ color: 'warning.main' }} />,
    invoice: <InvoiceIcon sx={{ color: 'secondary.main' }} />
};

function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const navigate = useNavigate();
    const theme = useTheme(); // ✅ استفاده از تم

    // شنود کلید میانبر (Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // جستجو با تاخیر (Debounce)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 1) {
                try {
                    const res = await globalSearch(query);
                    setResults(res.data);
                } catch (err) {
                    console.error(err);
                }
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (link) => {
        setOpen(false);
        setQuery('');
        setResults([]);
        // هندل کردن لینک‌های تب‌دار (مثلاً ?tab=scenarios)
        if (link.includes('?')) {
            navigate(link.split('?')[0]);
            // یک مکث کوتاه برای اینکه کامپوننت لود شود و تب را سوئیچ کند
            setTimeout(() => navigate(link), 100);
        } else {
            navigate(link);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    // ✅ استایل داینامیک برای پس‌زمینه دیالوگ
                    bgcolor: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4,
                    boxShadow: theme.shadows[10],
                    overflow: 'hidden',
                    position: 'absolute', top: 50, // باز شدن از بالا
                    m: 2
                }
            }}
        >
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <TextField
                    autoFocus
                    fullWidth
                    placeholder="جستجو در کل سیستم..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: theme.palette.primary.main, fontSize: 28, mr: 1 }} />
                            </InputAdornment>
                        ),
                        // ✅ رنگ متن ورودی
                        style: { fontSize: '1.2rem', color: theme.palette.text.primary }
                    }}
                />
            </Box>

            <DialogContent sx={{ p: 0, minHeight: 100, maxHeight: 400 }}>
                {results.length > 0 ? (
                    <List>
                        {results.map((item, index) => (
                            <ListItemButton
                                key={index}
                                onClick={() => handleSelect(item.link)}
                                sx={{
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    // ✅ استایل هاور داینامیک
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                                        borderLeft: `4px solid ${theme.palette.primary.main}`
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    {ICON_MAP[item.type] || <SearchIcon sx={{ color: theme.palette.text.secondary }}/>}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="body1" color="text.primary" fontWeight="bold">
                                            {item.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {item.subtitle}
                                        </Typography>
                                    }
                                />
                                <ArrowIcon fontSize="small" sx={{ color: theme.palette.text.disabled, fontSize: 14 }} />
                            </ListItemButton>
                        ))}
                    </List>
                ) : query ? (
                    <Box p={4} textAlign="center" color="text.secondary">
                        <Typography>موردی یافت نشد.</Typography>
                    </Box>
                ) : (
                    <Box p={2} display="flex" justifyContent="space-between" color="text.disabled">
                        <Typography variant="caption">دستورات پیشنهادی:</Typography>
                        <Typography variant="caption">پروژه، کاربر، سناریو...</Typography>
                    </Box>
                )}
            </DialogContent>

            <Box p={1} bgcolor={alpha(theme.palette.action.active, 0.05)} display="flex" justifyContent="flex-end" px={2}>
                <Typography variant="caption" color="text.secondary">
                    <span style={{border:`1px solid ${theme.palette.divider}`, borderRadius:4, padding:'0 4px', marginRight:5}}>ESC</span> برای بستن
                </Typography>
            </Box>
        </Dialog>
    );
}

export default CommandPalette;