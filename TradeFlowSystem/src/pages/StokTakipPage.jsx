import React, { useState, useEffect, useMemo } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  LocalShipping as LocalShippingIcon,
  People as PeopleIcon,
  Cancel as CancelIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { apiGetStockTracking, apiGetOrders, apiGetStokHareketleri } from '../utils/helpers';
import { normalizeTurkish } from '../utils/helpers';

// Türkiye'nin 81 ili
const TURKIYE_ILLERI = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara',
  'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl',
  'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı',
  'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane',
  'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir',
  'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş',
  'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize',
  'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ',
  'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van',
  'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale',
  'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova',
  'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const parseAddress = (adresStr = '') => {
  const result = { il: '', ilce: '' };
  if (!adresStr || typeof adresStr !== 'string') return result;
  // Adres formatı: "il / ilce / mahalle / ..." şeklinde
  const parts = adresStr.split(' / ').map(p => (p || '').trim()).filter(Boolean);
  // Sadece il ve ilce'yi al
  if (parts[0]) result.il = parts[0];
  if (parts[1]) result.ilce = parts[1];
  return result;
};

const getLocationFromItem = (item) => {
  const il = item.il || item.Il || '';
  const ilce = item.ilce || item.Ilce || '';
  if (il && ilce) {
    return { il, ilce };
  }

  const adres = item.adres || item.Adres || '';
  const parsed = parseAddress(adres);
  return {
    il: il || parsed.il,
    ilce: ilce || parsed.ilce
  };
};

