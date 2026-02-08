// src/components/ProjectsPage.jsx
import React, {useEffect, useState} from 'react';
import {
    alpha,
    Avatar,
    AvatarGroup,
    Box,
    Button,
    Chip,
    CircularProgress,
    Fade,
    Grid,
    IconButton,
    InputAdornment,
    LinearProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme
} from '@mui/material';
import {
    AccessTime as ActiveIcon,
    Add as AddIcon,
    ArrowForward as ArrowIcon,
    CheckCircle as DoneIcon,
    FolderOpen as ProjectIcon,
    GridView as GridViewIcon,
    List as ListViewIcon,
    Search as SearchIcon,
    TrendingUp as RevenueIcon
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {getProjects} from '../api';
import moment from 'jalali-moment';

function ProjectsPage() {
    const navigate = useNavigate();
    const theme = useTheme(); // ✅ استفاده از تم
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            setProjects(res.data);
        } catch (err) {
            console.error("Error fetching projects:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- محاسبات آمار ---
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.is_started).length;
    const completedProjects = projects.filter(p => !p.is_started).length;
    const totalRevenue = projects.reduce((sum, p) => sum + (Number(p.contract_amount) || 0), 0);

    // --- فیلتر کردن ---
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.page_username && p.page_username.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'active' ? p.is_started
                : !p.is_started;

        return matchesSearch && matchesStatus;
    });

    const formatPrice = (p) => Number(p).toLocaleString('fa-IR');

    // استایل کارت‌های آمار (داینامیک)
    const StatCard = ({title, value, icon, color, subtitle}) => (
        <Paper sx={{
            p: 3, borderRadius: 4, position: 'relative', overflow: 'hidden',
            bgcolor: alpha(color, 0.1), border: `1px solid ${alpha(color, 0.3)}`,
            transition: 'transform 0.3s', '&:hover': {transform: 'translateY(-5px)'}
        }}>
            <Box sx={{position: 'absolute', right: -10, top: -10, opacity: 0.1, color: color}}>
                {React.cloneElement(icon, {sx: {fontSize: 100}})}
            </Box>
            <Stack spacing={1}>
                <Avatar sx={{bgcolor: color, width: 48, height: 48, borderRadius: 3}}>
                    {React.cloneElement(icon, {sx: {color: '#fff'}})}
                </Avatar>
                <Typography variant="h4" fontWeight="900" sx={{color: theme.palette.text.primary}}>{value}</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{color: color}}>{title}</Typography>
                {subtitle &&
                    <Typography variant="caption" sx={{color: theme.palette.text.secondary}}>{subtitle}</Typography>}
            </Stack>
        </Paper>
    );

    return (
        <Box>
            {/* --- هدر و آمار --- */}
            <Typography variant="h4" fontWeight="900" mb={4} sx={{
                background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #3da9fc, #a16eff)'
                    : 'linear-gradient(45deg, #1e88e5, #7b1fa2)',
                backgroundClip: 'text', textFillColor: 'transparent', width: 'fit-content'
            }}>
                مدیریت و داشبورد پروژه‌ها
            </Typography>

            <Grid container spacing={3} mb={5}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="کل پروژه‌ها" value={totalProjects} icon={<ProjectIcon/>}
                              color={theme.palette.primary.main}/>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="پروژه‌های فعال" value={activeProjects} icon={<ActiveIcon/>}
                              color={theme.palette.success.main}/>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="پروژه‌های تکمیل شده" value={completedProjects} icon={<DoneIcon/>}
                              color={theme.palette.secondary.main}/>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="حجم کل قراردادها" value={`${(totalRevenue / 1000000).toLocaleString('fa-IR')} M`}
                              icon={<RevenueIcon/>} color={theme.palette.warning.main} subtitle="میلیون تومان"/>
                </Grid>
            </Grid>

            {/* --- تولبار (جستجو، فیلتر، تغییر نما) --- */}
            <Paper sx={{
                p: 2, mb: 4, borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between'
            }}>
                <Stack direction="row" spacing={2} sx={{flex: 1, minWidth: 300}}>
                    <TextField
                        placeholder="جستجوی نام پروژه، کارفرما..."
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon
                                color="action"/></InputAdornment>,
                        }}
                        sx={{
                            bgcolor: alpha(theme.palette.action.hover, 0.05), borderRadius: 2,
                            '& fieldset': {border: 'none'}
                        }}
                    />
                    <Stack direction="row" spacing={1} display={{xs: 'none', md: 'flex'}}>
                        <Button
                            variant={filterStatus === 'all' ? "contained" : "text"}
                            onClick={() => setFilterStatus('all')}
                            sx={{borderRadius: 2, color: filterStatus === 'all' ? '#fff' : 'text.secondary'}}
                        >همه</Button>
                        <Button
                            variant={filterStatus === 'active' ? "contained" : "text"}
                            onClick={() => setFilterStatus('active')}
                            color="success"
                            sx={{borderRadius: 2, color: filterStatus === 'active' ? '#fff' : 'text.secondary'}}
                        >فعال</Button>
                        <Button
                            variant={filterStatus === 'completed' ? "contained" : "text"}
                            onClick={() => setFilterStatus('completed')}
                            color="secondary"
                            sx={{borderRadius: 2, color: filterStatus === 'completed' ? '#fff' : 'text.secondary'}}
                        >تکمیل</Button>
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newView) => {
                            if (newView) setViewMode(newView);
                        }}
                        size="small"
                        sx={{bgcolor: alpha(theme.palette.action.hover, 0.05), borderRadius: 2}}
                    >
                        <ToggleButton value="grid"><GridViewIcon/></ToggleButton>
                        <ToggleButton value="list"><ListViewIcon/></ToggleButton>
                    </ToggleButtonGroup>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        onClick={() => navigate('/project/new')}
                        sx={{fontWeight: 'bold', px: 3, borderRadius: 2, boxShadow: theme.shadows[3]}}
                    >
                        پروژه جدید
                    </Button>
                </Stack>
            </Paper>

            {/* --- نمایش لیست پروژه‌ها --- */}
            {loading ? (
                <Box display="flex" justifyContent="center" mt={10}><CircularProgress/></Box>
            ) : filteredProjects.length === 0 ? (
                <Paper sx={{
                    p: 6,
                    textAlign: 'center',
                    bgcolor: 'transparent',
                    border: `2px dashed ${theme.palette.divider}`,
                    borderRadius: 4
                }}>
                    <Typography color="text.secondary" variant="h6">هیچ پروژه‌ای با این مشخصات یافت نشد.</Typography>
                </Paper>
            ) : viewMode === 'grid' ? (
                <Grid container spacing={3}>
                    {filteredProjects.map((project) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                            <Fade in={true} timeout={500}>
                                <Paper
                                    onClick={() => navigate(`/project/${project.id}`)}
                                    sx={{
                                        p: 2.5, borderRadius: 4,
                                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                                        backdropFilter: 'blur(10px)',
                                        border: `1px solid ${theme.palette.divider}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        position: 'relative', overflow: 'hidden',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: theme.shadows[8],
                                            borderColor: project.is_started ? theme.palette.success.main : theme.palette.secondary.main,
                                        }
                                    }}
                                >
                                    {/* نوار رنگی بالا */}
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: 4,
                                        bgcolor: project.is_started ? 'success.main' : 'secondary.main'
                                    }}/>

                                    <Stack direction="row" justifyContent="space-between" mb={2} mt={1}>
                                        <Avatar
                                            src={project.page_logo}
                                            variant="rounded"
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                bgcolor: 'primary.main',
                                                border: `1px solid ${theme.palette.divider}`
                                            }}
                                        >
                                            {project.project_name[0]}
                                        </Avatar>
                                        <Chip
                                            label={project.is_started ? "فعال" : "آرشیو"}
                                            size="small"
                                            color={project.is_started ? "success" : "secondary"}
                                            variant="outlined"
                                            sx={{fontWeight: 'bold'}}
                                        />
                                    </Stack>

                                    <Typography variant="h6" fontWeight="bold" noWrap mb={0.5} color="text.primary">
                                        {project.project_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={3}>
                                        @{project.page_username || '---'}
                                    </Typography>

                                    {/* نوار پیشرفت (فرضی) */}
                                    <Box mb={2}>
                                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="caption" color="text.secondary">پیشرفت
                                                پروژه</Typography>
                                            <Typography variant="caption" color="text.primary">65%</Typography>
                                        </Stack>
                                        <LinearProgress variant="determinate" value={65}
                                                        sx={{height: 6, borderRadius: 3}}/>
                                    </Box>

                                    {/* اعضای تیم (فرضی) */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" pt={2}
                                           borderTop={`1px solid ${theme.palette.divider}`}>
                                        <AvatarGroup max={3} sx={{
                                            '& .MuiAvatar-root': {
                                                width: 24,
                                                height: 24,
                                                fontSize: 10,
                                                borderColor: theme.palette.background.paper
                                            }
                                        }}>
                                            <Avatar sx={{bgcolor: 'orange'}}>A</Avatar>
                                            <Avatar sx={{bgcolor: 'pink'}}>B</Avatar>
                                            <Avatar sx={{bgcolor: 'cyan'}}>C</Avatar>
                                            <Avatar sx={{bgcolor: 'gray'}}>+2</Avatar>
                                        </AvatarGroup>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            {formatPrice(project.contract_amount)} <span
                                            style={{fontSize: 10, color: theme.palette.text.secondary}}>ت</span>
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Fade>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <TableContainer component={Paper} sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3
                }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{
                                '& th': {
                                    color: 'text.secondary',
                                    borderBottom: `1px solid ${theme.palette.divider}`
                                }
                            }}>
                                <TableCell>پروژه</TableCell>
                                <TableCell>کارفرما</TableCell>
                                <TableCell>وضعیت</TableCell>
                                <TableCell>مبلغ قرارداد</TableCell>
                                <TableCell>تاریخ شروع</TableCell>
                                <TableCell align="left">عملیات</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProjects.map((project) => (
                                <TableRow key={project.id} hover sx={{
                                    '& td': {
                                        color: 'text.primary',
                                        borderBottom: `1px solid ${theme.palette.divider}`
                                    }, cursor: 'pointer'
                                }} onClick={() => navigate(`/project/${project.id}`)}>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar src={project.page_logo} variant="rounded" sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'primary.main'
                                            }}>{project.project_name[0]}</Avatar>
                                            <Typography fontWeight="bold">{project.project_name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{project.page_username || '---'}</TableCell>
                                    <TableCell>
                                        <Chip label={project.is_started ? "فعال" : "پایان"} size="small"
                                              color={project.is_started ? "success" : "secondary"} variant="filled"/>
                                    </TableCell>
                                    <TableCell>{formatPrice(project.contract_amount)} ت</TableCell>
                                    <TableCell>{project.start_date ? moment(project.start_date).format('jYYYY/jMM/jDD') : '-'}</TableCell>
                                    <TableCell align="left">
                                        <IconButton size="small" sx={{color: 'text.secondary'}}><ArrowIcon
                                            fontSize="small"/></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

export default ProjectsPage;