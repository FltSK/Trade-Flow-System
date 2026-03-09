import React from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Fab,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  apiGetUstalar,
  apiCreateUsta,
  apiUpdateUsta,
  apiDeleteUsta,
  apiActivateUsta,
  apiDeleteUstaPermanent,
  formatPhoneNumber,
  validatePhoneNumber
} from '../utils/helpers';

export default function UstaPage() {
  const { user } = useAuth();
  
  // State'ler
  const [ustalar, setUstalar] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingUsta, setEditingUsta] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  
  // Form state'i
  const [form, setForm] = React.useState({
    adSoyad: '',
    telefon: '',
    adres: '',
    uzmanlikAlani: '',
    email: ''
  });

  // Usta listesini yükle
  const loadUstalar = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetUstalar();
      setUstalar(data);
    } catch (error) {

      setSnackbar({
        open: true,
        message: 'Ustalar yüklenirken hata oluştu. Lütfen backend servisinin çalıştığından emin olun.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUstalar();
  }, [loadUstalar]);

  // Form değişikliklerini handle et
  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Dialog'u aç
  const handleOpenDialog = (usta = null) => {
    if (usta) {
      setEditingUsta(usta);
      setForm({
        adSoyad: usta.adSoyad || '',
        telefon: usta.telefon || '',
        adres: usta.adres || '',
        uzmanlikAlani: usta.uzmanlikAlani || '',
        email: usta.email || ''
      });
    } else {
      setEditingUsta(null);
      setForm({
        adSoyad: '',
        telefon: '',
        adres: '',
        uzmanlikAlani: '',
        email: ''
      });
    }
    setDialogOpen(true);
  };

  // Dialog'u kapat
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUsta(null);
    setForm({
      adSoyad: '',
      telefon: '',
      adres: '',
      uzmanlikAlani: '',
      email: ''
    });
  };

  // Usta kaydet
  const handleSave = async () => {
    if (!form.adSoyad.trim()) {
      setSnackbar({
        open: true,
        message: 'Ad Soyad alanı zorunludur',
        severity: 'error'
      });
      return;
    }

    try {
      if (editingUsta) {
        // Güncelleme
        const updateData = {
          ...form,
          id: editingUsta.id
        };
        const result = await apiUpdateUsta(editingUsta.id, updateData);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Usta başarıyla güncellendi',
            severity: 'success'
          });
          loadUstalar();
          handleCloseDialog();
        } else {
          setSnackbar({
            open: true,
            message: typeof result.error === 'string' ? result.error : 'Usta güncellenirken hata oluştu',
            severity: 'error'
          });
        }
      } else {
        // Yeni ekleme
        const result = await apiCreateUsta(form);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Usta başarıyla eklendi',
            severity: 'success'
          });
          loadUstalar();
          handleCloseDialog();
        } else {
          setSnackbar({
            open: true,
            message: typeof result.error === 'string' ? result.error : 'Usta eklenirken hata oluştu',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Bir hata oluştu',
        severity: 'error'
      });
    }
  };

  // Usta sil
  const handleDelete = async (usta) => {
    if (window.confirm(`${usta.adSoyad} adlı ustayı silmek istediğinizden emin misiniz?`)) {
      try {
        const result = await apiDeleteUsta(usta.id);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Usta başarıyla silindi',
            severity: 'success'
          });
          loadUstalar();
        } else {
          setSnackbar({
            open: true,
            message: typeof result.error === 'string' ? result.error : 'Usta silinirken hata oluştu',
            severity: 'error'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Bir hata oluştu',
          severity: 'error'
        });
      }
    }
  };

  // Usta pasife çevir
  const handleDeactivate = async (usta) => {
    if (window.confirm(`${usta.adSoyad} adlı ustayı pasife çevirmek istediğinizden emin misiniz?`)) {
      try {
        const result = await apiDeleteUsta(usta.id);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Usta başarıyla pasife çevrildi',
            severity: 'success'
          });
          loadUstalar();
        } else {
          setSnackbar({
            open: true,
            message: typeof result.error === 'string' ? result.error : 'Usta pasife çevrilirken hata oluştu',
            severity: 'error'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Bir hata oluştu',
          severity: 'error'
        });
      }
    }
  };

  // Usta kalıcı olarak sil
  const handleDeletePermanent = async (usta) => {
    if (window.confirm(`${usta.adSoyad} adlı ustayı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      try {
        const result = await apiDeleteUstaPermanent(usta.id);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Usta başarıyla kalıcı olarak silindi',
            severity: 'success'
          });
          loadUstalar();
        } else {
          setSnackbar({
            open: true,
            message: typeof result.error === 'string' ? result.error : 'Usta kalıcı olarak silinirken hata oluştu',
            severity: 'error'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Bir hata oluştu',
          severity: 'error'
        });
      }
    }
  };

  // Usta aktifleştir
  const handleActivate = async (usta) => {
    try {
      const result = await apiActivateUsta(usta.id);
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Usta başarıyla aktifleştirildi',
          severity: 'success'
        });
        loadUstalar();
              } else {
          setSnackbar({
            open: true,
            message: typeof result.error === 'string' ? result.error : 'Usta aktifleştirilirken hata oluştu',
            severity: 'error'
          });
        }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Bir hata oluştu',
        severity: 'error'
      });
    }
  };

  // Aktif ve pasif ustaları ayır
  const activeUstalar = ustalar.filter(u => u.isActive);
  const inactiveUstalar = ustalar.filter(u => !u.isActive);

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Usta Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)'
            }
          }}
        >
          Yeni Usta Ekle
        </Button>
      </Box>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {activeUstalar.length}
              </Typography>
              <Typography variant="body2">
                Aktif Usta
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {inactiveUstalar.length}
              </Typography>
              <Typography variant="body2">
                Pasif Usta
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {ustalar.length}
              </Typography>
              <Typography variant="body2">
                Toplam Usta
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {ustalar.filter(u => u.uzmanlikAlani).length}
              </Typography>
              <Typography variant="body2">
                Uzmanlık Alanı Belirtilen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Aktif Ustalar Tablosu */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Aktif Ustalar
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ad Soyad</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Telefon</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Adres</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>E-posta</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Uzmanlık Alanı</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ekleyen</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeUstalar.map((usta) => (
              <TableRow key={usta.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    {usta.adSoyad}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" />
                    {usta.telefon || '-'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon color="action" />
                    {usta.adres || '-'}
                  </Box>
                </TableCell>
                <TableCell>
                  {usta.email || '-'}
                </TableCell>
                <TableCell>
                  {usta.uzmanlikAlani ? (
                    <Chip 
                      label={usta.uzmanlikAlani} 
                      color="info" 
                      size="small"
                      icon={<WorkIcon />}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={usta.createdByUsername || 'Bilinmiyor'} 
                    color="secondary" 
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                                 <TableCell>
                   <Box sx={{ display: 'flex', gap: 1 }}>
                     <IconButton 
                       size="small" 
                       color="primary" 
                       onClick={() => handleOpenDialog(usta)}
                       title="Düzenle"
                     >
                       <EditIcon />
                     </IconButton>
                     <IconButton 
                       size="small" 
                       color="warning" 
                       onClick={() => handleDeactivate(usta)}
                       title="Pasife Çevir"
                     >
                       <DeleteIcon />
                     </IconButton>
                     <IconButton 
                       size="small" 
                       color="error" 
                       onClick={() => handleDeletePermanent(usta)}
                       title="Kalıcı Sil"
                     >
                       <DeleteForeverIcon />
                     </IconButton>
                   </Box>
                 </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pasif Ustalar Tablosu */}
      {inactiveUstalar.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Pasif Ustalar
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.500' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ad Soyad</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Telefon</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Adres</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>E-posta</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Uzmanlık Alanı</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ekleyen</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactiveUstalar.map((usta) => (
                  <TableRow key={usta.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="disabled" />
                        {usta.adSoyad}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon color="disabled" />
                        {usta.telefon || '-'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon color="disabled" />
                        {usta.adres || '-'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {usta.email || '-'}
                    </TableCell>
                    <TableCell>
                      {usta.uzmanlikAlani ? (
                        <Chip 
                          label={usta.uzmanlikAlani} 
                          color="default" 
                          size="small"
                          icon={<WorkIcon />}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={usta.createdByUsername || 'Bilinmiyor'} 
                        color="default" 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                                     <TableCell>
                   <Box sx={{ display: 'flex', gap: 1 }}>
                     <IconButton 
                       size="small" 
                       color="primary" 
                       onClick={() => handleOpenDialog(usta)}
                       title="Düzenle"
                     >
                       <EditIcon />
                     </IconButton>
                     <IconButton 
                       size="small" 
                       color="success" 
                       onClick={() => handleActivate(usta)}
                       title="Aktifleştir"
                     >
                       <RestoreIcon />
                     </IconButton>
                   </Box>
                 </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Usta Ekleme/Düzenleme Dialog'u */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          pb: 3,
          pt: 3
        }}>
          {editingUsta ? 'Usta Düzenle' : 'Yeni Usta Ekle'}
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ad Soyad *"
                value={form.adSoyad}
                onChange={(e) => handleFormChange('adSoyad', e.target.value)}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefon (5XX-XXX-XXXX)"
                value={form.telefon}
                onChange={(e) => {
                  // Sadece rakamları al
                  const numbers = e.target.value.replace(/\D/g, '');

                  // Eğer 10 rakamdan fazlaysa, mevcut değeri koru
                  if (numbers.length > 10) {
                    return; // Hiçbir şey yapma, mevcut değeri koru
                  }

                  const formatted = formatPhoneNumber(numbers);
                  handleFormChange('telefon', formatted);
                }}
                margin="normal"
                inputProps={{
                  maxLength: 12, // 5XX-XXX-XXXX formatı için
                  placeholder: "5XX-XXX-XXXX"
                }}
                error={form.telefon && !validatePhoneNumber(form.telefon)}
                helperText={form.telefon && !validatePhoneNumber(form.telefon) ?
                  "Telefon numarası 10 rakam olmalıdır (5XX-XXX-XXXX)" :
                  form.telefon && validatePhoneNumber(form.telefon) ? "✓ Geçerli telefon numarası" : "5XX-XXX-XXXX formatında giriniz"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adres"
                value={form.adres}
                onChange={(e) => handleFormChange('adres', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Uzmanlık Alanı"
                value={form.uzmanlikAlani}
                onChange={(e) => handleFormChange('uzmanlikAlani', e.target.value)}
                margin="normal"
                placeholder="Örn: Isıtma, Soğutma, Elektrik, vb."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-posta"
                type="email"
                value={form.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                margin="normal"
                placeholder="usta@ornek.com"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            İptal
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)'
              }
            }}
          >
            {editingUsta ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 