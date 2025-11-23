// src/components/ReportEditor.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, TextField, Button, CircularProgress,
  Alert, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print'; // ✅ آیکون چاپ
import { useReactToPrint } from 'react-to-print'; // ✅ هوک چاپ

function ReportEditor({ title, initialContent, onSave, isSaving, isAdmin }) {
  const [content, setContent] = useState(initialContent || '');
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState(null);

  // ✅ رفرنس برای بخشی که باید چاپ شود
  const componentRef = useRef();

  // ✅ تابع هندل چاپ (اصلاح شده برای نسخه جدید react-to-print)
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // 👈 این خط مشکل ارور را حل می‌کند
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
      sx={{ p: 3, borderRadius: 2 }}
    >
      <Stack spacing={2}>
        {/* --- هدر: عنوان و دکمه‌ها --- */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary">{title}</Typography>

          <Stack direction="row" spacing={1}>
            {/* ✅ دکمه چاپ (همیشه برای همه فعال است) */}
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              disabled={!content}
            >
              چاپ
            </Button>

            {isAdmin && (
              <Button
                variant="contained"
                color={isEditing ? 'success' : 'primary'}
                startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                onClick={isEditing ? handleSave : handleEdit}
                disabled={isSaving}
              >
                {isSaving ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'ذخیره' : 'ویرایش')}
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
                    lineHeight: 1.8
                }
            }}
          />
        ) : (
          <Box sx={{ p: 2, border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 1, minHeight: '150px', bgcolor: 'rgba(0,0,0,0.2)' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', textAlign: 'right', lineHeight: 1.8 }}>
              {content || `هنوز محتوایی برای گزارش ${title} ثبت نشده است.`}
            </Typography>
          </Box>
        )}
      </Stack>

      {/* ✅✅✅ بخش مخفی مخصوص چاپ (Print Only) ✅✅✅
          این بخش در حالت عادی دیده نمی‌شود (display: none)، اما وقتی دکمه چاپ زده شود،
          توسط react-to-print به عنوان محتوای رفرنس (componentRef) استفاده می‌شود.
      */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef} style={{ padding: '40px', direction: 'rtl', color: '#000', fontFamily: 'Tahoma, Arial, sans-serif' }}>
            {/* سربرگ گزارش */}
            <div style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>گزارش عملکرد پروژه</h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>سیستم مدیریت محتوا</p>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>تاریخ گزارش:</p>
                    <p style={{ margin: 0 }}>{new Date().toLocaleDateString('fa-IR')}</p>
                </div>
            </div>

            {/* اطلاعات گزارش */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '18px', color: '#444', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                    {title}
                </h2>
                {/* متن اصلی گزارش */}
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '2', textAlign: 'justify', fontSize: '14px' }}>
                    {content || "متنی برای چاپ وجود ندارد."}
                </p>
            </div>

            {/* فوتر گزارش */}
            <div style={{ marginTop: '50px', borderTop: '1px solid #ccc', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: '#888' }}>
                این گزارش به صورت سیستمی تولید شده است.
            </div>
        </div>
      </div>

    </Paper>
  );
}

export default ReportEditor;