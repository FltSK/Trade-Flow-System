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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  ModelTraining as ModelIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  apiGetModels,
  apiCreateModel,
  apiUpdateModel,
  apiDeleteModel,
  apiGetBrands,
  apiGetProductTypes,
  apiDeactivateModel,
  apiActivateModel
} from '../utils/helpers';

export default function ModelsPage() {
  const { user } = useAuth();
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [form, setForm] = useState({
    ad: '',
    brandId: '',
    productTypeId: ''
  });
  const [inactiveModelIds, setInactiveModelIds] = useState([]);

  // Backend artık IsActive döndürdüğü için LocalStorage pasif listesine ayrıca ihtiyaç olmayabilir.
  // Yine de kullanıcı tercihini korumak istersek combine edebiliriz.

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      loadModels();
      loadBrands();
      loadProductTypes();
    }
  }, [user]);

  const loadModels = async () => {
    try {
      const result = await apiGetModels();
      if (result.success) {
        setModels(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Modeller yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const result = await apiGetBrands();
      if (result.success) {
        setBrands(result.data);
      }
    } catch (error) {

    }
  };

  const loadProductTypes = async () => {
    try {
      const result = await apiGetProductTypes();
      if (result.success) {
        setProductTypes(result.data);
      }
    } catch (error) {

    }
  };

  const handleOpenDialog = (model = null) => {
    if (model) {
      setEditMode(true);
      setSelectedModel(model);
      setForm({
        ad: model.ad,
        brandId: model.brandId,
        productTypeId: model.productTypeId
      });
    } else {
      setEditMode(false);
      setSelectedModel(null);
      setForm({
        ad: '',
        brandId: '',
        productTypeId: ''
      });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedModel(null);
    setForm({
      ad: '',
      brandId: '',
      productTypeId: ''
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
    if (!form.ad.trim()) {
      setError('Model adı boş olamaz');
      return;
    }
    if (!form.brandId) {
      setError('Lütfen bir marka seçin');
      return;
    }
    if (!form.productTypeId) {
      setError('Lütfen bir ürün türü seçin');
      return;
    }

    try {
      let result;
      if (editMode) {
        result = await apiUpdateModel(selectedModel.id, form);
      } else {
        result = await apiCreateModel(form);
      }

      if (result.success) {
        handleCloseDialog();
        loadModels();
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('İşlem sırasında hata oluştu');
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (window.confirm('Bu modeli silmek istediğinizden emin misiniz?')) {
      try {
        const result = await apiDeleteModel(modelId);
        if (result.success) {
          loadModels();
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('Model silinirken hata oluştu');
      }
    }
  };

  const handleDeactivateModel = async (modelId) => {
    if (!window.confirm('Bu modeli pasif yapmak istediğinize emin misiniz?')) return;
    const res = await apiDeactivateModel(modelId);
    if (res.success) {
      await loadModels();
    } else {
      setError(res.error);
    }
  };

  const handleActivateModel = async (modelId) => {
    const res = await apiActivateModel(modelId);
    if (res.success) {
      await loadModels();
    } else {
      setError(res.error);
    }
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <ModelIcon sx={{ mr: 2 }} />
          Modeller Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Model Ekle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'string' ? error : 'Bir hata oluştu'}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
              <TableRow>
                <TableCell>Model Adı</TableCell>
              <TableCell>Marka</TableCell>
              <TableCell>Ürün Türü</TableCell>
              <TableCell>Oluşturulma Tarihi</TableCell>
              <TableCell>Güncellenme Tarihi</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} sx={{ opacity: model.isActive === false ? 0.5 : 1 }}>
                <TableCell>
                  <Chip 
                    label={model.ad}
                    color="success"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={model.brandAd}
                    color="secondary"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={model.productTypeAd}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(model.createdAt).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  {model.updatedAt 
                    ? new Date(model.updatedAt).toLocaleDateString('tr-TR')
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(model)}
                    size="small"
                    title="Düzenle"
                  >
                    <EditIcon />
                  </IconButton>
                  {model.isActive === false ? (
                    <IconButton
                      color="success"
                      onClick={() => handleActivateModel(model.id)}
                      size="small"
                      title="Aktif Yap"
                    >
                      <Chip label="Aktif Yap" color="success" size="small" variant="outlined" />
                    </IconButton>
                  ) : (
                    <IconButton
                      color="warning"
                      onClick={() => handleDeactivateModel(model.id)}
                      size="small"
                      title="Pasif Yap"
                    >
                      <Chip label="Pasif Yap" color="warning" size="small" variant="outlined" />
                    </IconButton>
                  )}
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteModel(model.id)}
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

      {/* Model Ekleme/Düzenleme Dialog'u */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Model Düzenle' : 'Yeni Model Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Model Adı"
                value={form.ad}
                onChange={handleFormChange('ad')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ width: '100%' }}>
                <Select
                  value={form.brandId}
                  onChange={handleFormChange('brandId')}
                  displayEmpty
                  placeholder="Marka Seçin"
                >
                  <MenuItem value="" disabled>
                    Marka Seçin
                  </MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ width: '100%' }}>
                <Select
                  value={form.productTypeId}
                  onChange={handleFormChange('productTypeId')}
                  displayEmpty
                  placeholder="Ürün Türü Seçin"
                >
                  <MenuItem value="" disabled>
                    Ürün Türü Seçin
                  </MenuItem>
                  {productTypes.map((productType) => (
                    <MenuItem key={productType.id} value={productType.id}>
                      {productType.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
    </Container>
  );
} 