// src/components/ActivityLogsPage.jsx
import React, {useContext, useEffect, useState} from "react";
import {
    alpha,
    Box,
    Chip,
    CircularProgress,
    InputAdornment,
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
    AddCircle as CreateIcon,
    CheckCircle as CheckIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    History as HistoryIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import {getActivityLogs} from "../api";
import {UserContext} from "../App";
import {useNavigate} from "react-router-dom";
import moment from "jalali-moment";

const ACTION_COLORS = {
    ایجاد: "success", ویرایش: "warning", حذف: "error", تایید: "info",
};

const ACTION_ICONS = {
    ایجاد: <CreateIcon fontSize="small"/>,
    حذف: <DeleteIcon fontSize="small"/>,
    ویرایش: <EditIcon fontSize="small"/>,
    تایید: <CheckIcon fontSize="small"/>,
};

function ActivityLogsPage() {
    const {user} = useContext(UserContext);
    const navigate = useNavigate();
    const theme = useTheme(); // ✅ استفاده از تم
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (user && user.role !== "admin") navigate("/dashboard");
        fetchLogs();
    }, [user]);

    const fetchLogs = async () => {
        try {
            const res = await getActivityLogs();
            setLogs(res.data);
            setFilteredLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const result = logs.filter((log) => (log.user_name || "").includes(search) || (log.description || "").includes(search) || (log.model_name || "").includes(search));
        setFilteredLogs(result);
    }, [search, logs]);

    // --- استایل‌های داینامیک ---
    const glassCardSx = {
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: "blur(12px)",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[4],
        p: 3,
    };

    const tableHeadSx = {
        "& th": {
            bgcolor: alpha(theme.palette.action.hover, 0.1),
            color: theme.palette.text.secondary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontWeight: "bold",
        },
    };

    const tableBodySx = {
        "& td": {
            color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`,
        }, "& tr:hover": {
            bgcolor: `${alpha(theme.palette.action.hover, 0.1)} !important`,
        },
    };

    if (loading) return (<Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress/>
    </Box>);

    return (<Box sx={{width: "100%", maxWidth: "1600px", mx: "auto"}}>
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={4}
        >
            <Typography
                variant="h4"
                fontWeight="900"
                sx={{
                    color: theme.palette.text.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: 1, // گرادینت متن هدر (بنفش برای دارک، آبی تیره برای لایت)
                    background: theme.palette.mode === "dark" ? "linear-gradient(45deg, #b388ff, #7c4dff)" : "linear-gradient(45deg, #3f51b5, #1a237e)",
                    backgroundClip: "text",
                    textFillColor: "transparent",
                    textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
            >
                <HistoryIcon
                    fontSize="large"
                    sx={{color: theme.palette.secondary.main}}
                />{" "}
                گزارش فعالیت‌ها
            </Typography>

            <Box
                sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    borderRadius: 2,
                    p: 0.5,
                    border: `1px solid ${theme.palette.divider}`,
                }}
            >
                <TextField
                    size="small"
                    placeholder="جستجو در لاگ‌ها..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start">
                            <SearchIcon color="action"/>
                        </InputAdornment>), disableUnderline: true, style: {color: theme.palette.text.primary},
                    }}
                    variant="standard"
                    sx={{px: 1, minWidth: 250}}
                />
            </Box>
        </Stack>

        <Paper sx={glassCardSx}>
            <TableContainer sx={{maxHeight: 600}}>
                <Table stickyHeader>
                    <TableHead sx={tableHeadSx}>
                        <TableRow>
                            <TableCell>کاربر</TableCell>
                            <TableCell>عملیات</TableCell>
                            <TableCell>بخش</TableCell>
                            <TableCell>توضیحات</TableCell>
                            <TableCell>پروژه</TableCell>
                            <TableCell>تاریخ و زمان</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody sx={tableBodySx}>
                        {filteredLogs.map((log) => (<TableRow key={log.id} hover>
                            <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" fontWeight="bold">
                                        {log.user_name || "سیستم"}
                                    </Typography>
                                    {log.user_role && (<Chip
                                        label={log.user_role}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            borderColor: theme.palette.divider,
                                            height: 18,
                                            fontSize: "0.6rem",
                                        }}
                                    />)}
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    icon={ACTION_ICONS[log.action_type]}
                                    label={log.action_type}
                                    color={ACTION_COLORS[log.action_type] || "default"}
                                    size="small"
                                    sx={{fontWeight: "bold"}}
                                />
                            </TableCell>
                            <TableCell sx={{color: theme.palette.text.secondary}}>
                                {log.model_name}
                            </TableCell>
                            <TableCell
                                sx={{maxWidth: 350, color: theme.palette.text.primary}}
                            >
                                {log.description}
                            </TableCell>
                            <TableCell sx={{color: theme.palette.primary.main}}>
                                {log.project_name || "---"}
                            </TableCell>
                            <TableCell
                                dir="ltr"
                                align="right"
                                sx={{
                                    color: theme.palette.text.secondary, fontSize: "0.85rem",
                                }}
                            >
                                {moment(log.created_at)
                                    .locale("fa")
                                    .format("jYYYY/jMM/jDD - HH:mm:ss")}
                            </TableCell>
                        </TableRow>))}
                        {filteredLogs.length === 0 && (<TableRow>
                            <TableCell
                                colSpan={6}
                                align="center"
                                sx={{py: 5, opacity: 0.5}}
                            >
                                هیچ فعالیتی یافت نشد.
                            </TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    </Box>);
}

export default ActivityLogsPage;
