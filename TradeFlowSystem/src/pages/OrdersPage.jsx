import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { 
  apiGetOrders, 
  apiCreateOrder, 
  apiUpdateOrder, 
  apiDeleteOrder,
  apiGetStoklar,
  apiGetCustomers
} from '../utils/helpers';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stoklar, setStoklar] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({
    customerId: '',
    stokId: '',
    miktar: 1,
    notlar: '',
    status: 'Bekliyor'
  });

  // Filtre state'leri
  const [filters, setFilters] = useState({
    status: '',
    customerName: '',
    tcKimlik: '',
    stokId: '',
    sortBy: 'siparisTarihi',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersResult, stoklarResult, customersResult] = await Promise.all([
        apiGetOrders(),
        apiGetStoklar(),
        apiGetCustomers()
      ]);

      if (ordersResult.success) {
        setOrders(ordersResult.data);
      }
      if (stoklarResult.success) {
        setStoklar(stoklarResult.data);
      }
      if (customersResult.success) {
        setCustomers(customersResult.data);
      }
    } catch (error) {
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (order = null) => {
    if (order) {
      setEditMode(true);
      setSelectedOrder(order);
      setForm({
        customerId: order.customerId,
        stokId: order.stokId,
        miktar: order.miktar,
        notlar: order.notlar || '',
        status: order.status
      });
    } else {
      setEditMode(false);
      setSelectedOrder(null);
      setForm({
        customerId: '',
        stokId: '',
        miktar: 1,
        notlar: '',
        status: 'Bekliyor'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedOrder(null);
    setForm({
      customerId: '',
      stokId: '',
      miktar: 1,
      notlar: '',
      status: 'Bekliyor'
    });
  };

  const handleFormChange = (field) => (event) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      const orderData = {
        customerId: parseInt(form.customerId),
        stokId: parseInt(form.stokId),
        miktar: parseInt(form.miktar),
        notlar: form.notlar,
        status: form.status
      };

      let result;
      if (editMode) {
        result = await apiUpdateOrder(selectedOrder.id, orderData);
      } else {
        result = await apiCreateOrder(orderData);
      }

      if (result.success) {
        await loadData();
        handleCloseDialog();
      } else {
        setError(result.error || 'Sipariş işlemi başarısız');
      }
    } catch (error) {
      setError('Sipariş işlemi sırasında hata oluştu');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
      try {
        const result = await apiDeleteOrder(orderId);
        if (result.success) {
          await loadData();
        } else {
          setError(result.error || 'Sipariş silinemedi');
        }
      } catch (error) {
        setError('Sipariş silinirken hata oluştu');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Bekliyor':
        return 'warning';
      case 'TahsisEdildi':
        return 'info';
      // 'Tamamlandi' gösterimini kaldırıyoruz (renk döndürmeyelim)
      case 'Iptal':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Bekliyor':
        return <PendingIcon />;
      case 'TahsisEdildi':
        return <AssignmentIcon />;
      // 'Tamamlandi' ikonu kaldırıldı
      case 'Iptal':
        return <CancelIcon />;
      default:
        return <ShoppingCartIcon />;
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.adSoyad} (${customer.tcKimlik})` : 'Bilinmeyen Müşteri';
  };

  const getStokName = (stokId) => {
    const stok = stoklar.find(s => s.id === stokId);
    return stok ? `${stok.marka} ${stok.model}` : 'Bilinmeyen Ürün';
  };

  // Filtreleme fonksiyonu
  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Durum filtresi
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Müşteri adı filtresi
    if (filters.customerName) {
      filtered = filtered.filter(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return customer && customer.adSoyad.toLowerCase().includes(filters.customerName.toLowerCase());
      });
    }

    // TC kimlik filtresi
    if (filters.tcKimlik) {
      filtered = filtered.filter(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return customer && customer.tcKimlik.includes(filters.tcKimlik);
      });
    }

    // Ürün filtresi
    if (filters.stokId) {
      filtered = filtered.filter(order => order.stokId === parseInt(filters.stokId));
    }

    // Sıralama
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'customerName':
          aValue = getCustomerName(a.customerId);
          bValue = getCustomerName(b.customerId);
          break;
        case 'stokName':
          aValue = getStokName(a.stokId);
          bValue = getStokName(b.stokId);
          break;
        case 'miktar':
          aValue = a.miktar;
          bValue = b.miktar;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'siparisTarihi':
        default:
          aValue = new Date(a.siparisTarihi);
          bValue = new Date(b.siparisTarihi);
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      customerName: '',
      tcKimlik: '',
      stokId: '',
      sortBy: 'siparisTarihi',
      sortOrder: 'desc'
    });
  };

  if (!(user?.role === 'admin' || user?.role === 'superadmin')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Bu sayfaya erişim yetkiniz bulunmamaktadır.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1976d2' }}>
          Sipariş Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            }
          }}
        >
          Yeni Sipariş
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bekleyen Siparişler
              </Typography>
              <Typography variant="h4">
                {getFilteredOrders().filter(o => o.status === 'Bekliyor').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tahsis Edilen
              </Typography>
              <Typography variant="h4">
                {getFilteredOrders().filter(o => o.status === 'TahsisEdildi').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Tamamlanan kartı kaldırıldı */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                İptal Edilen
              </Typography>
              <Typography variant="h4">
                {getFilteredOrders().filter(o => o.status === 'Iptal').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtreler */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 2 }}>
          Filtreler ve Sıralama
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl sx={{ width: '100px' }} size="small">
              <InputLabel>Durum</InputLabel>
              <Select
                value={filters.status}
                onChange={handleFilterChange('status')}
                label="Durum"
              >
                <MenuItem value="">Tümü</MenuItem>
                <MenuItem value="Bekliyor">Bekliyor</MenuItem>
                <MenuItem value="TahsisEdildi">Tahsis Edildi</MenuItem>
                {/* Tamamlandı ve İptal kaldırıldı */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Müşteri Adı"
              value={filters.customerName}
              onChange={handleFilterChange('customerName')}
              placeholder="Müşteri adı ara..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="TC Kimlik"
              value={filters.tcKimlik}
              onChange={handleFilterChange('tcKimlik')}
              placeholder="TC kimlik ara..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl sx={{ width: '100px' }} size="small">
              <InputLabel>Ürün</InputLabel>
              <Select
                value={filters.stokId}
                onChange={handleFilterChange('stokId')}
                label="Ürün"
              >
                <MenuItem value="">Tümü</MenuItem>
                {stoklar.map((stok) => (
                  <MenuItem key={stok.id} value={stok.id}>
                    {stok.marka} {stok.model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sıralama</InputLabel>
              <Select
                value={filters.sortBy}
                onChange={handleFilterChange('sortBy')}
                label="Sıralama"
              >
                <MenuItem value="siparisTarihi">Sipariş Tarihi</MenuItem>
                <MenuItem value="customerName">Müşteri Adı</MenuItem>
                <MenuItem value="stokName">Ürün</MenuItem>
                <MenuItem value="miktar">Miktar</MenuItem>
                <MenuItem value="status">Durum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sıralama Yönü</InputLabel>
              <Select
                value={filters.sortOrder}
                onChange={handleFilterChange('sortOrder')}
                label="Sıralama Yönü"
              >
                <MenuItem value="desc">Azalan</MenuItem>
                <MenuItem value="asc">Artan</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                size="small"
              >
                Filtreleri Temizle
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Siparişler Tablosu */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Müşteri</TableCell>
                <TableCell>Ürün</TableCell>
                <TableCell>Miktar</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Sipariş Tarihi</TableCell>
                <TableCell>Notlar</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredOrders().map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{getCustomerName(order.customerId)}</TableCell>
                  <TableCell>{order.stokAdi || getStokName(order.stokId)}</TableCell>
                  <TableCell>{order.miktar}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(order.status)}
                      label={order.status}
                      color={getStatusColor(order.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(order.siparisTarihi).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    {order.notlar ? (
                      <Tooltip title={order.notlar}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {order.notlar}
                        </Typography>
                      </Tooltip>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(order)}
                          sx={{ color: '#1976d2' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteOrder(order.id)}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Sipariş Dialog'u */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Sipariş Düzenle' : 'Yeni Sipariş'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Müşteri</InputLabel>
                <Select
                  value={form.customerId}
                  onChange={handleFormChange('customerId')}
                  label="Müşteri"
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.adSoyad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ürün</InputLabel>
                <Select
                  value={form.stokId}
                  onChange={handleFormChange('stokId')}
                  label="Ürün"
                >
                  {stoklar.map((stok) => (
                    <MenuItem key={stok.id} value={stok.id}>
                      {stok.marka} {stok.model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Miktar"
                type="number"
                value={form.miktar}
                onChange={handleFormChange('miktar')}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={form.status}
                  onChange={handleFormChange('status')}
                  label="Durum"
                >
                  <MenuItem value="Bekliyor">Bekliyor</MenuItem>
                  <MenuItem value="TahsisEdildi">Tahsis Edildi</MenuItem>
                  {/* Tamamlandı ve İptal kaldırıldı */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                multiline
                rows={3}
                value={form.notlar}
                onChange={handleFormChange('notlar')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 