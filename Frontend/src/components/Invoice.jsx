// src/components/Invoice.jsx
import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Grid, Avatar } from '@mui/material';
import moment from 'jalali-moment';

// تابع کمکی برای فرمت پول
const formatPrice = (price) => Number(price).toLocaleString('fa-IR');

export const Invoice = React.forwardRef(({ payment, project, agency }, ref) => {
    if (!payment || !project) return null;

    return (
        <div ref={ref} style={{ padding: '40px', direction: 'rtl', fontFamily: 'Tahoma, Arial, sans-serif', color: '#000', backgroundColor: '#fff' }}>

            {/* --- سربرگ فاکتور --- */}
            <Box sx={{ borderBottom: '2px solid #000', pb: 2, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* نمایش لوگوی آژانس اگر موجود باشد */}
                    {agency?.logo && (
                        <img src={agency.logo} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                    )}
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{fontSize: '24px'}}>فاکتور رسمی</Typography>
                        <Typography variant="body2" sx={{mt: 1, fontSize: '14px'}}>
                            {agency?.brand_name || "آژانس تولید محتوا"}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{fontSize: '14px'}}><strong>شماره فاکتور:</strong> {payment.id}</Typography>
                    <Typography variant="body2" sx={{fontSize: '14px'}}><strong>تاریخ صدور:</strong> {moment(payment.date).locale('fa').format('jYYYY/jMM/jDD')}</Typography>
                </Box>
            </Box>

            {/* --- مشخصات طرفین --- */}
            <Grid container spacing={3} sx={{ mb: 4, border: '1px solid #ddd', p: 2, borderRadius: 2 }}>
                <Grid item xs={6}>
                    <Typography variant="h6" sx={{fontSize: '16px', mb: 1, fontWeight: 'bold'}}>فروشنده:</Typography>
                    <Typography variant="body2">نام: {agency?.brand_name || "آژانس محتوا"}</Typography>
                    <Typography variant="body2">شماره تماس: {agency?.phone || "۰۹۱۲..."}</Typography>
                    <Typography variant="body2">آدرس: {agency?.address || "تهران..."}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="h6" sx={{fontSize: '16px', mb: 1, fontWeight: 'bold'}}>خریدار:</Typography>
                    {/* <Typography variant="body2">نام مشتری: {project.client_user_details?.full_name || project.page_username}</Typography> */}
                    <Typography variant="body2">پروژه: {project.project_name}</Typography>
                </Grid>
            </Grid>

            {/* --- جدول اقلام --- */}
            <TableContainer sx={{ mb: 4, border: '1px solid #000' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                        <TableRow>
                            <TableCell sx={{borderBottom: '1px solid #000', fontWeight: 'bold'}}>شرح خدمات</TableCell>
                            <TableCell align="center" sx={{borderBottom: '1px solid #000', fontWeight: 'bold'}}>مبلغ واحد (تومان)</TableCell>
                            <TableCell align="center" sx={{borderBottom: '1px solid #000', fontWeight: 'bold'}}>تعداد</TableCell>
                            <TableCell align="left" sx={{borderBottom: '1px solid #000', fontWeight: 'bold'}}>مبلغ کل (تومان)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{borderBottom: 'none'}}>{payment.description} (بخشی از قرارداد پروژه {project.project_name})</TableCell>
                            <TableCell align="center" sx={{borderBottom: 'none'}}>{formatPrice(payment.amount)}</TableCell>
                            <TableCell align="center" sx={{borderBottom: 'none'}}>۱</TableCell>
                            <TableCell align="left" sx={{borderBottom: 'none', fontWeight: 'bold'}}>{formatPrice(payment.amount)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- جمع کل --- */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 6 }}>
                <Box sx={{ width: '40%', border: '1px solid #000', p: 2, borderRadius: 1, bgcolor: '#f9f9f9' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>جمع کل:</Typography>
                        <Typography fontWeight="bold">{formatPrice(payment.amount)} تومان</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontWeight="bold">مبلغ قابل پرداخت:</Typography>
                        <Typography fontWeight="bold" color="primary.main">{formatPrice(payment.amount)} تومان</Typography>
                    </Box>
                </Box>
            </Box>

            {/* --- مهر و امضا --- */}
            <Grid container spacing={4} sx={{ mt: 8 }}>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography fontWeight="bold" mb={8}>مهر و امضای فروشنده</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography fontWeight="bold" mb={8}>امضای خریدار</Typography>
                </Grid>
            </Grid>

            {/* --- پاورقی (Footer) --- */}
            {agency?.footer_text && (
                <Box sx={{ mt: 'auto', pt: 4, textAlign: 'center', fontSize: '12px', color: '#666', borderTop: '1px solid #eee' }}>
                    {agency.footer_text}
                </Box>
            )}
        </div>
    );
});