// src/components/FinancialManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CardActionArea,
    Chip, Stack, Button, Divider, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import {
    AttachMoney as MoneyIcon,
    TrendingUp as ProfitIcon,
    MoneyOff as ExpenseIcon,
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckedIcon,
    LocalOffer as DiscountIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    Print as PrintIcon,
    Event as DateIcon, // آیکون تقویم
    Warning as WarningIcon, // آیکون هشدار
    FileDownload as ExcelIcon, // ✅ آیکون اکسل
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'jalali-moment';
import {
    updateProject, getProjectPayments, createProjectPayment, deleteProjectPayment,
    getProjectExpenses, createProjectExpense, deleteProjectExpense, exportProjectFinancials // ✅ تابع اکسل
} from '../api';
import { useSnackbar } from 'notistack';
import { useReactToPrint } from 'react-to-print';
import { Invoice } from './Invoice';

// --- ثابت‌ها ---
const PACKAGES = [
    { id: 'pkg1', name: 'پکیج اول', price: 30000000, desc: 'شامل ۱۲ پست، ۴ استوری موشن، سناریو و...' },
    { id: 'pkg2', name: 'پکیج دوم', price: 22000000, desc: 'شامل ۸ پست، ۲ استوری موشن، سناریو و...' },
    { id: 'pkg3', name: 'پکیج سوم', price: 15000000, desc: 'شامل ۴ پست، ۱ استوری موشن و...' },
    { id: 'pkg4', name: 'پکیج چهارم', price: 9000000, desc: 'شامل ۴ پست ساده (بدون فیلمبرداری)' },
];

const PAYMENT_METHODS = [
    { id: 'method1', name: 'روش اول (۳۰-۳۰-۴۰)', discount: 0, stages: [30, 30, 40] },
    { id: 'method2', name: 'روش دوم (۵۰-۵۰)', discount: 0, stages: [50, 50] },
    { id: 'method3', name: 'روش سوم (نقدی)', discount: 15, stages: [100] },
];

const formatPrice = (price) => Number(price).toLocaleString('fa-IR');

function FinancialManagement({ project, onProjectUpdate, isAdmin }) {
    const { enqueueSnackbar } = useSnackbar();

    const [selectedPkgId, setSelectedPkgId] = useState(project.selected_package || 'pkg1');
    const [selectedMethodId, setSelectedMethodId] = useState(project.payment_method || 'method1');

    const [payments, setPayments] = useState([]);
    const [totalReceived, setTotalReceived] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState(0);

    const [loading, setLoading] = useState(true);

    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [openExpenseModal, setOpenExpenseModal] = useState(false);

    const [paymentData, setPaymentData] = useState({ amount: '', date: moment(), description: '' });
    const [expenseData, setExpenseData] = useState({ amount: '', date: moment(), description: '' });

    const [actionLoading, setActionLoading] = useState(false);

    const [printPayment, setPrintPayment] = useState(null);
    const invoiceRef = useRef();

    const handlePrintInvoice = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Invoice-${printPayment?.id}`,
        onAfterPrint: () => setPrintPayment(null),
    });

    const onPrintClick = (payment) => {
        setPrintPayment(payment);
        setTimeout(() => {
            handlePrintInvoice();
        }, 100);
    };

    // محاسبات مالی
    const contractAmount = project.contract_amount || 0;
    const remainingAmount = contractAmount - totalReceived;
    const progressPercent = contractAmount > 0 ? Math.min((totalReceived / contractAmount) * 100, 100) : 0;
    const netProfit = totalReceived - totalExpenses;

    const currentMethod = PAYMENT_METHODS.find(m => m.id === selectedMethodId) || PAYMENT_METHODS[0];

    useEffect(() => {
        fetchFinancials();
    }, [project.id]);

    const fetchFinancials = async () => {
        setLoading(true);
        try {
            const promises = [getProjectPayments(project.id)];
            if (isAdmin) {
                promises.push(getProjectExpenses(project.id));
            }
            const results = await Promise.all(promises);

            const paymentsData = results[0].data;
            setPayments(paymentsData);
            setTotalReceived(paymentsData.reduce((acc, curr) => acc + Number(curr.amount), 0));

            if (results[1]) {
                const expensesData = results[1].data;
                setExpenses(expensesData);
                setTotalExpenses(expensesData.reduce((acc, curr) => acc + Number(curr.amount), 0));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectionChange = async (type, id) => {
        if (!isAdmin) return;
        let newPkgId = selectedPkgId;
        let newMethodId = selectedMethodId;
        if (type === 'package') { newPkgId = id; setSelectedPkgId(id); } else { newMethodId = id; setSelectedMethodId(id); }

        const pkg = PACKAGES.find(p => p.id === newPkgId);
        const method = PAYMENT_METHODS.find(m => m.id === newMethodId);
        const discount = method.discount ? (pkg.price * method.discount / 100) : 0;
        const newContractAmount = pkg.price - discount;

        try {
            const response = await updateProject(project.id, {
                selected_package: newPkgId, payment_method: newMethodId, contract_amount: newContractAmount
            });
            onProjectUpdate(response.data);
            enqueueSnackbar('تنظیمات بروز شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); }
    };

    const handleToggleStart = async () => {
        if (!isAdmin) return;
        try {
            const response = await updateProject(project.id, { is_started: !project.is_started });
            onProjectUpdate(response.data);
            enqueueSnackbar(response.data.is_started ? 'پروژه فعال شد' : 'پروژه متوقف شد', { variant: 'info' });
        } catch (err) { console.error(err); }
    };

    const handleCreatePayment = async () => {
        setActionLoading(true);
        try {
            const dataToSend = {
                amount: paymentData.amount, description: paymentData.description,
                date: paymentData.date.locale('en').format('YYYY-MM-DD'), is_paid: true
            };
            const response = await createProjectPayment(project.id, dataToSend);
            setPayments(prev => [response.data, ...prev]);
            setTotalReceived(prev => prev + Number(paymentData.amount));
            enqueueSnackbar('پرداخت ثبت شد', { variant: 'success' });
            setOpenPaymentModal(false);
            setPaymentData({ amount: '', date: moment(), description: '' });
        } catch (err) { enqueueSnackbar('خطا در ثبت', { variant: 'error' }); }
        finally { setActionLoading(false); }
    };

    const handleDeletePayment = async (id, amount) => {
        if (window.confirm('حذف شود؟')) {
            try {
                await deleteProjectPayment(project.id, id);
                setPayments(prev => prev.filter(p => p.id !== id));
                setTotalReceived(prev => prev - Number(amount));
                enqueueSnackbar('حذف شد', { variant: 'info' });
            } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); }
        }
    };

    const handleCreateExpense = async () => {
        setActionLoading(true);
        try {
            const dataToSend = {
                amount: expenseData.amount, description: expenseData.description,
                date: expenseData.date.locale('en').format('YYYY-MM-DD')
            };
            const response = await createProjectExpense(project.id, dataToSend);
            setExpenses(prev => [response.data, ...prev]);
            setTotalExpenses(prev => prev + Number(expenseData.amount));
            enqueueSnackbar('هزینه ثبت شد', { variant: 'success' });
            setOpenExpenseModal(false);
            setExpenseData({ amount: '', date: moment(), description: '' });
        } catch (err) { enqueueSnackbar('خطا در ثبت هزینه', { variant: 'error' }); }
        finally { setActionLoading(false); }
    };

    const handleDeleteExpense = async (id, amount) => {
        if (window.confirm('این هزینه حذف شود؟')) {
            try {
                await deleteProjectExpense(project.id, id);
                setExpenses(prev => prev.filter(e => e.id !== id));
                setTotalExpenses(prev => prev - Number(amount));
                enqueueSnackbar('هزینه حذف شد', { variant: 'info' });
            } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); }
        }
    };

    // --- ✅ توابع محاسبه تاریخ سررسید ---
    const calculateDueDate = (stageIndex, totalStages) => {
        if (!project.start_date || !project.end_date) return null;
        const start = moment(project.start_date);
        const end = moment(project.end_date);

        if (stageIndex === 0) return start; // قسط اول: شروع پروژه
        if (stageIndex === totalStages - 1) return end; // قسط آخر: پایان پروژه

        // قسط میانی: دقیقاً وسط بازه زمانی
        const duration = end.diff(start, 'days');
        return start.clone().add(duration / 2, 'days');
    };

    const getDueDateStatus = (dueDate, isPaid) => {
        if (isPaid) return { label: 'پرداخت شده', color: 'success', icon: <CheckIcon fontSize="small"/> };
        if (!dueDate) return { label: 'تاریخ نامشخص', color: 'default', icon: null };

        const today = moment();
        if (today.isAfter(dueDate)) return { label: 'سررسید گذشته!', color: 'error', icon: <WarningIcon fontSize="small"/> };

        // اگر کمتر از ۳ روز مانده
        const diffDays = dueDate.diff(today, 'days');
        if (diffDays <= 3 && diffDays >= 0) return { label: 'سررسید نزدیک', color: 'warning', icon: <WarningIcon fontSize="small"/> };

        return { label: 'موعد نرسیده', color: 'info', icon: <DateIcon fontSize="small"/> };
    };

    // --- ✅ تابع دانلود اکسل ---
    const handleExportExcel = async () => {
        try {
            const response = await exportProjectFinancials(project.id);
            // ایجاد لینک دانلود موقت
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Financial_Report_${project.project_name}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            enqueueSnackbar('فایل اکسل دانلود شد', { variant: 'success' });
        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در دانلود فایل', { variant: 'error' });
        }
    };

    return (
        <Box>
            {/* --- بخش ۱: وضعیت کلی --- */}
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" sx={{display:'flex', alignItems:'center', gap:1}}>
                        {project.is_started ? <LockOpenIcon color="success"/> : <LockIcon color="error"/>}
                        وضعیت پروژه: <span style={{color: project.is_started ? '#2e7d32' : '#c62828'}}>{project.is_started ? 'فعال' : 'غیرفعال'}</span>
                    </Typography>
                    {isAdmin && <FormControlLabel control={<Switch checked={project.is_started || false} onChange={handleToggleStart}/>} label="تغییر وضعیت" />}
                </Stack>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                         <Typography variant="subtitle2" gutterBottom color="text.secondary">پکیج انتخابی:</Typography>
                         <Grid container spacing={1}>
                            {PACKAGES.map((pkg) => (
                                <Grid item xs={12} sm={6} key={pkg.id}>
                                    <Card elevation={pkg.id === selectedPkgId ? 6 : 1} sx={{ border: pkg.id === selectedPkgId ? '2px solid #3da9fc' : '1px solid rgba(255,255,255,0.1)', bgcolor: pkg.id === selectedPkgId ? 'rgba(61, 169, 252, 0.08)' : 'background.paper', transition: 'all 0.2s' }}>
                                        <CardActionArea onClick={() => handleSelectionChange('package', pkg.id)} disabled={!isAdmin} sx={{ p: 1.5 }}>
                                            <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight="bold">{pkg.name}</Typography>{pkg.id === selectedPkgId && <CheckIcon color="primary" fontSize="small"/>}</Stack>
                                            <Typography variant="body2" color="text.secondary">{formatPrice(pkg.price)} تومان</Typography>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">روش پرداخت:</Typography>
                        <Stack spacing={1}>
                            {PAYMENT_METHODS.map((method) => (
                                <Card key={method.id} elevation={method.id === selectedMethodId ? 6 : 1} sx={{ border: method.id === selectedMethodId ? '2px solid #ffab40' : '1px solid rgba(255,255,255,0.1)', bgcolor: method.id === selectedMethodId ? 'rgba(255, 171, 64, 0.08)' : 'background.paper' }}>
                                    <CardActionArea onClick={() => handleSelectionChange('method', method.id)} disabled={!isAdmin} sx={{ p: 1.5 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            {method.id === selectedMethodId ? <CheckIcon color="secondary" fontSize="small"/> : <UncheckedIcon fontSize="small" color="disabled"/>}
                                            <Typography variant="body2">{method.name}</Typography>
                                            {method.discount > 0 && <Chip label={`-${method.discount}%`} color="error" size="small" sx={{height:20, fontSize:'0.7rem'}}/>}
                                        </Stack>
                                    </CardActionArea>
                                </Card>
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- بخش ۲: داشبورد مالی --- */}
            {/* ✅ دکمه خروجی اکسل در هدر بخش مالی اضافه شد */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                 <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="primary"/> داشبورد مالی
                </Typography>
                {isAdmin && (
                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<ExcelIcon />}
                        onClick={handleExportExcel}
                    >
                        خروجی اکسل
                    </Button>
                )}
            </Stack>

            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3} sx={{ bgcolor: 'primary.dark', color: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>مبلغ قرارداد</Typography>
                            <Typography variant="h5" fontWeight="bold" mt={1}>{formatPrice(contractAmount)} <span style={{fontSize:'0.8rem'}}>ت</span></Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3} sx={{ bgcolor: 'success.dark', color: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>دریافتی کل</Typography>
                            <Typography variant="h5" fontWeight="bold" mt={1}>{formatPrice(totalReceived)} <span style={{fontSize:'0.8rem'}}>ت</span></Typography>
                        </CardContent>
                    </Card>
                </Grid>
                {isAdmin && (
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ bgcolor: 'error.dark', color: 'white' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" sx={{ opacity: 0.8 }}>هزینه‌ها</Typography><ExpenseIcon sx={{opacity: 0.5}}/></Stack>
                                <Typography variant="h5" fontWeight="bold" mt={1}>{formatPrice(totalExpenses)} <span style={{fontSize:'0.8rem'}}>ت</span></Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
                {isAdmin && (
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ background: netProfit >= 0 ? 'linear-gradient(45deg, #fbc02d 30%, #fdd835 90%)' : 'grey.800', color: 'black' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" fontWeight="bold">سود خالص</Typography><ProfitIcon/></Stack>
                                <Typography variant="h5" fontWeight="bold" mt={1}>{formatPrice(netProfit)} <span style={{fontSize:'0.8rem'}}>ت</span></Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">پیشرفت وصول مطالبات</Typography>
                    <Typography variant="body2">{progressPercent.toFixed(1)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progressPercent} color={progressPercent === 100 ? "success" : "primary"} sx={{ height: 8, borderRadius: 4 }} />
            </Paper>

            {/* --- بخش ۳: برنامه زمان‌بندی اقساط (جدید) --- */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt:4 }}>
                <DateIcon color="primary" /> برنامه زمان‌بندی اقساط
            </Typography>
            <Grid container spacing={2} mb={4}>
                {currentMethod.stages.map((percent, index) => {
                    const amount = (contractAmount * percent) / 100;
                    // فرض ساده: قسط‌ها به ترتیب پرداخت می‌شوند. اگر درصد پیشرفت > درصد تجمعی این قسط باشد یعنی پرداخت شده
                    const cumulativePercent = currentMethod.stages.slice(0, index + 1).reduce((a, b) => a + b, 0);
                    const isPaid = progressPercent >= cumulativePercent - 1; // -1 برای خطای اعشاری

                    const dueDate = calculateDueDate(index, currentMethod.stages.length);
                    const status = getDueDateStatus(dueDate, isPaid);

                    return (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper
                                elevation={3}
                                sx={{
                                    p: 2,
                                    border: isPaid ? '1px solid #4caf50' : (status.color === 'error' ? '1px solid #ef5350' : '1px solid rgba(255,255,255,0.1)'),
                                    bgcolor: isPaid ? 'rgba(76, 175, 80, 0.08)' : (status.color === 'error' ? 'rgba(239, 83, 80, 0.08)' : 'background.paper')
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        {index === 0 ? 'پیش‌پرداخت' : (index === currentMethod.stages.length - 1 ? 'تسویه نهایی' : `قسط ${index + 1}`)}
                                        <span style={{fontSize:'0.8rem', opacity:0.7}}> ({percent}٪)</span>
                                    </Typography>
                                    <Chip
                                        label={status.label}
                                        color={status.color}
                                        size="small"
                                        icon={status.icon}
                                        variant={isPaid ? "filled" : "outlined"}
                                    />
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" mb={1}>{formatPrice(amount)} ت</Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    سررسید: {dueDate ? dueDate.locale('fa').format('jD jMMMM jYYYY') : '---'}
                                </Typography>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* --- بخش ۴: جداول --- */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={isAdmin ? 6 : 12}>
                    <Paper elevation={3} sx={{p:2, borderRadius:2, height:'100%'}}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" color="primary">💰 دریافتی‌ها</Typography>
                            {isAdmin && <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenPaymentModal(true)}>ثبت</Button>}
                        </Stack>
                        <TableContainer>
                            <Table size="small">
                                <TableHead><TableRow><TableCell>تاریخ</TableCell><TableCell>مبلغ</TableCell><TableCell>بابت</TableCell><TableCell>عملیات</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {payments.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{moment(p.date).locale('fa').format('jMM/jDD')}</TableCell>
                                            <TableCell sx={{color:'success.main', fontWeight:'bold'}}>{formatPrice(p.amount)}</TableCell>
                                            <TableCell>{p.description}</TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="info" onClick={() => onPrintClick(p)} title="چاپ فاکتور"><PrintIcon fontSize="small"/></IconButton>
                                                {isAdmin && <IconButton size="small" color="error" onClick={() => handleDeletePayment(p.id, p.amount)}><DeleteIcon fontSize="small"/></IconButton>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {payments.length === 0 && <TableRow><TableCell colSpan={4} align="center">ثبت نشده</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {isAdmin && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{p:2, borderRadius:2, height:'100%'}}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" color="error">💸 هزینه‌ها</Typography>
                                <Button size="small" variant="contained" color="error" startIcon={<AddIcon />} onClick={() => setOpenExpenseModal(true)}>ثبت</Button>
                            </Stack>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead><TableRow><TableCell>تاریخ</TableCell><TableCell>مبلغ</TableCell><TableCell>بابت</TableCell><TableCell></TableCell></TableRow></TableHead>
                                    <TableBody>
                                        {expenses.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell>{moment(e.date).locale('fa').format('jMM/jDD')}</TableCell>
                                                <TableCell sx={{color:'error.main', fontWeight:'bold'}}>{formatPrice(e.amount)}</TableCell>
                                                <TableCell>{e.description}</TableCell>
                                                <TableCell><IconButton size="small" color="error" onClick={() => handleDeleteExpense(e.id, e.amount)}><DeleteIcon fontSize="small"/></IconButton></TableCell>
                                            </TableRow>
                                        ))}
                                        {expenses.length === 0 && <TableRow><TableCell colSpan={4} align="center">ثبت نشده</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* مودال‌ها */}
            <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle>ثبت دریافتی جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="مبلغ (تومان)" type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} fullWidth />
                        <TextField label="بابت" value={paymentData.description} onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })} fullWidth />
                        <DatePicker label="تاریخ" value={paymentData.date} onChange={(v) => setPaymentData({ ...paymentData, date: v })} renderInput={(p) => <TextField {...p} />} />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenPaymentModal(false)}>انصراف</Button><Button onClick={handleCreatePayment} variant="contained" disabled={actionLoading}>ثبت</Button></DialogActions>
            </Dialog>

            <Dialog open={openExpenseModal} onClose={() => setOpenExpenseModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{color:'error.main'}}>ثبت هزینه جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="مبلغ هزینه (تومان)" type="number" value={expenseData.amount} onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })} fullWidth color="error" />
                        <TextField label="بابت (مثلاً تدوین)" value={expenseData.description} onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })} fullWidth color="error" />
                        <DatePicker label="تاریخ هزینه" value={expenseData.date} onChange={(v) => setExpenseData({ ...expenseData, date: v })} renderInput={(p) => <TextField {...p} color="error" />} />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenExpenseModal(false)}>انصراف</Button><Button onClick={handleCreateExpense} variant="contained" color="error" disabled={actionLoading}>ثبت هزینه</Button></DialogActions>
            </Dialog>

            {/* --- کامپوننت مخفی فاکتور --- */}
            <div style={{ display: 'none' }}>
                <Invoice ref={invoiceRef} payment={printPayment} project={project} />
            </div>
        </Box>
    );
}

export default FinancialManagement;