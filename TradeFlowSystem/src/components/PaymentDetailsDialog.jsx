import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import { formatNumber } from '../utils/helpers';

export default function PaymentDetailsDialog({
  open,
  onClose,
  selectedMusteri,
  deletedPayments,
  pendingForCustomer,
  user,
  onDeletePayment,
  onUndoDelete,
  onApproveDelete,
  onRejectDelete
}) {
  if (!open || !selectedMusteri) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      fullScreen={false}
      disableEnforceFocus
      disableAutoFocus
      PaperProps={{ sx: { m: { xs: 1, sm: 2, md: 4 } } }}
    >
      <DialogTitle>
        {selectedMusteri?.adSoyad} - Ödeme Detayları
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Tutar</TableCell>
                <TableCell>Ödeme Türü</TableCell>
                <TableCell>Toptancı</TableCell>
                <TableCell>Ekleyen</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedMusteri?.odemeler?.map(odeme => (
                <TableRow key={odeme.id}>
                  <TableCell>{odeme.tarih ? odeme.tarih.split('T')[0] : '-'}</TableCell>
                  <TableCell>{formatNumber(odeme.tutar)} ₺</TableCell>
                  <TableCell>
                    <Chip 
                      label={odeme.tur} 
                      color={odeme.tur === 'Nakit' ? 'success' : 'primary'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{odeme.tur === 'Kredi Kartı' ? odeme.toptanci : '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={odeme.createdByUsername || (odeme.createdAt ? 'Eski Kayıt' : 'Bilinmiyor')} 
                      color="secondary" 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => onDeletePayment(selectedMusteri.id, odeme.id)} 
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {selectedMusteri?.odemeler?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Henüz ödeme yapılmamış
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6">
            Toplam Ödenen: {formatNumber((selectedMusteri?.odemeler || []).reduce((t, p) => t + (parseFloat(p.tutar)||0), 0))} ₺
          </Typography>
        </Box>

        {deletedPayments.filter(p => p.musteriId === selectedMusteri?.id).length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Silinen Ödemeler (Geri Alabilirsiniz)
            </Typography>
            {deletedPayments
              .filter(p => p.musteriId === selectedMusteri?.id)
              .map((deletedPayment) => (
                <Box key={`deleted-payment-${deletedPayment.deletedAt}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">
                    {deletedPayment.tarih ? deletedPayment.tarih.split('T')[0] : '-'} - {formatNumber(deletedPayment.tutar)} ₺ - {deletedPayment.tur}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    color="inherit"
                    onClick={() => onUndoDelete(deletedPayment)}
                  >
                    Geri Al
                  </Button>
                </Box>
              ))}
          </Box>
        )}

        {user.role === 'admin' && pendingForCustomer.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Silme Onayı Bekleyen Ödemeler
            </Typography>
            {pendingForCustomer.map(req => (
              <Box key={`pending-${req.id}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">
                    {req.paymentDate ? req.paymentDate.split('T')[0] : '-'} - {formatNumber(req.paymentAmount || 0)} ₺ - {req.paymentType || '-'} (İsteyen: {req.requestedBy || 'Bilinmeyen'})
                  </Typography>
                  {req.reason && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 0.5 }}>
                      Sebep: {req.reason}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <IconButton size="small" color="success" onClick={()=>onApproveDelete(req.id)}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={()=>onRejectDelete(req.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {user.role === 'employee' && pendingForCustomer.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Silme İsteğiniz Onay Bekliyor
            </Typography>
            {pendingForCustomer.map(req => (
              <Box key={`employee-pending-${req.id}`} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {req.paymentDate ? req.paymentDate.split('T')[0] : '-'} - {formatNumber(req.paymentAmount || 0)} ₺ - {req.paymentType || '-'}
                </Typography>
                {req.reason && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 0.5 }}>
                    Sebep: {req.reason}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
}


