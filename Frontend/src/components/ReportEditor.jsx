// src/components/ReportEditor.jsx
import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    alpha,
    Box,
    Button,
    CircularProgress,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import {useReactToPrint} from 'react-to-print';

function ReportEditor({title, initialContent, onSave, isSaving, isAdmin}) {
    const theme = useTheme(); // ✅ استفاده از تم
    const [content, setContent] = useState(initialContent || '');
    const [isEditing, setIsEditing] = useState(false);
    const [localError, setLocalError] = useState(null);

    // ✅ رفرنس برای بخشی که باید چاپ شود
    const componentRef = useRef();

    // ✅ تابع هندل چاپ
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Report-${title}`,
        onAfterPrint: () => console.log("Printed successfully"),
    });

    useEffect(() => {
        setContent(initialContent || '');
        setIsEditing(false);
    }, [initialContent]);

    const handleEdit = () => {
        setIsEditing(true);
        setLocalError(null);
    };

    const handleSave = async () => {
        setLocalError(null);
        if (!content.trim()) {
            setLocalError("محتوای گزارش نمی‌تواند خالی باشد.");
            return;
        }
        await onSave(content);
        setIsEditing(false);
    };

    return (
        <Paper
            elevation={3}
            sx={{
                p: 3, borderRadius: 2,
                // ✅ استایل داینامیک برای کانتینر اصلی
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(12px)',
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary
            }}
        >
            <Stack spacing={2}>
                {/* --- هدر: عنوان و دکمه‌ها --- */}
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Typography variant="h6" color="primary">{title}</Typography>

                    <Stack direction="row" spacing={1}>
                        {/* ✅ دکمه چاپ */}
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<PrintIcon/>}
                            onClick={handlePrint}
                            disabled={!content}
                            sx={{borderColor: theme.palette.divider, color: theme.palette.text.secondary}}
                        >
                            چاپ
                        </Button>

                        {isAdmin && (
                            <Button
                                variant="contained"
                                color={isEditing ? 'success' : 'primary'}
                                startIcon={isEditing ? <SaveIcon/> : <EditIcon/>}
                                onClick={isEditing ? handleSave : handleEdit}
                                disabled={isSaving}
                                sx={{color: '#fff', fontWeight: 'bold'}}
                            >
                                {isSaving ?
                                    <CircularProgress size={24} color="inherit"/> : (isEditing ? 'ذخیره' : 'ویرایش')}
                            </Button>
                        )}
                    </Stack>
                </Box>

                {localError && <Alert severity="error">{localError}</Alert>}

                {/* --- محیط ویرایش یا نمایش --- */}
                {isEditing ? (
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        variant="outlined"
                        placeholder={`متن گزارش ${title} را اینجا وارد کنید...`}
                        sx={{
                            '& textarea': {
                                minHeight: '200px',
                                fontFamily: 'Tahoma, Arial, sans-serif',
                                lineHeight: 1.8,
                                color: theme.palette.text.primary
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {borderColor: theme.palette.divider},
                                '&:hover fieldset': {borderColor: theme.palette.text.primary},
                                '&.Mui-focused fieldset': {borderColor: theme.palette.primary.main},
                            }
                        }}
                    />
                ) : (
                    <Box sx={{
                        p: 2,
                        borderRadius: 1,
                        minHeight: '150px',
                        // ✅ باکس نمایش متن (داینامیک)
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: alpha(theme.palette.action.hover, 0.05)
                    }}>
                        <Typography variant="body1" sx={{
                            whiteSpace: 'pre-wrap',
                            textAlign: 'right',
                            lineHeight: 1.8,
                            color: theme.palette.text.primary
                        }}>
                            {content || `هنوز محتوایی برای گزارش ${title} ثبت نشده است.`}
                        </Typography>
                    </Box>
                )}
            </Stack>

            {/* ✅✅✅ بخش مخفی مخصوص چاپ (Print Only) ✅✅✅
          نکته: این بخش نباید داینامیک باشد. چون کاغذ همیشه سفید است،
          متن باید همیشه مشکی (#000) باشد تا در چاپ خوانا باشد.
      */}
            <div style={{display: 'none'}}>
                <div ref={componentRef} style={{
                    padding: '40px',
                    direction: 'rtl',
                    color: '#000',
                    backgroundColor: '#fff',
                    fontFamily: 'Tahoma, Arial, sans-serif'
                }}>
                    {/* سربرگ گزارش */}
                    <div style={{
                        borderBottom: '2px solid #333',
                        paddingBottom: '20px',
                        marginBottom: '30px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h1 style={{margin: 0, fontSize: '24px', color: '#000'}}>گزارش عملکرد پروژه</h1>
                            <p style={{margin: '5px 0 0 0', fontSize: '14px', color: '#666'}}>سیستم مدیریت محتوا</p>
                        </div>
                        <div style={{textAlign: 'left'}}>
                            <p style={{margin: 0, fontWeight: 'bold', color: '#000'}}>تاریخ گزارش:</p>
                            <p style={{margin: 0, color: '#000'}}>{new Date().toLocaleDateString('fa-IR')}</p>
                        </div>
                    </div>

                    {/* اطلاعات گزارش */}
                    <div style={{marginBottom: '30px'}}>
                        <h2 style={{
                            fontSize: '18px',
                            color: '#444',
                            borderBottom: '1px solid #ddd',
                            paddingBottom: '10px'
                        }}>
                            {title}
                        </h2>
                        {/* متن اصلی گزارش */}
                        <p style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: '2',
                            textAlign: 'justify',
                            fontSize: '14px',
                            color: '#000'
                        }}>
                            {content || "متنی برای چاپ وجود ندارد."}
                        </p>
                    </div>

                    {/* فوتر گزارش */}
                    <div style={{
                        marginTop: '50px',
                        borderTop: '1px solid #ccc',
                        paddingTop: '20px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#888'
                    }}>
                        این گزارش به صورت سیستمی تولید شده است.
                    </div>
                </div>
            </div>

        </Paper>
    );
}

export default ReportEditor;