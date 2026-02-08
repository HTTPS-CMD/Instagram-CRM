// src/components/AgencyFinancialsPage.jsx
import React, {useContext, useEffect, useState} from "react";
import {
    alpha,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import {
    Add as AddIcon,
    AttachMoney as MoneyIcon,
    Business as BusinessIcon,
    Delete as DeleteIcon,
    MoneyOff as ExpenseIcon,
    Person as PersonIcon,
    ReceiptLong as ContractIcon,
    TrendingUp as ProfitIcon,
} from "@mui/icons-material";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import moment from "jalali-moment";
import {useSnackbar} from "notistack";
import {
    createGeneralExpense,
    createSalary,
    deleteGeneralExpense,
    deleteSalary,
    getDashboardStats,
    getGeneralExpenses,
    getProjects,
    getSalaries,
    getUsers,
} from "../api";
import {UserContext} from "../App";
import {useNavigate} from "react-router-dom";

const formatPrice = (price) => Number(price).toLocaleString("fa-IR");

function AgencyFinancialsPage() {
    const {user} = useContext(UserContext);
    const navigate = useNavigate();
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم

    // ریدایرکت اگر ادمین نیست
    useEffect(() => {
        if (user && user.role !== "admin") {
            navigate("/dashboard");
        }
    }, [user]);

    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [salaries, setSalaries] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [projects, setProjects] = useState([]);
    const [personnelList, setPersonnelList] = useState([]);
    const [stats, setStats] = useState(null);

    // مودال‌ها
    const [openSalaryModal, setOpenSalaryModal] = useState(false);
    const [openExpenseModal, setOpenExpenseModal] = useState(false);

    // فرم‌ها
    const [salaryForm, setSalaryForm] = useState({
        personnel: "", amount: "", date: moment(), description: "",
    });
    const [expenseForm, setExpenseForm] = useState({
        title: "", amount: "", expense_type: "other", date: moment(), description: "",
    });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [salRes, expRes, projRes, userRes, statsRes] = await Promise.all([getSalaries(), getGeneralExpenses(), getProjects(), getUsers(), getDashboardStats(),]);

            setSalaries(salRes.data);
            setExpenses(expRes.data);
            setProjects(projRes.data);

            const usersData = Array.isArray(userRes.data) ? userRes.data : userRes.data.results || [];
            setPersonnelList(usersData.filter((u) => u.role !== "client"));

            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
            enqueueSnackbar("خطا در دریافت اطلاعات مالی", {variant: "error"});
        } finally {
            setLoading(false);
        }
    };

    // --- هندلرها ---
    const handleCreateSalary = async () => {
        if (!salaryForm.personnel || !salaryForm.amount) {
            enqueueSnackbar("لطفاً پرسنل و مبلغ را مشخص کنید.", {
                variant: "warning",
            });
            return;
        }
        setActionLoading(true);
        try {
            const data = {
                personnel: salaryForm.personnel,
                amount: salaryForm.amount,
                description: salaryForm.description,
                payment_date: salaryForm.date.locale("en").format("YYYY-MM-DD"),
            };
            await createSalary(data);
            enqueueSnackbar("حقوق با موفقیت ثبت شد", {variant: "success"});
            setOpenSalaryModal(false);
            fetchData();
            setSalaryForm({
                personnel: "", amount: "", date: moment(), description: "",
            });
        } catch (err) {
            enqueueSnackbar("خطا در ثبت حقوق", {variant: "error"});
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSalary = async (id) => {
        if (window.confirm("آیا از حذف این رکورد مطمئن هستید؟")) {
            try {
                await deleteSalary(id);
                fetchData();
                enqueueSnackbar("رکورد حذف شد", {variant: "success"});
            } catch (e) {
                enqueueSnackbar("خطا در حذف", {variant: "error"});
            }
        }
    };

    const handleCreateExpense = async () => {
        setActionLoading(true);
        try {
            const data = {
                ...expenseForm, date: expenseForm.date.locale("en").format("YYYY-MM-DD"),
            };
            await createGeneralExpense(data);
            enqueueSnackbar("هزینه ثبت شد", {variant: "success"});
            setOpenExpenseModal(false);
            fetchData();
            setExpenseForm({
                title: "", amount: "", expense_type: "other", date: moment(), description: "",
            });
        } catch (err) {
            enqueueSnackbar("خطا در ثبت هزینه", {variant: "error"});
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm("آیا از حذف این هزینه مطمئن هستید؟")) {
            try {
                await deleteGeneralExpense(id);
                fetchData();
                enqueueSnackbar("هزینه حذف شد", {variant: "success"});
            } catch (e) {
                enqueueSnackbar("خطا در حذف", {variant: "error"});
            }
        }
    };

    // محاسبات آماری
    const totalIncome = stats?.financial_stats?.find((s) => s.name === "درآمد")?.amount || 0;
    const totalProjectExpenses = stats?.financial_stats?.find((s) => s.name === "هزینه")?.amount || 0;
    const totalSalaries = salaries.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalGeneralExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalAgencyExpenses = totalProjectExpenses + totalSalaries + totalGeneralExpenses;
    const netAgencyProfit = totalIncome - totalAgencyExpenses;

    // --- استایل‌های داینامیک ---
    const glassCardSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: "blur(12px)",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4],
    };

    const tableHeadSx = {
        "& th": {
            bgcolor: alpha(theme.palette.action.hover, 0.1),
            color: theme.palette.text.secondary,
            fontWeight: "bold",
            borderBottom: `1px solid ${theme.palette.divider}`,
        },
    };

    const tableBodySx = {
        "& td": {
            color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`,
        }, "& tr:hover": {bgcolor: alpha(theme.palette.action.hover, 0.1)},
    };

    const textFieldSx = {
        "& .MuiInputLabel-root": {color: theme.palette.text.secondary},
        "& .MuiInputLabel-root.Mui-focused": {color: theme.palette.primary.main},
        "& .MuiOutlinedInput-root": {
            color: theme.palette.text.primary,
            "& fieldset": {borderColor: theme.palette.divider},
            "&:hover fieldset": {borderColor: theme.palette.text.primary},
            "&.Mui-focused fieldset": {borderColor: theme.palette.primary.main},
        },
        "& .MuiSelect-icon": {color: theme.palette.text.primary},
    };

    // کارت‌های آماری با رنگ‌های داینامیک
    const statCardStyle = (colorMain) => ({
        ...glassCardSx,
        p: 3,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${alpha(colorMain, 0.15)} 0%, ${alpha(colorMain, 0.05)} 100%)`,
        border: `1px solid ${alpha(colorMain, 0.3)}`,
    });

    if (loading) return (<Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress/>
    </Box>);

    return (<Box sx={{width: "100%", maxWidth: "1600px", mx: "auto"}}>
        <Typography
            variant="h4"
            fontWeight="900"
            mb={4}
            sx={{
                color: theme.palette.text.primary, textShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
        >
            امور مالی آژانس
        </Typography>

        {/* --- کارت‌های آماری --- */}
        <Grid container spacing={3} mb={5}>
            <Grid item xs={12} md={4}>
                <Paper sx={statCardStyle(theme.palette.success.main)}>
                    <Box
                        sx={{position: "absolute", right: -20, top: -20, opacity: 0.1}}
                    >
                        <MoneyIcon
                            sx={{fontSize: 150, color: theme.palette.success.main}}
                        />
                    </Box>
                    <Typography
                        variant="subtitle1"
                        color="success.main"
                        fontWeight="bold"
                    >
                        درآمد کل
                    </Typography>
                    <Typography
                        variant="h4"
                        fontWeight="900"
                        mt={2}
                        sx={{letterSpacing: -1, color: theme.palette.text.primary}}
                    >
                        {formatPrice(totalIncome)}{" "}
                        <span style={{fontSize: "1rem", opacity: 0.7}}>تومان</span>
                    </Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
                <Paper sx={statCardStyle(theme.palette.error.main)}>
                    <Box
                        sx={{position: "absolute", right: -20, top: -20, opacity: 0.1}}
                    >
                        <ExpenseIcon
                            sx={{fontSize: 150, color: theme.palette.error.main}}
                        />
                    </Box>
                    <Typography
                        variant="subtitle1"
                        color="error.main"
                        fontWeight="bold"
                    >
                        هزینه‌های کل
                    </Typography>
                    <Typography
                        variant="h4"
                        fontWeight="900"
                        mt={2}
                        sx={{letterSpacing: -1, color: theme.palette.text.primary}}
                    >
                        {formatPrice(totalAgencyExpenses)}{" "}
                        <span style={{fontSize: "1rem", opacity: 0.7}}>تومان</span>
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.6, display: "block", mt: 1, color: theme.palette.text.secondary,
                        }}
                    >
                        شامل حقوق، جاری و پروژه‌ها
                    </Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
                <Paper sx={statCardStyle(theme.palette.warning.main)}>
                    <Box
                        sx={{position: "absolute", right: -20, top: -20, opacity: 0.1}}
                    >
                        <ProfitIcon
                            sx={{fontSize: 150, color: theme.palette.warning.main}}
                        />
                    </Box>
                    <Typography
                        variant="subtitle1"
                        color="warning.main"
                        fontWeight="bold"
                    >
                        سود خالص
                    </Typography>
                    <Typography
                        variant="h4"
                        fontWeight="900"
                        mt={2}
                        sx={{letterSpacing: -1, color: theme.palette.text.primary}}
                    >
                        {formatPrice(netAgencyProfit)}{" "}
                        <span style={{fontSize: "1rem", opacity: 0.7}}>تومان</span>
                    </Typography>
                </Paper>
            </Grid>
        </Grid>

        {/* --- تب‌ها --- */}
        <Stack direction="row" spacing={2} mb={3}>
            {[{
                label: "هزینه‌های جاری", icon: <BusinessIcon/>, id: 0, color: theme.palette.error.main,
            }, {
                label: "حقوق پرسنل", icon: <PersonIcon/>, id: 1, color: theme.palette.warning.main,
            }, {
                label: "قراردادها", icon: <ContractIcon/>, id: 2, color: theme.palette.info.main,
            },].map((tab) => (<Button
                key={tab.id}
                variant={tabIndex === tab.id ? "contained" : "outlined"}
                onClick={() => setTabIndex(tab.id)}
                startIcon={tab.icon}
                sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    bgcolor: tabIndex === tab.id ? tab.color : "transparent",
                    color: tabIndex === tab.id ? "#fff" : theme.palette.text.secondary,
                    borderColor: tabIndex === tab.id ? tab.color : theme.palette.divider,
                    "&:hover": {
                        bgcolor: tabIndex === tab.id ? tab.color : alpha(tab.color, 0.1), borderColor: tab.color,
                    },
                }}
            >
                {tab.label}
            </Button>))}
        </Stack>

        {/* --- محتوای تب‌ها --- */}
        <Paper sx={{...glassCardSx, p: 0, overflow: "hidden", minHeight: 400}}>
            {/* تب ۱: هزینه‌های جاری */}
            {tabIndex === 0 && (<Box>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    p={3}
                    borderBottom={`1px solid ${theme.palette.divider}`}
                >
                    <Typography variant="h6" fontWeight="bold">
                        لیست هزینه‌های جاری
                    </Typography>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<AddIcon/>}
                        onClick={() => setOpenExpenseModal(true)}
                        sx={{fontWeight: "bold"}}
                    >
                        ثبت هزینه جدید
                    </Button>
                </Stack>
                <TableContainer sx={{maxHeight: 500}}>
                    <Table stickyHeader>
                        <TableHead sx={tableHeadSx}>
                            <TableRow>
                                <TableCell>عنوان</TableCell>
                                <TableCell>نوع</TableCell>
                                <TableCell>مبلغ</TableCell>
                                <TableCell>تاریخ</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={tableBodySx}>
                            {expenses.map((e) => (<TableRow key={e.id}>
                                <TableCell>{e.title}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={e.expense_type}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(theme.palette.action.active, 0.1),
                                            color: theme.palette.text.primary,
                                        }}
                                    />
                                </TableCell>
                                <TableCell
                                    fontWeight="bold"
                                    sx={{color: theme.palette.error.main}}
                                >
                                    {formatPrice(e.amount)}
                                </TableCell>
                                <TableCell>
                                    {moment(e.date).locale("fa").format("jD jMMMM jYYYY")}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        sx={{color: theme.palette.error.main}}
                                        onClick={() => handleDeleteExpense(e.id)}
                                    >
                                        <DeleteIcon/>
                                    </IconButton>
                                </TableCell>
                            </TableRow>))}
                            {expenses.length === 0 && (<TableRow>
                                <TableCell
                                    colSpan={5}
                                    align="center"
                                    sx={{py: 5, opacity: 0.5}}
                                >
                                    هیچ هزینه‌ای ثبت نشده است.
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>)}

            {/* تب ۲: حقوق پرسنل */}
            {tabIndex === 1 && (<Box>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    p={3}
                    borderBottom={`1px solid ${theme.palette.divider}`}
                >
                    <Typography variant="h6" fontWeight="bold">
                        لیست پرداختی حقوق
                    </Typography>
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<AddIcon/>}
                        onClick={() => setOpenSalaryModal(true)}
                        sx={{fontWeight: "bold"}}
                    >
                        ثبت حقوق جدید
                    </Button>
                </Stack>
                <TableContainer sx={{maxHeight: 500}}>
                    <Table stickyHeader>
                        <TableHead sx={tableHeadSx}>
                            <TableRow>
                                <TableCell>نام پرسنل</TableCell>
                                <TableCell>مبلغ</TableCell>
                                <TableCell>بابت</TableCell>
                                <TableCell>تاریخ پرداخت</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={tableBodySx}>
                            {salaries.map((s) => (<TableRow key={s.id}>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Avatar
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                bgcolor: alpha(theme.palette.action.active, 0.1),
                                                color: theme.palette.text.primary,
                                            }}
                                        >
                                            P
                                        </Avatar>
                                        <Typography>
                                            {s.personnel_name || s.personnel_username}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell
                                    fontWeight="bold"
                                    sx={{color: theme.palette.warning.main}}
                                >
                                    {formatPrice(s.amount)}
                                </TableCell>
                                <TableCell sx={{opacity: 0.7}}>
                                    {s.description}
                                </TableCell>
                                <TableCell>
                                    {moment(s.payment_date)
                                        .locale("fa")
                                        .format("jD jMMMM jYYYY")}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        sx={{color: theme.palette.error.main}}
                                        onClick={() => handleDeleteSalary(s.id)}
                                    >
                                        <DeleteIcon/>
                                    </IconButton>
                                </TableCell>
                            </TableRow>))}
                            {salaries.length === 0 && (<TableRow>
                                <TableCell
                                    colSpan={5}
                                    align="center"
                                    sx={{py: 5, opacity: 0.5}}
                                >
                                    هیچ پرداختی ثبت نشده است.
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>)}

            {/* تب ۳: قراردادها */}
            {tabIndex === 2 && (<Box>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    p={3}
                    borderBottom={`1px solid ${theme.palette.divider}`}
                >
                    <Typography variant="h6" fontWeight="bold">
                        وضعیت مالی پروژه‌ها
                    </Typography>
                </Stack>
                <TableContainer sx={{maxHeight: 500}}>
                    <Table stickyHeader>
                        <TableHead sx={tableHeadSx}>
                            <TableRow>
                                <TableCell>نام پروژه</TableCell>
                                <TableCell>مشتری</TableCell>
                                <TableCell>مبلغ قرارداد</TableCell>
                                <TableCell>وضعیت</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={tableBodySx}>
                            {projects.map((p) => (<TableRow
                                key={p.id}
                                hover
                                sx={{
                                    cursor: "pointer", "&:hover": {
                                        bgcolor: alpha(theme.palette.action.hover, 0.1),
                                    },
                                }}
                            >
                                <TableCell fontWeight="bold">{p.project_name}</TableCell>
                                <TableCell sx={{opacity: 0.7}}>
                                    {p.page_username}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: theme.palette.success.main, fontWeight: "bold",
                                    }}
                                >
                                    {formatPrice(p.contract_amount)} ت
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={p.is_started ? "فعال" : "متوقف"}
                                        sx={{
                                            bgcolor: p.is_started ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.action.disabled, 0.1),
                                            color: p.is_started ? theme.palette.success.main : theme.palette.text.disabled,
                                        }}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            color: theme.palette.text.secondary, borderColor: theme.palette.divider,
                                        }}
                                        onClick={() => navigate(`/project/${p.id}`)}
                                    >
                                        مدیریت
                                    </Button>
                                </TableCell>
                            </TableRow>))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>)}
        </Paper>

        {/* --- مودال ثبت هزینه --- */}
        <Dialog
            open={openExpenseModal}
            onClose={() => setOpenExpenseModal(false)}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                },
            }}
        >
            <DialogTitle>ثبت هزینه جاری جدید</DialogTitle>
            <DialogContent>
                <Stack spacing={3} mt={1}>
                    <TextField
                        sx={textFieldSx}
                        label="عنوان هزینه"
                        fullWidth
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                    />
                    <TextField
                        sx={textFieldSx}
                        label="مبلغ (تومان)"
                        type="number"
                        fullWidth
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    />
                    <TextField
                        sx={textFieldSx}
                        select
                        fullWidth
                        label="دسته‌بندی"
                        value={expenseForm.expense_type}
                        onChange={(e) => setExpenseForm({...expenseForm, expense_type: e.target.value})}
                    >
                        <MenuItem value="rent">اجاره دفتر</MenuItem>
                        <MenuItem value="utility">قبوض</MenuItem>
                        <MenuItem value="software">نرم‌افزار/سایت</MenuItem>
                        <MenuItem value="marketing">تبلیغات</MenuItem>
                        <MenuItem value="other">سایر</MenuItem>
                    </TextField>
                    <TextField
                        sx={textFieldSx}
                        label="توضیحات"
                        fullWidth
                        multiline
                        rows={2}
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    />
                    <DatePicker
                        label="تاریخ"
                        value={expenseForm.date}
                        onChange={(v) => setExpenseForm({...expenseForm, date: v})}
                        renderInput={(p) => (<TextField {...p} sx={textFieldSx} fullWidth/>)}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{p: 3}}>
                <Button onClick={() => setOpenExpenseModal(false)} color="inherit">
                    انصراف
                </Button>
                <Button
                    onClick={handleCreateExpense}
                    variant="contained"
                    color="error"
                >
                    ثبت هزینه
                </Button>
            </DialogActions>
        </Dialog>

        {/* --- مودال ثبت حقوق --- */}
        <Dialog
            open={openSalaryModal}
            onClose={() => setOpenSalaryModal(false)}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                },
            }}
        >
            <DialogTitle>ثبت پرداخت حقوق</DialogTitle>
            <DialogContent>
                <Stack spacing={3} mt={1}>
                    <TextField
                        sx={textFieldSx}
                        select
                        fullWidth
                        label="پرسنل"
                        value={salaryForm.personnel}
                        onChange={(e) => setSalaryForm({...salaryForm, personnel: e.target.value})}
                    >
                        {personnelList.map((p) => (<MenuItem key={p.id} value={p.id}>
                            {p.full_name || p.username} ({p.role})
                        </MenuItem>))}
                    </TextField>
                    <TextField
                        sx={textFieldSx}
                        label="مبلغ (تومان)"
                        type="number"
                        fullWidth
                        value={salaryForm.amount}
                        onChange={(e) => setSalaryForm({...salaryForm, amount: e.target.value})}
                    />
                    <TextField
                        sx={textFieldSx}
                        label="بابت (مثلاً حقوق آبان)"
                        fullWidth
                        value={salaryForm.description}
                        onChange={(e) => setSalaryForm({...salaryForm, description: e.target.value})}
                    />
                    <DatePicker
                        label="تاریخ پرداخت"
                        value={salaryForm.date}
                        onChange={(v) => setSalaryForm({...salaryForm, date: v})}
                        renderInput={(p) => (<TextField {...p} sx={textFieldSx} fullWidth/>)}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{p: 3}}>
                <Button onClick={() => setOpenSalaryModal(false)} color="inherit">
                    انصراف
                </Button>
                <Button
                    onClick={handleCreateSalary}
                    variant="contained"
                    color="warning"
                >
                    ثبت پرداخت
                </Button>
            </DialogActions>
        </Dialog>
    </Box>);
}

export default AgencyFinancialsPage;
