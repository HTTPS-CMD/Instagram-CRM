// src/components/ExtraServicesPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Stack,
    FormControl, InputLabel, Select, MenuItem, Chip, Divider, IconButton
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

// مپ کردن آیکون‌ها
const ICON_MAP = {
    video: <VideoIcon fontSize="large" color="primary"/>,
    car: <CarIcon fontSize="large" color="warning"/>,
    edit: <EditIcon fontSize="large" color="info"/>,
    admin: <AdminIcon fontSize="large" color="success"/>,
    person: <PersonIcon fontSize="large" color="secondary"/>,
    camera: <CameraIcon fontSize="large" color="error"/>,
    studio: <StudioIcon fontSize="large" color="warning"/>,
    movie: <MovieIcon fontSize="large" color="action"/>,
    star: <StarIcon fontSize="large" />
};

const formatPrice = (p) => Number(p).toLocaleString('fa-IR');

function ExtraServicesPage() {
    const { user } = useContext(UserContext);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [cart, setCart] = useState({}); // { serviceId: quantity }
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
            // اگر فقط یک پروژه دارد، خودکار انتخاب شود
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
            // ارسال تک تک آیتم‌ها به صورت موازی
            const promises = Object.entries(cart).map(([serviceId, quantity]) => {
                // ✅ تبدیل دقیق داده‌ها به عدد
                const payload = {
                    project: parseInt(selectedProject), // تبدیل به عدد
                    service: parseInt(serviceId),       // تبدیل به عدد
                    quantity: parseInt(quantity)        // تبدیل به عدد
                };

                return createServiceRequest(payload);
            });

            await Promise.all(promises);

            enqueueSnackbar('درخواست‌ها با موفقیت ثبت شد و به فاکتور پروژه اضافه گردید.', { variant: 'success' });
            setCart({});
            setTimeout(() => navigate(`/project/${selectedProject}`), 1500);

        } catch (err) {
            console.error("Service Request Error:", err.response?.data || err);

            // نمایش دقیق خطا در اسنک‌بار
            let errorMsg = 'خطا در ثبت درخواست.';
            if (err.response && err.response.data) {
                const details = err.response.data;
                if (typeof details === 'object') {
                    errorMsg = Object.entries(details)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ');
                } else {
                    errorMsg = String(details);
                }
            }
            enqueueSnackbar(errorMsg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" mb={4} sx={{display:'flex', alignItems:'center', gap:1}}>
                <CartIcon fontSize="large" color="secondary"/> سفارش خدمات اضافه
            </Typography>

            {/* انتخاب پروژه */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" gutterBottom>
                            لطفاً پروژه‌ای که می‌خواهید خدمات برای آن انجام شود را انتخاب کنید:
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
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
                            elevation={cart[service.id] ? 8 : 2}
                            sx={{
                                borderRadius: 4, transition: '0.3s',
                                border: cart[service.id] ? '2px solid #ffab40' : '1px solid transparent',
                                bgcolor: 'background.paper'
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ mb: 2, opacity: 0.8 }}>
                                    {ICON_MAP[service.icon_name] || <StarIcon fontSize="large"/>}
                                </Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>{service.title}</Typography>
                                <Typography variant="body2" color="text.secondary" height={40} sx={{overflow:'hidden'}}>
                                    {service.description || 'بدون توضیحات'}
                                </Typography>
                                <Chip label={`${formatPrice(service.price)} تومان`} color="primary" variant="outlined" sx={{ mt: 2, fontWeight:'bold' }} />

                                {/* شمارشگر */}
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mt={3} sx={{ bgcolor: 'action.hover', borderRadius: 50, p: 0.5 }}>
                                    <IconButton size="small" color="error" onClick={() => handleQuantityChange(service.id, -1)} disabled={!cart[service.id]}>
                                        <RemoveIcon />
                                    </IconButton>
                                    <Typography variant="h6" fontWeight="bold" sx={{ minWidth: 20 }}>
                                        {cart[service.id] || 0}
                                    </Typography>
                                    <IconButton size="small" color="success" onClick={() => handleQuantityChange(service.id, 1)}>
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
                    bgcolor: 'background.paper',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    ml: { md: '240px' } // فاصله برای سایدبار
                }}
            >
                <Box>
                    <Typography variant="body2" color="text.secondary">مبلغ قابل پرداخت:</Typography>
                    <Typography variant="h4" fontWeight="900" color="secondary.main">
                        {formatPrice(calculateTotal())} <span style={{fontSize: '1rem'}}>تومان</span>
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading || calculateTotal() === 0 || !selectedProject}
                    sx={{ px: 4, borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                    ثبت سفارش و افزودن به فاکتور
                </Button>
            </Paper>

            {/* فاصله خالی پایین صفحه برای اینکه فوتر روی محتوا نیاید */}
            <Box height={100} />
        </Box>
    );
}

export default ExtraServicesPage;