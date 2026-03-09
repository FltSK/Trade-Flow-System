import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

/**
 * Lazy-loaded Customer Form Dialog
 * Bu component sadece dialog açıkken yüklenir
 */
const CustomerFormDialog = React.memo(({ 
  open, 
  onClose,
  isMdUp,
  editMusteri,
  children // Form içeriği prop olarak gelecek
}) => {
  // Dialog kapandığında içeriği unmount etme (performans için)
  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth 
      fullScreen={!isMdUp}
      disableEnforceFocus
      disableAutoFocus
      // Animation optimize et
      transitionDuration={{ enter: 225, exit: 195 }}
      PaperProps={{
        sx: {
          m: { xs: 1, sm: 2, md: 4 },
          maxWidth: 1320,
          width: { md: '80vw', lg: '75vw', xl: '70vw' }
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {editMusteri ? 'Müşteri Düzenle' : 'Müşteri Ekle'}
      </DialogTitle>
      <DialogContent sx={{ 
        minWidth: { xs: 'auto', md: 900 }, 
        pt: 1, 
        bgcolor: 'grey.50',
        '& .MuiTypography-h6': { fontSize: '1.4rem' },
        '& .MuiTypography-subtitle1': { fontSize: '1.3rem' },
        '& .MuiTextField-root .MuiInputLabel-root': { fontSize: 16 },
        '& .MuiTextField-root .MuiInputBase-input': { fontSize: 17, padding: '10px 18px' },
        '& .MuiTextField-root .MuiFormHelperText-root': { fontSize: 13 },
        '& .MuiTextField-root .MuiSelect-select': { fontSize: 17, padding: '10px 18px' },
        '& .MuiButton-root': { fontSize: 16, padding: '10px 16px' }
      }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}, (prevProps, nextProps) => {
  // Sadece bu değerler değişirse re-render yap
  return (
    prevProps.open === nextProps.open &&
    prevProps.editMusteri?.id === nextProps.editMusteri?.id
  );
});

CustomerFormDialog.displayName = 'CustomerFormDialog';

export default CustomerFormDialog;

