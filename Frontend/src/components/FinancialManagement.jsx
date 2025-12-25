// src/components/FinancialManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardActionArea, CardContent,
    Chip, Stack, Button, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, alpha, useTheme
} from '@mui/material';
import {
    AttachMoney as MoneyIcon, TrendingUp as ProfitIcon, MoneyOff as ExpenseIcon,
    CheckCircle as CheckIcon, RadioButtonUnchecked as UncheckedIcon,
    Lock as LockIcon, LockOpen as LockOpenIcon, Add as AddIcon,
    Delete as DeleteIcon, Print as PrintIcon, Event as DateIcon, FileDownload as ExcelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'jalali-moment';
import {
    updateProject, getProjectPayments, createProjectPayment, deleteProjectPayment,
    getProjectExpenses, createProjectExpense, deleteProjectExpense, exportProjectFinancials,
    getPackages, getPaymentMethods, getAgencyInfo
} from '../api';
import { useSnackbar } from 'notistack';
import { useReactToPrint } from 'react-to-print';
import { Invoice } from './Invoice';

const formatPrice = (price) => Number(price).toLocaleString('fa-IR');

function FinancialManagement({ project, onProjectUpdate, isAdmin }) {
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم

    const [packagesList, setPackagesList] = useState([]);
    const [methodsList, setMethodsList] = useState([]);
    const [agencyInfo, setAgencyInfo] = useState(null);
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

    useEffect(() => {
        if(printPayment) handlePrintInvoice();
    }, [printPayment]);

    useEffect(() => {
        const fetchAllData = async () => {
            setConfigLoading(true);
            try {
                const basePromises = [
                    getPackages(),
                    getPaymentMethods(),
                    getProjectPayments(project.id),
                    getAgencyInfo()
                ];
                if (isAdmin) basePromises.push(getProjectExpenses(project.id));

                const results = await Promise.all(basePromises);

                setPackagesList(Array.isArray(results[0].data) ? results[0].data : (results[0].data.results || []));
                setMethodsList(Array.isArray(results[1].data) ? results[1].data : (results[1].data.results || []));
                setPayments(results[2].data);

                const agnData = Array.isArray(results[3].data) ? results[3].data : (results[3].data.results || []);
                if (agnData.length > 0) setAgencyInfo(agnData[0]);

                if (isAdmin) setExpenses(results[4].data);

                setSelectedPkgId(project.selected_package);
                setSelectedMethodId(project.payment_method);
            } catch (err) {
                console.error(err);
            } finally {
                setConfigLoading(false);
            }
        };
        fetchAllData();
    }, [project.id, isAdmin]);

    // --- هندلرها ---
    const handleSelectionChange = async (type, id) => {
        if (!isAdmin) return;
        let newPkgId = type === 'package' ? id : selectedPkgId;
        let newMethodId = type === 'method' ? id : selectedMethodId;
        const selectedPkg = packagesList.find(p => p.id === newPkgId);
        const selectedMethod = methodsList.find(m => m.id === newMethodId);

        if (!selectedPkg && type === 'method') return;
        const basePrice = selectedPkg ? selectedPkg.price : 0;
        const discount = (selectedMethod && selectedMethod.discount_percent > 0) ? (basePrice * selectedMethod.discount_percent / 100) : 0;
        const newContractAmount = basePrice - discount;

        if (type === 'package') setSelectedPkgId(id); else setSelectedMethodId(id);

        try {
            const payload = { contract_amount: newContractAmount };
            if (newPkgId) payload.selected_package = newPkgId;
            if (newMethodId) payload.payment_method = newMethodId;
            const response = await updateProject(project.id, payload);
            onProjectUpdate(response.data);
            enqueueSnackbar('بروزرسانی شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); }
    };

    const handleCreatePayment = async () => {
        setActionLoading(true);
        try {
            const data = { amount: paymentData.amount, description: paymentData.description, date: paymentData.date.locale('en').format('YYYY-MM-DD'), is_paid: true };
            const res = await createProjectPayment(project.id, data);
            setPayments([res.data, ...payments]); setOpenPaymentModal(false); setPaymentData({ amount: '', date: moment(), description: '' });
            enqueueSnackbar('ثبت شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); } finally { setActionLoading(false); }
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
            const data = { amount: expenseData.amount, description: expenseData.description, date: expenseData.date.locale('en').format('YYYY-MM-DD') };
            const res = await createProjectExpense(project.id, data);
            setExpenses([res.data, ...expenses]); setOpenExpenseModal(false); setExpenseData({ amount: '', date: moment(), description: '' });
            enqueueSnackbar('ثبت شد', { variant: 'success' });
        } catch (err) { enqueueSnackbar('خطا', { variant: 'error' }); } finally { setActionLoading(false); }
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

    const handleToggleStart = async () => {
        if (!isAdmin) return;
        try {
            const response = await updateProject(project.id, { is_started: !project.is_started });
            onProjectUpdate(response.data);
            enqueueSnackbar(response.data.is_started ? 'پروژه فعال شد' : 'پروژه متوقف شد', { variant: 'info' });
        } catch (err) { console.error(err); }
    };

    // --- محاسبات ---
    const totalReceived = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const contractAmount = project.contract_amount || 0;
    const progressPercent = contractAmount > 0 ? Math.min((totalReceived / contractAmount) * 100, 100) : 0;
    const netProfit = totalReceived - totalExpenses;
    const currentMethod = methodsList.find(m => m.id === selectedMethodId);
    const paymentStages = currentMethod ? currentMethod.stages.split(',').map(Number) : [];

    const calculateDueDate = (index, total) => {
        if (!project.start_date || !project.end_date) return null;
        const start = moment(project.start_date);
        const end = moment(project.end_date);
        if (index === 0) return start;
        if (index === total - 1) return end;
        const diff = end.diff(start, 'days');
        return start.clone().add(diff / 2, 'days');
    };

    // --- استایل‌های شیشه‌ای داینامیک ---
    const glassCardSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4],
        p: 3, mb: 3
    };
    const textFieldSx = {
        '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
        '& .MuiOutlinedInput-root': { color: theme.palette.text.primary, '& fieldset': { borderColor: theme.palette.divider } }
    };
    const tableHeadSx = { '& th': { bgcolor: alpha(theme.palette.action.hover, 0.1), color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` } };
    const tableBodySx = { '& td': { color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }, '& tr:hover': { bgcolor: `${alpha(theme.palette.action.hover, 0.1)} !important` } };

    if (configLoading) return <CircularProgress />;

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(12px)', border: `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" sx={{display:'flex', alignItems:'center', gap:1, color: theme.palette.text.primary}}>
                        {project.is_started ? <LockOpenIcon color="success"/> : <LockIcon color="error"/>}
                        وضعیت: <span style={{color: project.is_started ? theme.palette.success.main : theme.palette.error.main}}>{project.is_started ? 'فعال' : 'غیرفعال'}</span>
                    </Typography>
                    {isAdmin && <FormControlLabel control={<Switch checked={project.is_started || false} onChange={handleToggleStart}/>} label="تغییر وضعیت" sx={{color: theme.palette.text.primary}} />}
                </Stack>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">پکیج انتخابی:</Typography>
                        <Grid container spacing={2}>
                        {packagesList.map((pkg) => (
                            <Grid item xs={12} sm={6} key={pkg.id}>
                                <Card sx={{
                                    bgcolor: pkg.id === selectedPkgId ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.action.disabledBackground, 0.1),
                                    border: pkg.id === selectedPkgId ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                                    color: theme.palette.text.primary
                                }}>
                                    <CardActionArea onClick={() => handleSelectionChange('package', pkg.id)} disabled={!isAdmin} sx={{ p: 2 }}>
                                        <Typography fontWeight="bold">{pkg.title}</Typography>
                                        <Typography variant="h6" fontWeight="900" mt={1}>{formatPrice(pkg.price)} تومان</Typography>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={4}>
                         <Typography variant="subtitle2" gutterBottom color="text.secondary">روش پرداخت:</Typography>
                         <Stack spacing={1}>
                             {methodsList.map((method) => (
                                 <Card key={method.id} sx={{
                                     bgcolor: method.id === selectedMethodId ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.action.disabledBackground, 0.1),
                                     border: method.id === selectedMethodId ? `2px solid ${theme.palette.warning.main}` : `1px solid ${theme.palette.divider}`,
                                     color: theme.palette.text.primary
                                 }}>
                                     <CardActionArea onClick={() => handleSelectionChange('method', method.id)} disabled={!isAdmin} sx={{ p: 1.5, display:'flex', alignItems:'center', gap:1 }}>
                                         {method.id === selectedMethodId ? <CheckIcon color="secondary" fontSize="small"/> : <UncheckedIcon fontSize="small" color="action"/>}
                                         <Typography variant="body2">{method.title}</Typography>
                                         {method.discount_percent > 0 && <Chip label={`-${method.discount_percent}%`} color="error" size="small" sx={{height:20, fontSize:'0.7rem'}}/>}
                                     </CardActionArea>
                                 </Card>
                             ))}
                         </Stack>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{...glassCardSx, bgcolor: alpha(theme.palette.success.main, 0.1), borderColor: theme.palette.success.main, textAlign:'center'}}>
                        <Typography variant="caption" display="block" color="text.secondary">دریافتی کل</Typography>
                        <Typography variant="h5" fontWeight="900" color="success.main">{formatPrice(totalReceived)}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{...glassCardSx, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: theme.palette.info.main, textAlign:'center'}}>
                        <Typography variant="caption" display="block" color="text.secondary">مبلغ قرارداد</Typography>
                        <Typography variant="h5" fontWeight="900" color="info.main">{formatPrice(contractAmount)}</Typography>
                    </Paper>
                </Grid>
                {isAdmin && (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{...glassCardSx, bgcolor: alpha(theme.palette.error.main, 0.1), borderColor: theme.palette.error.main, textAlign:'center'}}>
                                <Typography variant="caption" display="block" color="text.secondary">هزینه‌ها</Typography>
                                <Typography variant="h5" fontWeight="900" color="error.main">{formatPrice(totalExpenses)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper sx={{...glassCardSx, bgcolor: alpha(theme.palette.warning.main, 0.1), borderColor: theme.palette.warning.main, textAlign:'center'}}>
                                <Typography variant="caption" display="block" color="text.secondary">سود خالص</Typography>
                                <Typography variant="h5" fontWeight="900" color="warning.main">{formatPrice(netProfit)}</Typography>
                            </Paper>
                        </Grid>
                    </>
                )}
            </Grid>

            <Paper elevation={2} sx={{ ...glassCardSx, p: 2, mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">پیشرفت وصول مطالبات</Typography>
                    <Typography variant="body2" color="text.primary">{progressPercent.toFixed(1)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progressPercent} color={progressPercent === 100 ? "success" : "primary"} sx={{ height: 8, borderRadius: 4 }} />
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt:4, color: theme.palette.text.primary }}><DateIcon color="primary" /> برنامه زمان‌بندی اقساط</Typography>
            <Grid container spacing={2} mb={4}>
                {paymentStages.length > 0 ? paymentStages.map((percent, index) => {
                    const amount = (contractAmount * percent) / 100;
                    const cumulativePercent = paymentStages.slice(0, index + 1).reduce((a, b) => a + b, 0);
                    const isPaid = progressPercent >= cumulativePercent - 1;
                    const dueDate = calculateDueDate(index, paymentStages.length);

                    return (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper elevation={3} sx={{
                                p: 2,
                                border: isPaid ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.divider}`,
                                bgcolor: isPaid ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.background.paper, 0.05),
                                color: theme.palette.text.primary
                            }}>
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
                    <Paper elevation={3} sx={{...glassCardSx, p:2, borderRadius:2, height:'100%'}}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" color="primary">💰 دریافتی‌ها</Typography>
                            {isAdmin && <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenPaymentModal(true)}>ثبت</Button>}
                        </Stack>
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={tableHeadSx}><TableRow><TableCell>مبلغ</TableCell><TableCell>تاریخ</TableCell><TableCell>شرح</TableCell><TableCell>عملیات</TableCell></TableRow></TableHead>
                                <TableBody sx={tableBodySx}>
                                    {payments.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell sx={{color: theme.palette.success.main, fontWeight:'bold'}}>{formatPrice(p.amount)}</TableCell>
                                            <TableCell>{moment(p.date).locale('fa').format('jYYYY/jMM/jDD')}</TableCell>
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
                        <Paper elevation={3} sx={{...glassCardSx, p:2, borderRadius:2, height:'100%'}}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" color="error">💸 هزینه‌ها</Typography>
                                <Button size="small" variant="contained" color="error" startIcon={<AddIcon />} onClick={() => setOpenExpenseModal(true)}>ثبت</Button>
                            </Stack>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={tableHeadSx}><TableRow><TableCell>عنوان</TableCell><TableCell>مبلغ</TableCell><TableCell>تاریخ</TableCell><TableCell></TableCell></TableRow></TableHead>
                                    <TableBody sx={tableBodySx}>
                                        {expenses.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell>{e.title}</TableCell>
                                                <TableCell fontWeight="bold" sx={{color: theme.palette.error.main}}>{Number(e.amount).toLocaleString()} ت</TableCell>
                                                <TableCell>{moment(e.date).locale('fa').format('jYYYY/jMM/jDD')}</TableCell>
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

            {/* مودال‌ها */}
            <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary } }}
            >
                <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>ثبت دریافتی جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={2}>
                        <TextField sx={textFieldSx} label="مبلغ" type="number" fullWidth value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} />
                        <TextField sx={textFieldSx} label="شرح" fullWidth value={paymentData.description} onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })} />
                        <DatePicker label="تاریخ" value={paymentData.date} onChange={(v) => setPaymentData({ ...paymentData, date: v })} renderInput={(p) => <TextField {...p} sx={textFieldSx} />} />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenPaymentModal(false)} color="inherit">لغو</Button><Button onClick={handleCreatePayment} variant="contained" color="success">ثبت</Button></DialogActions>
            </Dialog>

            <Dialog open={openExpenseModal} onClose={() => setOpenExpenseModal(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary } }}
            >
                <DialogTitle sx={{color:'error.main', borderBottom: `1px solid ${theme.palette.divider}`}}>ثبت هزینه جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={2}>
                        <TextField sx={textFieldSx} label="مبلغ" type="number" fullWidth value={expenseData.amount} onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })} color="error" />
                        <TextField sx={textFieldSx} label="بابت" fullWidth value={expenseData.description} onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })} color="error" />
                        <DatePicker label="تاریخ" value={expenseData.date} onChange={(v) => setExpenseData({ ...expenseData, date: v })} renderInput={(p) => <TextField {...p} sx={textFieldSx} color="error" />} />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenExpenseModal(false)} color="inherit">لغو</Button><Button onClick={handleCreateExpense} variant="contained" color="error">ثبت</Button></DialogActions>
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