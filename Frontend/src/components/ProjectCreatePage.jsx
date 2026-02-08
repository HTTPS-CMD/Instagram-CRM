// src/components/ProjectCreatePage.jsx
import React, {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {createProject, getClients, getUsersByRole} from "../api";
import {
    Alert,
    alpha,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    Input,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
    useTheme
} from "@mui/material";
import {motion} from "framer-motion";
import {
    ArrowBack as ArrowBackIcon,
    Badge as BadgeIcon,
    Group as GroupIcon,
    Instagram as InstaIcon,
    Movie as MovieIcon,
    UploadFile as UploadFileIcon
} from "@mui/icons-material";

import jMoment from 'jalali-moment';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';

function ProjectCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projectType = searchParams.get('type') || 'instagram';
    const isInstagram = projectType === 'instagram';
    const theme = useTheme(); // ✅ استفاده از تم

    // ✅ استیت‌ها (پرسنل به صورت آرایه هستند)
    const [formData, setFormData] = useState({
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
        monthly_post_goal: isInstagram ? 12 : 0,
        project_type: projectType,
        // ✅ آرایه‌ها برای انتخاب چند نفر
        writers: [],
        videographers: [],
        editors: [],
        designers: [],
        social_admins: [],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);

    const [clients, setClients] = useState([]);
    const [writers, setWriters] = useState([]);
    const [videographers, setVideographers] = useState([]);
    const [editors, setEditors] = useState([]);
    const [designers, setDesigners] = useState([]);
    const [socialAdmins, setSocialAdmins] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, writersRes, videoRes, editorsRes, designersRes, socialRes] = await Promise.all([
                    getClients(),
                    getUsersByRole('writer'),
                    getUsersByRole('videographer'),
                    getUsersByRole('editor'),
                    getUsersByRole('designer'),
                    getUsersByRole('social_admin')
                ]);

                // تابع کمکی برای هندل کردن صفحه‌بندی
                const getData = (res) => {
                    if (Array.isArray(res.data)) return res.data;
                    if (res.data && Array.isArray(res.data.results)) return res.data.results;
                    return [];
                };

                setClients(getData(clientsRes));
                setWriters(getData(writersRes));
                setVideographers(getData(videoRes));
                setEditors(getData(editorsRes));
                setDesigners(getData(designersRes));
                setSocialAdmins(getData(socialRes));
            } catch (err) {
                console.error(err);
                setError("خطا در دریافت لیست پرسنل.");
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const {name, value, files} = e.target;
        if (files) {
            setFormData((prev) => ({...prev, [name]: files[0]}));
        } else {
            setFormData((prev) => ({...prev, [name]: value}));
        }
    };

    const handleStartDateChange = (newDate) => setFormData((prev) => ({...prev, start_date: newDate}));
    const handleEndDateChange = (newDate) => setFormData((prev) => ({...prev, end_date: newDate}));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // ✅ اعتبارسنجی اجباری مشتری
        if (!formData.client_user) {
            setLoading(false);
            setError("لطفاً مشتری (صاحب پروژه) را انتخاب کنید.");
            return;
        }

        const dataToSend = new FormData();
        dataToSend.append('project_type', projectType);

        for (const key in formData) {
            const value = formData[key];

            if (value !== null && value !== undefined && value !== "") {
                if (key === 'start_date' || key === 'end_date') {
                    try {
                        if (!jMoment(value).isValid()) throw new Error();
                        dataToSend.append(key, value.locale('en').format('YYYY-MM-DD'));
                    } catch {
                        setLoading(false);
                        setError('فرمت تاریخ صحیح نیست');
                        return;
                    }
                } else if (Array.isArray(value)) {
                    value.forEach(item => {
                        dataToSend.append(key, item);
                    });
                } else {
                    dataToSend.append(key, value);
                }
            }
        }

        try {
            const response = await createProject(dataToSend);
            navigate(`/project/${response.data.id}`);
        } catch (err) {
            console.error(err);
            let msg = "خطا در ایجاد پروژه.";
            if (err.response && err.response.data) {
                // نمایش دقیق خطای سرور
                msg = Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join('\n');
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const getFileName = (fieldName) => formData[fieldName]?.name || "انتخاب نشده";

    // --- استایل‌های داینامیک ---
    const glassCardSx = {
        p: 3, borderRadius: 4, mb: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[4],
        color: theme.palette.text.primary
    };

    const textFieldSx = {
        '& .MuiInputLabel-root': {color: theme.palette.text.secondary},
        '& .MuiInputLabel-root.Mui-focused': {color: theme.palette.primary.main},
        '& .MuiOutlinedInput-root': {
            color: theme.palette.text.primary,
            '& fieldset': {borderColor: theme.palette.divider},
            '&:hover fieldset': {borderColor: theme.palette.text.primary},
            '&.Mui-focused fieldset': {borderColor: theme.palette.primary.main},
        },
        '& .MuiSelect-icon': {color: theme.palette.text.primary}
    };

    const selectMenuSx = {
        textAlign: 'right',
        direction: 'rtl',
        '& .MuiSelect-select': {textAlign: 'right', paddingRight: 2}
    };

    return (
        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
            <Box sx={{width: '100%', maxWidth: '1600px', mx: 'auto'}}>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            {isInstagram ? <InstaIcon fontSize="large" sx={{color: '#E1306C'}}/> :
                                <MovieIcon fontSize="large" sx={{color: theme.palette.warning.main}}/>}
                            <Typography variant="h4" fontWeight="900" sx={{
                                color: theme.palette.text.primary,
                                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }}>
                                {isInstagram ? 'ایجاد پروژه اینستاگرام' : 'ایجاد پروژه تیزر / تکی'}
                            </Typography>
                        </Stack>
                    </Box>
                    <Button variant="outlined"
                            sx={{color: theme.palette.text.primary, borderColor: theme.palette.divider}}
                            startIcon={<ArrowBackIcon/>} onClick={() => navigate("/project/new")}>
                        بازگشت
                    </Button>
                </Stack>

                <form onSubmit={handleSubmit} style={{width: '100%'}}>
                    <Stack spacing={4}>

                        {/* --- کارت ۱: اطلاعات --- */}
                        <Paper sx={glassCardSx}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                                <BadgeIcon color="primary"/>
                                <Typography variant="h6" fontWeight="bold" color="primary">اطلاعات اصلی</Typography>
                            </Stack>
                            <Divider sx={{mb: 3, borderColor: theme.palette.divider}}/>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField sx={textFieldSx} name="project_name" label="نام پروژه"
                                               value={formData.project_name} onChange={handleChange} fullWidth
                                               required/>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth required sx={textFieldSx}>
                                        <InputLabel>مشتری (صاحب پروژه)</InputLabel>
                                        <Select name="client_user" value={formData.client_user} label="مشتری"
                                                onChange={handleChange} disabled={dataLoading} sx={selectMenuSx}>
                                            {clients.map(c => <MenuItem key={c.id} value={c.id} sx={{
                                                direction: 'rtl',
                                                textAlign: 'right'
                                            }}>{c.username} {c.full_name && `(${c.full_name})`}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {isInstagram && (
                                    <>
                                        <Grid item xs={12} md={4}>
                                            <TextField sx={textFieldSx} name="page_username" label="آیدی صفحه (@)"
                                                       value={formData.page_username} onChange={handleChange} fullWidth
                                                       required/>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField sx={textFieldSx} name="page_password_encrypted"
                                                       label="رمز عبور صفحه" type="password"
                                                       value={formData.page_password_encrypted} onChange={handleChange}
                                                       fullWidth required/>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField sx={textFieldSx} name="page_slogan" label="شعار برند"
                                                       value={formData.page_slogan} onChange={handleChange} fullWidth/>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Paper>

                        {/* --- کارت ۲: تیم اجرایی (چند انتخابی) --- */}
                        <Paper sx={glassCardSx}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                                <GroupIcon color="secondary"/>
                                <Typography variant="h6" fontWeight="bold" color="secondary">تیم اجرایی (چند
                                    انتخابی)</Typography>
                            </Stack>
                            <Divider sx={{mb: 3, borderColor: theme.palette.divider}}/>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={textFieldSx}>
                                        <InputLabel>تیم نویسندگان</InputLabel>
                                        <Select
                                            name="writers"
                                            multiple
                                            value={formData.writers}
                                            label="تیم نویسندگان"
                                            onChange={handleChange}
                                            sx={selectMenuSx}
                                            renderValue={(selected) => (
                                                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                                    {selected.map((value) => {
                                                        const u = writers.find(w => w.id === value);
                                                        return <Chip key={value} label={u ? u.username : value}
                                                                     size="small" sx={{
                                                            bgcolor: alpha(theme.palette.action.hover, 0.1),
                                                            color: theme.palette.text.primary
                                                        }}/>;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {writers.map(u => <MenuItem key={u.id} value={u.id} sx={{
                                                direction: 'rtl',
                                                textAlign: 'right'
                                            }}>{u.username}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={textFieldSx}>
                                        <InputLabel>تیم فیلم‌برداری</InputLabel>
                                        <Select name="videographers" multiple value={formData.videographers}
                                                label="تیم فیلم‌برداری" onChange={handleChange} sx={selectMenuSx}
                                                renderValue={(selected) => <Box
                                                    sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                                    {selected.map((value) => {
                                                        const u = videographers.find(w => w.id === value);
                                                        return <Chip key={value} label={u ? u.username : value}
                                                                     size="small" sx={{
                                                            bgcolor: alpha(theme.palette.action.hover, 0.1),
                                                            color: theme.palette.text.primary
                                                        }}/>;
                                                    })}
                                                </Box>
                                                }>
                                            {videographers.map(u => <MenuItem key={u.id} value={u.id} sx={{
                                                direction: 'rtl',
                                                textAlign: 'right'
                                            }}>{u.username}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={textFieldSx}>
                                        <InputLabel>تیم تدوین</InputLabel>
                                        <Select name="editors" multiple value={formData.editors} label="تیم تدوین"
                                                onChange={handleChange} sx={selectMenuSx}
                                                renderValue={(selected) => <Box
                                                    sx={{display: 'flex', gap: 0.5}}>{selected.map(v => <Chip key={v}
                                                                                                              label={editors.find(w => w.id === v)?.username}
                                                                                                              size="small"
                                                                                                              sx={{
                                                                                                                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                                                                                                                  color: theme.palette.text.primary
                                                                                                              }}/>)}</Box>}
                                        >
                                            {editors.map(u => <MenuItem key={u.id}
                                                                        value={u.id}>{u.username}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={textFieldSx}>
                                        <InputLabel>تیم گرافیک</InputLabel>
                                        <Select name="designers" multiple value={formData.designers} label="تیم گرافیک"
                                                onChange={handleChange} sx={selectMenuSx}
                                                renderValue={(selected) => <Box
                                                    sx={{display: 'flex', gap: 0.5}}>{selected.map(v => <Chip key={v}
                                                                                                              label={designers.find(w => w.id === v)?.username}
                                                                                                              size="small"
                                                                                                              sx={{
                                                                                                                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                                                                                                                  color: theme.palette.text.primary
                                                                                                              }}/>)}</Box>}
                                        >
                                            {designers.map(u => <MenuItem key={u.id}
                                                                          value={u.id}>{u.username}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {isInstagram && (
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth sx={textFieldSx}>
                                            <InputLabel>تیم ادمین سوشال</InputLabel>
                                            <Select name="social_admins" multiple value={formData.social_admins}
                                                    label="تیم ادمین سوشال" onChange={handleChange} sx={selectMenuSx}
                                                    renderValue={(selected) => <Box
                                                        sx={{display: 'flex', gap: 0.5}}>{selected.map(v => <Chip
                                                        key={v} label={socialAdmins.find(w => w.id === v)?.username}
                                                        size="small" sx={{
                                                        bgcolor: alpha(theme.palette.action.hover, 0.1),
                                                        color: theme.palette.text.primary
                                                    }}/>)}</Box>}
                                            >
                                                {socialAdmins.map(u => <MenuItem key={u.id}
                                                                                 value={u.id}>{u.username}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>

                        {/* --- کارت ۳: زمان‌بندی --- */}
                        <Paper sx={glassCardSx}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}><DatePicker label="تاریخ شروع" value={formData.start_date}
                                                                      onChange={handleStartDateChange}
                                                                      renderInput={(params) => <TextField {...params}
                                                                                                          fullWidth
                                                                                                          required
                                                                                                          sx={textFieldSx}/>}/></Grid>
                                <Grid item xs={12} md={4}><DatePicker label="تاریخ پایان" value={formData.end_date}
                                                                      onChange={handleEndDateChange}
                                                                      renderInput={(params) => <TextField {...params}
                                                                                                          fullWidth
                                                                                                          required
                                                                                                          sx={textFieldSx}/>}/></Grid>
                                {isInstagram &&
                                    <Grid item xs={12} md={4}><TextField sx={textFieldSx} name="monthly_post_goal"
                                                                         label="تعداد پست ماهانه" type="number"
                                                                         value={formData.monthly_post_goal}
                                                                         onChange={handleChange} fullWidth
                                                                         required/></Grid>}
                            </Grid>
                        </Paper>

                        {/* --- کارت ۴: فایل‌ها --- */}
                        {isInstagram && (
                            <Paper sx={glassCardSx}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}><Button component="label" variant="outlined" fullWidth
                                                                      startIcon={<UploadFileIcon/>} sx={{
                                        color: theme.palette.text.primary,
                                        borderColor: theme.palette.divider,
                                        height: 56
                                    }}>انتخاب لوگو<Input type="file" name="page_logo" inputProps={{accept: "image/*"}}
                                                         onChange={handleChange}
                                                         sx={{display: 'none'}}/></Button><Typography variant="caption"
                                                                                                      color="text.secondary">{getFileName('page_logo')}</Typography></Grid>
                                    <Grid item xs={12} md={4}><Button component="label" variant="outlined" fullWidth
                                                                      startIcon={<UploadFileIcon/>} sx={{
                                        color: theme.palette.text.primary,
                                        borderColor: theme.palette.divider,
                                        height: 56
                                    }}>کاور پست<Input type="file" name="cover_post_asset"
                                                      inputProps={{accept: "image/*"}} onChange={handleChange}
                                                      sx={{display: 'none'}}/></Button><Typography variant="caption"
                                                                                                   color="text.secondary">{getFileName('cover_post_asset')}</Typography></Grid>
                                    <Grid item xs={12} md={4}><Button component="label" variant="outlined" fullWidth
                                                                      startIcon={<UploadFileIcon/>} sx={{
                                        color: theme.palette.text.primary,
                                        borderColor: theme.palette.divider,
                                        height: 56
                                    }}>کاور هایلایت<Input type="file" name="cover_highlight_asset"
                                                          inputProps={{accept: "image/*"}} onChange={handleChange}
                                                          sx={{display: 'none'}}/></Button><Typography variant="caption"
                                                                                                       color="text.secondary">{getFileName('cover_highlight_asset')}</Typography></Grid>
                                    <Grid item xs={12}><TextField sx={textFieldSx} name="page_bio" label="بیوگرافی"
                                                                  value={formData.page_bio} onChange={handleChange}
                                                                  fullWidth multiline rows={3}/></Grid>
                                </Grid>
                            </Paper>
                        )}

                        <Box sx={{mt: 2, mb: 10}}>
                            <Button type="submit" variant="contained" color="primary" size="large" fullWidth
                                    disabled={loading} sx={{bgcolor: 'primary.main', fontWeight: 'bold', height: 50}}>
                                {loading ? <CircularProgress size={26} color="inherit"/> : "ایجاد پروژه"}
                            </Button>
                            {error && <Alert severity="error" sx={{mt: 2, whiteSpace: 'pre-line'}}>{error}</Alert>}
                        </Box>
                    </Stack>
                </form>
            </Box>
        </motion.div>
    );
}

export default ProjectCreatePage;