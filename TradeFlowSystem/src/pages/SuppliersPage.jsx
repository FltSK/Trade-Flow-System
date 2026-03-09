import React, { useMemo, useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { 
  formatNumber, 
  apiGetCustomers, 
  apiGetPayments, 
  hesaplaTotalOdenen, 
  hesaplaKalanOdeme,
  formatPhoneNumber,
  validatePhoneNumber,
  apiGetSuppliers, 
  apiCreateSupplier, 
  apiDeleteSupplier, 
  apiActivateSupplier 
} from '../utils/helpers';

export default function SuppliersPage() {
  const [musteriler, setMusteriler] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  // Payments dialog date filter
  const [paymentsStartDate, setPaymentsStartDate] = useState('');
  const [paymentsEndDate, setPaymentsEndDate] = useState('');
  
  // Pasif toptancıları takip et
  const [inactiveSuppliers, setInactiveSuppliers] = useState(() => {
    const stored = localStorage.getItem('inactiveSuppliers');
    return stored ? JSON.parse(stored) : [];
  });

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [inactiveDialogOpen, setInactiveDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState(null);

  // Filter states
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('');

  // Form states
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    address: '',
    taxNumber: ''
  });



  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load customers and payments first
        const customersResult = await apiGetCustomers();
        const paymentsResult = await apiGetPayments();
        
        if (customersResult.success && paymentsResult.success) {
          // Group payments by customerId
          const paymentsByCustomer = {};
          paymentsResult.data.forEach(payment => {
            if (!paymentsByCustomer[payment.customerId]) {
              paymentsByCustomer[payment.customerId] = [];
            }
            paymentsByCustomer[payment.customerId].push({
              id: payment.id,
              tutar: payment.tutar,
              tarih: payment.tarih,
              tur: payment.tur,
              toptanci: payment.toptanci,
              createdByUsername: payment.createdByUsername || payment.CreatedByUsername || ''
            });
          });
          
          // Merge customers with their payments
          const customersWithPayments = customersResult.data.map(customer => ({
            id: customer.id,
            adSoyad: customer.adSoyad,
            tcKimlik: customer.tcKimlik,
            telefon: customer.telefon,
            adres: customer.adres,
            sozlesmeTutari: customer.sozlesmeTutari,
            sozlesmeTarihi: customer.sozlesmeTarihi,
            odemeTaahhutTarihi: customer.odemeTaahhutTarihi,
            yapilanIs: customer.yapilanIs,
            boruTipi: customer.boruTipi,
            satilanCihaz: customer.satilanCihaz,
            termostat: customer.termostat,
            toptanciIsmi: customer.toptanciIsmi,
            odemeler: paymentsByCustomer[customer.id] || []
          }));
          
          setMusteriler(customersWithPayments);
        } else {
          setError('Müşteri verileri yüklenemedi');
        }

        // Load suppliers from API
        const suppliersResult = await apiGetSuppliers();
        if (suppliersResult.success) {
          setSuppliers(suppliersResult.data);
        } else {
          setError(suppliersResult.error || 'Toptancılar yüklenemedi');
        }


      } catch (err) {
        setError('Veriler yüklenirken hata oluştu');

      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Toptancı istatistikleri
  const supplierStats = useMemo(() => {
    const allSuppliers = suppliers.map(s => s.name);
    const activeSuppliers = suppliers.filter(s => s.isActive && !inactiveSuppliers.includes(s.name)).map(s => s.name);
    const totalPayments = musteriler.reduce((total, customer) => {
      const cardPayments = (customer.odemeler || []).filter(p => {
        const tur = (p.tur || '').toLowerCase();
        return (tur === 'kredi kartı' || tur === 'kredi karti') && !!p.toptanci;
      });
      return total + cardPayments.reduce((sum, payment) => sum + parseFloat(payment.tutar || 0), 0);
    }, 0);

    // Filtre uygulanmışsa istatistikleri güncelle
    if (selectedSupplierFilter) {
      const filteredActiveSuppliers = activeSuppliers.filter(name => name === selectedSupplierFilter);
      const filteredInactiveSuppliers = inactiveSuppliers.filter(name => name === selectedSupplierFilter);
      
      return {
        totalSuppliers: filteredActiveSuppliers.length + filteredInactiveSuppliers.length,
        activeSuppliers: filteredActiveSuppliers.length,
        inactiveSuppliers: filteredInactiveSuppliers.length,
        totalPayments: totalPayments
      };
    }

    return {
      totalSuppliers: allSuppliers.length,
      activeSuppliers: activeSuppliers.length,
      inactiveSuppliers: inactiveSuppliers.length,
      totalPayments: totalPayments
    };
  }, [suppliers, musteriler, inactiveSuppliers, selectedSupplierFilter]);

  // Filtrelenmiş toptancılar
  const filteredSuppliers = useMemo(() => {
    if (!selectedSupplierFilter) {
      return suppliers;
    }
    return suppliers.filter(supplier => supplier.name === selectedSupplierFilter);
  }, [suppliers, selectedSupplierFilter]);

  // Aktif toptancılar listesi (filtre uygulanmış)
  const activeSuppliers = useMemo(() => {
    const allActiveSuppliers = suppliers
      .filter(supplier => supplier.isActive && !inactiveSuppliers.includes(supplier.name))
      .map(supplier => supplier.name);
    
    if (!selectedSupplierFilter) {
      return allActiveSuppliers;
    }
    return allActiveSuppliers.filter(name => name === selectedSupplierFilter);
  }, [suppliers, inactiveSuppliers, selectedSupplierFilter]);

  // Toptancı ödeme detayları
  const getSupplierPayments = (supplierName) => {
    const payments = [];
    let totalAmount = 0;
    
    musteriler.forEach(customer => {
      const customerPayments = (customer.odemeler || []).filter(p => {
        const tur = (p.tur || '').toLowerCase();
        return p.toptanci === supplierName && (tur === 'kredi kartı' || tur === 'kredi karti');
      });
      if (customerPayments.length > 0) {
        const customerTotal = customerPayments.reduce((sum, p) => sum + parseFloat(p.tutar || 0), 0);
        totalAmount += customerTotal;
        
        payments.push({
          customer: customer.adSoyad,
          tc: customer.tcKimlik,
          contractDate: customer.sozlesmeTarihi,
          total: customerTotal,
          payments: customerPayments.map(cp => ({
            ...cp,
            createdByUsername: cp.createdByUsername || cp.CreatedByUsername || (customer.createdByUsername || '')
          }))
        });
      }
    });

    return { payments, totalAmount };
  };

  // Toptancı ekleme
  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) return;

    try {
      const result = await apiCreateSupplier({
        name: newSupplier.name.trim(),
        phone: newSupplier.phone.trim(),
        address: newSupplier.address.trim(),
        taxNumber: newSupplier.taxNumber.trim(),
        isActive: true
      });

        if (result.success) {
          // Refresh suppliers list
          const suppliersResult = await apiGetSuppliers();
          if (suppliersResult.success) {
          setSuppliers(suppliersResult.data);
        }
        
        // Reset form
        setNewSupplier({ name: '', phone: '', address: '', taxNumber: '' });
        setAddDialogOpen(false);
        } else {
          alert(result.error || 'Toptancı eklenemedi');
        }
      } catch (err) {

        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
  };

  // Toptancı pasif yapma
  const handleDeactivateSupplier = (supplierName) => {
    setSupplierToDelete(supplierName);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!supplierToDelete) return;

    try {
      // Backend'de pasif yap
      const supplierData = suppliers.find(s => s.name === supplierToDelete);
      if (supplierData) {
        const result = await apiDeleteSupplier(supplierData.id);
        if (result.success) {
          // Frontend state'ini güncelle
          const updatedInactive = [...inactiveSuppliers, supplierToDelete];
          setInactiveSuppliers(updatedInactive);
          localStorage.setItem('inactiveSuppliers', JSON.stringify(updatedInactive));
          
          // Suppliers listesini yenile
          const suppliersResult = await apiGetSuppliers();
          if (suppliersResult.success) {
            setSuppliers(suppliersResult.data);
          }
          
          setDeleteConfirmOpen(false);
          setSupplierToDelete(null);
        } else {
          alert(result.error || 'Toptancı pasif hale getirilemedi');
        }
      }
    } catch (error) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Toptancı aktif yapma
  const handleActivateSupplier = async (supplierName) => {
    try {
      // Backend'de aktif yap
      const supplierData = suppliers.find(s => s.name === supplierName);
      if (supplierData) {
        const result = await apiActivateSupplier(supplierData.id);
        if (result.success) {
          // Frontend state'ini güncelle
          const updatedInactive = inactiveSuppliers.filter(s => s !== supplierName);
          setInactiveSuppliers(updatedInactive);
          localStorage.setItem('inactiveSuppliers', JSON.stringify(updatedInactive));
          
          // Suppliers listesini yenile
          const suppliersResult = await apiGetSuppliers();
          if (suppliersResult.success) {
            setSuppliers(suppliersResult.data);
          }
        } else {
          alert(result.error || 'Toptancı aktif hale getirilemedi');
        }
      }
    } catch (error) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Toptancı detay görüntüleme
  const handleViewSupplierDetails = (supplierName) => {
    const supplierData = suppliers.find(s => s.name === supplierName);
    const paymentData = getSupplierPayments(supplierName);
    
    // Sözleşme tarihine göre sırala (en yeni üstte)
    const sortedPayments = paymentData.payments.sort((a, b) => {
      const contractDateDiff = new Date(b.contractDate) - new Date(a.contractDate);
      if (contractDateDiff !== 0) {
        return contractDateDiff;
      }
      // Aynı sözleşme tarihi için ödeme tarihine göre sırala (en son eklenen üstte)
      // Her müşterinin payments array'indeki ilk ödemeyi kontrol et
      if (a.payments && b.payments && a.payments.length > 0 && b.payments.length > 0) {
        const aLatestPayment = a.payments.sort((p1, p2) => new Date(p2.tarih) - new Date(p1.tarih))[0];
        const bLatestPayment = b.payments.sort((p1, p2) => new Date(p2.tarih) - new Date(p1.tarih))[0];
        return new Date(bLatestPayment.tarih) - new Date(aLatestPayment.tarih);
      }
      return 0;
    });
    
    // Her müşterinin payments array'ini de sırala
    sortedPayments.forEach(customerPayment => {
      customerPayment.payments.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    });
    
    setSelectedSupplier({
      name: supplierName,
      data: supplierData,
      payments: sortedPayments,
      totalAmount: paymentData.totalAmount
    });
    setDetailDialogOpen(true);
  };

  // Ödeme detaylarını görüntüleme
  const handleViewPayments = (supplierName) => {
    const paymentData = getSupplierPayments(supplierName);
    const allPayments = [];
    
    // Tüm ödemeleri topla
    musteriler.forEach(customer => {
      const customerPayments = (customer.odemeler || []).filter(p => {
        const tur = (p.tur || '').toLowerCase();
        return p.toptanci === supplierName && (tur === 'kredi kartı' || tur === 'kredi karti');
      });
      customerPayments.forEach(payment => {
        allPayments.push({
          ...payment,
          customerName: customer.adSoyad,
          customerTc: customer.tcKimlik,
          contractAmount: customer.sozlesmeTutari,
          contractDate: customer.sozlesmeTarihi,
          createdByUsername: payment.createdByUsername || payment.CreatedByUsername || ''
        });
      });
    });

    setSelectedPayments({
      supplierName,
      payments: allPayments.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)),
      totalAmount: paymentData.totalAmount
    });
    // reset date filters when opening dialog
    setPaymentsStartDate('');
    setPaymentsEndDate('');
    setPaymentsDialogOpen(true);
  };

  // Müşteri ödeme detaylarını görüntüleme
  const handleViewCustomerPayments = (customerName, supplierName) => {
    const customer = musteriler.find(m => m.adSoyad === customerName);
    if (!customer) return;

    const customerPayments = (customer.odemeler || []).filter(p => {
      const tur = (p.tur || '').toLowerCase();
      return p.toptanci === supplierName && (tur === 'kredi kartı' || tur === 'kredi karti');
    });
    const totalAmount = customerPayments.reduce((sum, p) => sum + parseFloat(p.tutar || 0), 0);

    const payments = customerPayments.map(payment => ({
      ...payment,
      customerName: customer.adSoyad,
      customerTc: customer.tcKimlik,
      contractAmount: customer.sozlesmeTutari,
      contractDate: customer.sozlesmeTarihi,
      createdByUsername: payment.createdByUsername || payment.CreatedByUsername || ''
    }));

    setSelectedPayments({
      supplierName,
      customerName,
      payments: payments.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)),
      totalAmount: totalAmount
    });
    // reset date filters when opening dialog
    setPaymentsStartDate('');
    setPaymentsEndDate('');
    setPaymentsDialogOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
      <Typography
          variant="h3"
        sx={{
          fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
            mb: 1
        }}
      >
          Toptancı Cari Yönetimi
      </Typography>
        <Typography variant="h6" color="text.secondary">
          Toptancılarınızın ödeme bilgilerini takip edin
        </Typography>
      </Box>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {supplierStats.totalSuppliers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Toplam Toptancı
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {supplierStats.activeSuppliers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Aktif Toptancı
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {supplierStats.inactiveSuppliers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pasif Toptancı
                  </Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(supplierStats.totalPayments)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Toplam Ödeme (₺)
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toptancı Ekleme Kartı */}
      <Card sx={{ 
        mb: 3,
        borderRadius: 3, 
        overflow: 'hidden', 
        boxShadow: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 6
        }
      }} onClick={() => setAddDialogOpen(true)}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 60, 
                height: 60 
              }}>
                <AddIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Yeni Toptancı Ekle
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Sisteme yeni bir toptancı ekleyerek ödeme takibini başlatın
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', opacity: 0.8 }}>
                +
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Tıklayın
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Filtre Bölümü */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3, mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            Toptancı Filtresi
            {selectedSupplierFilter && (
              <Chip 
                label={`Seçili: ${selectedSupplierFilter}`} 
                color="primary" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl size="medium" sx={{ minWidth: 200 }}>
                <InputLabel shrink>Toptancı Seçin</InputLabel>
                <Select
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                  label="Toptancı Seçin"
                >
                  <MenuItem value="">
                    <em>Tüm Toptancılar</em>
                  </MenuItem>
                  {suppliers
                    .filter(supplier => supplier.isActive)
                    .map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </MenuItem>
              ))}
            </Select>
          </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                onClick={() => setSelectedSupplierFilter('')}
                disabled={!selectedSupplierFilter}
                sx={{ minWidth: 120 }}
              >
                Filtreyi Temizle
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Ana İçerik */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Aktif Toptancılar" />
            <Tab label="Pasif Toptancılar" />
          </Tabs>
        </Box>

        {/* Aktif Toptancılar */}
        {selectedTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {activeSuppliers.map(supplierName => {
                const paymentData = getSupplierPayments(supplierName);
                const supplierData = suppliers.find(s => s.name === supplierName);
                  
                  return (
                    <Grid item xs={12} md={6} lg={4} key={supplierName}>
                      <Card sx={{ 
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6
                        }
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: 'primary.main',
                              mr: 2,
                              width: 50,
                              height: 50
                            }}>
                              <BusinessIcon />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {supplierName}
                              </Typography>
                              {supplierData && (
                                <Typography variant="body2" color="text.secondary">
                                  {supplierData.createdByUsername} tarafından eklendi
                                </Typography>
                              )}
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeactivateSupplier(supplierName)}
                            >
                              <DeleteIcon />
          </IconButton>
        </Box>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {formatNumber(paymentData.totalAmount)} ₺
            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Toplam Ödeme
                            </Typography>
                          </Box>

                                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                             <Box>
                               <Typography variant="body2" color="text.secondary">
                                 Müşteri Sayısı
                               </Typography>
                               <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                 {paymentData.payments.length}
                               </Typography>
                             </Box>
                             <Box>
                               <Typography variant="body2" color="text.secondary">
                                 Ortalama Ödeme
                               </Typography>
                               <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                 {paymentData.payments.length > 0 
                                   ? formatNumber(Math.round(paymentData.totalAmount / paymentData.payments.length))
                                   : '0'} ₺
                               </Typography>
                             </Box>
                           </Box>

                           {/* Ödeme Sayısı - Tıklanabilir */}
                           <Box sx={{ mb: 2 }}>
                             <Button
                               variant="outlined"
                               fullWidth
                               size="small"
                               onClick={() => handleViewPayments(supplierName)}
                          sx={{
                                 borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                                   borderColor: 'primary.dark',
                                   backgroundColor: 'primary.light',
                              color: 'primary.dark'
                            }
                          }}
                             >
                               <PaymentIcon sx={{ mr: 1, fontSize: 16 }} />
                               Tüm Ödemeleri Görüntüle ({paymentData.payments.reduce((total, p) => total + p.payments.length, 0)} ödeme)
                             </Button>
                           </Box>

                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewSupplierDetails(supplierName)}
                            sx={{ mt: 2 }}
                          >
                            Detayları Görüntüle
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>

            {activeSuppliers.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Henüz aktif toptancı bulunmuyor
                        </Typography>
                <Typography variant="body2" color="text.secondary">
                  Müşteri ödemelerinde toptancı bilgisi ekleyerek toptancıları görüntüleyebilirsiniz
                </Typography>
          </Box>
        )}
      </Box>
        )}

        {/* Pasif Toptancılar */}
        {selectedTab === 1 && (
          <Box sx={{ p: 3 }}>
            {inactiveSuppliers.length > 0 ? (
              <List>
                {inactiveSuppliers
                  .filter(supplierName => {
                    if (!selectedSupplierFilter) return true;
                    return supplierName === selectedSupplierFilter;
                  })
                  .map(supplierName => {
                    const paymentData = getSupplierPayments(supplierName);
                    const supplierData = suppliers.find(s => s.name === supplierName);
                  
                  return (
                    <ListItem
                      key={supplierName}
                      sx={{
                        mb: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'grey.400' }}>
                          <BusinessIcon />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {supplierName}
                            </Typography>
                            <Chip label="Pasif" color="error" size="small" />
        </Box>
                        }
                        secondary={
                          <>
                            {supplierData && (
                              <Typography component="span" variant="body2" color="text.secondary">
                                {supplierData.createdByUsername} tarafından eklendi
                              </Typography>
                            )}
                            <Typography component="span" variant="body2" color="text.secondary">
                              Toplam Ödeme: {formatNumber(paymentData.totalAmount)} ₺ • 
                              Müşteri Sayısı: {paymentData.payments.length}
                            </Typography>
                          </>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewSupplierDetails(supplierName)}
                          >
                            <VisibilityIcon />
          </IconButton>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleActivateSupplier(supplierName)}
                          >
                            <RestoreIcon />
                </IconButton>
              </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CancelIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Pasif toptancı bulunmuyor
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tüm toptancılar aktif durumda
                </Typography>
          </Box>
            )}
          </Box>
        )}
      </Paper>



      {/* Toptancı Ekleme Dialogu */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pb: 3,
          pt: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, }}>
            <BusinessIcon />
            <Typography variant="h6">Yeni Toptancı Ekle</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 6 }}>
          <Grid container spacing={2} pt={2}>
            <Grid item xs={12}>
            <TextField
              fullWidth
                label="Toptancı Adı"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon (5XX-XXX-XXXX)"
                value={newSupplier.phone}
                onChange={(e) => {
                  // Sadece rakamları al
                  const numbers = e.target.value.replace(/\D/g, '');
                  
                  // Eğer 10 rakamdan fazlaysa, mevcut değeri koru
                  if (numbers.length > 10) {
                    return; // Hiçbir şey yapma, mevcut değeri koru
                  }
                  
                  const formatted = formatPhoneNumber(numbers);
                  setNewSupplier({...newSupplier, phone: formatted});
                }}
                inputProps={{
                  maxLength: 12, // 5XX-XXX-XXXX formatı için
                  placeholder: "5XX-XXX-XXXX"
                }}
                error={newSupplier.phone && !validatePhoneNumber(newSupplier.phone)}
                helperText={newSupplier.phone && !validatePhoneNumber(newSupplier.phone) ? 
                  "Telefon numarası 10 rakam olmalıdır (5XX-XXX-XXXX)" : 
                  newSupplier.phone && validatePhoneNumber(newSupplier.phone) ? "✓ Geçerli telefon numarası" : "5XX-XXX-XXXX formatında giriniz"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vergi Numarası"
                value={newSupplier.taxNumber}
                onChange={(e) => setNewSupplier({...newSupplier, taxNumber: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adres"
                multiline
                rows={3}
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddDialogOpen(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleAddSupplier}
            variant="contained"
            disabled={!newSupplier.name.trim() || (newSupplier.phone && !validatePhoneNumber(newSupplier.phone))}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            Toptancı Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toptancı Detay Dialogu */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BusinessIcon />
              <Typography variant="h6">{selectedSupplier?.name}</Typography>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedSupplier && (
            <Grid container spacing={3}>
              {/* Toptancı Bilgileri */}
              {selectedSupplier.data && (
                <Grid item xs={12}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Toptancı Bilgileri
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedSupplier.data.phone && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon color="action" />
                              <Typography variant="body2">
                                {selectedSupplier.data.phone}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {selectedSupplier.data.address && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOnIcon color="action" />
                              <Typography variant="body2">
                                {selectedSupplier.data.address}
                              </Typography>
              </Box>
                          </Grid>
                        )}
                        {selectedSupplier.data.taxNumber && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ReceiptIcon color="action" />
                              <Typography variant="body2">
                                {selectedSupplier.data.taxNumber}
                              </Typography>
          </Box>
                          </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="action" />
                            <Typography variant="body2">
                              {selectedSupplier.data.createdByUsername} tarafından eklendi
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Ödeme Özeti */}
              <Grid item xs={12}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Ödeme Özeti
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 2, 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          color: 'white'
                        }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {formatNumber(selectedSupplier.totalAmount)} ₺
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Toplam Ödeme
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 2, 
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          borderRadius: 2,
                          color: 'white'
                        }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {selectedSupplier.payments.length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Müşteri Sayısı
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 2, 
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          borderRadius: 2,
                          color: 'white'
                        }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {selectedSupplier.payments.length > 0 
                              ? formatNumber(Math.round(selectedSupplier.totalAmount / selectedSupplier.payments.length))
                              : '0'} ₺
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Ortalama Ödeme
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Müşteri Listesi */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Müşteri Ödemeleri
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Müşteri</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>TC</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Sözleşme Tarihi</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Toplam Ödeme</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Ödeme Sayısı</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedSupplier.payments.map((payment, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {payment.customer}
                                </Typography>
                              </TableCell>
                              <TableCell>{payment.tc}</TableCell>
                              <TableCell>{payment.contractDate}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${formatNumber(payment.total)} ₺`}
                                  color="primary"
                                  size="small"
                                />
                              </TableCell>
                                                           <TableCell>
                               <Button
                                 variant="outlined"
                                 size="small"
                                 onClick={() => handleViewCustomerPayments(payment.customer, selectedSupplier.name)}
                                 sx={{
                                   borderColor: 'secondary.main',
                                   color: 'secondary.main',
                                   minWidth: 'auto',
                                   px: 1,
                                   py: 0.5,
                                   fontSize: '0.75rem',
                                   '&:hover': {
                                     borderColor: 'secondary.dark',
                                     backgroundColor: 'secondary.light',
                                     color: 'secondary.dark'
                                   }
                                 }}
                               >
                                 {payment.payments.length} ödeme
                               </Button>
                             </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Pasif Yapma Onay Dialogu */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Emin misiniz?</DialogTitle>
        <DialogContent>
          <Typography>
            "{supplierToDelete}" toptancısını pasif yapmak istediğinizden emin misiniz?
            <Typography component="div" sx={{ mt: 1, color: 'info.main', fontWeight: 'bold' }}>
              Bu işlem toptancıyı listeden kaldırır ancak mevcut veriler korunur.
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleConfirmDeactivate} color="warning" variant="contained">
            Pasif Yap
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ödeme Detayları Dialogu */}
      <Dialog 
        open={paymentsDialogOpen} 
        onClose={() => setPaymentsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PaymentIcon />
                             <Typography variant="h6">
                 {selectedPayments?.customerName 
                   ? `${selectedPayments.customerName} - ${selectedPayments.supplierName} Ödemeleri`
                   : `${selectedPayments?.supplierName} - Tüm Ödemeler`
                 }
               </Typography>
            </Box>
            <IconButton onClick={() => setPaymentsDialogOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedPayments && (
                  <Box>
              {/* Ödeme Özeti */}
              {/* Tarih Filtresi */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Başlangıç Tarihi"
                        InputLabelProps={{ shrink: true }}
                        value={paymentsStartDate}
                        onChange={(e)=>setPaymentsStartDate(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={5} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Bitiş Tarihi"
                        InputLabelProps={{ shrink: true }}
                        value={paymentsEndDate}
                        onChange={(e)=>setPaymentsEndDate(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} md={4}>
                      <Box sx={{ display:'flex', gap:1 }}>
                        <Button variant="outlined" size="small" onClick={()=>{setPaymentsStartDate(''); setPaymentsEndDate('');}}>Temizle</Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Ödeme Özeti
                  </Typography>
                  <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: 2,
                              color: 'white'
                            }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {formatNumber((selectedPayments.payments || []).filter(p => {
                              const d = new Date(p.tarih);
                              const sOk = !paymentsStartDate || d >= new Date(paymentsStartDate);
                              const eOk = !paymentsEndDate || d <= new Date(paymentsEndDate);
                              return sOk && eOk;
                            }).reduce((sum, p) => sum + parseFloat(p.tutar || 0), 0))} ₺
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                Toplam Ödeme
                              </Typography>
                  </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                              borderRadius: 2,
                              color: 'white'
                            }}>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                                {(selectedPayments.payments || []).filter(p => {
                                  const d = new Date(p.tarih);
                                  const sOk = !paymentsStartDate || d >= new Date(paymentsStartDate);
                                  const eOk = !paymentsEndDate || d <= new Date(paymentsEndDate);
                                  return sOk && eOk;
                                }).length}
                </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {selectedPayments.customerName ? 'Müşteri Ödeme Sayısı' : 'Toplam Ödeme Sayısı'}
                    </Typography>
                  </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                              borderRadius: 2,
                              color: 'white'
                            }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                                {(() => {
                                  const filtered = (selectedPayments.payments || []).filter(p => {
                                    const d = new Date(p.tarih);
                                    const sOk = !paymentsStartDate || d >= new Date(paymentsStartDate);
                                    const eOk = !paymentsEndDate || d <= new Date(paymentsEndDate);
                                    return sOk && eOk;
                                  });
                                  const total = filtered.reduce((sum, p) => sum + parseFloat(p.tutar || 0), 0);
                                  return filtered.length > 0 ? `${formatNumber(Math.round(total / filtered.length))} ₺` : '0 ₺';
                                })()}
                  </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                Ortalama Ödeme
                              </Typography>
                    </Box>
                          </Grid>
                        </Grid>
                </CardContent>
              </Card>

              {/* Ödeme Listesi */}
              <Card>
                <CardContent>
                                     <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                     {selectedPayments.customerName ? 'Müşteri Ödeme Detayları' : 'Ödeme Detayları'}
                </Typography>
                  <TableContainer sx={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Tarih</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Müşteri</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>TC</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Sözleşme Tutarı</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Ödeme Tutarı</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Ödeme Türü</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Ödemeyi Alan</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedPayments.payments || []).filter(p => {
                          const d = new Date(p.tarih);
                          const sOk = !paymentsStartDate || d >= new Date(paymentsStartDate);
                          const eOk = !paymentsEndDate || d <= new Date(paymentsEndDate);
                          return sOk && eOk;
                        }).map((payment, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {new Date(payment.tarih).toLocaleDateString('tr-TR')}
                    </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(payment.tarih).toLocaleTimeString('tr-TR')}
                    </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {payment.customerName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {payment.customerTc}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {formatNumber(payment.contractAmount)} ₺
                              </Typography>
                            </TableCell>
                            <TableCell>
                    <Chip
                                label={`${formatNumber(payment.tutar)} ₺`}
                                color="primary"
                                size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={payment.tur}
                                color="secondary"
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {payment.createdByUsername || 'Bilinmiyor'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPaymentsDialogOpen(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 