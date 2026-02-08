// src/components/AutomationPage.jsx
import React, {useEffect, useState} from "react";
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import {
    Add as AddIcon,
    Bolt as BoltIcon,
    Delete as DeleteIcon,
    NextPlan as ActionIcon,
    PlayCircleFilled as TriggerIcon,
} from "@mui/icons-material";
import apiClient from "../api"; // فرض بر وجود کلاینت عمومی
import {useSnackbar} from "notistack";

function AutomationPage() {
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme(); // ✅ استفاده از تم
    const [rules, setRules] = useState([]);
    const [open, setOpen] = useState(false);

    // فرم ساخت قانون جدید
    const [formData, setFormData] = useState({
        name: "", trigger_type: "project_created", action_type: "create_default_tasks", action_data_input: "", // ورودی متن برای دیتا
        is_active: true,
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await apiClient.get("/api/v1/automation-rules/");
            setRules(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        try {
            // تبدیل ورودی متن به فرمت مناسب JSON
            let finalData = {};
            if (formData.action_type === "create_default_tasks") {
                finalData = {tasks: formData.action_data_input}; // در بک‌اند با کاما جدا می‌شود
            } else {
                finalData = {message: formData.action_data_input};
            }

            await apiClient.post("/api/v1/automation-rules/", {
                ...formData, action_data: finalData,
            });
            enqueueSnackbar("قانون جدید ساخته شد", {variant: "success"});
            setOpen(false);
            fetchRules();
        } catch (err) {
            enqueueSnackbar("خطا در ذخیره", {variant: "error"});
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("حذف شود؟")) return;
        try {
            await apiClient.delete(`/api/v1/automation-rules/${id}/`);
            setRules((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleRule = async (rule) => {
        try {
            const newVal = !rule.is_active;
            await apiClient.patch(`/api/v1/automation-rules/${rule.id}/`, {
                is_active: newVal,
            });
            setRules((prev) => prev.map((r) => (r.id === rule.id ? {...r, is_active: newVal} : r)));
        } catch (err) {
            console.error(err);
        }
    };

    // استایل‌های داینامیک فرم
    const inputStyle = {
        "& .MuiInputBase-input": {color: theme.palette.text.primary},
        "& .MuiInputLabel-root": {color: theme.palette.text.secondary},
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.text.primary,
        },
        "& .MuiSelect-select": {color: theme.palette.text.primary},
    };

    return (<Box>
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={4}
        >
            <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                    display: "flex", alignItems: "center", gap: 1, color: theme.palette.text.primary,
                }}
            >
                <BoltIcon sx={{color: theme.palette.warning.main}}/> مرکز اتوماسیون
                هوشمند
            </Typography>
            <Button
                variant="contained"
                startIcon={<AddIcon/>}
                onClick={() => setOpen(true)}
                sx={{
                    bgcolor: "primary.main", fontWeight: "bold", boxShadow: theme.shadows[3],
                }}
            >
                ساخت ربات جدید
            </Button>
        </Stack>

        <Grid container spacing={3}>
            {rules.map((rule) => (<Grid item xs={12} md={6} lg={4} key={rule.id}>
                <Paper
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        position: "relative",
                        overflow: "hidden", // ✅ استایل داینامیک کارت
                        bgcolor: rule.is_active ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.action.disabledBackground, 0.3),
                        border: rule.is_active ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[2],
                        transition: "0.3s",
                        "&:hover": {
                            transform: "translateY(-5px)", boxShadow: theme.shadows[6],
                        },
                    }}
                >
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="start"
                        mb={2}
                    >
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                            {rule.name}
                        </Typography>
                        <FormControlLabel
                            control={<Switch
                                checked={rule.is_active}
                                onChange={() => toggleRule(rule)}
                                color="success"
                                size="small"
                            />}
                            label={rule.is_active ? "فعال" : "خاموش"}
                            sx={{mr: -2, color: "text.secondary"}}
                        />
                    </Box>

                    <Stack spacing={2}>
                        <Box
                            sx={{
                                display: "flex", alignItems: "center", gap: 1.5, color: theme.palette.info.main,
                            }}
                        >
                            <TriggerIcon fontSize="small"/>
                            <Typography variant="body2" color="text.secondary">
                                {rule.trigger_type === "project_created" ? "وقتی پروژه جدید ساخته شد" : "وقتی تسکی تمام شد"}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: "flex", alignItems: "center", gap: 1.5, color: theme.palette.success.main,
                            }}
                        >
                            <ActionIcon fontSize="small"/>
                            <Typography variant="body2" color="text.secondary">
                                {rule.action_type === "create_default_tasks" ? "تسک‌های زیر را بساز:" : "به مشتری پیام بده:"}
                            </Typography>
                        </Box>
                        <Paper
                            sx={{
                                p: 1,
                                bgcolor: alpha(theme.palette.action.hover, 0.1),
                                borderRadius: 2,
                                fontSize: "0.85rem",
                                color: theme.palette.text.primary,
                                border: `1px dashed ${theme.palette.divider}`,
                            }}
                        >
                            {rule.action_type === "create_default_tasks" ? rule.action_data.tasks || rule.action_data_input || "---" : rule.action_data.message || "---"}
                        </Paper>
                    </Stack>

                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(rule.id)}
                        sx={{
                            position: "absolute", bottom: 10, left: 10, opacity: 0.7, "&:hover": {
                                opacity: 1, bgcolor: alpha(theme.palette.error.main, 0.1),
                            },
                        }}
                    >
                        <DeleteIcon fontSize="small"/>
                    </IconButton>
                </Paper>
            </Grid>))}
        </Grid>

        {/* Modal */}
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: theme.palette.background.paper, color: theme.palette.text.primary,
                },
            }}
        >
            <DialogTitle
                sx={{borderBottom: `1px solid ${theme.palette.divider}`}}
            >
                تعریف قانون جدید
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} mt={2}>
                    <TextField
                        label="نام قانون (مثلا: تسک‌های اولیه اینستاگرام)"
                        fullWidth
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        sx={inputStyle}
                    />

                    <TextField
                        select
                        label="اگر..."
                        fullWidth
                        value={formData.trigger_type}
                        onChange={(e) => setFormData({...formData, trigger_type: e.target.value})}
                        sx={inputStyle}
                    >
                        <MenuItem value="project_created">پروژه جدید ساخته شد</MenuItem>
                        <MenuItem value="task_done">تسک انجام شد (Done)</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="آنوقت..."
                        fullWidth
                        value={formData.action_type}
                        onChange={(e) => setFormData({...formData, action_type: e.target.value})}
                        sx={inputStyle}
                    >
                        <MenuItem value="create_default_tasks">
                            تسک‌های پیش‌فرض بساز
                        </MenuItem>
                        <MenuItem value="notify_client">به مشتری اعلان بفرست</MenuItem>
                    </TextField>

                    <TextField
                        label={formData.action_type === "create_default_tasks" ? "لیست تسک‌ها (با '،' جدا کنید)" : "متن پیام"}
                        placeholder={formData.action_type === "create_default_tasks" ? "سناریو، فیلمبرداری، تدوین" : "سلام، تسک {task} در پروژه {project} انجام شد."}
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.action_data_input}
                        onChange={(e) => setFormData({...formData, action_data_input: e.target.value})}
                        helperText={formData.action_type === "notify_client" ? "متغیرهای قابل استفاده: {task}, {project}" : "مثال: سناریو، دکوپاژ، تدوین"}
                        sx={{
                            ...inputStyle, "& .MuiFormHelperText-root": {color: theme.palette.info.main},
                        }}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        size="large"
                        sx={{fontWeight: "bold", py: 1.5}}
                    >
                        ذخیره و فعال‌سازی
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    </Box>);
}

export default AutomationPage;
