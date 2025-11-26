// src/components/SystemSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button, IconButton,
    Stack, Divider, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Avatar, Alert // ✅ همه موارد لازم اضافه شدند
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
    Save as SaveIcon, Inventory as PackageIcon,
    Payment as PaymentIcon, Business as AgencyIcon,
    UploadFile as UploadIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
    getPackages, createPackage, updatePackage, deletePackage,
    getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
    getAgencyInfo, createAgencyInfo, updateAgencyInfo
} from '../api';

function TabPanel({ children, value, index }) {
    return <div hidden={value !== index} style={{ marginTop: 20 }}>{value === index && children}</div>;
}

function SystemSettingsPage() {
    const { enqueueSnackbar } = useSnackbar();
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // داده‌ها
    const [packages, setPackages] = useState([]);
    const [methods, setMethods] = useState([]);
    const [agency, setAgency] = useState(null);

    // فرم‌های ویرایش
    const [newPackage, setNewPackage] = useState({ title: '', price: '', description: '' });
    const [newMethod, setNewMethod] = useState({ title: '', stages: '', discount_percent: 0 });
    const [agencyForm, setAgencyForm] = useState({ brand_name: '', phone: '', address: '', footer_text: '', logo: null });
    const [previewLogo, setPreviewLogo] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pkgRes, metRes, agnRes] = await Promise.all([
                getPackages(),
                getPaymentMethods(),
                getAgencyInfo()
            ]);

            // هندل کردن Pagination احتمالی
            setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : (pkgRes.data.results || []));
            setMethods(Array.isArray(metRes.data) ? metRes.data : (metRes.data.results || []));

            const agencyData = Array.isArray(agnRes.data) ? agnRes.data : (agnRes.data.results || []);
            if (agencyData.length > 0) {
                const info = agencyData[0];
                setAgency(info);
                setAgencyForm({
                    brand_name: info.brand_name,
                    phone: info.phone,
                    address: info.address,
                    footer_text: info.footer_text,
                    logo: null
                });
                setPreviewLogo(info.logo);
            }
        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در دریافت اطلاعات', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // --- مدیریت پکیج‌ها ---
    const handleAddPackage = async () => {
        try {
            await createPackage(newPackage);
            enqueueSnackbar('پکیج اضافه شد', { variant: 'success' });
            setNewPackage({ title: '', price: '', description: '' });
            fetchData();
        } catch (err) { enqueueSnackbar('خطا در ایجاد پکیج', { variant: 'error' }); }
    };
    const handleDeletePackage = async (id) => {
        if(window.confirm('آیا مطمئن هستید؟')) {
            await deletePackage(id);
            setPackages(packages.filter(p => p.id !== id));
        }
    };

    // --- مدیریت روش‌های پرداخت ---
    const handleAddMethod = async () => {
        try {
            await createPaymentMethod(newMethod);
            enqueueSnackbar('روش پرداخت اضافه شد', { variant: 'success' });
            setNewMethod({ title: '', stages: '', discount_percent: 0 });
            fetchData();
        } catch (err) { enqueueSnackbar('خطا (فرمت درصدها: 30,30,40)', { variant: 'error' }); }
    };
    const handleDeleteMethod = async (id) => {
        if(window.confirm('آیا مطمئن هستید؟')) {
            await deletePaymentMethod(id);
            setMethods(methods.filter(m => m.id !== id));
        }
    };

    // --- مدیریت اطلاعات آژانس ---
    const handleSaveAgency = async () => {
        const formData = new FormData();
        Object.keys(agencyForm).forEach(key => {
            if (key === 'logo' && !agencyForm.logo) return; // عکس اگر نال بود نفرست
            formData.append(key, agencyForm[key]);
        });

        try {
            if (agency) {
                await updateAgencyInfo(agency.id, formData);
            } else {
                await createAgencyInfo(formData);
            }
            enqueueSnackbar('اطلاعات آژانس ذخیره شد', { variant: 'success' });
            fetchData(); // برای آپدیت لوگو
        } catch (err) { enqueueSnackbar('خطا در ذخیره', { variant: 'error' }); }
    };

    if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" mb={3}>تنظیمات سیستم</Typography>
            <Paper sx={{ p: 2 }}>
                <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} indicatorColor="primary" textColor="primary">
                    <Tab icon={<PackageIcon />} label="مدیریت پکیج‌ها" />
                    <Tab icon={<PaymentIcon />} label="روش‌های پرداخت" />
                    <Tab icon={<AgencyIcon />} label="اطلاعات آژانس" />
                </Tabs>

                {/* تب ۱: پکیج‌ها */}
                <TabPanel value={tabIndex} index={0}>
                    <Grid container spacing={2} alignItems="flex-end" mb={3}>
                        <Grid item xs={3}><TextField label="نام پکیج" fullWidth size="small" value={newPackage.title} onChange={e => setNewPackage({...newPackage, title: e.target.value})} /></Grid>
                        <Grid item xs={3}><TextField label="قیمت (تومان)" type="number" fullWidth size="small" value={newPackage.price} onChange={e => setNewPackage({...newPackage, price: e.target.value})} /></Grid>
                        <Grid item xs={4}><TextField label="توضیحات" fullWidth size="small" value={newPackage.description} onChange={e => setNewPackage({...newPackage, description: e.target.value})} /></Grid>
                        <Grid item xs={2}><Button variant="contained" startIcon={<AddIcon />} fullWidth onClick={handleAddPackage}>افزودن</Button></Grid>
                    </Grid>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead><TableRow><TableCell>عنوان</TableCell><TableCell>قیمت</TableCell><TableCell>توضیحات</TableCell><TableCell>عملیات</TableCell></TableRow></TableHead>
                            <TableBody>
                                {packages.map(pkg => (
                                    <TableRow key={pkg.id}>
                                        <TableCell>{pkg.title}</TableCell>
                                        <TableCell>{Number(pkg.price).toLocaleString()} ت</TableCell>
                                        <TableCell>{pkg.description}</TableCell>
                                        <TableCell><IconButton color="error" onClick={() => handleDeletePackage(pkg.id)}><DeleteIcon /></IconButton></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* تب ۲: روش‌های پرداخت */}
                <TabPanel value={tabIndex} index={1}>
                    <Alert severity="info" sx={{ mb: 2 }}>درصدها را با ویرگول جدا کنید (مثال: 30,30,40). جمع درصدها باید ۱۰۰ شود.</Alert>
                    <Grid container spacing={2} alignItems="flex-end" mb={3}>
                        <Grid item xs={3}><TextField label="عنوان روش" fullWidth size="small" value={newMethod.title} onChange={e => setNewMethod({...newMethod, title: e.target.value})} /></Grid>
                        <Grid item xs={3}><TextField label="مراحل (مثال: 50,50)" fullWidth size="small" value={newMethod.stages} onChange={e => setNewMethod({...newMethod, stages: e.target.value})} /></Grid>
                        <Grid item xs={3}><TextField label="تخفیف (%)" type="number" fullWidth size="small" value={newMethod.discount_percent} onChange={e => setNewMethod({...newMethod, discount_percent: e.target.value})} /></Grid>
                        <Grid item xs={3}><Button variant="contained" startIcon={<AddIcon />} fullWidth onClick={handleAddMethod}>افزودن</Button></Grid>
                    </Grid>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead><TableRow><TableCell>عنوان</TableCell><TableCell>مراحل</TableCell><TableCell>تخفیف</TableCell><TableCell>عملیات</TableCell></TableRow></TableHead>
                            <TableBody>
                                {methods.map(m => (
                                    <TableRow key={m.id}>
                                        <TableCell>{m.title}</TableCell>
                                        <TableCell>{m.stages}</TableCell>
                                        <TableCell>{m.discount_percent}%</TableCell>
                                        <TableCell><IconButton color="error" onClick={() => handleDeleteMethod(m.id)}><DeleteIcon /></IconButton></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* تب ۳: اطلاعات آژانس */}
                <TabPanel value={tabIndex} index={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4} textAlign="center">
                            <Avatar src={previewLogo} sx={{ width: 120, height: 120, margin: '0 auto', mb: 2, bgcolor: 'primary.main' }}>A</Avatar>
                            <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
                                آپلود لوگو
                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                    if(e.target.files[0]) {
                                        setAgencyForm({...agencyForm, logo: e.target.files[0]});
                                        setPreviewLogo(URL.createObjectURL(e.target.files[0]));
                                    }
                                }} />
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Stack spacing={2}>
                                <TextField label="نام برند / آژانس" fullWidth value={agencyForm.brand_name} onChange={e => setAgencyForm({...agencyForm, brand_name: e.target.value})} />
                                <TextField label="شماره تماس" fullWidth value={agencyForm.phone} onChange={e => setAgencyForm({...agencyForm, phone: e.target.value})} />
                                <TextField label="آدرس" fullWidth multiline rows={2} value={agencyForm.address} onChange={e => setAgencyForm({...agencyForm, address: e.target.value})} />
                                <TextField label="متن پایین فاکتور" fullWidth multiline rows={2} value={agencyForm.footer_text} onChange={e => setAgencyForm({...agencyForm, footer_text: e.target.value})} />
                                <Button variant="contained" size="large" onClick={handleSaveAgency} startIcon={<SaveIcon />}>ذخیره تغییرات</Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>
        </Box>
    );
}

export default SystemSettingsPage;