// src/components/AIAnalysisTab.jsx
import React, {useState} from "react";
import {Box, Button, CircularProgress, Divider, Paper, Stack, Typography,} from "@mui/material";
import {AutoAwesome as AIIcon, Bolt as BoltIcon, SmartToy as RobotIcon,} from "@mui/icons-material";
import {analyzeProjectAI} from "../api";
import {motion} from "framer-motion";

function AIAnalysisTab({projectId}) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await analyzeProjectAI(projectId);
            setAnalysis(res.data.analysis);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (<Box>
        {!analysis && !loading && (<Paper
            elevation={0}
            sx={{
                p: 6,
                textAlign: "center",
                background: "linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%)",
                color: "white",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.1)",
            }}
        >
            <RobotIcon sx={{fontSize: 80, color: "#00e676", mb: 2}}/>
            <Typography
                variant="h4"
                fontWeight="bold"
                textAlign={"center"}
                gutterBottom
            >
                دستیار هوشمند تحلیلگر
            </Typography>
            <Typography
                variant="body1"
                sx={{
                    opacity: 0.7, mb: 4, maxWidth: 600, mx: "auto", textAlign: "center",
                }}
            >
                من تمام گزارش‌های هفتگی پرسنل را می‌خوانم، عملکرد پیج را بررسی
                می‌کنم و یک برنامه استراتژیک دقیق برای ماه آینده به شما می‌دهم.
            </Typography>

            <Button
                variant="contained"
                size="large"
                onClick={handleAnalyze}
                startIcon={<AIIcon/>}
                sx={{
                    bgcolor: "#00e676",
                    color: "#000",
                    fontWeight: "bold",
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    "&:hover": {bgcolor: "#00c853"},
                    boxShadow: "0 0 20px rgba(0, 230, 118, 0.4)",
                }}
            >
                شروع تحلیل هوشمند
            </Button>
        </Paper>)}

        {loading && (<Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={10}
        >
            <CircularProgress size={60} sx={{color: "#00e676"}}/>
            <Typography variant="h6" mt={3} color="primary">
                در حال تفکر و تحلیل داده‌ها...
            </Typography>
            <Typography variant="caption" color="text.secondary">
                لطفاً چند لحظه صبر کنید
            </Typography>
        </Box>)}

        {analysis && (<motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
        >
            <Paper
                sx={{
                    p: 4, borderRadius: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <AIIcon color="success"/>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                        نتیجه تحلیل هوشمند
                    </Typography>
                </Stack>
                <Divider sx={{mb: 3}}/>

                <Box
                    sx={{
                        lineHeight: 2, fontSize: "1.05rem", whiteSpace: "pre-wrap",
                    }}
                >
                    {/* اگر react-markdown نصب باشد بهتر است، اگر نه متن ساده */}
                    {analysis}
                </Box>

                <Box mt={4} display="flex" justifyContent="flex-end">
                    <Button
                        variant="outlined"
                        onClick={() => setAnalysis(null)}
                        startIcon={<BoltIcon/>}
                    >
                        تحلیل مجدد
                    </Button>
                </Box>
            </Paper>
        </motion.div>)}
    </Box>);
}

export default AIAnalysisTab;
