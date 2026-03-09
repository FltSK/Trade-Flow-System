import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
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
  Alert,
  IconButton,
  Chip,
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  apiGetDukkanCarisi,
  apiCreateDukkanCarisi,
  apiUpdateDukkanCarisi,
  apiDeleteDukkanCarisi,
  apiSearchDukkanCarisi
} from '../utils/helpers';

export default function DukkanCarisiPage() {
  const { user } = useAuth();
  const [dukkanCarisi, setDukkanCarisi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({
    aciklama: '',
    tutar: 0,
    yapilanIslem: 'Çıkış',
    islemTarihi: new Date()
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [islemFilter, setIslemFilter] = useState('');
  const [baslangicTarihi, setBaslangicTarihi] = useState(null);
  const [bitisTarihi, setBitisTarihi] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDukkanCarisi();
    }
  }, [user]);

  // Filtre alanları değiştiğinde otomatik arama (debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      handleSearch();
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, islemFilter, baslangicTarihi, bitisTarihi]);

  const loadDukkanCarisi = async () => {
    try {
      setLoading(true);
      const result = await apiGetDukkanCarisi();
      if (result.success) {
        setDukkanCarisi(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Dükkan carisi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditMode(true);
      setSelectedItem(item);
      setForm({
        aciklama: item.aciklama,
        tutar: item.tutar,
        yapilanIslem: item.yapilanIslem,
        islemTarihi: new Date(item.islemTarihi)
      });
    } else {
      setEditMode(false);
      setSelectedItem(null);
      setForm({
        aciklama: '',
        tutar: 0,
        yapilanIslem: 'Çıkış',
        islemTarihi: new Date()
      });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedItem(null);
    setForm({
      aciklama: '',
      tutar: 0,
      yapilanIslem: 'Çıkış',
      islemTarihi: new Date()
    });
    setError('');
  };

  const handleFormChange = (field) => (event) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!form.aciklama || form.tutar <= 0 || !form.islemTarihi) {
        setError('Lütfen tüm alanları doldurun');
        return;
      }

      let result;
      if (editMode) {
        result = await apiUpdateDukkanCarisi(selectedItem.id, {
          ...form,
          islemTarihi: form.islemTarihi.toISOString(),
          guncelleyenKullanici: user?.username || 'Sistem'
        });
      } else {
        result = await apiCreateDukkanCarisi({
          ...form,
          islemTarihi: form.islemTarihi.toISOString(),
          yapanKullanici: user?.username || 'Sistem'
        });
      }

      if (result.success) {
        handleCloseDialog();
        await loadDukkanCarisi();
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('İşlem sırasında hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      try {
        const result = await apiDeleteDukkanCarisi(id);
        if (result.success) {
          await loadDukkanCarisi();
          setError('');
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('Kayıt silinirken hata oluştu');
      }
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const result = await apiSearchDukkanCarisi(searchTerm, islemFilter, baslangicTarihi, bitisTarihi);
      if (result.success) {
        setDukkanCarisi(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Arama yapılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIslemFilter('');
    setBaslangicTarihi(null);
    setBitisTarihi(null);
    loadDukkanCarisi();
  };

  const getIslemColor = (islem) => {
    switch (islem) {
      case 'Giriş':
        return 'success';
      case 'Çıkış':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateTotal = () => {
    return dukkanCarisi.reduce((total, item) => {
      if (item.yapilanIslem === 'Giriş') {
        return total + item.tutar;
      } else {
        return total - item.tutar;
      }
    }, 0);
  };

  const calculateFilteredTotal = () => {
    return dukkanCarisi.reduce((total, item) => {
      const d = new Date(item.islemTarihi);
      const startOk = !baslangicTarihi || d >= new Date(new Date(baslangicTarihi).setHours(0,0,0,0));
      const endOk = !bitisTarihi || d <= new Date(new Date(bitisTarihi).setHours(23,59,59,999));
      if (!startOk || !endOk) return total;
      if (item.yapilanIslem === 'Giriş') return total + item.tutar;
      return total - item.tutar;
    }, 0);
  };

  if (!(user?.role === 'admin')) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Bu sayfaya erişim yetkiniz bulunmamaktadır.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalanceWalletIcon sx={{ mr: 2 }} />
          Dükkan Carisi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Kayıt Ekle
        </Button>
      </Box>

      {/* Toplam Bakiye Kartı */}
      <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Toplam Bakiye
          </Typography>
          <Typography variant="h4" component="div" sx={{ 
            color: calculateTotal() >= 0 ? 'success.main' : 'error.main',
            fontWeight: 'bold'
          }}>
            {calculateTotal().toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </Typography>
          {(baslangicTarihi || bitisTarihi) && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Seçilen Aralık Toplamı
              </Typography>
              <Typography variant="h6" component="div" sx={{ 
                color: calculateFilteredTotal() >= 0 ? 'success.main' : 'error.main',
                fontWeight: 'bold'
              }}>
                {calculateFilteredTotal().toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Filtreler */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Açıklama Ara"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl sx={{ width: '150px' }} size="small">
                <InputLabel>İşlem Türü</InputLabel>
                <Select
                  value={islemFilter}
                  onChange={(e) => setIslemFilter(e.target.value)}
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="Giriş">Giriş</MenuItem>
                  <MenuItem value="Çıkış">Çıkış</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={baslangicTarihi}
                onChange={(newValue) => setBaslangicTarihi(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                label="Bitiş Tarihi"
                value={bitisTarihi}
                onChange={(newValue) => setBitisTarihi(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                onClick={handleClearSearch}
                fullWidth
              >
                Temizle
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell>Tutar</TableCell>
              <TableCell>İşlem Türü</TableCell>
              <TableCell>Yapan Kullanıcı</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dukkanCarisi.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {new Date(item.islemTarihi).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>{item.aciklama}</TableCell>
                <TableCell>
                  {item.tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.yapilanIslem}
                    color={getIslemColor(item.yapilanIslem)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{item.yapanKullanici}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(item)}
                    size="small"
                    title="Düzenle"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(item.id)}
                    size="small"
                    title="Sil"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Ekleme/Düzenleme Dialog'u */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Kayıt Düzenle' : 'Yeni Kayıt Ekle'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  value={form.aciklama}
                  onChange={handleFormChange('aciklama')}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tutar"
                  type="number"
                  value={form.tutar}
                  onChange={handleFormChange('tutar')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="islem-turu-label">İşlem Türü</InputLabel>
                    <Select
                      labelId="islem-turu-label"
                      label="İşlem Türü"
                      value={form.yapilanIslem}
                      onChange={handleFormChange('yapilanIslem')}
                      sx={{ minWidth: 160 }}
                    >
                      <MenuItem value="Giriş">Giriş</MenuItem>
                      <MenuItem value="Çıkış">Çıkış</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              
              <Grid item xs={12}>
                <DatePicker
                  label="İşlem Tarihi"
                  value={form.islemTarihi}
                  onChange={(newValue) => {
                    setForm(prev => ({
                      ...prev,
                      islemTarihi: newValue
                    }));
                  }}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 