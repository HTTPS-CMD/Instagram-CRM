// src/components/FinancialManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardActionArea, CardContent,
    Chip, Stack, Button, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import {
    AttachMoney as MoneyIcon,
    TrendingUp as ProfitIcon,
    MoneyOff as ExpenseIcon,
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Print as PrintIcon,
    Event as DateIcon,
    FileDownload as ExcelIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'jalali-moment';
import {
    updateProject, getProjectPayments, createProjectPayment, deleteProjectPayment,
    getProjectExpenses, createProjectExpense, deleteProjectExpense, exportProjectFinancials,
    getPackages, getPaymentMethods, getAgencyInfo // ✅ تابع جدید
} from '../api';
import { useSnackbar } from 'notistack';
import { useReactToPrint } from 'react-to-print';
import { Invoice } from './Invoice';

const formatPrice = (price) => Number(price).toLocaleString('fa-IR');

function FinancialManagement({ project, onProjectUpdate, isAdmin }) {
    const { enqueueSnackbar } = useSnackbar();

    const [packagesList, setPackagesList] = useState([]);
    const [methodsList, setMethodsList] = useState([]);
    const [agencyInfo, setAgencyInfo] = useState(null); // ✅ استیت اطلاعات آژانس
    const [configLoading, setConfigLoading] = useState(true);

    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);

    const [selectedPkgId, setSelectedPkgId] = useState(null);
    const [selectedMethodId, setSelectedMethodId] = useState(null);

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
        setTimeout(() => handlePrintInvoice(), 100);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setConfigLoading(true);
            try {
                const basePromises = [
                    getPackages(),
                    getPaymentMethods(),
                    getProjectPayments(project.id),
                    getAgencyInfo() // ✅ دریافت اطلاعات آژانس
                ];

                if (isAdmin) {
                    basePromises.push(getProjectExpenses(project.id));
                }

                const results = await Promise.all(basePromises);

                const pkgRes = results[0];
                const methodRes = results[1];
                const payRes = results[2];
                const agencyRes = results[3]; // ✅ نتیجه آژانس
                const expRes = isAdmin ? results[4] : { data: [] };

                setPackagesList(Array.isArray(pkgRes.data) ? pkgRes.data : (pkgRes.data.results || []));
                setMethodsList(Array.isArray(methodRes.data) ? methodRes.data : (methodRes.data.results || []));

                // ذخیره اطلاعات آژانس (اولین آیتم آرایه)
                const agnData = Array.isArray(agencyRes.data) ? agencyRes.data : (agencyRes.data.results || []);
                if (agnData.length > 0) setAgencyInfo(agnData[0]);

                setPayments(payRes.data);
                setExpenses(expRes.data);

                setSelectedPkgId(project.selected_package);
                setSelectedMethodId(project.payment_method);

            } catch (err) {
                console.error("Error fetching data:", err);
                if (err.response && err.response.status !== 403) {
                    enqueueSnackbar('خطا در دریافت اطلاعات', { variant: 'error' });
                }
            } finally {
                setConfigLoading(false);
            }
        };
        fetchAllData();
    }, [project.id, isAdmin]);

    useEffect(() => {
        setSelectedPkgId(project.selected_package);
        setSelectedMethodId(project.payment_method);
    }, [project.selected_package, project.payment_method]);

    const totalReceived = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const contractAmount = project.contract_amount || 0;
    const progressPercent = contractAmount > 0 ? Math.min((totalReceived / contractAmount) * 100, 100) : 0;
    const netProfit = totalReceived - totalExpenses;

    const currentMethod = methodsList.find(m => m.id === selectedMethodId);
    const paymentStages = currentMethod ? currentMethod.stages.split(',').map(Number) : [];

    const handleSelectionChange = async (type, id) => {
        if (!isAdmin) return;

        let newPkgId = type === 'package' ? id : selectedPkgId;
        let newMethodId = type === 'method' ? id : selectedMethodId;

        const selectedPkg = packagesList.find(p => p.id === newPkgId);
        const selectedMethod = methodsList.find(m => m.id === newMethodId);

        if (!selectedPkg && type === 'method') return;

        const basePrice = selectedPkg ? selectedPkg.price : 0;
        const discount = (selectedMethod && selectedMethod.discount_percent > 0)
            ? (basePrice * selectedMethod.discount_percent / 100)
            : 0;

        const newContractAmount = basePrice - discount;

        if (type === 'package') setSelectedPkgId(id);
        else setSelectedMethodId(id);

        try {
            const payload = { contract_amount: newContractAmount };
            if (newPkgId) payload.selected_package = newPkgId;
            if (newMethodId) payload.payment_method = newMethodId;

            const response = await updateProject(project.id, payload);
            onProjectUpdate(response.data);
            enqueueSnackbar('تنظیمات مالی بروز شد', { variant: 'success' });
        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در بروزرسانی', { variant: 'error' });
        }
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
            const data = {
                amount: paymentData.amount, description: paymentData.description,
                date: paymentData.date.locale('en').format('YYYY-MM-DD'), is_paid: true
            };
            const res = await createProjectPayment(project.id, data);
            setPayments([res.data, ...payments]);
            setOpenPaymentModal(false);
            setPaymentData({ amount: '', date: moment(), description: '' });
            enqueueSnackbar('پرداخت ثبت شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); }
        finally { setActionLoading(false); }
    };

    const handleDeletePayment = async (id) => {
        if(window.confirm('حذف شود؟')) {
            try { await deleteProjectPayment(project.id, id); setPayments(payments.filter(p => p.id !== id)); }
            catch(e) { enqueueSnackbar('خطا', {variant:'error'}); }
        }
    };

    const handleCreateExpense = async () => {
        setActionLoading(true);
        try {
            const data = {
                amount: expenseData.amount, description: expenseData.description,
                date: expenseData.date.locale('en').format('YYYY-MM-DD')
            };
            const res = await createProjectExpense(project.id, data);
            setExpenses([res.data, ...expenses]);
            setOpenExpenseModal(false);
            setExpenseData({ amount: '', date: moment(), description: '' });
            enqueueSnackbar('هزینه ثبت شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); }
        finally { setActionLoading(false); }
    };

    const handleDeleteExpense = async (id) => {
        if(window.confirm('حذف شود؟')) {
            try { await deleteProjectExpense(project.id, id); setExpenses(expenses.filter(e => e.id !== id)); }
            catch(e) { enqueueSnackbar('خطا', {variant:'error'}); }
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await exportProjectFinancials(project.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Financial_Report_${project.project_name}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { enqueueSnackbar('خطا در دانلود', { variant: 'error' }); }
    };

    const calculateDueDate = (index, total) => {
        if (!project.start_date || !project.end_date) return null;
        const start = moment(project.start_date);
        const end = moment(project.end_date);
        if (index === 0) return start;
        if (index === total - 1) return end;
        const diff = end.diff(start, 'days');
        return start.clone().add(diff / 2, 'days');
    };

    if (configLoading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

    return (
        <Box>
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
                         {packagesList.length === 0 ? (
                             <Typography color="error" variant="caption">هیچ پکیجی تعریف نشده است. لطفاً از منوی تنظیمات سیستم، پکیج اضافه کنید.</Typography>
                         ) : (
                             <Grid container spacing={2}>
                                {packagesList.map((pkg) => (
                                    <Grid item xs={12} sm={6} key={pkg.id}>
                                        <Card
                                            elevation={pkg.id === selectedPkgId ? 8 : 2}
                                            sx={{
                                                border: pkg.id === selectedPkgId ? '2px solid #3da9fc' : '1px solid rgba(255,255,255,0.1)',
                                                bgcolor: pkg.id === selectedPkgId ? 'rgba(61, 169, 252, 0.15)' : 'background.paper',
                                                transition: 'all 0.3s ease',
                                                cursor: isAdmin ? 'pointer' : 'default',
                                                transform: pkg.id === selectedPkgId ? 'scale(1.02)' : 'scale(1)',
                                                '&:hover': { borderColor: '#3da9fc', boxShadow: '0 4px 20px rgba(61, 169, 252, 0.2)' }
                                            }}
                                        >
                                            <CardActionArea onClick={() => handleSelectionChange('package', pkg.id)} disabled={!isAdmin} sx={{ p: 2 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Typography variant="subtitle1" fontWeight="bold" color={pkg.id === selectedPkgId ? 'primary.main' : 'text.primary'}>{pkg.title}</Typography>
                                                    {pkg.id === selectedPkgId && <CheckIcon color="primary" />}
                                                </Stack>
                                                <Typography variant="h5" fontWeight="900" color={pkg.id === selectedPkgId ? 'text.primary' : 'text.secondary'} mb={1}>
                                                    {formatPrice(pkg.price)} <Typography component="span" variant="caption">تومان</Typography>
                                                </Typography>
                                                {pkg.description && <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pkg.description}</Typography>}
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                         )}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">روش پرداخت:</Typography>
                        {methodsList.length === 0 ? (
                            <Typography color="error" variant="caption">روش پرداختی تعریف نشده است.</Typography>
                        ) : (
                            <Stack spacing={1}>
                                {methodsList.map((method) => (
                                    <Card
                                        key={method.id}
                                        elevation={method.id === selectedMethodId ? 6 : 1}
                                        sx={{
                                            border: method.id === selectedMethodId ? '2px solid #ffab40' : '1px solid rgba(255,255,255,0.1)',
                                            bgcolor: method.id === selectedMethodId ? 'rgba(255, 171, 64, 0.08)' : 'background.paper'
                                        }}
                                    >
                                        <CardActionArea onClick={() => handleSelectionChange('method', method.id)} disabled={!isAdmin} sx={{ p: 1.5 }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                {method.id === selectedMethodId ? <CheckIcon color="secondary" fontSize="small"/> : <UncheckedIcon fontSize="small" color="disabled"/>}
                                                <Typography variant="body2">{method.title}</Typography>
                                                {method.discount_percent > 0 && <Chip label={`-${method.discount_percent}%`} color="error" size="small" sx={{height:20, fontSize:'0.7rem'}}/>}
                                            </Stack>
                                        </CardActionArea>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                 <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MoneyIcon color="primary"/> داشبورد مالی</Typography>
                {isAdmin && <Button variant="outlined" color="success" startIcon={<ExcelIcon />} onClick={handleExportExcel}>خروجی اکسل</Button>}
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
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={3} sx={{ bgcolor: 'error.dark', color: 'white' }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2" sx={{ opacity: 0.8 }}>هزینه‌ها</Typography><ExpenseIcon sx={{opacity: 0.5}}/></Stack>
                                    <Typography variant="h5" fontWeight="bold" mt={1}>{formatPrice(totalExpenses)} <span style={{fontSize:'0.8rem'}}>ت</span></Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={3} sx={{ background: netProfit >= 0 ? 'linear-gradient(45deg, #fbc02d 30%, #f57f17 90%)' : 'grey.800', color: 'black' }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2" fontWeight="bold">سود خالص</Typography><ProfitIcon/></Stack>
                                    <Typography variant="h5" fontWeight="bold" mt={1}>{formatPrice(netProfit)} <span style={{fontSize:'0.8rem'}}>ت</span></Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}
            </Grid>

            <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">پیشرفت وصول مطالبات</Typography>
                    <Typography variant="body2">{progressPercent.toFixed(1)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progressPercent} color={progressPercent === 100 ? "success" : "primary"} sx={{ height: 8, borderRadius: 4 }} />
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt:4 }}><DateIcon color="primary" /> برنامه زمان‌بندی اقساط</Typography>
            <Grid container spacing={2} mb={4}>
                {paymentStages.length > 0 ? paymentStages.map((percent, index) => {
                    const amount = (contractAmount * percent) / 100;
                    const cumulativePercent = paymentStages.slice(0, index + 1).reduce((a, b) => a + b, 0);
                    const isPaid = progressPercent >= cumulativePercent - 1;
                    const dueDate = calculateDueDate(index, paymentStages.length);

                    return (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper elevation={3} sx={{ p: 2, border: isPaid ? '1px solid #4caf50' : '1px solid rgba(255,255,255,0.1)', bgcolor: isPaid ? 'rgba(76, 175, 80, 0.08)' : 'background.paper' }}>
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography variant="subtitle2" color="text.secondary">قسط {index + 1} ({percent}٪)</Typography>
                                    <Chip label={isPaid ? 'پرداخت شده' : 'موعد نرسیده'} color={isPaid ? "success" : "default"} size="small" variant={isPaid ? "filled" : "outlined"} />
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" mb={1}>{formatPrice(amount)} ت</Typography>
                                <Typography variant="caption" color="text.secondary">سررسید: {dueDate ? dueDate.locale('fa').format('jD jMMMM jYYYY') : '---'}</Typography>
                            </Paper>
                        </Grid>
                    );
                }) : (
                    <Grid item xs={12}><Typography color="text.secondary" align="center">روش پرداخت انتخاب نشده است.</Typography></Grid>
                )}
            </Grid>

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
                                                <IconButton size="small" color="info" onClick={() => onPrintClick(p)}><PrintIcon fontSize="small"/></IconButton>
                                                {isAdmin && <IconButton size="small" color="error" onClick={() => handleDeletePayment(p.id)}><DeleteIcon fontSize="small"/></IconButton>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                                                <TableCell><IconButton size="small" color="error" onClick={() => handleDeleteExpense(e.id)}><DeleteIcon fontSize="small"/></IconButton></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle>ثبت دریافتی جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="مبلغ" type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} fullWidth />
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
                        <TextField label="مبلغ" type="number" value={expenseData.amount} onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })} fullWidth color="error" />
                        <TextField label="بابت" value={expenseData.description} onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })} fullWidth color="error" />
                        <DatePicker label="تاریخ" value={expenseData.date} onChange={(v) => setExpenseData({ ...expenseData, date: v })} renderInput={(p) => <TextField {...p} color="error" />} />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenExpenseModal(false)}>انصراف</Button><Button onClick={handleCreateExpense} variant="contained" color="error" disabled={actionLoading}>ثبت</Button></DialogActions>
            </Dialog>

            {/* ✅ ارسال اطلاعات آژانس به کامپوننت فاکتور */}
            <div style={{ display: 'none' }}>
                <Invoice
                    ref={invoiceRef}
                    payment={printPayment}
                    project={project}
                    agency={agencyInfo} // ✅ اینجا پاس دادیم
                />
            </div>
        </Box>
    );
}

export default FinancialManagement;