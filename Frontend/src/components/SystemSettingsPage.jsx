// src/components/SystemSettingsPage.jsx
import React, {useEffect, useState} from 'react';
import {
    Alert,
    alpha,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Business as AgencyIcon,
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    Description as DocIcon,
    Download as DownloadIcon,
    Folder as FilesIcon,
    Image as ImageIcon,
    InsertDriveFile as FileIcon,
    Inventory as PackageIcon,
    Movie as VideoIcon,
    Payment as PaymentIcon,
    PictureAsPdf as PdfIcon,
    Save as SaveIcon,
    UploadFile as UploadIcon
} from '@mui/icons-material';
import {useSnackbar} from 'notistack';
import {
    createAgencyFile,
    createAgencyInfo,
    createPackage,
    createPaymentMethod,
    deleteAgencyFile,
    deletePackage,
    deletePaymentMethod,
    getAgencyFiles,
    getAgencyInfo,
    getPackages,
    getPaymentMethods,
    updateAgencyInfo
} from '../api';
import moment from 'jalali-moment';
import ThemeSettings from './ThemeSettings';

function TabPanel({children, value, index}) {
    return (
        <div hidden={value !== index} style={{width: '100%', marginTop: 24}}>
            {value === index && children}
        </div>
    );
}

function SystemSettingsPage() {
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // داده‌ها
    const [packages, setPackages] = useState([]);
    const [methods, setMethods] = useState([]);
    const [agency, setAgency] = useState(null);
    const [agencyFiles, setAgencyFiles] = useState([]);

    // فرم‌ها
    const [newPackage, setNewPackage] = useState({title: '', price: '', description: ''});
    const [newMethod, setNewMethod] = useState({title: '', stages: '', discount_percent: 0});
    const [agencyForm, setAgencyForm] = useState({brand_name: '', phone: '', address: '', footer_text: '', logo: null});
    const [previewLogo, setPreviewLogo] = useState(null);
    const [newFileTitle, setNewFileTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // --- استایل‌های داینامیک ---
    const glassCardSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        p: 3,
        boxShadow: theme.shadows[4]
    };

    const textFieldSx = {
        '& .MuiInputLabel-root': {color: theme.palette.text.secondary},
        '& .MuiInputLabel-root.Mui-focused': {color: theme.palette.primary.main},
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': {borderColor: theme.palette.divider},
            '&:hover fieldset': {borderColor: theme.palette.text.primary},
            '&.Mui-focused fieldset': {borderColor: theme.palette.primary.main},
        }
    };

    const tableHeadSx = {
        '& th': {
            bgcolor: alpha(theme.palette.action.hover, 0.1),
            color: theme.palette.text.secondary,
            fontWeight: 'bold',
            borderBottom: `1px solid ${theme.palette.divider}`
        }
    };

    const tableBodySx = {
        '& td': {
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`
        },
        '& tr:hover': {bgcolor: alpha(theme.palette.action.hover, 0.1)}
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pkgRes, metRes, agnRes, fileRes] = await Promise.all([
                getPackages(),
                getPaymentMethods(),
                getAgencyInfo(),
                getAgencyFiles()
            ]);

            setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : (pkgRes.data.results || []));
            setMethods(Array.isArray(metRes.data) ? metRes.data : (metRes.data.results || []));
            setAgencyFiles(Array.isArray(fileRes.data) ? fileRes.data : (fileRes.data.results || []));

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
            enqueueSnackbar('خطا در دریافت اطلاعات', {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    // هندلرها (همان لاجیک قبلی)
    const handleAddPackage = async () => {
        try {
            await createPackage(newPackage);
            enqueueSnackbar('پکیج اضافه شد', {variant: 'success'});
            setNewPackage({title: '', price: '', description: ''});
            fetchData();
        } catch (err) {
            enqueueSnackbar('خطا', {variant: 'error'});
        }
    };
    const handleDeletePackage = async (id) => {
        if (window.confirm('حذف شود؟')) {
            await deletePackage(id);
            setPackages(packages.filter(p => p.id !== id));
        }
    };
    const handleAddMethod = async () => {
        try {
            await createPaymentMethod(newMethod);
            enqueueSnackbar('روش اضافه شد', {variant: 'success'});
            setNewMethod({title: '', stages: '', discount_percent: 0});
            fetchData();
        } catch (err) {
            enqueueSnackbar('خطا', {variant: 'error'});
        }
    };
    const handleDeleteMethod = async (id) => {
        if (window.confirm('حذف شود؟')) {
            await deletePaymentMethod(id);
            setMethods(methods.filter(m => m.id !== id));
        }
    };
    const handleSaveAgency = async () => {
        const formData = new FormData();
        Object.keys(agencyForm).forEach(key => {
            if (key === 'logo' && !agencyForm.logo) return;
            formData.append(key, agencyForm[key]);
        });
        try {
            if (agency) await updateAgencyInfo(agency.id, formData); else await createAgencyInfo(formData);
            enqueueSnackbar('ذخیره شد', {variant: 'success'});
            fetchData();
        } catch (err) {
            enqueueSnackbar('خطا', {variant: 'error'});
        }
    };
    const handleUploadFile = async () => {
        if (!selectedFile || !newFileTitle) {
            enqueueSnackbar('عنوان و فایل الزامی است', {variant: 'warning'});
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('title', newFileTitle);
        formData.append('file', selectedFile);
        try {
            const res = await createAgencyFile(formData);
            setAgencyFiles([res.data, ...agencyFiles]);
            enqueueSnackbar('آپلود شد', {variant: 'success'});
            setNewFileTitle('');
            setSelectedFile(null);
        } catch (err) {
            enqueueSnackbar('خطا', {variant: 'error'});
        } finally {
            setUploading(false);
        }
    };
    const handleDeleteFile = async (id) => {
        if (window.confirm('حذف شود؟')) {
            try {
                await deleteAgencyFile(id);
                setAgencyFiles(agencyFiles.filter(f => f.id !== id));
                enqueueSnackbar('حذف شد', {variant: 'success'});
            } catch (err) {
                enqueueSnackbar('خطا', {variant: 'error'});
            }
        }
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf':
                return <PdfIcon sx={{fontSize: 50, color: theme.palette.error.main}}/>;
            case 'image':
                return <ImageIcon sx={{fontSize: 50, color: theme.palette.success.main}}/>;
            case 'video':
                return <VideoIcon sx={{fontSize: 50, color: theme.palette.warning.main}}/>;
            case 'office':
                return <DocIcon sx={{fontSize: 50, color: theme.palette.info.main}}/>;
            default:
                return <FileIcon sx={{fontSize: 50, color: theme.palette.action.disabled}}/>;
        }
    };

    if (loading) return <Box p={5} textAlign="center"><CircularProgress/></Box>;

    return (
        <Box sx={{maxWidth: '1600px', mx: 'auto', p: 1}}>

            <Typography variant="h4" fontWeight="900" mb={4}
                        sx={{color: theme.palette.text.primary, textShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
                تنظیمات سیستم
            </Typography>

            <Paper sx={{...glassCardSx, p: 0}}>
                {/* --- نوار تب‌ها --- */}
                <Tabs
                    value={tabIndex}
                    onChange={(e, v) => setTabIndex(v)}
                    sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '& .MuiTab-root': {
                            color: theme.palette.text.secondary,
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            minHeight: 60,
                            '&.Mui-selected': {color: theme.palette.primary.main}
                        },
                        '& .MuiTabs-indicator': {backgroundColor: theme.palette.primary.main, height: 3}
                    }}
                >
                    <Tab icon={<PackageIcon/>} iconPosition="start" label="پکیج‌ها"/>
                    <Tab icon={<PaymentIcon/>} iconPosition="start" label="روش‌های پرداخت"/>
                    <Tab icon={<AgencyIcon/>} iconPosition="start" label="اطلاعات آژانس"/>
                    <Tab icon={<FilesIcon/>} iconPosition="start" label="فایل‌های داخلی"/>
                </Tabs>

                <Box p={4}>
                    {/* --- تب ۱: پکیج‌ها --- */}
                    <TabPanel value={tabIndex} index={0}>
                        <Grid container spacing={2} alignItems="center" mb={4}>
                            <Grid item xs={12} md={3}><TextField sx={textFieldSx} label="نام پکیج" fullWidth
                                                                 value={newPackage.title} onChange={e => setNewPackage({
                                ...newPackage,
                                title: e.target.value
                            })}/></Grid>
                            <Grid item xs={12} md={3}><TextField sx={textFieldSx} label="قیمت (تومان)" type="number"
                                                                 fullWidth value={newPackage.price}
                                                                 onChange={e => setNewPackage({
                                                                     ...newPackage,
                                                                     price: e.target.value
                                                                 })}/></Grid>
                            <Grid item xs={12} md={4}><TextField sx={textFieldSx} label="توضیحات" fullWidth
                                                                 value={newPackage.description}
                                                                 onChange={e => setNewPackage({
                                                                     ...newPackage,
                                                                     description: e.target.value
                                                                 })}/></Grid>
                            <Grid item xs={12} md={2}>
                                <Button variant="contained" size="large" fullWidth onClick={handleAddPackage}
                                        startIcon={<AddIcon/>}
                                        sx={{bgcolor: 'primary.main', height: 56, fontWeight: 'bold'}}>افزودن</Button>
                            </Grid>
                        </Grid>

                        <TableContainer sx={{border: `1px solid ${theme.palette.divider}`, borderRadius: 2}}>
                            <Table>
                                <TableHead
                                    sx={tableHeadSx}><TableRow><TableCell>عنوان</TableCell><TableCell>قیمت</TableCell><TableCell>توضیحات</TableCell><TableCell>عملیات</TableCell></TableRow></TableHead>
                                <TableBody sx={tableBodySx}>
                                    {packages.map(pkg => (
                                        <TableRow key={pkg.id}>
                                            <TableCell>{pkg.title}</TableCell>
                                            <TableCell>{Number(pkg.price).toLocaleString()} ت</TableCell>
                                            <TableCell sx={{opacity: 0.7}}>{pkg.description}</TableCell>
                                            <TableCell><IconButton color="error"
                                                                   onClick={() => handleDeletePackage(pkg.id)}><DeleteIcon/></IconButton></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </TabPanel>

                    {/* --- تب ۲: روش‌های پرداخت --- */}
                    <TabPanel value={tabIndex} index={1}>
                        <Alert severity="info" variant="filled" sx={{
                            mb: 3,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                            border: `1px solid ${theme.palette.info.main}`
                        }}>
                            درصدها را با ویرگول جدا کنید (مثال: 30,30,40). جمع درصدها باید ۱۰۰ شود.
                        </Alert>
                        <Grid container spacing={2} alignItems="center" mb={4}>
                            <Grid item xs={12} md={3}><TextField sx={textFieldSx} label="عنوان روش" fullWidth
                                                                 value={newMethod.title} onChange={e => setNewMethod({
                                ...newMethod,
                                title: e.target.value
                            })}/></Grid>
                            <Grid item xs={12} md={3}><TextField sx={textFieldSx} label="مراحل (مثال: 50,50)" fullWidth
                                                                 value={newMethod.stages} onChange={e => setNewMethod({
                                ...newMethod,
                                stages: e.target.value
                            })}/></Grid>
                            <Grid item xs={12} md={3}><TextField sx={textFieldSx} label="تخفیف (%)" type="number"
                                                                 fullWidth value={newMethod.discount_percent}
                                                                 onChange={e => setNewMethod({
                                                                     ...newMethod,
                                                                     discount_percent: e.target.value
                                                                 })}/></Grid>
                            <Grid item xs={12} md={3}><Button variant="contained" size="large" fullWidth
                                                              onClick={handleAddMethod} startIcon={<AddIcon/>} sx={{
                                bgcolor: 'success.main',
                                height: 56,
                                fontWeight: 'bold',
                                color: '#fff'
                            }}>افزودن روش</Button></Grid>
                        </Grid>
                        <TableContainer sx={{border: `1px solid ${theme.palette.divider}`, borderRadius: 2}}>
                            <Table>
                                <TableHead sx={tableHeadSx}><TableRow><TableCell>عنوان</TableCell><TableCell>مراحل
                                    پرداخت</TableCell><TableCell>تخفیف</TableCell><TableCell>عملیات</TableCell></TableRow></TableHead>
                                <TableBody sx={tableBodySx}>
                                    {methods.map(m => (
                                        <TableRow key={m.id}>
                                            <TableCell>{m.title}</TableCell>
                                            <TableCell><Chip label={m.stages} size="small" sx={{
                                                bgcolor: alpha(theme.palette.action.active, 0.1),
                                                color: theme.palette.text.primary
                                            }}/></TableCell>
                                            <TableCell sx={{
                                                color: 'success.main',
                                                fontWeight: 'bold'
                                            }}>{m.discount_percent}%</TableCell>
                                            <TableCell><IconButton color="error"
                                                                   onClick={() => handleDeleteMethod(m.id)}><DeleteIcon/></IconButton></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </TabPanel>

                    {/* --- تب ۳: اطلاعات آژانس --- */}
                    <TabPanel value={tabIndex} index={2}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={4} textAlign="center">
                                <Box sx={{
                                    width: 150, height: 150, margin: '0 auto', mb: 3,
                                    borderRadius: '50%', border: `4px solid ${theme.palette.divider}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: alpha(theme.palette.action.hover, 0.1), overflow: 'hidden'
                                }}>
                                    {previewLogo ? (
                                        <img src={previewLogo} alt="logo"
                                             style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                                    ) : (
                                        <AgencyIcon
                                            sx={{fontSize: 60, opacity: 0.3, color: theme.palette.text.secondary}}/>
                                    )}
                                </Box>
                                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon/>}
                                        sx={{color: theme.palette.text.primary, borderColor: theme.palette.divider}}>
                                    آپلود لوگوی جدید
                                    <input type="file" hidden accept="image/*" onChange={(e) => {
                                        if (e.target.files[0]) {
                                            setAgencyForm({...agencyForm, logo: e.target.files[0]});
                                            setPreviewLogo(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}/>
                                </Button>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Stack spacing={3}>
                                    <TextField sx={textFieldSx} label="نام برند / آژانس" fullWidth
                                               value={agencyForm.brand_name} onChange={e => setAgencyForm({
                                        ...agencyForm,
                                        brand_name: e.target.value
                                    })}/>
                                    <TextField sx={textFieldSx} label="شماره تماس" fullWidth value={agencyForm.phone}
                                               onChange={e => setAgencyForm({...agencyForm, phone: e.target.value})}/>
                                    <TextField sx={textFieldSx} label="آدرس" fullWidth multiline rows={2}
                                               value={agencyForm.address}
                                               onChange={e => setAgencyForm({...agencyForm, address: e.target.value})}/>
                                    <TextField sx={textFieldSx} label="متن پایین فاکتور" fullWidth multiline rows={2}
                                               value={agencyForm.footer_text} onChange={e => setAgencyForm({
                                        ...agencyForm,
                                        footer_text: e.target.value
                                    })}/>
                                    <Button variant="contained" size="large" onClick={handleSaveAgency}
                                            startIcon={<SaveIcon/>} sx={{
                                        bgcolor: 'warning.main',
                                        fontWeight: 'bold',
                                        alignSelf: 'flex-start',
                                        px: 4
                                    }}>ذخیره تغییرات</Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* --- تب ۴: فایل‌های داخلی --- */}
                    <TabPanel value={tabIndex} index={3}>
                        <Box mb={4} p={3} sx={{
                            bgcolor: alpha(theme.palette.action.hover, 0.05),
                            borderRadius: 3,
                            border: `1px dashed ${theme.palette.divider}`
                        }}>
                            <Typography variant="h6" gutterBottom
                                        sx={{color: theme.palette.primary.main, fontWeight: 'bold', mb: 2}}>📂 آپلود فایل
                                سازمانی جدید</Typography>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={5}>
                                    <TextField sx={textFieldSx} label="عنوان فایل (مثلاً: قرارداد خام پرسنل)" fullWidth
                                               size="small" value={newFileTitle}
                                               onChange={(e) => setNewFileTitle(e.target.value)}/>
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Button component="label" variant="outlined" fullWidth startIcon={<UploadIcon/>}
                                            sx={{
                                                height: 40,
                                                color: theme.palette.text.secondary,
                                                borderColor: theme.palette.divider,
                                                justifyContent: 'flex-start'
                                            }}>
                                        {selectedFile ? selectedFile.name : 'انتخاب فایل (PDF, Word, عکس...)'}
                                        <input type="file" hidden onChange={(e) => setSelectedFile(e.target.files[0])}/>
                                    </Button>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button variant="contained" fullWidth color="primary" onClick={handleUploadFile}
                                            disabled={uploading} sx={{height: 40, fontWeight: 'bold'}}>
                                        {uploading ? <CircularProgress size={24} color="inherit"/> : 'آپلود'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider sx={{mb: 4, borderColor: theme.palette.divider}}/>

                        {agencyFiles.length === 0 ? (
                            <Typography
                                sx={{opacity: 0.5, textAlign: 'center', py: 5, color: theme.palette.text.secondary}}>هنوز
                                فایلی آپلود نشده است.</Typography>
                        ) : (
                            <Grid container spacing={3}>
                                {agencyFiles.map((file) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                                        <Card sx={{
                                            bgcolor: alpha(theme.palette.background.default, 0.5),
                                            color: theme.palette.text.primary,
                                            borderRadius: 3,
                                            border: `1px solid ${theme.palette.divider}`,
                                            transition: '0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                                boxShadow: theme.shadows[4],
                                                borderColor: theme.palette.primary.main
                                            }
                                        }}>
                                            <CardContent sx={{textAlign: 'center', py: 4}}>
                                                {getFileIcon(file.file_type)}
                                                <Tooltip title={file.title}>
                                                    <Typography variant="subtitle1" fontWeight="bold" mt={2} noWrap
                                                                sx={{maxWidth: '100%'}}>
                                                        {file.title}
                                                    </Typography>
                                                </Tooltip>
                                                <Typography variant="caption"
                                                            sx={{display: 'block', mt: 0.5, opacity: 0.5}}>
                                                    {moment(file.uploaded_at).locale('fa').format('jD jMMMM jYYYY')}
                                                </Typography>
                                            </CardContent>
                                            <Divider sx={{borderColor: theme.palette.divider}}/>
                                            <CardActions sx={{justifyContent: 'space-between', px: 2}}>
                                                <Button size="small" startIcon={<DownloadIcon/>} href={file.file}
                                                        target="_blank" sx={{color: theme.palette.primary.main}}>
                                                    دانلود
                                                </Button>
                                                <IconButton size="small" onClick={() => handleDeleteFile(file.id)}
                                                            color="error">
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </TabPanel>
                </Box>
                <ThemeSettings />
            </Paper>
        </Box>
    );
}

export default SystemSettingsPage;