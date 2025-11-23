// src/components/ScenarioKanban.jsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Box, Paper, Typography, Chip, Stack, CircularProgress } from '@mui/material';
import { getScenarios, updateScenario } from '../api';
import { useSnackbar } from 'notistack';

const COLUMNS = {
    idea: { title: 'ایده اولیه', color: '#ff9800' },
    approved: { title: 'تایید شده', color: '#4caf50' },
    filmed: { title: 'فیلم‌برداری شده', color: '#9c27b0' },
    posted: { title: 'منتشر شده', color: '#2196f3' },
    rejected: { title: 'نیازمند اصلاح', color: '#f44336' }
};

function ScenarioKanban({ projectId }) {
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();

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
        const { source, destination, draggableId } = result;

        if (source.droppableId !== destination.droppableId) {
            // آپدیت لوکال (برای سرعت نمایش)
            const updatedScenarios = scenarios.map(s =>
                s.id.toString() === draggableId ? { ...s, status: destination.droppableId } : s
            );
            setScenarios(updatedScenarios);

            // آپدیت سرور
            try {
                await updateScenario(draggableId, { status: destination.droppableId }, projectId);
                enqueueSnackbar('وضعیت سناریو تغییر کرد', { variant: 'success' });
            } catch (err) {
                enqueueSnackbar('خطا در تغییر وضعیت', { variant: 'error' });
                fetchScenarios(); // برگرداندن به حالت قبل
            }
        }
    };

    // ✅ تابع اصلاح شده برای ترکیب استایل‌ها (حل مشکل باگ جابجایی)
    const getItemStyle = (isDragging, draggableStyle) => ({
        // استایل‌های پیش‌فرض کتابخانه (مختصات حرکت)
        ...draggableStyle,
        // اگر در حال درگ است، هم حرکت کند و هم کمی بچرخد
        transform: isDragging
            ? `${draggableStyle.transform} rotate(3deg)`
            : draggableStyle.transform,
        // تنظیمات ظاهری
        userSelect: 'none',
        marginBottom: 8,
    });

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

    const columnsData = Object.keys(COLUMNS).map(colId => ({
        id: colId,
        ...COLUMNS[colId],
        items: scenarios.filter(s => s.status === colId)
    }));

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', overflowX: 'auto', gap: 2, pb: 2, minHeight: 500, width: '100%' }}>
                {columnsData.map((column) => (
                    <Box key={column.id} sx={{ minWidth: 280, width: 280, flexShrink: 0 }}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2,
                                height: '100%',
                                bgcolor: 'rgba(255,255,255,0.03)',
                                borderTop: `4px solid ${column.color}`,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                {column.title}
                                <Chip label={column.items.length} size="small" sx={{ bgcolor: column.color, color: 'white', height: 20 }} />
                            </Typography>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <Box
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        sx={{
                                            flexGrow: 1,
                                            minHeight: 400,
                                            bgcolor: snapshot.isDraggingOver ? 'rgba(255,255,255,0.05)' : 'transparent',
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
                                                        // ✅ استفاده از تابع استایل اصلاح شده در پراپ style
                                                        style={getItemStyle(
                                                            snapshot.isDragging,
                                                            provided.draggableProps.style
                                                        )}
                                                        sx={{
                                                            p: 2,
                                                            bgcolor: 'background.paper',
                                                            opacity: snapshot.isDragging ? 0.9 : 1,
                                                            boxShadow: snapshot.isDragging ? 10 : 1
                                                        }}
                                                    >
                                                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" color="text.secondary" noWrap>
                                                            {item.summary || 'بدون خلاصه'}
                                                        </Typography>
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