export default function StokTakipPage() {
  const { user } = useAuth();
  const [stockData, setStockData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stokHareketleri, setStokHareketleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtre state'leri
  const [filters, setFilters] = useState({
    customerName: '',
    tcKimlik: '',
    cihazAdi: '',
    hesapYapildi: '',
    il: '',
    ilce: '',
    startDate: '',
    endDate: '',
    sortBy: 'sozlesmeTarihi',
    sortOrder: 'desc'
  });

  const cityOptions = useMemo(() => {
    const cities = new Set();
    stockData.forEach(item => {
      const { il } = getLocationFromItem(item);
      // Sadece Türkiye'nin 81 ilinden biri ise ekle
      if (il && TURKIYE_ILLERI.includes(il)) {
        cities.add(il);
      }
    });
    return Array.from(cities).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [stockData]);

  const districtOptions = useMemo(() => {
    const districts = new Set();
    stockData.forEach(item => {
      const { il, ilce } = getLocationFromItem(item);
      if (filters.il) {
        if (il === filters.il && ilce) {
          districts.add(ilce);
        }
      } else if (ilce) {
        districts.add(ilce);
      }
    });
    return Array.from(districts).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [stockData, filters.il]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stockResult, ordersResult, stokHareketleriResult] = await Promise.all([
        apiGetStockTracking(),
        apiGetOrders(),
        apiGetStokHareketleri()
      ]);

      if (stockResult.success) {
        setStockData(stockResult.data);
      } else {
        setError(stockResult.error || 'Veriler yüklenemedi');
      }

      if (ordersResult.success) {
        setOrders(ordersResult.data);
      }

      if (stokHareketleriResult.success) {
        setStokHareketleri(stokHareketleriResult.data);
      }
    } catch (error) {
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Durum hesaplama fonksiyonu (Müşteriler sayfası ile aynı mantık)
  const getItemStatus = (item) => {
    // 1) Orders tablosuna bak - müşteriler sayfası ile aynı mantık (sadece customerId kontrol ediliyor)
    if (orders && orders.length > 0) {
      const customerOrders = orders.filter(order => order.customerId === item.customerId);
      
      if (customerOrders.length > 0) {
        // En son sipariş
        const latestOrder = customerOrders.sort((a, b) => 
          new Date(b.siparisTarihi) - new Date(a.siparisTarihi)
        )[0];
        
        switch (latestOrder.status) {
          case 'Bekliyor':
            return 'Bekliyor';
          case 'TahsisEdildi':
            return 'TahsisEdildi';
          default:
            return 'Bekliyor';
        }
      }
    }
    
    // 2) Eğer sipariş yoksa StokHareketleri'ne bak - müşteriler sayfası ile aynı mantık
    if (stokHareketleri && stokHareketleri.length > 0) {
      const customerStokHareketleri = stokHareketleri.filter(hareket => 
        hareket.customerId === item.customerId && 
        hareket.hareketTipi === 'Çıkış'
      );
      
      if (customerStokHareketleri.length > 0) {
        return 'TahsisEdildi';
      }
    }
    
    // 3) Hiçbiri yoksa "TahsisEdilmedi"
    return 'TahsisEdilmedi';
  };

  // Filtreleme fonksiyonu
  const getFilteredData = () => {
    let filtered = [...stockData];

    // Görüntülenmeyecek ürün tipleri
    const excludedProductTypes = [
      'kolon',
      'dönüşüm-kolon',
      'gaz tesisatı',
      'dönüşüm',
      'full',
      'z-diğer',
      'kolon-gaz işleri'
    ];
    
    // Belirtilen ürün tiplerini filtrele
    filtered = filtered.filter(item => {
      const satilanCihaz = (item.satilanCihaz || '').toLowerCase().trim();
      return !excludedProductTypes.some(excluded => 
        satilanCihaz === excluded.toLowerCase() || 
        satilanCihaz.includes(excluded.toLowerCase())
      );
    });

    // İl filtresi - sadece geçerli illeri filtrele
    if (filters.il && TURKIYE_ILLERI.includes(filters.il)) {
      filtered = filtered.filter(item => {
        const { il } = getLocationFromItem(item);
        return il === filters.il;
      });
    }

    // İlçe filtresi
    if (filters.ilce) {
      filtered = filtered.filter(item => {
        const { ilce } = getLocationFromItem(item);
        return ilce === filters.ilce;
      });
    }

    // Tarih aralığı filtresi (sözleşme tarihine göre)
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(item => {
        if (!item.sozlesmeTarihi) {
          return false;
        }

        const sozlesmeDate = new Date(item.sozlesmeTarihi);
        if (Number.isNaN(sozlesmeDate.getTime())) {
          return false;
        }

        let isInRange = true;

        if (filters.startDate) {
          const start = new Date(filters.startDate);
          start.setHours(0, 0, 0, 0);
          if (sozlesmeDate < start) {
            isInRange = false;
          }
        }

        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (sozlesmeDate > end) {
            isInRange = false;
          }
        }

        return isInRange;
      });
    }

    // Müşteri adı filtresi (Türkçe karakterleri normalize ederek)
    if (filters.customerName) {
      filtered = filtered.filter(item => {
        const normalizedCustomerName = normalizeTurkish(item.customerName || '');
        const normalizedSearchTerm = normalizeTurkish(filters.customerName);
        return normalizedCustomerName.includes(normalizedSearchTerm);
      });
    }

    // TC kimlik filtresi
    if (filters.tcKimlik) {
      filtered = filtered.filter(item =>
        item.tcKimlik?.includes(filters.tcKimlik)
      );
    }

    // Cihaz adı filtresi (Türkçe karakterleri normalize ederek)
    if (filters.cihazAdi) {
      filtered = filtered.filter(item => {
        const normalizedCihazAdi = normalizeTurkish(item.satilanCihaz || '');
        const normalizedSearchTerm = normalizeTurkish(filters.cihazAdi);
        return normalizedCihazAdi.includes(normalizedSearchTerm);
      });
    }

    // Tahsis durumu filtresi - artık yeni mantık kullanılıyor
    if (filters.hesapYapildi !== '') {
      filtered = filtered.filter(item => {
        const status = getItemStatus(item);
        if (filters.hesapYapildi === 'tahsisEdildi') {
          return status === 'TahsisEdildi';
        } else if (filters.hesapYapildi === 'bekliyor') {
          return status === 'Bekliyor';
        } else if (filters.hesapYapildi === 'tahsisEdilmedi') {
          return status === 'TahsisEdilmedi';
        }
        return true;
      });
    }

    // Sıralama
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'customerName':
          aValue = a.customerName || '';
          bValue = b.customerName || '';
          break;
        case 'stokMarka':
          aValue = `${a.stokMarka} ${a.stokModel}`;
          bValue = `${b.stokMarka} ${b.stokModel}`;
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'hesapYapildi':
          aValue = getItemStatus(a);
          bValue = getItemStatus(b);
          break;
        case 'sozlesmeTarihi':
          aValue = a.sozlesmeTarihi ? new Date(a.sozlesmeTarihi) : new Date(0);
          bValue = b.sozlesmeTarihi ? new Date(b.sozlesmeTarihi) : new Date(0);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
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
      [field]: event.target.value,
      ...(field === 'il' ? { ilce: '' } : {})
    }));
  };

  const clearFilters = () => {
    setFilters({
      customerName: '',
      tcKimlik: '',
      cihazAdi: '',
      hesapYapildi: '',
      il: '',
      ilce: '',
      startDate: '',
      endDate: '',
      sortBy: 'sozlesmeTarihi',
      sortOrder: 'desc'
    });
  };

  const getTahsisDurumuChip = (status) => {
    switch (status) {
      case 'TahsisEdildi':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Tahsis Edildi"
            color="success"
            size="small"
          />
        );
      case 'Bekliyor':
        return (
          <Chip
            icon={<PendingIcon />}
            label="Bekliyor"
            color="warning"
            size="small"
          />
        );
      case 'TahsisEdilmedi':
      default:
        return (
          <Chip
            icon={<CancelIcon />}
            label="Tahsis Edilmedi"
            color="default"
            size="small"
          />
        );
    }
  };

  // 🔍 DEBUG: Console'a yazdır
  React.useEffect(() => {
    if (stockData.length > 0) {
      // Benzersiz müşteri sayısını hesapla
      const uniqueCustomers = [...new Set(stockData.map(item => item.customerId))];
      const uniqueCustomersData = uniqueCustomers.map(customerId => {
        const customerRecords = stockData.filter(item => item.customerId === customerId);
        return customerRecords[0];
      });
      
      const toplamMusteriSayisi = uniqueCustomers.length;
      // Her item için durum hesapla
      const dataWithStatusForDebug = uniqueCustomersData.map(item => ({
        ...item,
        calculatedStatus: getItemStatus(item)
      }));
      const tahsisEdilenCount = dataWithStatusForDebug.filter(item => item.calculatedStatus === 'TahsisEdildi').length;
      const bekleyenCount = dataWithStatusForDebug.filter(item => item.calculatedStatus === 'Bekliyor').length;
      const tahsisEdilmediCount = dataWithStatusForDebug.filter(item => item.calculatedStatus === 'TahsisEdilmedi').length;
      const toplamAdet = stockData.reduce((sum, item) => sum + (item.quantity || 0), 0);
      
      console.log('=== STOK TAKİP DEBUG ===');
      console.log('📦 Toplam kayıt (cihaz satışı):', stockData.length);
      console.log('👥 Benzersiz müşteri sayısı:', toplamMusteriSayisi);
      console.log('✅ Tahsis edilen müşteri:', tahsisEdilenCount);
      console.log('⏳ Bekleyen müşteri:', bekleyenCount);
      console.log('❌ Tahsis edilmedi (müşteri):', tahsisEdilmediCount);
      console.log('📊 Toplam cihaz adedi:', toplamAdet);
      
      // Bekleyen ve tahsis edilmemiş müşteri listesi
      const bekleyenMusteriler = dataWithStatusForDebug.filter(item => 
        item.calculatedStatus === 'Bekliyor' || item.calculatedStatus === 'TahsisEdilmedi'
      );
      console.log('🔍 Bekleyen/Tahsis edilmedi müşteri detayları:', bekleyenMusteriler.map(m => ({
        id: m.customerId,
        ad: m.customerName,
        tc: m.tcKimlik,
        durum: m.calculatedStatus
      })));
      console.log('========================');
    }
  }, [stockData, orders, stokHareketleri]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredData = getFilteredData();
  
  // Benzersiz müşteri sayısını hesapla (her müşteri bir kez sayılsın)
  const uniqueCustomers = [...new Set(filteredData.map(item => item.customerId))];
  const uniqueCustomersData = uniqueCustomers.map(customerId => {
    const customerRecords = filteredData.filter(item => item.customerId === customerId);
    return customerRecords[0]; // İlk kaydı al (müşteri bilgileri aynı)
  });
  
  // Her item için durum hesapla
  const dataWithStatus = uniqueCustomersData.map(item => ({
    ...item,
    calculatedStatus: getItemStatus(item)
  }));
  
  const toplamMusteriSayisi = uniqueCustomers.length;
  const tahsisEdilenCount = dataWithStatus.filter(item => item.calculatedStatus === 'TahsisEdildi').length;
  const bekleyenCount = dataWithStatus.filter(item => item.calculatedStatus === 'Bekliyor').length;
  const tahsisEdilmediCount = dataWithStatus.filter(item => item.calculatedStatus === 'TahsisEdilmedi').length;
  const toplamAdet = filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const toplamKayitSayisi = filteredData.length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1976d2' }}>
          <InventoryIcon sx={{ fontSize: 40, mr: 1, verticalAlign: 'middle' }} />
          Stok Takip
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {typeof error === 'string' ? error : error.message || 'Bir hata oluştu'}
        </Alert>
      )}

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Toplam Müşteri
                </Typography>
              </Box>
              <Typography variant="h4">
                {toplamMusteriSayisi}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                {toplamKayitSayisi} satış kaydı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Tahsis Edilen
                </Typography>
              </Box>
              <Typography variant="h4">
                {tahsisEdilenCount}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                Müşteri sayısı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PendingIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Bekleyen
                </Typography>
              </Box>
              <Typography variant="h4">
                {bekleyenCount}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                Müşteri sayısı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CancelIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Tahsis Edilmedi
                </Typography>
              </Box>
              <Typography variant="h4">
                {tahsisEdilmediCount}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                Müşteri sayısı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalShippingIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Toplam Adet
                </Typography>
              </Box>
              <Typography variant="h4">
                {toplamAdet}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                Satılan cihaz
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtreler Butonu */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ minWidth: 120 }}
        >
          {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
        </Button>
      </Box>

      {/* Filtreler */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 2 }}>
            Filtreler ve Sıralama
          </Typography>
          <Grid container spacing={2}>
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
              <TextField
                fullWidth
                size="small"
                label="Cihaz Adı"
                value={filters.cihazAdi}
                onChange={handleFilterChange('cihazAdi')}
                placeholder="Cihaz ara..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>İl</InputLabel>
                <Select
                  value={filters.il}
                  onChange={handleFilterChange('il')}
                  label="İl"
                  displayEmpty
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {cityOptions.map(il => (
                    <MenuItem key={il} value={il}>
                      {il}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small" disabled={!filters.il && districtOptions.length === 0}>
                <InputLabel shrink>İlçe</InputLabel>
                <Select
                  value={filters.ilce}
                  onChange={handleFilterChange('ilce')}
                  label="İlçe"
                  displayEmpty
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {districtOptions.map(ilce => (
                    <MenuItem key={ilce} value={ilce}>
                      {ilce}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Tahsis Durumu</InputLabel>
                <Select
                  value={filters.hesapYapildi}
                  onChange={handleFilterChange('hesapYapildi')}
                  label="Tahsis Durumu"
                  displayEmpty
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="tahsisEdildi">Tahsis Edildi</MenuItem>
                  <MenuItem value="bekliyor">Bekliyor</MenuItem>
                  <MenuItem value="tahsisEdilmedi">Tahsis Edilmedi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Başlangıç Tarihi"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={handleFilterChange('startDate')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Bitiş Tarihi"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={handleFilterChange('endDate')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sıralama</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={handleFilterChange('sortBy')}
                  label="Sıralama"
                >
                  <MenuItem value="sozlesmeTarihi">Sözleşme Tarihi</MenuItem>
                  <MenuItem value="createdAt">Oluşturulma Tarihi</MenuItem>
                  <MenuItem value="customerName">Müşteri Adı</MenuItem>
                  <MenuItem value="stokMarka">Ürün</MenuItem>
                  <MenuItem value="quantity">Miktar</MenuItem>
                  <MenuItem value="hesapYapildi">Tahsis Durumu</MenuItem>
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
      )}

      {/* Stok Takip Tablosu */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Müşteri Adı</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>İl</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>TC Kimlik</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Satılan Cihaz</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Marka</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Model</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Adet</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Tahsis Durumu</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Sözleşme Tarihi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((item) => {
                const { il } = getLocationFromItem(item);
                return (
                <TableRow key={item.id} hover>
                  <TableCell>{item.customerName}</TableCell>
                  <TableCell>{il || '-'}</TableCell>
                  <TableCell>{item.tcKimlik}</TableCell>
                  <TableCell>{item.satilanCihaz || '-'}</TableCell>
                  <TableCell>{item.stokMarka}</TableCell>
                  <TableCell>{item.stokModel}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.quantity} 
                      color="primary" 
                      size="small" 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>{getTahsisDurumuChip(getItemStatus(item))}</TableCell>
                  <TableCell>
                    {item.sozlesmeTarihi ? new Date(item.sozlesmeTarihi).toLocaleDateString('tr-TR') : '-'}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredData.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Gösterilecek veri bulunamadı.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

