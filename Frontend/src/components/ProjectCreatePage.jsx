// src/components/ProjectCreatePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createProject, getClients, getUsersByRole } from "../api";
import {
  Box, Typography, Paper, Grid, TextField, Button,
  CircularProgress, Alert, Stack, InputLabel, Input,
  MenuItem, FormControl, Select, Divider
} from "@mui/material";
import { motion } from "framer-motion";
import {
    ArrowBack as ArrowBackIcon,
    UploadFile as UploadFileIcon,
    Add as AddIcon,
    Badge as BadgeIcon,
    Group as GroupIcon,
    AccessTime as TimeIcon,
    PermMedia as MediaIcon
} from "@mui/icons-material";

import jMoment from 'jalali-moment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const initialFormData = {
  project_name: "",
  client_user: "",
  start_date: null,
  end_date: null,
  page_username: "",
  page_password_encrypted: "",
  page_slogan: "",
  page_bio: "",
  page_logo: null,
  cover_post_asset: null,
  cover_highlight_asset: null,
  monthly_post_goal: 12,
  writer_user: "",
  videographer_user: "",
  editor_user: "",
  designer_user: "",
  social_admin_user: "",
};

// کامپوننت اختصاصی سلکت
const HoverSelect = ({ children, ...props }) => {
    const [open, setOpen] = useState(false);
    return (
        <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <Select
                {...props}
                open={open}
                onClose={() => setOpen(false)}
                onOpen={() => setOpen(true)}
                sx={{
                    textAlign: 'right',
                    direction: 'rtl',
                    '& .MuiSelect-select': { textAlign: 'right', paddingRight: 2 },
                    ...props.sx
                }}
            >
                {children}
            </Select>
        </div>
    );
};

