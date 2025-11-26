// src/components/AgencyFinancialsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Stack, Button, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress,
    useTheme
} from '@mui/material';
import {
    AttachMoney as MoneyIcon,
    TrendingUp as ProfitIcon,
    MoneyOff as ExpenseIcon,
    AccountBalance as BankIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    ReceiptLong as ContractIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'jalali-moment';
import { useSnackbar } from 'notistack';
import {
    getSalaries, createSalary, deleteSalary,
    getGeneralExpenses, createGeneralExpense, deleteGeneralExpense,
    getDashboardStats, getUsers, getProjects
} from '../api';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';

const formatPrice = (price) => Number(price).toLocaleString('fa-IR');

function AgencyFinancialsPage() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user]);

    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [salaries, setSalaries] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [projects, setProjects] = useState([]);
    const [personnelList, setPersonnelList] = useState([]);
    const [stats, setStats] = useState(null);

    const [openSalaryModal, setOpenSalaryModal] = useState(false);
    const [openExpenseModal, setOpenExpenseModal] = useState(false);

    const [salaryForm, setSalaryForm] = useState({ personnel: '', amount: '', date: moment(), description: '' });
    const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', expense_type: 'other', date: moment(), description: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [salRes, expRes, projRes, userRes, statsRes] = await Promise.all([
                getSalaries(),
                getGeneralExpenses(),
                getProjects(),
                getUsers(),
                getDashboardStats()
            ]);

            setSalaries(salRes.data);
            setExpenses(expRes.data);
            setProjects(projRes.data);

            // ✅✅✅ اصلاحیه: این بخش باید داخل try باشد تا userRes شناخته شود
            // بررسی می‌کنیم که آیا دیتا آرایه است یا آبجکت پاگینیشن (results)
            const usersData = Array.isArray(userRes.data) ? userRes.data : (userRes.data.results || []);
            setPersonnelList(usersData.filter(u => u.role !== 'client'));

            setStats(statsRes.data);

        } catch (err) {
            console.error(err);
            enqueueSnackbar('خطا در دریافت اطلاعات مالی', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // --- هندلرهای حقوق ---
    const handleCreateSalary = async () => {
        // اعتبارسنجی اولیه
        if (!salaryForm.personnel || !salaryForm.amount) {
            enqueueSnackbar('لطفاً پرسنل و مبلغ را مشخص کنید.', { variant: 'warning' });
            return;
        }

        setActionLoading(true);
        try {
            const data = {
                personnel: salaryForm.personnel, // مطمئن شوید این فقط ID است
                amount: salaryForm.amount,
                description: salaryForm.description,
                // تبدیل تاریخ به رشته میلادی استاندارد (YYYY-MM-DD)
                payment_date: salaryForm.date.locale('en').format('YYYY-MM-DD')
            };

            console.log("Sending Salary Data:", data); // برای دیباگ در کنسول

            await createSalary(data);
            enqueueSnackbar('حقوق با موفقیت ثبت شد', { variant: 'success' });
            setOpenSalaryModal(false);
            fetchData();
            // ریست فرم
            setSalaryForm({ personnel: '', amount: '', date: moment(), description: '' });
        } catch (err) {
            console.error("Salary Error:", err.response?.data || err);

            // نمایش خطای دقیق سرور به کاربر
            let errorMsg = 'خطا در ثبت حقوق.';
            if (err.response && err.response.data) {
                errorMsg = Object.entries(err.response.data)
                    .map(([key, val]) => `${key}: ${val}`)
                    .join('\n');
            }
            enqueueSnackbar(errorMsg, { variant: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSalary = async (id) => {
        if(window.confirm('حذف شود؟')) {
            try { await deleteSalary(id); fetchData(); enqueueSnackbar('حذف شد', {variant:'info'}); }
            catch(e){ enqueueSnackbar('خطا', {variant:'error'}); }
        }
    };

    // --- هندلرهای هزینه‌ها ---
    const handleCreateExpense = async () => {
        setActionLoading(true);
        try {
            const data = {
                ...expenseForm,
                date: expenseForm.date.locale('en').format('YYYY-MM-DD')
            };
            await createGeneralExpense(data);
            enqueueSnackbar('هزینه ثبت شد', { variant: 'success' });
            setOpenExpenseModal(false);
            fetchData();
            // ریست فرم
            setExpenseForm({ title: '', amount: '', expense_type: 'other', date: moment(), description: '' });
        } catch (err) { enqueueSnackbar('خطا در ثبت', { variant: 'error' }); }
        finally { setActionLoading(false); }
    };

    const handleDeleteExpense = async (id) => {
        if(window.confirm('حذف شود؟')) {
            try { await deleteGeneralExpense(id); fetchData(); enqueueSnackbar('حذف شد', {variant:'info'}); }
            catch(e){ enqueueSnackbar('خطا', {variant:'error'}); }
        }
    };

    const totalIncome = stats?.financial_stats.find(s => s.name === 'درآمد')?.amount || 0;
    const totalProjectExpenses = stats?.financial_stats.find(s => s.name === 'هزینه')?.amount || 0;
    const totalSalaries = salaries.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalGeneralExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalAgencyExpenses = totalProjectExpenses + totalSalaries + totalGeneralExpenses;
    const netAgencyProfit = totalIncome - totalAgencyExpenses;

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom mb={4} textAlign={'left'}>امور مالی کل آژانس</Typography>

            {/* --- کارت‌های آماری --- */}
            <Grid container spacing={3} mb={5}>
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ bgcolor: 'primary.dark', color: 'white' }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{opacity:0.8}}>درآمد کل قراردادها</Typography>
                                <MoneyIcon />
                            </Stack>
                            <Typography variant="h4" fontWeight="bold" mt={2}>{formatPrice(totalIncome)} <span style={{fontSize:'1rem'}}>ت</span></Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ bgcolor: 'error.dark', color: 'white' }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{opacity:0.8}}>کل هزینه‌های آژانس</Typography>
                                <ExpenseIcon />
                            </Stack>
                            <Typography variant="h4" fontWeight="bold" mt={2}>{formatPrice(totalAgencyExpenses)} <span style={{fontSize:'1rem'}}>ت</span></Typography>
                            <Typography variant="caption" sx={{opacity:0.7}}>شامل: حقوق، جاری و هزینه‌های پروژه</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ background: 'linear-gradient(45deg, #fbc02d 30%, #f57f17 90%)', color: 'black' }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontWeight="bold">سود خالص نهایی</Typography>
                                <ProfitIcon />
                            </Stack>
                            <Typography variant="h4" fontWeight="bold" mt={2}>{formatPrice(netAgencyProfit)} <span style={{fontSize:'1rem'}}>ت</span></Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* --- تب‌ها --- */}
            <Stack direction="row" spacing={2} mb={3}>
                <Button
                    variant={tabIndex === 0 ? "contained" : "outlined"}
                    onClick={() => setTabIndex(0)}
                    startIcon={<BusinessIcon />}
                >
                    هزینه‌های جاری
                </Button>
                <Button
                    variant={tabIndex === 1 ? "contained" : "outlined"}
                    onClick={() => setTabIndex(1)}
                    startIcon={<PersonIcon />}
                >
                    حقوق پرسنل
                </Button>
                <Button
                    variant={tabIndex === 2 ? "contained" : "outlined"}
                    onClick={() => setTabIndex(2)}
                    startIcon={<ContractIcon />}
                >
                    نمای کلی قراردادها
                </Button>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {/* --- تب ۱: هزینه‌های جاری --- */}
            {tabIndex === 0 && (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" color="error">لیست هزینه‌های جاری</Typography>
                        <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={() => setOpenExpenseModal(true)}>ثبت هزینه</Button>
                    </Stack>
                    <TableContainer>
                        <Table>
                            <TableHead><TableRow><TableCell>عنوان</TableCell><TableCell>نوع</TableCell><TableCell>مبلغ</TableCell><TableCell>تاریخ</TableCell><TableCell></TableCell></TableRow></TableHead>
                            <TableBody>
                                {expenses.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell>{e.title}</TableCell>
                                        <TableCell><Chip label={e.expense_type} size="small" /></TableCell>
                                        <TableCell fontWeight="bold">{formatPrice(e.amount)}</TableCell>
                                        <TableCell>{moment(e.date).locale('fa').format('jYYYY/jMM/jDD')}</TableCell>
                                        <TableCell><IconButton size="small" color="error" onClick={() => handleDeleteExpense(e.id)}><DeleteIcon /></IconButton></TableCell>
                                    </TableRow>
                                ))}
                                {expenses.length === 0 && <TableRow><TableCell colSpan={5} align="center">ثبت نشده</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* --- تب ۲: حقوق پرسنل --- */}
            {tabIndex === 1 && (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" color="warning.main">لیست پرداختی حقوق</Typography>
                        <Button variant="contained" color="warning" startIcon={<AddIcon />} onClick={() => setOpenSalaryModal(true)}>ثبت حقوق</Button>
                    </Stack>
                    <TableContainer>
                        <Table>
                            <TableHead><TableRow><TableCell>نام پرسنل</TableCell><TableCell>مبلغ</TableCell><TableCell>بابت / توضیحات</TableCell><TableCell>تاریخ پرداخت</TableCell><TableCell></TableCell></TableRow></TableHead>
                            <TableBody>
                                {salaries.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>{s.personnel_name || s.personnel_username}</TableCell>
                                        <TableCell fontWeight="bold">{formatPrice(s.amount)}</TableCell>
                                        <TableCell>{s.description}</TableCell>
                                        <TableCell>{moment(s.payment_date).locale('fa').format('jYYYY/jMM/jDD')}</TableCell>
                                        <TableCell><IconButton size="small" color="error" onClick={() => handleDeleteSalary(s.id)}><DeleteIcon /></IconButton></TableCell>
                                    </TableRow>
                                ))}
                                {salaries.length === 0 && <TableRow><TableCell colSpan={5} align="center">ثبت نشده</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* --- تب ۳: قراردادها --- */}
            {tabIndex === 2 && (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary">وضعیت مالی پروژه‌ها</Typography>
                    <TableContainer>
                        <Table>
                            <TableHead><TableRow><TableCell>نام پروژه</TableCell><TableCell>مشتری</TableCell><TableCell>مبلغ قرارداد</TableCell><TableCell>وضعیت</TableCell></TableRow></TableHead>
                            <TableBody>
                                {projects.map(p => (
                                    <TableRow key={p.id} hover sx={{cursor:'pointer'}} onClick={() => navigate(`/project/${p.id}`)}>
                                        <TableCell fontWeight="bold">{p.project_name}</TableCell>
                                        <TableCell>{p.page_username}</TableCell>
                                        <TableCell>{formatPrice(p.contract_amount)} ت</TableCell>
                                        <TableCell>
                                            <Chip label={p.is_started ? 'فعال' : 'متوقف'} color={p.is_started ? 'success' : 'default'} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* --- مودال ثبت هزینه --- */}
            <Dialog open={openExpenseModal} onClose={() => setOpenExpenseModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>ثبت هزینه جاری جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="عنوان هزینه" fullWidth value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} />
                        <TextField label="مبلغ (تومان)" type="number" fullWidth value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                        <FormControl fullWidth>
                            <InputLabel>دسته‌بندی</InputLabel>
                            <Select value={expenseForm.expense_type} label="دسته‌بندی" onChange={e => setExpenseForm({...expenseForm, expense_type: e.target.value})}>
                                <MenuItem value="rent">اجاره دفتر</MenuItem>
                                <MenuItem value="utility">قبوض</MenuItem>
                                <MenuItem value="software">نرم‌افزار/سایت</MenuItem>
                                <MenuItem value="marketing">تبلیغات</MenuItem>
                                <MenuItem value="other">سایر</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="توضیحات" fullWidth multiline rows={2} value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                        <DatePicker label="تاریخ" value={expenseForm.date} onChange={v => setExpenseForm({...expenseForm, date: v})} renderInput={(p) => <TextField {...p} />} />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenExpenseModal(false)}>انصراف</Button><Button onClick={handleCreateExpense} variant="contained">ثبت</Button></DialogActions>
            </Dialog>

            {/* --- مودال ثبت حقوق --- */}
            <Dialog open={openSalaryModal} onClose={() => setOpenSalaryModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>ثبت پرداخت حقوق</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <FormControl fullWidth>
                            <InputLabel>پرسنل</InputLabel>
                            <Select value={salaryForm.personnel} label="پرسنل" onChange={e => setSalaryForm({...salaryForm, personnel: e.target.value})}>
                                {personnelList.map(p => <MenuItem key={p.id} value={p.id}>{p.full_name || p.username} ({p.role})</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField label="مبلغ (تومان)" type="number" fullWidth value={salaryForm.amount} onChange={e => setSalaryForm({...salaryForm, amount: e.target.value})} />
                        <TextField label="بابت (مثلاً حقوق آبان)" fullWidth value={salaryForm.description} onChange={e => setSalaryForm({...salaryForm, description: e.target.value})} />
                        <DatePicker label="تاریخ پرداخت" value={salaryForm.date} onChange={v => setSalaryForm({...salaryForm, date: v})} renderInput={(p) => <TextField {...p} />} />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenSalaryModal(false)}>انصراف</Button><Button onClick={handleCreateSalary} variant="contained">ثبت</Button></DialogActions>
            </Dialog>

        </Box>
    );
}

export default AgencyFinancialsPage;