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
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  apiGetProductTypes,
  apiCreateProductType,
  apiUpdateProductType,
  apiDeleteProductType
} from '../utils/helpers';

export default function ProductTypesPage() {
  const { user } = useAuth();
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [form, setForm] = useState({
    ad: ''
  });

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
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Ürün türleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (productType = null) => {
    if (productType) {
      setEditMode(true);
      setSelectedProductType(productType);
      setForm({
        ad: productType.ad
      });
    } else {
      setEditMode(false);
      setSelectedProductType(null);
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
    setSelectedProductType(null);
    setForm({
      ad: ''
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
      setError('Ürün türü adı boş olamaz');
      return;
    }

    try {
      let result;
      if (editMode) {
        result = await apiUpdateProductType(selectedProductType.id, form);
      } else {
        result = await apiCreateProductType(form);
      }

      if (result.success) {
        handleCloseDialog();
        loadProductTypes();
        setError('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('İşlem sırasında hata oluştu');
    }
  };

  const handleDeleteProductType = async (productTypeId) => {
    if (window.confirm('Bu ürün türünü silmek istediğinizden emin misiniz?')) {
      try {
        const result = await apiDeleteProductType(productTypeId);
        if (result.success) {
          loadProductTypes();
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('Ürün türü silinirken hata oluştu');
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
          <CategoryIcon sx={{ mr: 2 }} />
          Ürün Türleri Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Ürün Türü Ekle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'string' ? error : 'Bir hata oluştu'}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ürün Türü Adı</TableCell>
              <TableCell>Oluşturulma Tarihi</TableCell>
              <TableCell>Güncellenme Tarihi</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productTypes.map((productType) => (
              <TableRow key={productType.id}>
                <TableCell>
                  <Chip 
                    label={productType.ad}
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {new Date(productType.createdAt).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  {productType.updatedAt 
                    ? new Date(productType.updatedAt).toLocaleDateString('tr-TR')
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(productType)}
                    size="small"
                    title="Düzenle"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteProductType(productType.id)}
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

      {/* Ürün Türü Ekleme/Düzenleme Dialog'u */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Ürün Türü Düzenle' : 'Yeni Ürün Türü Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Ürün Türü Adı"
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
    </Container>
  );
} 