function ProjectCreatePage() {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // استیت‌های لیست‌ها
  const [clients, setClients] = useState([]);
  const [writers, setWriters] = useState([]);
  const [videographers, setVideographers] = useState([]);
  const [editors, setEditors] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [socialAdmins, setSocialAdmins] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // دریافت همزمان همه داده‌ها
        const [clientsRes, writersRes, videoRes, editorsRes, designersRes, socialRes] = await Promise.all([
            getClients(),
            getUsersByRole('writer'),
            getUsersByRole('videographer'),
            getUsersByRole('editor'),
            getUsersByRole('designer'),
            getUsersByRole('social_admin')
        ]);

        // ✅✅✅ تابع کمکی برای استخراج آرایه از پاسخ (چه صفحه‌بندی باشد چه نباشد)
        const getData = (res) => Array.isArray(res.data) ? res.data : (res.data.results || []);

        setClients(getData(clientsRes));
        setWriters(getData(writersRes));
        setVideographers(getData(videoRes));
        setEditors(getData(editorsRes));
        setDesigners(getData(designersRes));
        setSocialAdmins(getData(socialRes));

      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("خطا در دریافت لیست پرسنل یا مشتریان.");
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStartDateChange = (newDate) => {
    setFormData((prev) => ({ ...prev, start_date: newDate }));
  };
  const handleEndDateChange = (newDate) => {
    setFormData((prev) => ({ ...prev, end_date: newDate }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dataToSend = new FormData();
    for (const key in formData) {
        const value = formData[key];
        // فقط مقادیر پر شده را بفرست (تا از ارور 500 جلوگیری شود)
        if (value !== null && value !== "" && value !== undefined) {
          if (key === 'start_date' || key === 'end_date') {
            try {
                if (!jMoment(value).isValid()) throw new Error('فرمت تاریخ صحیح نیست.');
                const gregorianDate = value.locale('en').format('YYYY-MM-DD');
                dataToSend.append(key, gregorianDate);
            } catch (error) {
                setLoading(false);
                setError(error.message);
                return;
            }
          } else {
            dataToSend.append(key, value);
          }
        }
    }

    try {
      const response = await createProject(dataToSend);
      navigate(`/project/${response.data.id}`);
    } catch (err) {
      console.error("Create failed", err);
      let msg = "خطا در ایجاد پروژه.";
      if(err.response && err.response.data) {
          // نمایش جزئیات خطا
          msg = Object.entries(err.response.data).map(([k,v]) => `${k}: ${v}`).join('\n');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getFileName = (fieldName) => {
    return formData[fieldName] && formData[fieldName].name ? formData[fieldName].name : "انتخاب نشده";
  };

  // استایل مشترک برای اینپوت‌های متنی
  const rtlInputProps = {
      style: { textAlign: 'right', direction: 'rtl' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
       <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
                <Typography variant="h4" fontWeight="bold">ایجاد پروژه جدید</Typography>
                <Typography variant="body1" color="text.secondary" mt={1}>
                    برای شروع، اطلاعات پروژه را وارد کنید.
                </Typography>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/dashboard")}
              sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
            >
              بازگشت
            </Button>
       </Stack>

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <Stack spacing={4} sx={{ width: '100%' }}>

            {/* --- کارت ۱: اطلاعات هویتی --- */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <BadgeIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold" color="primary">اطلاعات هویتی و دسترسی</Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3} sx={{ width: '100%' }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            name="project_name"
                            label="نام پروژه (فارسی)"
                            value={formData.project_name}
                            onChange={handleChange}
                            fullWidth
                            required
                            placeholder="مثلاً: اینستاگرام فروشگاه ..."
                            inputProps={rtlInputProps}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required sx={{ minWidth: '100%' }}>
                        <InputLabel>مشتری (صاحب پروژه)</InputLabel>
                        <HoverSelect
                            name="client_user"
                            value={formData.client_user}
                            label="مشتری (صاحب پروژه)"
                            onChange={handleChange}
                            disabled={dataLoading}
                            sx={{ paddingLeft: '150px' }}
                        >
                            {dataLoading ? <MenuItem disabled>درحال بارگذاری...</MenuItem> :
                            clients.map(c => <MenuItem key={c.id} value={c.id} sx={{direction: 'rtl', textAlign:'right'}}>{c.username} {c.full_name && `(${c.full_name})`}</MenuItem>)
                            }
                        </HoverSelect>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <TextField
                            name="page_username"
                            label="آیدی صفحه (@)"
                            value={formData.page_username}
                            onChange={handleChange}
                            fullWidth
                            required
                            inputProps={rtlInputProps}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            name="page_password_encrypted"
                            label="رمز عبور صفحه"
                            type="password"
                            value={formData.page_password_encrypted}
                            onChange={handleChange}
                            fullWidth
                            required
                            inputProps={rtlInputProps}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            name="page_slogan"
                            label="شعار برند (اختیاری)"
                            value={formData.page_slogan}
                            onChange={handleChange}
                            fullWidth
                            inputProps={rtlInputProps}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* --- کارت ۲: تیم اجرایی (پرسنل) --- */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <GroupIcon color="secondary" />
                    <Typography variant="h6" fontWeight="bold" color="secondary">تیم اجرایی (پرسنل)</Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3} sx={{ width: '100%' }}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ minWidth: '100%' }}>
                        <InputLabel>سناریو نویس</InputLabel>
                        <HoverSelect
                            name="writer_user"
                            value={formData.writer_user}
                            label="سناریو نویس"
                            onChange={handleChange}
                            sx={{ paddingLeft: '150px' }}
                        >
                            <MenuItem value=""><em>انتخاب نشده</em></MenuItem>
                            {writers.map(u => <MenuItem key={u.id} value={u.id} sx={{direction: 'rtl', textAlign:'right'}}>{u.username} ({u.full_name})</MenuItem>)}
                        </HoverSelect>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ minWidth: '100%' }}>
                        <InputLabel>فیلم‌بردار</InputLabel>
                        <HoverSelect
                            name="videographer_user"
                            value={formData.videographer_user}
                            label="فیلم‌بردار"
                            onChange={handleChange}
                            sx={{ paddingLeft: '150px' }}
                        >
                            <MenuItem value=""><em>انتخاب نشده</em></MenuItem>
                            {videographers.map(u => <MenuItem key={u.id} value={u.id} sx={{direction: 'rtl', textAlign:'right'}}>{u.username} ({u.full_name})</MenuItem>)}
                        </HoverSelect>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ minWidth: '100%' }}>
                        <InputLabel>تدوین‌گر</InputLabel>
                        <HoverSelect
                            name="editor_user"
                            value={formData.editor_user}
                            label="تدوین‌گر"
                            onChange={handleChange}
                            sx={{ paddingLeft: '150px' }}
                        >
                            <MenuItem value=""><em>انتخاب نشده</em></MenuItem>
                            {editors.map(u => <MenuItem key={u.id} value={u.id} sx={{direction: 'rtl', textAlign:'right'}}>{u.username} ({u.full_name})</MenuItem>)}
                        </HoverSelect>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ minWidth: '100%' }}>
                        <InputLabel>گرافیست (UI/UX)</InputLabel>
                        <HoverSelect
                            name="designer_user"
                            value={formData.designer_user}
                            label="گرافیست (UI/UX)"
                            onChange={handleChange}
                            sx={{ paddingLeft: '150px' }}
                        >
                            <MenuItem value=""><em>انتخاب نشده</em></MenuItem>
                            {designers.map(u => <MenuItem key={u.id} value={u.id} sx={{direction: 'rtl', textAlign:'right'}}>{u.username} ({u.full_name})</MenuItem>)}
                        </HoverSelect>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ minWidth: '100%' }}>
                        <InputLabel>ادمین سوشال</InputLabel>
                        <HoverSelect
                            name="social_admin_user"
                            value={formData.social_admin_user}
                            label="ادمین سوشال"
                            onChange={handleChange}
                            sx={{ paddingLeft: '150px' }}
                        >
                            <MenuItem value=""><em>انتخاب نشده</em></MenuItem>
                            {socialAdmins.map(u => <MenuItem key={u.id} value={u.id} sx={{direction: 'rtl', textAlign:'right'}}>{u.username} ({u.full_name})</MenuItem>)}
                        </HoverSelect>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- کارت ۳: زمان‌بندی --- */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <TimeIcon color="info" />
                    <Typography variant="h6" fontWeight="bold" color="info.main">زمان‌بندی و تعهدات</Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3} sx={{ width: '100%' }}>
                    <Grid item xs={12} md={4}>
                        <DatePicker
                        label="تاریخ شروع قرارداد"
                        value={formData.start_date}
                        onChange={handleStartDateChange}
                        renderInput={(params) => <TextField {...params} fullWidth required inputProps={rtlInputProps} />}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <DatePicker
                        label="تاریخ پایان قرارداد"
                        value={formData.end_date}
                        onChange={handleEndDateChange}
                        renderInput={(params) => <TextField {...params} fullWidth required inputProps={rtlInputProps} />}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                        name="monthly_post_goal"
                        label="تعداد پست (ماهانه)"
                        type="number"
                        value={formData.monthly_post_goal}
                        onChange={handleChange}
                        fullWidth
                        required
                        inputProps={rtlInputProps}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* --- کارت ۴: فایل‌ها --- */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <MediaIcon color="warning" />
                    <Typography variant="h6" fontWeight="bold" color="warning.main">فایل‌های گرافیکی اولیه</Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3} sx={{ width: '100%' }}>
                    <Grid item xs={12} md={4}>
                        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth sx={{height: 56, borderStyle: 'dashed'}}>
                            انتخاب لوگو
                            <Input type="file" name="page_logo" inputProps={{ accept: "image/*" }} onChange={handleChange} sx={{ display: 'none' }} />
                        </Button>
                        <Typography variant="caption" display="block" mt={1} align="center" color="text.secondary">
                            {getFileName('page_logo')}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth sx={{height: 56, borderStyle: 'dashed'}}>
                            انتخاب کاور پست
                            <Input type="file" name="cover_post_asset" inputProps={{ accept: "image/*" }} onChange={handleChange} sx={{ display: 'none' }} />
                        </Button>
                        <Typography variant="caption" display="block" mt={1} align="center" color="text.secondary">
                            {getFileName('cover_post_asset')}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth sx={{height: 56, borderStyle: 'dashed'}}>
                            انتخاب کاور هایلایت
                            <Input type="file" name="cover_highlight_asset" inputProps={{ accept: "image/*" }} onChange={handleChange} sx={{ display: 'none' }} />
                        </Button>
                        <Typography variant="caption" display="block" mt={1} align="center" color="text.secondary">
                            {getFileName('cover_highlight_asset')}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            name="page_bio"
                            label="بیوگرافی صفحه (اختیاری)"
                            value={formData.page_bio}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="متن بایو اینستاگرام..."
                            inputProps={rtlInputProps}
                            />
                    </Grid>
                </Grid>
            </Paper>

            {/* --- دکمه ثبت --- */}
            <Box sx={{ mt: 2, mb: 10 }}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<AddIcon />}
                    disabled={loading}
                    fullWidth
                    sx={{ py: 1.5, fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', borderRadius: 2 }}
                >
                    {loading ? <CircularProgress size={26} color="inherit" /> : "ایجاد پروژه جدید"}
                </Button>

                {error && (
                    <Alert severity="error" sx={{ mt: 2, whiteSpace: 'pre-line' }}>{error}</Alert>
                )}
            </Box>

        </Stack>
      </form>
    </motion.div>
  );
}

export default ProjectCreatePage;