// src/components/DashboardPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { getProjects, getDashboardStats } from "../api";
import {
  Typography, Box, CircularProgress, List, ListItem, ListItemButton,
    ListItemText,
  Paper, Avatar, IconButton,
  Button, Stack, Grid, TextField, InputAdornment, Divider,
  Chip,
  useTheme, useMediaQuery
} from "@mui/material";
import {
  Folder as FolderIcon,
  ChevronLeft as ChevronLeftIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value);

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const isAdmin = user && user.role === 'admin';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectsResponse = await getProjects();
        setProjects(projectsResponse.data);
        setFilteredProjects(projectsResponse.data);

        if (isAdmin) {
            const statsResponse = await getDashboardStats();
            setStats(statsResponse.data);
        }
      } catch (err) {
        console.error("Error:", err);
        if (err.response && err.response.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  useEffect(() => {
      const results = projects.filter(project =>
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.page_username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(results);
  }, [searchTerm, projects]);

  const handleProjectClick = (projectId) => navigate(`/project/${projectId}`);
  const handleAddNewProject = () => navigate('/project/new');

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* --- هدر --- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4} spacing={2}>
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>داشبورد مدیریت</Typography>
            <Typography variant="body1" color="text.secondary">نمای کلی وضعیت پروژه‌ها و مالی</Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddNewProject} sx={{ borderRadius: 2, px: 3, width: {xs: '100%', sm: 'auto'} }}>
              پروژه جدید
          </Button>
        )}
      </Stack>

      {/* --- نمودارها (همیشه زیر هم) --- */}
      {isAdmin && stats && (
          <Stack spacing={4} mb={5} sx={{ width: '100%' }}>

              {/* نمودار دایره‌ای */}
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: 400, display:'flex', flexDirection:'column', alignItems:'center', width: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{display:'flex', alignItems:'center', gap:1, width: '100%'}}>
                      <PieChartIcon color="secondary"/> وضعیت پروژه‌ها
                  </Typography>
                  <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.project_stats}
                                cx="50%" cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.project_stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} پروژه`} contentStyle={{borderRadius: 8, fontFamily: 'Tahoma'}} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span style={{paddingRight: 10, paddingLeft: 20, fontSize: '14px', color: '#e0e0e0'}}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                  </Box>
              </Paper>

              {/* نمودار میله‌ای */}
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: 400, width: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{display:'flex', alignItems:'center', gap:1}}>
                      <BarChartIcon color="primary"/> تحلیل مالی کل
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                          data={stats.financial_stats}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                      >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={(val) => `${val/1000000}M`} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={80}
                            tick={{fontSize: 14, fontWeight: 'bold', fill: '#fff', dx: -40}}
                          />
                          <Tooltip
                              formatter={(value) => [`${formatPrice(value)} تومان`, 'مبلغ']}
                              contentStyle={{borderRadius: 10, direction: 'rtl', textAlign:'right', fontFamily: 'Tahoma', color: '#000'}}
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          />
                          <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={40}>
                              {stats.financial_stats.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </Paper>
          </Stack>
      )}

      <Divider sx={{my: 4}} />

      {/* --- لیست پروژه‌ها --- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={2} spacing={2}>
          <Typography variant="h6">لیست پروژه‌ها ({filteredProjects.length})</Typography>
          <TextField
            placeholder="جستجو..."
            variant="outlined" size="small"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ bgcolor: 'background.paper', borderRadius: 1, width: {xs: '100%', sm: 300} }}
            InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                endAdornment: searchTerm && (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm("")}><ClearIcon fontSize="small" /></IconButton></InputAdornment>)
            }}
          />
      </Stack>

      {/* --- ✅ اصلاح نهایی و قطعی لیست --- */}
      <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: 2 }}>
        <List sx={{ p: 0 }}>
          {filteredProjects.length === 0 ? (
            <ListItem sx={{ p: 3 }}><ListItemText primary="پروژه‌ای یافت نشد." sx={{ textAlign: "center" }} /></ListItem>
          ) : (
            filteredProjects.map((project, index) => (
              <React.Fragment key={project.id}>
                  <ListItemButton
                    onClick={() => handleProjectClick(project.id)}
                    component={motion.div}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    sx={{
                        p: 2,
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                    }}
                  >
                    {/* کانتینر اصلی: فلکس باکس افقی */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">

                        {/* --- سمت راست: آواتار و متن‌ها --- */}
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ overflow: 'hidden' }}>
                            <Avatar src={project.page_logo} sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}>
                                <FolderIcon />
                            </Avatar>

                            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                    {project.project_name}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {`@${project.page_username}`}
                                    </Typography>
                                    <Chip
                                        label={project.is_started ? "فعال" : "متوقف"}
                                        size="small"
                                        color={project.is_started ? "success" : "error"}
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                </Stack>
                            </Stack>
                        </Stack>

                        {/* --- سمت چپ: فلش --- */}
                        <IconButton edge="end" sx={{ color: 'primary.main' }}>
                            <ChevronLeftIcon />
                        </IconButton>

                    </Stack>
                  </ListItemButton>
                  {index < filteredProjects.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </motion.div>
  );
}

export default DashboardPage;