// src/components/ScenarioManager.jsx
import React, {useState} from 'react';
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    MovieCreation as ScenarioIcon,
    ViewKanban as KanbanIcon,
    ViewList as ListIcon
} from '@mui/icons-material';
import ScenarioList, {ScenarioForm} from './ScenarioList'; // ✅ ایمپورت ScenarioForm
import ScenarioKanban from './ScenarioKanban';

const ScenarioManager = ({projectId}) => {
    const theme = useTheme();
    const [viewMode, setViewMode] = useState('kanban');
    const [openModal, setOpenModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setViewMode(newView);
        }
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        setOpenModal(false);
    };

    return (
        <Box sx={{mt: 3}}>
            {/* هدر و کنترلر سوئیچ */}
            <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems="center" mb={3}
                   spacing={2}>
                <Box>
                    <Typography variant="h6" fontWeight="bold"
                                sx={{display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.primary}}>
                        <ScenarioIcon color="primary"/> مدیریت سناریوها
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ایده‌پردازی، نگارش و پیگیری سناریوهای پروژه
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        onClick={() => setOpenModal(true)}
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            fontWeight: 'bold',
                            boxShadow: theme.shadows[4]
                        }}
                    >
                        سناریو جدید
                    </Button>

                    <Paper sx={{
                        bgcolor: alpha(theme.palette.action.active, 0.05),
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`
                    }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewChange}
                            size="small"
                            sx={{
                                '& .MuiToggleButton-root': {
                                    color: theme.palette.text.secondary,
                                    borderColor: 'transparent',
                                    borderRadius: 2,
                                    px: 2,
                                    '&.Mui-selected': {
                                        color: '#fff',
                                        bgcolor: theme.palette.primary.main,
                                        '&:hover': {bgcolor: theme.palette.primary.dark}
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="list"><ListIcon sx={{mr: 1}}/> لیست</ToggleButton>
                            <ToggleButton value="kanban"><KanbanIcon sx={{mr: 1}}/> بورد</ToggleButton>
                        </ToggleButtonGroup>
                    </Paper>
                </Stack>
            </Stack>

            {/* نمایش محتوا بر اساس انتخاب کاربر */}
            <Box>
                {viewMode === 'list' ? (
                    <ScenarioList key={refreshTrigger} projectId={projectId}/>
                ) : (
                    <ScenarioKanban key={refreshTrigger} projectId={projectId}/>
                )}
            </Box>

            {/* مودال ایجاد سناریو */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth
                    PaperProps={{sx: {bgcolor: theme.palette.background.paper, color: theme.palette.text.primary}}}
            >
                <DialogTitle sx={{bgcolor: theme.palette.primary.main, color: '#fff'}}>ایجاد سناریو جدید</DialogTitle>
                <DialogContent dividers>
                    <ScenarioForm
                        projectId={projectId}
                        onScenarioSaved={handleSuccess}
                        onCancel={() => setOpenModal(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ScenarioManager;