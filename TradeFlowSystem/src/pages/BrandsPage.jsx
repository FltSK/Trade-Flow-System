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
  Business as BusinessIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  apiGetBrands,
  apiCreateBrand,
  apiUpdateBrand,
  apiDeleteBrand,
  apiGetProductTypes,
  apiGetBrandProductTypes,
  apiAddProductTypeToBrand,
  apiRemoveProductTypeFromBrand
} from '../utils/helpers';

export default function BrandsPage() {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openProductTypeDialog, setOpenProductTypeDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedBrandForProductType, setSelectedBrandForProductType] = useState(null);
  const [brandProductTypes, setBrandProductTypes] = useState([]);
  const [form, setForm] = useState({
    ad: ''
  });
  const [productTypeForm, setProductTypeForm] = useState({
    productTypeId: ''
  });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      loadBrands();
      loadProductTypes();
    }
  }, [user]);

  const loadBrands = async () => {
    try {
      const result = await apiGetBrands();
      if (result.success) {
        setBrands(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Markalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
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

  const loadBrandProductTypes = async (brandId) => {
    if (!brandId) {

      return;
    }
    try {
      const result = await apiGetBrandProductTypes(brandId);
      if (result.success) {
        setBrandProductTypes(result.data);
      } else {

      }
    } catch (error) {

    }
  };

  const handleOpenDialog = (brand = null) => {
    if (brand) {
      setEditMode(true);
      setSelectedBrand(brand);
      setForm({
        ad: brand.ad
      });
    } else {
      setEditMode(false);
      setSelectedBrand(null);
      setForm({
        ad: ''
      });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedBrand(null);
    setForm({
      ad: ''
    });
    setError('');
  };

  const handleOpenProductTypeDialog = (brand) => {
    if (!brand || !brand.id) {
      setError('Geçersiz marka bilgisi');
      return;
    }
    setSelectedBrandForProductType(brand);
    loadBrandProductTypes(brand.id);
    setProductTypeForm({
      productTypeId: ''
    });
    setOpenProductTypeDialog(true);
  };

  const handleCloseProductTypeDialog = () => {
    setOpenProductTypeDialog(false);
    setSelectedBrandForProductType(null);
    setBrandProductTypes([]);
    setProductTypeForm({
      productTypeId: ''
    });
  };

  const handleFormChange = (field) => (event) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleProductTypeFormChange = (field) => (event) => {
    setProductTypeForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    if (!form.ad.trim()) {
      setError('Marka adı boş olamaz');
      return;
    }

    try {
      let result;
      if (editMode) {
        result = await apiUpdateBrand(selectedBrand.id, form);
      } else {
        result = await apiCreateBrand(form);
      }

      if (result.success) {
        handleCloseDialog();
        loadBrands();
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('İşlem sırasında hata oluştu');
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (window.confirm('Bu markayı silmek istediğinizden emin misiniz?')) {
      try {
        const result = await apiDeleteBrand(brandId);
        if (result.success) {
          loadBrands();
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('Marka silinirken hata oluştu');
      }
    }
  };

  const handleAddProductType = async () => {
    if (!productTypeForm.productTypeId) {
      setError('Lütfen bir ürün türü seçin');
      return;
    }

    try {
      const result = await apiAddProductTypeToBrand(selectedBrandForProductType.id, productTypeForm.productTypeId);
      if (result.success) {
        loadBrandProductTypes(selectedBrandForProductType.id);
        setProductTypeForm({
          productTypeId: ''
        });
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Ürün türü eklenirken hata oluştu');
    }
  };

  const handleRemoveProductType = async (productTypeId) => {
    if (!productTypeId) {
      setError('Geçersiz ürün türü ID');
      return;
    }
    
    if (window.confirm('Bu ürün türünü markadan kaldırmak istediğinizden emin misiniz?')) {
      try {
        const result = await apiRemoveProductTypeFromBrand(selectedBrandForProductType.id, productTypeId);
        if (result.success) {
          loadBrandProductTypes(selectedBrandForProductType.id);
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('Ürün türü kaldırılırken hata oluştu');
      }
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
          <BusinessIcon sx={{ mr: 2 }} />
          Markalar Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Marka Ekle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'string' ? error : 'Bir hata oluştu'}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Marka Adı</TableCell>
              <TableCell>Oluşturulma Tarihi</TableCell>
              <TableCell>Güncellenme Tarihi</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>
                  <Chip 
                    label={brand.ad}
                    color="secondary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {new Date(brand.createdAt).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  {brand.updatedAt 
                    ? new Date(brand.updatedAt).toLocaleDateString('tr-TR')
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(brand)}
                    size="small"
                    title="Düzenle"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="info"
                    onClick={() => handleOpenProductTypeDialog(brand)}
                    size="small"
                    title="Ürün Türleri"
                  >
                    <LinkIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteBrand(brand.id)}
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

      {/* Marka Ekleme/Düzenleme Dialog'u */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Marka Düzenle' : 'Yeni Marka Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Marka Adı"
            value={form.ad}
            onChange={handleFormChange('ad')}
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Marka Ürün Türleri Dialog'u */}
      <Dialog 
        open={openProductTypeDialog} 
        onClose={handleCloseProductTypeDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedBrandForProductType?.ad} - Ürün Türleri
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
                         <Grid item xs={12} md={6}>
               <FormControl sx={{ width: '100%' }}>
                 <Select
                   value={productTypeForm.productTypeId}
                   onChange={handleProductTypeFormChange('productTypeId')}
                   displayEmpty
                   placeholder="Ürün Türü Seçin"
                 >
                   <MenuItem value="" disabled>
                     Ürün Türü Seçin
                   </MenuItem>
                   {productTypes
                     .filter(pt => !brandProductTypes.some(bpt => bpt.productTypeId === pt.id))
                     .map((productType) => (
                       <MenuItem key={productType.id} value={productType.id}>
                         {productType.ad}
                       </MenuItem>
                     ))}
                 </Select>
               </FormControl>
             </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                onClick={handleAddProductType}
                disabled={!productTypeForm.productTypeId}
                fullWidth
                sx={{ mt: 1 }}
              >
                Ürün Türü Ekle
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Mevcut Ürün Türleri:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                             {brandProductTypes.map((bpt) => {
                 return (
                   <Chip
                     key={bpt.id}
                     label={bpt.productType?.ad || 'Bilinmeyen'}
                     color="primary"
                     onDelete={() => handleRemoveProductType(bpt.productTypeId)}
                     deleteIcon={<LinkOffIcon />}
                   />
                 );
               })}
              {brandProductTypes.length === 0 && (
                <Typography color="text.secondary">
                  Henüz ürün türü eklenmemiş
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductTypeDialog}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 