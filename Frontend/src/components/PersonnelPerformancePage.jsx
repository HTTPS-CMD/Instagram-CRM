// src/components/PersonnelPerformancePage.jsx
import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Assessment as ReportIcon,
    Assignment as TaskIcon,
    AttachMoney as MoneyIcon,
    Delete as DeleteIcon,
    Gavel as LawIcon,
    History as HistoryIcon,
    ThumbDown as BadIcon,
    ThumbUp as GoodIcon
} from '@mui/icons-material';
import {useSnackbar} from 'notistack';
import moment from 'jalali-moment';
import TaskKanban from './TaskKanban'; // ایمپورت تسک بورد
import {createPersonnelLog, deletePersonnelLog, getPerformanceReport, getPersonnelLogs, getUsers} from '../api';

function TabPanel({children, value, index}) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{py: 3}}>{children}</Box>}
        </div>
    );
}

function PersonnelPerformancePage() {
    const theme = useTheme();
    const {enqueueSnackbar} = useSnackbar();
    const [tabIndex, setTabIndex] = useState(0);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // آی‌دی کاربر انتخاب شده

    // استیت‌های بخش لاگ (LogBook)
    const [logs, setLogs] = useState([]);
    const [openLogModal, setOpenLogModal] = useState(false);
    const [newLog, setNewLog] = useState({
        user: '', type: 'penalty', category: 'discipline',
        title: '', description: '', financial_impact: 0, score_impact: 0
    });

    // استیت‌های بخش کارنامه (Report Card)
    const [reportData, setReportData] = useState(null);
    const [reportMonth, setReportMonth] = useState(moment().locale('en').format('YYYY-MM')); // ماه جاری میلادی
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        // دریافت لیست کاربران برای سلکتور
        getUsers().then(res => {
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setUsers(data);
            if (data.length > 0) setSelectedUser(data[0].id);
        });
        loadLogs();
    }, []);

    // دریافت لاگ‌ها
    const loadLogs = () => {
        getPersonnelLogs()
            .then(res => {
                // چک می‌کنیم که آیا پاسخ واقعاً یک آرایه است یا نه
                if (Array.isArray(res.data)) {
                    setLogs(res.data);
                } else if (res.data && Array.isArray(res.data.results)) {
                    setLogs(res.data.results);
                } else {
                    console.error("Invalid logs data:", res.data);
                    setLogs([]); // اگر داده اشتباه بود، لیست خالی بگذار تا صفحه سفید نشود
                }
            })
            .catch(err => {
                console.error(err);
                setLogs([]); // در صورت ارور هم لیست خالی شود
            });
    };

    // ثبت لاگ جدید
    const handleSaveLog = async () => {
        if (!newLog.title) {
            enqueueSnackbar('عنوان الزامی است', {variant: 'warning'});
            return;
        }
        try {
            await createPersonnelLog({...newLog, user: selectedUser}); // لاگ برای کاربر انتخاب شده
            enqueueSnackbar('ثبت شد', {variant: 'success'});
            setOpenLogModal(false);
            loadLogs();
            // ریست کردن فرم
            setNewLog(prev => ({...prev, title: '', description: '', financial_impact: 0, score_impact: 0}));
        } catch (err) {
            enqueueSnackbar('خطا در ثبت', {variant: 'error'});
            console.error(err);
        }
    };

    // دریافت کارنامه
    const handleGetReport = async () => {
        if (!selectedUser) return;
        setLoadingReport(true);
        try {
            const res = await getPerformanceReport(selectedUser, reportMonth);
            setReportData(res.data);
        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در دریافت کارنامه', {variant: 'error'});
        } finally {
            setLoadingReport(false);
        }
    };

    // هندلر حذف لاگ
    const handleDeleteLog = async (id) => {
        if (window.confirm('حذف شود؟')) {
            await deletePersonnelLog(id);
            setLogs(prev => prev.filter(l => l.id !== id));
        }
    };

    return (
        <Container maxWidth="xl" sx={{mt: 4, mb: 4}}>
            {/* هدر صفحه و انتخاب پرسنل */}
            <Paper sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">مدیریت جامع عملکرد پرسنل</Typography>
                    <Typography variant="body2" color="text.secondary">تسک‌ها، انضباط کاری و کارنامه ماهانه</Typography>
                </Box>
                <Box sx={{minWidth: 250}}>
                    <TextField
                        select
                        label="انتخاب پرسنل"
                        value={selectedUser || ''}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        fullWidth
                        size="small"
                        sx={{textAlign: 'right'}}
                    >
                        {users.map(u => (
                            <MenuItem key={u.id} value={u.id}>{u.full_name || u.username} ({u.role})</MenuItem>
                        ))}
                    </TextField>
                </Box>
            </Paper>

            {/* تب‌ها */}
            <Paper sx={{mb: 3, borderRadius: 2}}>
                <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered variant="fullWidth"
                      indicatorColor="primary">
                    <Tab icon={<TaskIcon/>} label="کارتابل وظایف (Planner)" iconPosition="start"/>
                    <Tab icon={<LawIcon/>} label="دفتر وقایع (Log Book)" iconPosition="start"/>
                    <Tab icon={<ReportIcon/>} label="کارنامه ماهانه (Report Card)" iconPosition="start"/>
                </Tabs>
            </Paper>

            {/* تب ۱: تسک‌ها */}
            <TabPanel value={tabIndex} index={0}>
                <Alert severity="info" sx={{mb: 2}}>
                    در این بخش می‌توانید وظایف روزانه، هفتگی و پروژه‌ای را
                    برای <b>{users.find(u => u.id === selectedUser)?.username}</b> تعریف و مدیریت کنید.
                </Alert>
                {/* ارسال selectedUser به عنوان فیلتر به تسک‌بورد */}
                <TaskKanban projectId={null} filterUser={selectedUser}/>
            </TabPanel>

            {/* تب ۲: دفتر وقایع (انضباطی/مالی) */}
            <TabPanel value={tabIndex} index={1}>
                <Stack direction="row" justifyContent="flex-end" mb={2}>
                    <Button variant="contained" color="error" startIcon={<AddIcon/>}
                            onClick={() => setOpenLogModal(true)}>
                        ثبت واقعه جدید
                    </Button>
                </Stack>

                <Grid container spacing={2}>
                    {logs.filter(l => l.user === selectedUser).map(log => (
                        <Grid item xs={12} md={6} key={log.id}>
                            <Card sx={{
                                borderRight: `5px solid ${log.log_type === 'penalty' ? '#f44336' : '#4caf50'}`,
                                height: '100%'
                            }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6" fontWeight="bold">{log.title}</Typography>
                                        <Chip
                                            label={log.financial_impact > 0 ? `${log.financial_impact.toLocaleString()} ت` : 'بدون بار مالی'}
                                            color={log.log_type === 'penalty' ? 'error' : 'success'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" mt={1} sx={{minHeight: 40}}>
                                        {log.description}
                                    </Typography>
                                    <Divider sx={{my: 1}}/>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="text.secondary">
                                            {moment(log.date).locale('fa').format('jYYYY/jMM/jDD')} |
                                            ثبت: {log.recorder_name}
                                        </Typography>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteLog(log.id)}>
                                            <DeleteIcon fontSize="small"/>
                                        </IconButton>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {logs.filter(l => l.user === selectedUser).length === 0 && (
                        <Box width="100%" textAlign="center" mt={5}>
                            <Typography color="text.secondary">هیچ سابقه‌ای برای این کاربر ثبت نشده است.</Typography>
                        </Box>
                    )}
                </Grid>
            </TabPanel>

            {/* تب ۳: کارنامه */}
            <TabPanel value={tabIndex} index={2}>
                <Paper sx={{p: 3, borderRadius: 3, minHeight: 400}}>
                    <Stack direction="row" spacing={2} mb={4} alignItems="center" justifyContent="center">
                        <Typography fontWeight="bold">انتخاب ماه:</Typography>
                        <TextField
                            type="month"
                            value={reportMonth}
                            onChange={(e) => setReportMonth(e.target.value)}
                            size="small"
                            sx={{direction: 'ltr'}}
                        />
                        <Button variant="contained" onClick={handleGetReport} disabled={loadingReport}
                                startIcon={<HistoryIcon/>}>
                            {loadingReport ? <CircularProgress size={24} color="inherit"/> : 'محاسبه کارنامه'}
                        </Button>
                    </Stack>

                    {reportData ? (
                        <Grid container spacing={3}>
                            {/* خلاصه امتیازات */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{height: '100%', bgcolor: 'primary.dark', color: 'white', borderRadius: 4}}>
                                    <CardContent sx={{
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        height: '100%'
                                    }}>
                                        <Typography variant="h6" sx={{opacity: 0.8}}>نمره نهایی عملکرد</Typography>
                                        <Typography variant="h1" fontWeight="900" my={2}>
                                            {reportData.stats.final_score}
                                        </Typography>
                                        <Typography variant="body2" sx={{opacity: 0.8}}>مجموع KPI + امتیازات
                                            انضباطی</Typography>
                                        <Box mt={3} p={1} bgcolor="rgba(255,255,255,0.1)" borderRadius={2}>
                                            <Typography variant="body2">تسک‌های انجام
                                                شده: {reportData.stats.daily_count + reportData.stats.weekly_count + reportData.stats.project_count}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* آمار مالی و متن گزارش */}
                            <Grid item xs={12} md={8}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Paper sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            border: '1px solid #f44336',
                                            borderRadius: 3
                                        }}>
                                            <Typography color="error" fontWeight="bold" display="flex"
                                                        alignItems="center" justifyContent="center" gap={1}>
                                                <BadIcon/> ضرر وارده
                                            </Typography>
                                            <Typography variant="h5" mt={1}
                                                        fontWeight="bold">{reportData.stats.financial_loss.toLocaleString()} ت</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            border: '1px solid #4caf50',
                                            borderRadius: 3
                                        }}>
                                            <Typography color="success.main" fontWeight="bold" display="flex"
                                                        alignItems="center" justifyContent="center" gap={1}>
                                                <GoodIcon/> ارزش افزوده
                                            </Typography>
                                            <Typography variant="h5" mt={1}
                                                        fontWeight="bold">{reportData.stats.value_added.toLocaleString()} ت</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Paper
                                            sx={{p: 3, bgcolor: '#f8f9fa', borderRadius: 3, border: '1px dashed #ccc'}}>
                                            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                                                <HistoryIcon sx={{verticalAlign: 'middle', mr: 1}}/>
                                                گزارش تشریحی سیستم
                                            </Typography>
                                            <Typography variant="body1" sx={{
                                                whiteSpace: 'pre-wrap',
                                                fontFamily: 'inherit',
                                                lineHeight: 1.8
                                            }}>
                                                {reportData.written_report}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box textAlign="center" mt={5} color="text.secondary">
                            <ReportIcon sx={{fontSize: 60, opacity: 0.2}}/>
                            <Typography>برای مشاهده کارنامه، ماه مورد نظر را انتخاب و دکمه محاسبه را بزنید.</Typography>
                        </Box>
                    )}
                </Paper>
            </TabPanel>

            {/* مودال ثبت وقایع */}
            <Dialog open={openLogModal} onClose={() => setOpenLogModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{bgcolor: newLog.log_type === 'penalty' ? '#ffebee' : '#e8f5e9'}}>
                    {newLog.log_type === 'penalty' ? 'ثبت تخلف / جریمه / نکته منفی' : 'ثبت پاداش / نکته مثبت'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={2}>
                        <TextField
                            select label="نوع ثبت" fullWidth
                            value={newLog.log_type}
                            onChange={(e) => setNewLog({...newLog, log_type: e.target.value})}
                        >
                            <MenuItem value="penalty">🛑 جریمه / نکته منفی</MenuItem>
                            <MenuItem value="bonus">✅ پاداش / نکته مثبت</MenuItem>
                            <MenuItem value="info">ℹ️ یادداشت معمولی</MenuItem>
                        </TextField>

                        <TextField label="عنوان موضوع" fullWidth value={newLog.title}
                                   onChange={(e) => setNewLog({...newLog, title: e.target.value})} required
                                   placeholder="مثال: تاخیر در ورود"/>

                        <TextField
                            label="مبلغ تاثیر مالی (تومان)" type="number" fullWidth
                            value={newLog.financial_impact}
                            onChange={(e) => setNewLog({...newLog, financial_impact: e.target.value})}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><MoneyIcon/></InputAdornment>
                            }}
                            helperText="اگر جریمه یا پاداش مالی دارد وارد کنید"
                        />

                        <TextField
                            label="تاثیر روی امتیاز (نمره)" type="number" fullWidth
                            value={newLog.score_impact}
                            onChange={(e) => setNewLog({...newLog, score_impact: Number(e.target.value)})}
                            helperText="مثلا -10 برای جریمه یا +20 برای پاداش"
                        />

                        <TextField label="شرح کامل ماجرا" multiline rows={3} fullWidth value={newLog.description}
                                   onChange={(e) => setNewLog({...newLog, description: e.target.value})}/>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenLogModal(false)}>لغو</Button>
                    <Button variant="contained" onClick={handleSaveLog}
                            color={newLog.log_type === 'penalty' ? 'error' : 'success'}>ثبت</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default PersonnelPerformancePage;