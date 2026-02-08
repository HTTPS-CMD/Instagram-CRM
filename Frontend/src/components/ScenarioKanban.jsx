// src/components/ScenarioKanban.jsx
import React, {useEffect, useState} from 'react';
import {DragDropContext, Draggable, Droppable} from '@hello-pangea/dnd';
import {alpha, Box, Chip, CircularProgress, Paper, Stack, Typography, useTheme} from '@mui/material';
import {getScenarios, updateScenario} from '../api';
import {useSnackbar} from 'notistack';
import {HistoryEdu as StoryIcon, MovieCreation as ReelsIcon} from '@mui/icons-material';

const COLUMNS = {
    idea: {title: 'ایده اولیه', color: '#ff9800'},
    approved: {title: 'تایید شده', color: '#4caf50'},
    filmed: {title: 'فیلم‌برداری شده', color: '#9c27b0'},
    posted: {title: 'منتشر شده', color: '#2196f3'},
    rejected: {title: 'نیازمند اصلاح', color: '#f44336'}
};

function ScenarioKanban({projectId}) {
    const theme = useTheme(); // ✅ استفاده از تم
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        fetchScenarios();
    }, [projectId]);

    const fetchScenarios = async () => {
        try {
            const res = await getScenarios(projectId);
            setScenarios(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const {source, destination, draggableId} = result;

        if (source.droppableId !== destination.droppableId) {
            const updatedScenarios = scenarios.map(s =>
                s.id.toString() === draggableId ? {...s, status: destination.droppableId} : s
            );
            setScenarios(updatedScenarios);

            try {
                await updateScenario(draggableId, {status: destination.droppableId}, projectId);
                enqueueSnackbar('وضعیت سناریو تغییر کرد', {variant: 'success'});
            } catch (err) {
                enqueueSnackbar('خطا در تغییر وضعیت', {variant: 'error'});
                fetchScenarios();
            }
        }
    };

    const getItemStyle = (isDragging, draggableStyle) => ({
        ...draggableStyle,
        transform: isDragging
            ? `${draggableStyle.transform} rotate(3deg)`
            : draggableStyle.transform,
        userSelect: 'none',
        marginBottom: 8,
    });

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress/></Box>;

    const columnsData = Object.keys(COLUMNS).map(colId => ({
        id: colId,
        ...COLUMNS[colId],
        items: scenarios.filter(s => s.status === colId)
    }));

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{display: 'flex', overflowX: 'auto', gap: 2, pb: 2, minHeight: 500, width: '100%'}}>
                {columnsData.map((column) => (
                    <Box key={column.id} sx={{minWidth: 280, width: 280, flexShrink: 0}}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2,
                                height: '100%',
                                // ✅ رنگ پس‌زمینه ستون (شیشه‌ای داینامیک)
                                bgcolor: alpha(theme.palette.background.paper, 0.4),
                                borderTop: `4px solid ${column.color}`,
                                display: 'flex',
                                flexDirection: 'column',
                                border: `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                color: theme.palette.text.primary
                            }}>
                                {column.title}
                                <Chip label={column.items.length} size="small"
                                      sx={{bgcolor: column.color, color: '#fff', height: 20, fontWeight: 'bold'}}/>
                            </Typography>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <Box
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        sx={{
                                            flexGrow: 1,
                                            minHeight: 400,
                                            // ✅ هایلایت هنگام درگ کردن
                                            bgcolor: snapshot.isDraggingOver ? alpha(theme.palette.action.hover, 0.1) : 'transparent',
                                            borderRadius: 2,
                                            transition: 'background-color 0.2s',
                                            p: 1
                                        }}
                                    >
                                        {column.items.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <Paper
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={getItemStyle(
                                                            snapshot.isDragging,
                                                            provided.draggableProps.style
                                                        )}
                                                        sx={{
                                                            p: 2,
                                                            // ✅ رنگ کارت (داینامیک)
                                                            bgcolor: theme.palette.background.paper,
                                                            color: theme.palette.text.primary,
                                                            opacity: snapshot.isDragging ? 0.9 : 1,
                                                            boxShadow: snapshot.isDragging ? 10 : 2,
                                                            borderLeft: item.scenario_type === 'story' ? `3px solid ${theme.palette.warning.main}` : `3px solid ${theme.palette.secondary.main}`,
                                                            border: `1px solid ${theme.palette.divider}`
                                                        }}
                                                    >
                                                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="caption" display="block"
                                                                    color="text.secondary" noWrap mb={1.5}>
                                                            {item.summary || 'بدون خلاصه'}
                                                        </Typography>

                                                        {/* ✅ اضافه کردن نوع سناریو (ریلز/استوری) در پایین کارت */}
                                                        <Stack direction="row" justifyContent="flex-end">
                                                            <Chip
                                                                icon={item.scenario_type === 'story' ?
                                                                    <StoryIcon sx={{fontSize: 14}}/> :
                                                                    <ReelsIcon sx={{fontSize: 14}}/>}
                                                                label={item.scenario_type === 'story' ? 'استوری' : 'ریلز'}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.65rem',
                                                                    // ✅ رنگ چیپ بر اساس نوع سناریو و تم
                                                                    color: item.scenario_type === 'story' ? theme.palette.warning.main : theme.palette.secondary.main,
                                                                    borderColor: item.scenario_type === 'story' ? alpha(theme.palette.warning.main, 0.5) : alpha(theme.palette.secondary.main, 0.5),
                                                                    bgcolor: item.scenario_type === 'story' ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.secondary.main, 0.05)
                                                                }}
                                                            />
                                                        </Stack>
                                                    </Paper>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        </Paper>
                    </Box>
                ))}
            </Box>
        </DragDropContext>
    );
}

export default ScenarioKanban;