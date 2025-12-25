// src/components/ExtraServicesPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Stack,
    FormControl, InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress, alpha, useTheme
} from '@mui/material';
import {
    Add as AddIcon, Remove as RemoveIcon, ShoppingCart as CartIcon,
    Videocam as VideoIcon, DirectionsCar as CarIcon, Edit as EditIcon,
    Person as PersonIcon, CameraAlt as CameraIcon, Lightbulb as StudioIcon,
    Movie as MovieIcon, AdminPanelSettings as AdminIcon, Star as StarIcon
} from '@mui/icons-material';
import { getProjects, getExtraServices, createServiceRequest } from '../api';
import { UserContext } from '../App';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

const ICON_MAP = {
    video: <VideoIcon fontSize="large" sx={{ color: '#2979ff' }}/>,
    car: <CarIcon fontSize="large" sx={{ color: '#ff9100' }}/>,
    edit: <EditIcon fontSize="large" sx={{ color: '#00e676' }}/>,
    admin: <AdminIcon fontSize="large" sx={{ color: '#f50057' }}/>,
    person: <PersonIcon fontSize="large" sx={{ color: '#aa00ff' }}/>,
    camera: <CameraIcon fontSize="large" sx={{ color: '#ff1744' }}/>,
    studio: <StudioIcon fontSize="large" sx={{ color: '#ffc400' }}/>,
    movie: <MovieIcon fontSize="large" sx={{ color: '#651fff' }}/>,
    star: <StarIcon fontSize="large" sx={{ color: '#00b0ff' }}/>
};

const formatPrice = (p) => Number(p).toLocaleString('fa-IR');

function ExtraServicesPage() {
    const { user } = useContext(UserContext);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const theme = useTheme(); // ✅ استفاده از تم

    const [projects, setProjects] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projRes, servRes] = await Promise.all([
                getProjects(),
                getExtraServices()
            ]);
            setProjects(projRes.data);
            setServices(servRes.data);
            if(projRes.data.length === 1) setSelectedProject(projRes.data[0].id);
        } catch (err) { console.error(err); }
    };

    const handleQuantityChange = (id, change) => {
        setCart(prev => {
            const current = prev[id] || 0;
            const newQty = Math.max(0, current + change);
            const newCart = { ...prev, [id]: newQty };
            if (newQty === 0) delete newCart[id];
            return newCart;
        });
    };

    const calculateTotal = () => {
        let total = 0;
        Object.entries(cart).forEach(([id, qty]) => {
            const service = services.find(s => s.id === parseInt(id));
            if(service) total += service.price * qty;
        });
        return total;
    };

    const handleSubmit = async () => {
        if (!selectedProject) {
            enqueueSnackbar('لطفاً ابتدا یک پروژه را انتخاب کنید.', { variant: 'warning' });
            return;
        }
        if (Object.keys(cart).length === 0) {
            enqueueSnackbar('هیچ خدمتی انتخاب نشده است.', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const promises = Object.entries(cart).map(([serviceId, quantity]) => {
                const payload = {
                    project: parseInt(selectedProject),
                    service: parseInt(serviceId),
                    quantity: parseInt(quantity)
                };
                return createServiceRequest(payload);
            });

            await Promise.all(promises);

            enqueueSnackbar('درخواست‌ها با موفقیت ثبت شد و به فاکتور پروژه اضافه گردید.', { variant: 'success' });
            setCart({});
            setTimeout(() => navigate(`/project/${selectedProject}`), 1500);

        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در ثبت درخواست.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // --- استایل‌های داینامیک ---
    const glassCardSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4]
    };

    const selectSx = {
        '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
        '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main },
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': { borderColor: theme.palette.divider },
            '&:hover fieldset': { borderColor: theme.palette.text.primary },
            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
        },
        '& .MuiSelect-icon': { color: theme.palette.text.secondary }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>
            <Typography variant="h4" fontWeight="900" mb={4} sx={{
                color: theme.palette.text.primary,
                display:'flex', alignItems:'center', gap:1,
                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <CartIcon fontSize="large" sx={{color: theme.palette.warning.main}}/> سفارش خدمات اضافه
            </Typography>

            {/* انتخاب پروژه */}
            <Paper sx={{ ...glassCardSx, p: 3, mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" sx={{color: theme.palette.text.secondary}}>
                            لطفاً پروژه‌ای که می‌خواهید خدمات برای آن انجام شود را انتخاب کنید:
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={selectSx}>
                            <InputLabel>انتخاب پروژه</InputLabel>
                            <Select
                                value={selectedProject}
                                label="انتخاب پروژه"
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                {projects.map(p => (
                                    <MenuItem key={p.id} value={p.id}>{p.project_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* لیست خدمات */}
            <Grid container spacing={3}>
                {services.map(service => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={service.id}>
                        <Card
                            sx={{
                                ...glassCardSx,
                                transition: '0.3s',
                                border: cart[service.id] ? `2px solid ${theme.palette.warning.main}` : `1px solid ${theme.palette.divider}`,
                                bgcolor: cart[service.id] ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.background.paper, 0.6),
                                '&:hover': { transform: 'translateY(-5px)', borderColor: theme.palette.warning.main }
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ mb: 2, opacity: 0.9 }}>
                                    {ICON_MAP[service.icon_name] || <StarIcon fontSize="large" sx={{color: theme.palette.text.primary}}/>}
                                </Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">{service.title}</Typography>
                                <Typography variant="body2" sx={{color: theme.palette.text.secondary, height:40, overflow:'hidden'}}>
                                    {service.description || 'بدون توضیحات'}
                                </Typography>
                                <Chip
                                    label={`${formatPrice(service.price)} تومان`}
                                    sx={{
                                        mt: 2, fontWeight:'bold',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        border: `1px solid ${theme.palette.primary.main}`
                                    }}
                                />

                                {/* شمارشگر */}
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mt={3} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1), borderRadius: 50, p: 0.5 }}>
                                    <IconButton size="small" sx={{color: theme.palette.error.main}} onClick={() => handleQuantityChange(service.id, -1)} disabled={!cart[service.id]}>
                                        <RemoveIcon />
                                    </IconButton>
                                    <Typography variant="h6" fontWeight="bold" sx={{ minWidth: 20, color: theme.palette.text.primary }}>
                                        {cart[service.id] || 0}
                                    </Typography>
                                    <IconButton size="small" sx={{color: theme.palette.success.main}} onClick={() => handleQuantityChange(service.id, 1)}>
                                        <AddIcon />
                                    </IconButton>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* فوتر جمع کل */}
            <Paper
                elevation={10}
                sx={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    p: 2, px: 4, zIndex: 1000,
                    // ✅ رنگ فوتر داینامیک
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    ml: { md: '260px' }
                }}
            >
                <Box>
                    <Typography variant="body2" sx={{color: theme.palette.text.secondary}}>مبلغ قابل پرداخت:</Typography>
                    <Typography variant="h4" fontWeight="900" sx={{color: theme.palette.warning.main}}>
                        {formatPrice(calculateTotal())} <span style={{fontSize: '1rem', color: theme.palette.text.primary}}>تومان</span>
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading || calculateTotal() === 0 || !selectedProject}
                    sx={{ px: 4, borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem', bgcolor: 'primary.main', color: '#fff' }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'ثبت سفارش'}
                </Button>
            </Paper>

            <Box height={100} />
        </Box>
    );
}

export default ExtraServicesPage;