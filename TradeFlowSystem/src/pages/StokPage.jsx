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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  ModelTraining as ModelTrainingIcon,
  Work as WorkIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useCustomers } from '../hooks/useCustomers';
import { useNavigate } from 'react-router-dom';
import {
  apiGetStoklar,
  apiCreateStok,
  apiUpdateStok,
  apiDeleteStok,
  apiRestoreStok,
  apiGetStokHareketleri,
  apiCreateStokHareketi,
  apiGetProductTypes,
  apiGetBrands,
  apiGetBrandsByProductType,
  apiGetModelsByBrandAndProductType,
  apiDeactivateStok,
  apiActivateStok
} from '../utils/helpers';

export default function StokPage() {
  const { user } = useAuth();
  const { checkAndUpdateCustomerColors } = useCustomers();
  const navigate = useNavigate();
  const [stoklar, setStoklar] = useState([]);
  const [hareketler, setHareketler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openHareketDialog, setOpenHareketDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStok, setSelectedStok] = useState(null);
  const [deletedStok, setDeletedStok] = useState(null); // Silinen stok bilgisi
  const [showRestoreButton, setShowRestoreButton] = useState(false); // Geri alma butonu görünürlüğü
  const [form, setForm] = useState({
    urunTuru: '',
    marka: '',
    model: '',
    miktar: 0,
    minimumStok: 1,
    birimFiyat: 0
  });

  const [productTypes, setProductTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [hareketForm, setHareketForm] = useState({
    stokId: '',
    miktar: 0,
    hareketTipi: 'Giriş',
    aciklama: ''
  });

  // Load product types from API
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      loadProductTypes();
    }
  }, [user]);

  const loadProductTypes = async () => {
    try {
      const result = await apiGetProductTypes();
      if (result.success) {
        setProductTypes(result.data);
      }
    } catch (error) {

    }
  };

  const loadBrandsByProductType = async (productTypeId) => {
    if (!productTypeId) {
      setBrands([]);
      return [];
    }

    try {
      const result = await apiGetBrandsByProductType(productTypeId);
      if (result.success) {
        setBrands(result.data);
        return result.data;
      } else {
        setBrands([]);
        return [];
      }
    } catch (error) {

      setBrands([]);
      return [];
    }
  };

  const loadModels = async (brandId, productTypeId) => {
    if (!brandId || !productTypeId) {
      setModels([]);
      return [];
    }

    try {
      const result = await apiGetModelsByBrandAndProductType(brandId, productTypeId);
      if (result.success) {
        setModels(result.data);
        return result.data;
      } else {
        setModels([]);
        return [];
      }
    } catch (error) {

      setModels([]);
      return [];
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      loadStoklar();
      loadHareketler();
    }
  }, [user]);

  const loadStoklar = async () => {
    try {
      const result = await apiGetStoklar();
      if (result.success) {
        setStoklar(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Stoklar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadHareketler = async () => {
    try {
      const result = await apiGetStokHareketleri();
      if (result.success) {
        setHareketler(result.data);
      }
    } catch (error) {

    }
  };

  const handleOpenDialog = (stok = null) => {
    if (stok) {
      setEditMode(true);
      setSelectedStok(stok);
      
      // Find the corresponding IDs for the existing stok data
      const productType = productTypes.find(pt => pt.ad === stok.urunTuru);
      
      setForm({
        urunTuru: productType?.id || '',
        marka: '', // Will be set after brands are loaded
        model: '', // Will be set after models are loaded
        miktar: stok.miktar,
        minimumStok: stok.minimumStok,
        birimFiyat: stok.birimFiyat
      });

      // Load brands for the product type first
      if (productType) {
        loadBrandsByProductType(productType.id).then((loadedBrands) => {
          // Find the brand ID from the loaded brands
          const brand = loadedBrands.find(b => b.ad === stok.marka);
          if (brand) {
            setForm(prev => ({
              ...prev,
              marka: brand.id
            }));
            
            // Load models for the brand and product type
            loadModels(brand.id, productType.id).then((loadedModels) => {
              // Find the model ID from the loaded models
              const model = loadedModels.find(m => m.ad === stok.model);
              if (model) {
                setForm(prev => ({
                  ...prev,
                  model: model.id
                }));
              }
            });
          }
        });
      }
    } else {
      setEditMode(false);
      setSelectedStok(null);
      setForm({
        urunTuru: '',
        marka: '',
        model: '',
        miktar: 0,
        minimumStok: 1,
        birimFiyat: 0
      });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedStok(null);
    setForm({
      urunTuru: '',
      marka: '',
      model: '',
      miktar: 0,
      minimumStok: 1,
      birimFiyat: 0
    });
    setError('');
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;
    setForm(prev => ({
      ...prev,
      [field]: value
    }));

    // If product type changes, load brands for that product type
    if (field === 'urunTuru') {
      const productTypeId = value;
      
      if (productTypeId) {
        loadBrandsByProductType(productTypeId);
      } else {
        setBrands([]);
        setModels([]);
      }
      
      // Clear brand and model when product type changes
      setForm(prev => ({
        ...prev,
        marka: '',
        model: ''
      }));
    }
    
    // If brand changes, load models for that brand and product type
    if (field === 'marka') {
      const brandId = value;
      const productTypeId = form.urunTuru;
      
      if (brandId && productTypeId) {
        loadModels(brandId, productTypeId);
      } else {
        setModels([]);
      }
      
      // Clear model when brand changes
      setForm(prev => ({
        ...prev,
        model: ''
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Get the actual names from IDs
      const selectedProductType = productTypes.find(pt => pt.id === parseInt(form.urunTuru));
      const selectedBrand = brands.find(b => b.id === parseInt(form.marka));
      const selectedModel = models.find(m => m.id === parseInt(form.model));

      if (!selectedProductType || !selectedBrand || !selectedModel) {
        setError('Lütfen tüm alanları doldurun');
        return;
      }

      const stokData = {
        urunTuru: selectedProductType.ad,
        marka: selectedBrand.ad,
        model: selectedModel.ad,
        miktar: form.miktar,
        minimumStok: form.minimumStok,
        birimFiyat: form.birimFiyat
      };

      let result;
      if (editMode) {
        result = await apiUpdateStok(selectedStok.id, stokData);
      } else {
        result = await apiCreateStok(stokData);
      }

      if (result.success) {
        handleCloseDialog();
        await loadStoklar();
        loadHareketler();
        
        // localStorage artık SignalR ile otomatik güncelleniyor
        
        // Stok güncellendiğinde müşteri renklerini kontrol et
        if (editMode) {
          // Güncellenmiş stok verilerini al
          const updatedStoklar = await apiGetStoklar();
          if (updatedStoklar.success) {
            checkAndUpdateCustomerColors(updatedStoklar.data);
          }
        }
        
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('İşlem sırasında hata oluştu');
    }
  };

  const handleDeleteStok = async (stokId) => {
    if (window.confirm('Bu stok kaydını silmek istediğinizden emin misiniz?')) {
      try {
        const result = await apiDeleteStok(stokId);
        if (result.success) {
          // Silinen stok bilgisini sakla
          const silinenStok = stoklar.find(s => s.id === stokId);
          setDeletedStok(silinenStok);
          setShowRestoreButton(true);
          
          // 20 saniye sonra geri alma butonunu gizle
          setTimeout(() => {
            setShowRestoreButton(false);
            setDeletedStok(null);
          }, 20000);
          
          loadStoklar();
          loadHareketler();
          
          // localStorage artık SignalR ile otomatik güncelleniyor
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('Stok silinirken hata oluştu');
      }
    }
  };

  const handleRestoreStok = async () => {
    if (!deletedStok) return;
    
    try {
      const result = await apiRestoreStok(deletedStok.id);
      if (result.success) {
        setShowRestoreButton(false);
        setDeletedStok(null);
        await loadStoklar();
        loadHareketler();
        
        // localStorage artık SignalR ile otomatik güncelleniyor
        
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Stok geri yüklenirken hata oluştu');
    }
  };

  const handleOpenHareketDialog = (stok) => {
    setHareketForm({
      stokId: stok.id,
      miktar: 0,
      hareketTipi: 'Giriş',
      aciklama: ''
    });
    setOpenHareketDialog(true);
  };

  const handleCloseHareketDialog = () => {
    setOpenHareketDialog(false);
    setHareketForm({
      stokId: '',
      miktar: 0,
      hareketTipi: 'Giriş',
      aciklama: ''
    });
  };

  const handleHareketFormChange = (field) => (event) => {
    setHareketForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleHareketSubmit = async () => {
    try {
      const result = await apiCreateStokHareketi(hareketForm);
      if (result.success) {
        handleCloseHareketDialog();
        await loadStoklar();
        loadHareketler();
        
        // Stok hareketi eklendiğinde müşteri renklerini kontrol et
        const updatedStoklar = await apiGetStoklar();
        if (updatedStoklar.success) {
          checkAndUpdateCustomerColors(updatedStoklar.data);
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Hareket eklenirken hata oluştu');
    }
  };

  const getStokDurumu = (stok) => {
    if (stok.miktar < 0) return { color: 'error', icon: <ErrorIcon />, text: `Eksi Stok (${stok.miktar})` };
    if (stok.miktar === 0) return { color: 'error', icon: <ErrorIcon />, text: 'Stok Yok' };
    if (stok.miktar <= stok.minimumStok) return { color: 'warning', icon: <WarningIcon />, text: 'Kritik Stok' };
    return { color: 'success', icon: <CheckCircleIcon />, text: 'Yeterli Stok' };
  };

  if (!(user?.role === 'admin' || user?.role === 'superadmin')) {
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
          <InventoryIcon sx={{ mr: 2 }} />
          Stok Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Stok Ekle
        </Button>
      </Box>

      {/* Geri Alma Butonu */}
      {showRestoreButton && deletedStok && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRestoreStok}
              sx={{ ml: 1 }}
            >
              Geri Al
            </Button>
          }
        >
          "{deletedStok.urunTuru} {deletedStok.marka} {deletedStok.model}" silindi. 
          Geri almak için butona tıklayın.
        </Alert>
      )}

      {/* Ürün Yönetimi Butonları */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="urun-yonetimi-content"
          id="urun-yonetimi-header"
          sx={{
            backgroundColor: '#f5f5f5',
            '&:hover': {
              backgroundColor: '#eeeeee'
            }
          }}
        >
          <Typography variant="h6" sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 1 }} />
            Ürün ve İş Yönetimi
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => navigate('/urun-turleri')}
                fullWidth
                sx={{ 
                  py: 2,
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': {
                    borderColor: '#388e3c',
                    backgroundColor: '#f1f8e9'
                  }
                }}
              >
                Ürün Türleri
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                startIcon={<BusinessIcon />}
                onClick={() => navigate('/markalar')}
                fullWidth
                sx={{ 
                  py: 2,
                  borderColor: '#2196f3',
                  color: '#2196f3',
                  '&:hover': {
                    borderColor: '#1976d2',
                    backgroundColor: '#e3f2fd'
                  }
                }}
              >
                Markalar
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                startIcon={<ModelTrainingIcon />}
                onClick={() => navigate('/modeller')}
                fullWidth
                sx={{ 
                  py: 2,
                  borderColor: '#ff9800',
                  color: '#ff9800',
                  '&:hover': {
                    borderColor: '#f57c00',
                    backgroundColor: '#fff3e0'
                  }
                }}
              >
                Modeller
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                startIcon={<WorkIcon />}
                onClick={() => navigate('/is-tanimlari')}
                fullWidth
                sx={{ 
                  py: 2,
                  borderColor: '#9c27b0',
                  color: '#9c27b0',
                  '&:hover': {
                    borderColor: '#7b1fa2',
                    backgroundColor: '#f3e5f5'
                  }
                }}
              >
                İş Tanımları
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ürün Türü</TableCell>
              <TableCell>Marka</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Miktar</TableCell>
              <TableCell>Minimum Stok</TableCell>
              <TableCell>Birim Fiyat</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stoklar.map((stok) => {
              const durum = getStokDurumu(stok);
              return (
                <TableRow 
                  key={stok.id}
                  sx={{
                    backgroundColor: stok.miktar < 0 ? '#ffcdd2' : 
                                   stok.miktar === 0 ? '#ffebee' : 
                                   stok.miktar <= stok.minimumStok ? '#fff3e0' : 'inherit'
                  }}
                >
                  <TableCell>{stok.urunTuru}</TableCell>
                  <TableCell>{stok.marka}</TableCell>
                  <TableCell>
                    {stok.model}
                    {!stok.isActive && (
                      <Chip label="Pasif" color="default" size="small" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>{stok.miktar}</TableCell>
                  <TableCell>{stok.minimumStok}</TableCell>
                  <TableCell>{stok.birimFiyat?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                  <TableCell>
                    <Chip 
                      icon={durum.icon}
                      label={durum.text}
                      color={durum.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenHareketDialog(stok)}
                      size="small"
                      title="Stok Hareketi Ekle"
                    >
                      <InventoryIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(stok)}
                      size="small"
                      title="Düzenle"
                    >
                      <EditIcon />
                    </IconButton>
                    {stok.isActive ? (
                      <Button size="small" variant="outlined" color="warning" sx={{ ml: 1 }} onClick={async ()=>{
                        const r = await apiDeactivateStok(stok.id);
                        if (r.success) { loadStoklar(); }
                        else { setError(r.error); }
                      }}>Pasif Yap</Button>
                    ) : (
                      <Button size="small" variant="outlined" color="success" sx={{ ml: 1 }} onClick={async ()=>{
                        const r = await apiActivateStok(stok.id);
                        if (r.success) { loadStoklar(); }
                        else { setError(r.error); }
                      }}>Aktif Yap</Button>
                    )}
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteStok(stok.id)}
                      size="small"
                      title="Sil"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Stok Ekleme/Düzenleme Dialog'u */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Stok Düzenle' : 'Yeni Stok Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ minWidth: 180, maxWidth: 300, width: '100%' }}>
                <InputLabel>Ürün Türü</InputLabel>
                <Select
                  value={form.urunTuru}
                  onChange={handleFormChange('urunTuru')}
                  label="Ürün Türü"
                >
                  {productTypes.map((productType) => (
                    <MenuItem key={productType.id} value={productType.id}>
                      {productType.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl sx={{ minWidth: 180, maxWidth: 300, width: '100%' }}>
                <InputLabel>Marka</InputLabel>
                <Select
                  value={form.marka}
                  onChange={handleFormChange('marka')}
                  label="Marka"
                >
                  {brands.map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl sx={{ minWidth: 180, maxWidth: 300, width: '100%' }}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={form.model}
                  onChange={handleFormChange('model')}
                  label="Model"
                  disabled={!form.urunTuru || !form.marka}
                >
                  {models.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Miktar"
                type="number"
                value={form.miktar}
                onChange={handleFormChange('miktar')}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Stok"
                type="number"
                value={form.minimumStok}
                onChange={handleFormChange('minimumStok')}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Birim Fiyat"
                type="number"
                value={form.birimFiyat}
                onChange={handleFormChange('birimFiyat')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stok Hareketi Dialog'u */}
      <Dialog 
        open={openHareketDialog} 
        onClose={handleCloseHareketDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Stok Hareketi Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Hareket Tipi</InputLabel>
                <Select
                  value={hareketForm.hareketTipi}
                  onChange={handleHareketFormChange('hareketTipi')}
                  label="Hareket Tipi"
                >
                  <MenuItem value="Giriş">Giriş</MenuItem>
                  <MenuItem value="Çıkış">Çıkış</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Miktar"
                type="number"
                value={hareketForm.miktar}
                onChange={handleHareketFormChange('miktar')}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                value={hareketForm.aciklama}
                onChange={handleHareketFormChange('aciklama')}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHareketDialog}>İptal</Button>
          <Button onClick={handleHareketSubmit} variant="contained">
            Ekle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 