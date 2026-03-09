import React from 'react';
const { useMemo } = React;
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
const PaymentDetailsDialog = React.lazy(() => import('../components/PaymentDetailsDialog'));
const ClientTable = React.lazy(() => import('../components/ClientTable'));
// Memoized table - dialog açılışını TAMAMEN bloke etmez
import ClientTableMemoized from '../components/ClientTableMemoized';
import JobInfoDialog from '../components/JobInfoDialog';
import CheckIcon from '@mui/icons-material/Check';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import TableSortLabel from '@mui/material/TableSortLabel';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { useAuth } from '../context/AuthContext';
import { useRealTime } from '../context/RealTimeContext';
import Divider from '@mui/material/Divider';
import {
  formatNumber, 
  truncateText, 
  hesaplaTotalOdenen, 
  hesaplaKalanOdeme, 
  odemeTurleri,
  formatPhoneNumber,
  validatePhoneNumber,
  formatFileSize,
  apiGetDeletedCustomers,
  clearLocalStorage,
  clearSpecificLocalStorage,
  apiGetActiveUstalar,
  apiGetCustomerAssignments,
  apiGetCustomerFilters,
  apiGetFilteredCustomers,
  apiGetStoklar,
  apiGetJobs,
  apiGetModelsByProductType,
  apiGetBrandsByProductType,
  apiGetModelsByBrandAndProductType,
  apiUploadSozlesme,
  apiDownloadSozlesme,
  apiDeleteSozlesme,
  API_BASE_URL,
  apiGetSozlesmeBlobUrl
} from '../utils/helpers';
import { useCustomers } from '../hooks/useCustomers';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

// Add option arrays near imports
// İş seçenekleri backend'den yüklenecek
const pipeOptions = ['Esnek','Çelik'];
const thermostatOptions = ['Akıllı','Kablolu','Kablosuz','Yok'];

// Statik iş → ürün türü mapping'i kaldırıldı; bilgiler backend Jobs üzerinden geliyor

export default function ClientPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  // Masaüstünde tabloyu ekrana daha iyi oturtmak için hafif ölçekleme
  // Not: masaüstü tablo ölçekleme kaldırıldı
  const setFormRef = React.useRef(null);
  
  // Süper admin için boş sayfa göster
  if (user?.role === 'superadmin') {
    return <Box sx={{ height: '100vh', bgcolor: 'white' }}></Box>;
  }
  // İş detay diyalogu state'leri (erken tanımla ki effect'lerde kullanılabilsin)
  const [jobInfoOpen, setJobInfoOpen] = React.useState(false);
  const [jobInfoData, setJobInfoData] = React.useState(null);

  // Usta listesi state'i
  const [ustalar, setUstalar] = React.useState([]);
  const [loadingUstalar, setLoadingUstalar] = React.useState(false);

  // Filtre state'leri
  const [customerFilters, setCustomerFilters] = React.useState({
    ekleyen: '',
    usta: '',
    kalanOdeme: '',
    odemeYontemi: ''
  });
  const [filterOptions, setFilterOptions] = React.useState({
    ekleyenler: [],
    ustalar: []
  });

  // Dosya yükleme state'leri
  const [uploadingFile, setUploadingFile] = React.useState(false);
  const [loadingFilters, setLoadingFilters] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

  // Stok kontrolü state'leri
  const [stoklar, setStoklar] = React.useState([]);
  const [loadingStoklar, setLoadingStoklar] = React.useState(false);
  const [jobs, setJobs] = React.useState([]);
  // Basit demo veri yapıları (ileride API ile değiştirilebilir)
  // Devlet kaynaklarına yakın, güncel ve açık bir API: turkiyeapi.dev
  const [provinces, setProvinces] = React.useState([]); // [{id,name}]
  const [districts, setDistricts] = React.useState([]); // [{id,name}]
  const [neighborhoods, setNeighborhoods] = React.useState([]); // [{id,name}]

  const fetchDistrictsByProvinceName = React.useCallback(async (provinceName) => {
    try {
      const province = (provinces || []).find(p => (p.name || '').toLowerCase() === (provinceName || '').toLowerCase());
      if (!province) { setDistricts([]); setNeighborhoods([]); return; }
      const res = await fetch(`https://api.turkiyeapi.dev/v1/districts?provinceId=${province.id}`);
      const json = await res.json();
      setDistricts(Array.isArray(json.data) ? json.data : []);
      setNeighborhoods([]);
    } catch { setDistricts([]); setNeighborhoods([]); }
  }, [provinces]);

  const fetchNeighborhoodsByDistrictName = React.useCallback(async (districtName) => {
    try {
      const district = (districts || []).find(d => (d.name || '').toLowerCase() === (districtName || '').toLowerCase());
      if (!district) { setNeighborhoods([]); return; }
      const res = await fetch(`https://api.turkiyeapi.dev/v1/neighborhoods?districtId=${district.id}`);
      const json = await res.json();            
      setNeighborhoods(Array.isArray(json.data) ? json.data : []);
    } catch { setNeighborhoods([]); }
  }, [districts]);  

  React.useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await fetch('https://api.turkiyeapi.dev/v1/provinces');
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        setProvinces(list);
        // Varsayılan il/ilçe
        const defaultProvince = 'Uşak';
        const defaultDistrict = 'Eşme';
        // Eğer formda il yoksa Uşak yap ve ilçeleri getir
        setFormRef.current && setFormRef.current(prev => ({ ...prev, il: prev.il || defaultProvince }));
        // İlçeleri getir ve Eşme'yi seç
        try {
          const prov = list.find(p => (p.name || '').toLowerCase() === defaultProvince.toLowerCase());
          if (prov) {
            const dRes = await fetch(`https://api.turkiyeapi.dev/v1/districts?provinceId=${prov.id}`);
            const dJson = await dRes.json();
            const dList = Array.isArray(dJson.data) ? dJson.data : [];
            setDistricts(dList);
            if (dList.some(d => (d.name || '').toLowerCase() === defaultDistrict.toLowerCase())) {
              setFormRef.current && setFormRef.current(prev => ({ ...prev, ilce: prev.ilce || defaultDistrict }));
              // Mahalleleri getir
              const dd = dList.find(d => (d.name || '').toLowerCase() === defaultDistrict.toLowerCase());
              if (dd) {
                const mRes = await fetch(`https://api.turkiyeapi.dev/v1/neighborhoods?districtId=${dd.id}`);
                const mJson = await mRes.json();
                setNeighborhoods(Array.isArray(mJson.data) ? mJson.data : []);
              }
            }
          }
        } catch {}
      } catch {}
    };
    loadProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProvinceChange = React.useCallback(async (value) => {
    setFormRef.current && setFormRef.current(prev => ({ ...prev, il: value, ilce: '', mahalle: '' }));
    await fetchDistrictsByProvinceName(value);
  }, [fetchDistrictsByProvinceName]);

  const handleDistrictChange = React.useCallback(async (value) => {
    setFormRef.current && setFormRef.current(prev => ({ ...prev, ilce: value, mahalle: '' }));
    await fetchNeighborhoodsByDistrictName(value);
  }, [fetchNeighborhoodsByDistrictName]);


  
  // Usta listesini yükle
  const loadUstalar = async () => {
    setLoadingUstalar(true);
    try {
      const data = await apiGetActiveUstalar();
      const list = Array.isArray(data) ? data : [];
      setUstalar(list);
    } catch (error) {

    } finally {
      setLoadingUstalar(false);
    }
  };

  // Müşteri filtrelerini yükle
  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const data = await apiGetCustomerFilters();
      setFilterOptions(data);
    } catch (error) {

    } finally {
      setLoadingFilters(false);
    }
  };



  // Müşteri filtrelerini yükle
  React.useEffect(() => {
    loadFilters();
  }, []);

  // Use the custom hook for all customer management
  const {
    // State
    musteriler,
    setMusteriler, // Add setMusteriler function
    loading,
    error,
    searchTerm,
    setSearchTerm,
    form,
    setForm,
    editMusteri,
    open,
    odemeDetayOpen,
    odemeEkleOpen,
    selectedMusteri,
    deleteConfirmOpen,
    customerToDelete,
    deletedCustomersOpen,
    setDeletedCustomersOpen,
    custPayments,
    custPayForm,
    custPayErr,
    odemeForm,
    payErr,
    deletedPayments,
    deletedCustPayments,
    deletedCustomers,
    setDeletedCustomers,
    pendingPaymentDeletes,
    inactiveSuppliers,
    setInactiveSuppliers,
    orders, // Siparişler state'i
    orderLoading, // Siparişler yükleme durumu
    stokHareketleri, // Stok hareketleri state'i
    stokHareketleriLoading, // Stok hareketleri yükleme durumu
    updateTaahhutDate,
    loadData,
    loadStoklar, // Stokları yükleme fonksiyonu
    loadOrders, // Siparişleri yükleme fonksiyonu
    loadCustomersByDateRange,
    clearDateFilter,
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    
    // Tarih filtresi state'leri
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showDateFilter,
    setShowDateFilter,
    dateFilteredMusteriler,
    isDateFiltered,
    dateRangeTotals,
    
    // Computed
    supplierOptions,
    filteredMusteriler,
    ustaAtamalari,
    setUstaAtamalari,
    
    // Functions
    handleOpen,
    handleClose,
    handleSubmit,
    handleChange,
    handleCustPayChange,
    addCustPayment,
    deleteCustPayment,
    handleUndoCustDelete,
    handleOdemeDetayOpen,
    handleOdemeDetayClose,
    handleOdemeEkleOpen,
    handleOdemeEkleClose,
    handleOdemeChange,
    handleOdemeEkle,
    handleOdemeSil,
    requestPaymentDelete,
    approvePaymentDelete,
    rejectPaymentDelete,
    handleUndoDelete,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleUndoCustomerDelete,
    handleClearDeletedCustomers,
    handlePermanentDelete,
    handleCleanupDeletedCustomer,
    handleCleanupAllDeletedCustomers,
    refreshSuppliers, // Add refreshSuppliers function
    // Çoklu cihaz satışı
    soldDevices,
    setSoldDevices
  } = useCustomers();
  
  // 🔍 DEBUG: Müşteriler tablosu
  React.useEffect(() => {
    if (musteriler.length > 0) {
      console.log('=== MÜŞTERİLER TABLOSU DEBUG ===');
      console.log('📦 Toplam müşteri:', musteriler.length);
      console.log('✅ Tahsis edilen:', musteriler.filter(m => m.hesapYapildi).length);
      console.log('⏳ Bekleyen:', musteriler.filter(m => !m.hesapYapildi).length);
      console.log('================================');
    }
  }, [musteriler]);
  
  // setForm referansını efekt öncesi callbacklerde kullanmak için sakla
  React.useEffect(() => { setFormRef.current = setForm; }, [setForm]);

  const { connection } = useRealTime();

  // Usta listesini ve stokları yükle
  React.useEffect(() => {
    // kritik olmayan verileri idle zamanı veya kısa gecikmeyle yükle
    const t = setTimeout(() => {
      loadUstalar();
      loadStoklar();
      apiGetJobs().then(res => { if (res.success) setJobs(res.data); });
      const storedStoklar = localStorage.getItem('stoklar');
      if (storedStoklar) {
        try { setStoklar(JSON.parse(storedStoklar)); } catch {}
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Ürün seçimi gerekmeyen iş adları: 'kolon' davranışı gibi (erken tanımlama)
  const isDeviceOptionalJobName = React.useCallback((rawName) => {
    const name = (rawName || '').trim().toLowerCase();
    if (!name) return false;
    const optionalList = new Set([
      'kolon',
      'gaz tesisatı',
      'kolon gaz',
      'full',
      'dönüşüm',
      'dönüşüm kolon',
      'dönüşüm-kolon',
      'z-diğer',
      'z-diger'
    ]);
    return optionalList.has(name);
  }, []);

  // Usta listesini, seçilen iş 'kolon' ise sadece uzmanlık alanında 'kolon' geçen ustalarla sınırla
  const filteredUstalar = React.useMemo(() => {
    const name = (form?.yapilanIs || '').trim().toLowerCase();
    if (!isDeviceOptionalJobName(name)) return ustalar;
    // Cihaz gerekmeyen işlerde (kolon vb.) uzmanlık alanında 'kolon' geçenleri önceliklendirelim
    return ustalar.filter(u => (u.uzmanlikAlani || '').toLowerCase().includes('kolon'));
  }, [ustalar, form?.yapilanIs, isDeviceOptionalJobName]);

  // İş detay diyalogu açıldığında usta atamalarını yükle
  React.useEffect(() => {
    const loadAssignments = async () => {
      if (jobInfoOpen && jobInfoData?.id) {
        try {
          // Mevcut listeden anında gösterim
          const fromList = musteriler.find(m => m.id === jobInfoData.id);
          if (fromList && Array.isArray(fromList.ustaAtamalari)) {
            setJobInfoData(prev => prev ? ({ ...prev, ustaAtamalari: fromList.ustaAtamalari }) : prev);
          }
          // Ardından gerçek veriyi fetch edip hem diyaloga hem liste state'ine yaz
          const res = await apiGetCustomerAssignments(jobInfoData.id);
          if (res.success) {
            setJobInfoData(prev => prev ? ({ ...prev, ustaAtamalari: res.data }) : prev);
            setMusteriler(prev => prev.map(c => c.id === jobInfoData.id ? { ...c, ustaAtamalari: res.data } : c));
          }
        } catch {}
      }
    };
    loadAssignments();
  }, [jobInfoOpen, jobInfoData?.id]);

  // SignalR sözleşme dosyası güncellemelerini dinle
  React.useEffect(() => {
    if (!connection) return;

    const handleSozlesmeUploaded = (customerId, sozlesmeData) => {
      setMusteriler(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === customerId 
            ? { 
                ...customer, 
                sozlesmeDosyaAdi: sozlesmeData.fileName,
                sozlesmeDosyaBoyutu: sozlesmeData.fileSize,
                sozlesmeDosyaTipi: sozlesmeData.fileType
              }
            : customer
        )
      );
      // Eğer iş detay diyalogu açık ve aynı müşteriyi gösteriyorsa onu da güncelle
      setJobInfoData(prev => prev && prev.id === customerId 
        ? { 
            ...prev, 
            sozlesmeDosyaAdi: sozlesmeData.fileName,
            sozlesmeDosyaBoyutu: sozlesmeData.fileSize,
            sozlesmeDosyaTipi: sozlesmeData.fileType
          }
        : prev
      );
    };

    const handleSozlesmeDeleted = (customerId) => {
      setMusteriler(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === customerId 
            ? { ...customer, sozlesmeDosyaAdi: null, sozlesmeDosyaBoyutu: null, sozlesmeDosyaTipi: null }
            : customer
        )
      );
      setJobInfoData(prev => prev && prev.id === customerId 
        ? { ...prev, sozlesmeDosyaAdi: null, sozlesmeDosyaBoyutu: null, sozlesmeDosyaTipi: null }
        : prev
      );
    };

    connection.on('ReceiveSozlesmeUploaded', handleSozlesmeUploaded);
    connection.on('ReceiveSozlesmeDeleted', handleSozlesmeDeleted);

    return () => {
      connection.off('ReceiveSozlesmeUploaded', handleSozlesmeUploaded);
      connection.off('ReceiveSozlesmeDeleted', handleSozlesmeDeleted);
    };
  }, [connection]);

  // buildJobInfo fonksiyonunu useEffect'ten önce tanımla
  const buildJobInfo = React.useCallback((m) => {
    const primary = Array.isArray(m.soldDevices) && m.soldDevices.length>0 ? m.soldDevices[0] : {};
    return {
      ...m,
      yapilanIs: primary.yapilanIs || primary.YapilanIs || m.yapilanIs || '',
      boruTipi: primary.boruTipi || primary.BoruTipi || m.boruTipi || '',
      satilanCihaz: primary.deviceName || primary.satilanCihaz || primary.SatilanCihaz || m.satilanCihaz || '',
      termostat: primary.termostat || primary.Termostat || m.termostat || ''
    };
  }, []);

  // Müşteriler değiştiğinde açık iş detay diyalogunu senkron tut
  React.useEffect(() => {
    if (!jobInfoOpen || !jobInfoData) return;
    const updated = musteriler.find(m => m.id === jobInfoData.id);
    if (updated) {
      setJobInfoData(buildJobInfo(updated));
    }
  }, [musteriler, jobInfoOpen]);



  // Sıralama durumu ve fonksiyonları
  const [sortField, setSortField] = React.useState('sozlesmeTarihi');
  const [sortOrder, setSortOrder] = React.useState('desc'); // 'asc' | 'desc'

  // Bugünün tarihi (YYYY-MM-DD) - gelecekte minimum tarih kısıtlaması için kullanılır
  const todayStr = React.useMemo(() => new Date().toLocaleDateString('sv-SE'), []);
  
  // Düzenleme modunda geçmiş tarihlerin seçilebilmesi için minimum tarih
  const minDateStr = React.useMemo(() => {
    // Eğer düzenleme modundaysa, geçmiş tarihleri de kabul et
    if (editMusteri) {
      return '1900-01-01'; // Çok eski bir tarih, pratik olarak sınırsız
    }
    return todayStr; // Yeni müşteri eklerken bugünden önceki tarihleri kabul etme
  }, [editMusteri, todayStr]);

  // Randevu tarihi düzenleme state'leri
  const [randevuDialogOpen, setRandevuDialogOpen] = React.useState(false);
  const [selectedRandevuMusteri, setSelectedRandevuMusteri] = React.useState(null);
  const [randevuDate, setRandevuDate] = React.useState('');
  // Görsel önizleme (büyütme) state'i
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = React.useState('');
  const [blobPreviewUrl, setBlobPreviewUrl] = React.useState('');



  // Dinamik cihaz seçenekleri - işin bağlı ürün türlerinden aktif modellere göre (backend)
  const [deviceOptions, setDeviceOptions] = React.useState([]);
  const [addQuantity, setAddQuantity] = React.useState(1);
  const [deviceOptionsByJob, setDeviceOptionsByJob] = React.useState({}); // { [jobNameLower]: string[] }
  // İş seçimi (ön ödeme benzeri) geçici form ve hata durumları
  const [jobForm, setJobForm] = React.useState({ yapilanIs: '', deviceName: '', boruTipi: '', termostat: '', quantity: '', note: '' });
  const [jobErr, setJobErr] = React.useState({});

  // const isDeviceOptionalJobName = React.useCallback((rawName) => {
  //   const name = (rawName || '').trim().toLowerCase();
  //   if (!name) return false;
  //   const optionalList = new Set([
  //     'kolon',
  //     'gaz tesisatı',
  //     'kolon gaz',
  //     'dönüşüm',
  //     'dönüşüm kolon'
  //   ]);
  //   return optionalList.has(name);
  // }, []);

  const ensureDeviceOptionsForJob = React.useCallback(async (jobName) => {
    const key = (jobName || '').trim().toLowerCase();
    if (!key) return;
    if (deviceOptionsByJob[key]) return;
    const selectedJob = jobs.find(j => (j.ad || '').toLowerCase() === key);
    if (!selectedJob) return;
    const productTypes = Array.isArray(selectedJob.productTypes) ? selectedJob.productTypes : [];
    if (productTypes.length === 0) { setDeviceOptionsByJob(prev => ({ ...prev, [key]: [] })); return; }
    try {
      const all = await Promise.all(productTypes.map(pt => apiGetModelsByProductType(pt.id)));
      const models = all.flatMap(r => (r.success ? r.data : []));
      const names = models.map(m => `${m.brandAd} ${m.ad}`);
      // Sadece stokta olanları göster
      const stokNameSet = new Set((stoklar || []).map(s => (`${(s.marka || '').trim()} ${(s.model || '').trim()}`).toLowerCase()));
      const filteredNames = names.filter(n => stokNameSet.has((n || '').trim().toLowerCase()));
      setDeviceOptionsByJob(prev => ({ ...prev, [key]: [...new Set(filteredNames)] }));
    } catch {
      setDeviceOptionsByJob(prev => ({ ...prev, [key]: [] }));
    }
  }, [jobs, stoklar, deviceOptionsByJob]);

  const handleJobChange = React.useCallback(async (e) => {
    const { name, value } = e.target;
    setJobForm(prev => ({ ...prev, [name]: value }));
    if (name === 'yapilanIs') {
      await ensureDeviceOptionsForJob(value);
      const noDevice = isDeviceOptionalJobName(value);
      if (noDevice) {
        // Kolon seçildiğinde diğer alanları temizle ve varsayılan değerler ver
        setJobForm(prev => ({ 
          ...prev, 
          deviceName: '', 
          termostat: '', 
          quantity: '1' 
        }));
      } else {
        setJobForm(prev => ({ ...prev, deviceName: '' }));
      }

      // İş seçilince marka ve model seçeneklerini yükle (ürün türleri üzerinden marka → model akışı)
      try {
        const selectedJob = jobs.find(j => (j.ad || '').toLowerCase() === (value || '').trim().toLowerCase());
        const productTypes = Array.isArray(selectedJob?.productTypes) ? selectedJob.productTypes : [];
        let brandMap = new Map(); // id-> {id, ad}
        // İşe bağlı ürün türlerine göre markaları topla
        for (const pt of productTypes) {
          const res = await apiGetBrandsByProductType(pt.id);
          if (res.success) {
            for (const b of (res.data || [])) {
              brandMap.set(b.id, b);
            }
          }
        }
        const brandOptions = Array.from(brandMap.values());
        setJobForm(prev => ({ ...prev, _brandOptions: brandOptions, brandId: '', modelName: '' }));
      } catch {}
    }

    if (name === 'brandId') {
      // Marka seçildi → modele göre seçenekleri yükle (yalnızca stokta olanlar)
      try {
        const selectedJob = jobs.find(j => (j.ad || '').toLowerCase() === (jobForm.yapilanIs || '').trim().toLowerCase());
        const productTypes = Array.isArray(selectedJob?.productTypes) ? selectedJob.productTypes : [];
        let modelNames = new Set();
        for (const pt of productTypes) {
          const res = await apiGetModelsByBrandAndProductType(value, pt.id);
          if (res.success) {
            const models = res.data || [];
            const names = models.map(m => `${m.brandAd} ${m.ad}`);
            const stokNameSet = new Set((stoklar || []).map(s => (`${(s.marka || '').trim()} ${(s.model || '').trim()}`).toLowerCase()));
            names.forEach(n => { if (stokNameSet.has((n || '').trim().toLowerCase())) modelNames.add(n); });
          }
        }
        setJobForm(prev => ({ ...prev, _modelOptions: Array.from(modelNames), modelName: '' }));
      } catch {}
    }
  }, [ensureDeviceOptionsForJob, isDeviceOptionalJobName]);

  const addJobItem = React.useCallback((e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const errors = {};
    const noDevice = isDeviceOptionalJobName(jobForm.yapilanIs);
    if (!jobForm.yapilanIs) errors.yapilanIs = 'Zorunlu alan';
    // Cihaz alanı kalktı: model zorunlu
    if (!noDevice && !jobForm.modelName) errors.deviceName = 'Seçiniz';
    
    // Kolon işi için adet, boru tipi, termostat zorunlu değil
    if (!noDevice) {
      const qty = parseInt(jobForm.quantity, 10);
      if (!qty || qty <= 0) errors.quantity = 'Geçerli bir adet giriniz';
    }
    
    setJobErr(errors);
    if (Object.keys(errors).length) return;
    
    // Kolon için varsayılan değerler
    const finalQuantity = noDevice ? 1 : (parseInt(jobForm.quantity, 10) || 1);
    
    // Ana iş/cihazı da soldDevices olarak tut: ilk seçimde otomatik ekle mantığı
    setSoldDevices(prev => ([
      ...prev,
      {
        yapilanIs: jobForm.yapilanIs || '',
        deviceName: noDevice ? (jobForm.yapilanIs || '') : (jobForm.modelName || ''),
        brandAd: jobForm.brandId ? ((jobForm._brandOptions||[]).find(b=> b.id === parseInt(jobForm.brandId,10))?.ad || '') : '',
        modelName: noDevice ? '' : (jobForm.modelName || ''),
        boruTipi: jobForm.boruTipi || '',
        termostat: noDevice ? '' : (jobForm.termostat || ''),
        quantity: finalQuantity,
        note: jobForm.note || ''
      }
    ]));
    setJobForm({ yapilanIs: '', deviceName: '', boruTipi: '', termostat: '', quantity: '', note: '' });
    setJobErr({});
  }, [jobForm, setSoldDevices, isDeviceOptionalJobName]);

  const deleteJobItem = React.useCallback((index) => {
    setSoldDevices(prev => prev.filter((_, i) => i !== index));
  }, [setSoldDevices]);

  const deleteJobRow = React.useCallback((idx, row) => {
    // Birincil satır (müşterinin ana iş/cihazı) ise form alanlarını temizle
    if (row && row._isPrimary) {
      setForm(f => ({ ...f, yapilanIs: '', satilanCihaz: '', boruTipi: '', termostat: '' }));
      return;
    }
    // Diğer satırlar soldDevices içindeki indeks ile eşleşir; edit modunda birincil satır varsa offset uygula
    const hasPrimary = !!(editMusteri && (((form?.yapilanIs || '').trim()) || ((form?.satilanCihaz || '').trim()) || ((form?.boruTipi || '').trim()) || ((form?.termostat || '').trim())));
    const soldIdx = hasPrimary ? idx - 1 : idx;
    setSoldDevices(prev => prev.filter((_, i) => i !== soldIdx));
  }, [setForm, setSoldDevices, editMusteri, form?.yapilanIs, form?.satilanCihaz, form?.boruTipi, form?.termostat]);

  const handleAddSoldDevice = React.useCallback(() => {
    const name = (form?.satilanCihaz || '').trim();
    const qty = parseInt(addQuantity, 10);
    if (!name || !qty || qty <= 0) return;
    setSoldDevices(prev => ([...prev, { deviceName: name, quantity: qty, note: '', yapilanIs: form?.yapilanIs || '' }]));
    setAddQuantity(1);
  }, [form?.satilanCihaz, addQuantity, setSoldDevices]);

  React.useEffect(() => {
    const loadModelsForSelectedJob = async () => {
      const selectedJob = jobs.find(j => (j.ad || '').toLowerCase() === (form.yapilanIs || '').toLowerCase());
      if (!selectedJob) {
        setDeviceOptions([]);
        return;
      }
      const productTypes = Array.isArray(selectedJob.productTypes) ? selectedJob.productTypes : [];
      if (productTypes.length === 0) {
        setDeviceOptions([]);
        return;
      }
      // Her ürün türü için aktif modelleri çek ve marka+model string'lerini oluştur
      try {
        const all = await Promise.all(productTypes.map(pt => apiGetModelsByProductType(pt.id)));
        const models = all.flatMap(r => (r.success ? r.data : []));
        const names = models.map(m => `${m.brandAd} ${m.ad}`);
        // Stok yönetiminde kaydı olan modelleri göster
        const stokNameSet = new Set((stoklar || []).map(s => (`${(s.marka || '').trim()} ${(s.model || '').trim()}`).toLowerCase()));
        const filteredNames = names.filter(n => stokNameSet.has((n || '').trim().toLowerCase()));
        setDeviceOptions([...new Set(filteredNames)]);
      } catch {
        setDeviceOptions([]);
      }
    };
    if ((form.yapilanIs || '').trim()) {
      loadModelsForSelectedJob();
    } else {
      setDeviceOptions([]);
    }
  }, [form.yapilanIs, jobs, stoklar]);

  // Mevcut seçili cihaz değeri seçeneklerde yoksa geçici olarak listeye ekle (edit modunda görünür kalsın)
  const mergedDeviceOptions = React.useMemo(() => {
    const current = (form?.satilanCihaz || '').trim();
    if (!current) return deviceOptions;
    if (deviceOptions.includes(current)) return deviceOptions;
    return [current, ...deviceOptions];
  }, [deviceOptions, form?.satilanCihaz]);

  // İş tablosunda gösterilecek satırlar: (edit modunda) müşterinin kayıtlı ana cihazı + eklenen satırlar
  const jobTableRows = React.useMemo(() => ([...(soldDevices || [])]), [soldDevices]);

  // Eski kayıtlar için (sadece deviceName mevcutsa) stok verisinden marka/model çözümle
  const resolveBrandModelFromRow = React.useCallback((row) => {
    const brand = (row?.brandAd || '').trim();
    const model = (row?.modelName || '').trim();
    if (brand || model) return { brand, model };

    const device = (row?.deviceName || '').trim();
    if (!device) return { brand: '', model: '' };

    const normalized = device.toLowerCase();
    try {
      const match = (stoklar || []).find(s => (`${(s.marka || '').trim()} ${(s.model || '').trim()}`).toLowerCase() === normalized);
      if (match) {
        return { brand: (match.marka || '').trim(), model: (match.model || '').trim() };
      }
    } catch {}

    const parts = device.split(' ');
    if (parts.length >= 2) {
      return { brand: parts[0], model: parts.slice(1).join(' ') };
    }
    return { brand: device, model: '' };
  }, [stoklar]);

  // jobs yüklendiğinde veya dialog açıkken mevcut yapilanIs listedeki seçenek değilse temizle
  React.useEffect(() => {
    if (!open) return;
    const current = form?.yapilanIs || '';
    if (!current) return;
    const exactNames = new Set(jobs.map(j => j.ad));
    if (!exactNames.has(current)) {
      setForm(f => ({ ...f, yapilanIs: '', satilanCihaz: '' }));
    }
  }, [jobs, open]);

  // Satışı Yapılan Cihaz: Seçeneklerde yoksa veya iş cihaz gerektirmiyorsa değeri temizle
  React.useEffect(() => {
    const noDevice = isDeviceOptionalJobName(form?.yapilanIs);
    if (noDevice) {
      if (form.satilanCihaz) setForm(f => ({ ...f, satilanCihaz: '' }));
      return;
    }
    // Seçenekler henüz yüklenmediyse mevcut değeri koru; yüklendikten sonra doğrula
    if (deviceOptions.length > 0 && form?.satilanCihaz && !deviceOptions.includes(form.satilanCihaz)) {
      setForm(f => ({ ...f, satilanCihaz: '' }));
    }
  }, [form?.yapilanIs, deviceOptions, isDeviceOptionalJobName]);

  // Boru Tipi: seçeneklerde yoksa temizle
  React.useEffect(() => {
    const current = form?.boruTipi || '';
    if (!current) return;
    if (!pipeOptions.includes(current)) {
      setForm(f => ({ ...f, boruTipi: '' }));
    }
  }, [form?.boruTipi]);

  // Bir müşteri için bekleyen silme taleplerini kontrol et
  const getPendingDeleteCount = React.useCallback((musteriId) => {
    return pendingPaymentDeletes.filter(req => req.customerId === musteriId).length;
  }, [pendingPaymentDeletes]);

  // Eski stok kontrolü kaldırıldı (artık backend mapping ile dinamik)

  const handleSort = React.useCallback((field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);

  // Tarih aralığına göre filtrelenmiş müşteri listesi - sadece client-side filtreleme kullan
  const filteredMusterilerForDisplay = React.useMemo(() => {
    let filtered = filteredMusteriler;
    
    // Tarih filtresi
    if (startDate || endDate) {
      filtered = filtered.filter(musteri => {
        // Ödeme taahhüt tarihi varsa onu kullan, yoksa ödeme tarihlerini kontrol et
        let tarihKontrol = null;
        
        if (musteri.odemeTaahhutTarihi) {
          // Ödeme taahhüt tarihi varsa onu kullan
          tarihKontrol = new Date(musteri.odemeTaahhutTarihi);
        } else if (musteri.odemeler && musteri.odemeler.length > 0) {
          // Ödeme taahhüt tarihi yoksa, en son ödeme tarihini kullan
          const sonOdeme = musteri.odemeler.reduce((latest, odeme) => {
            const odemeTarihi = new Date(odeme.tarih);
            return !latest || odemeTarihi > latest ? odemeTarihi : latest;
          }, null);
          tarihKontrol = sonOdeme;
        } else {
          // Hiç ödeme yoksa, sözleşme tarihini kullan
          tarihKontrol = musteri.sozlesmeTarihi ? new Date(musteri.sozlesmeTarihi) : null;
        }
        
        // Eğer hiç tarih bulunamazsa, filtreleme yapma
        if (!tarihKontrol) return true;
        
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && end) {
          return tarihKontrol >= start && tarihKontrol <= end;
        } else if (start) {
          return tarihKontrol >= start;
        } else if (end) {
          return tarihKontrol <= end;
        }
        return true;
      });
    }
    
    // Ekleyen filtresi
    if (customerFilters.ekleyen) {
      filtered = filtered.filter(musteri => 
        musteri.createdByUsername === customerFilters.ekleyen
      );
    }
    
    // Usta filtresi
    if (customerFilters.usta) {
      filtered = filtered.filter(musteri => 
        musteri.ustaIsmi === customerFilters.usta
      );
    }
    
    // Kalan ödeme filtresi
    if (customerFilters.kalanOdeme) {
      filtered = filtered.filter(musteri => {
        const kalanOdeme = hesaplaKalanOdeme(musteri.sozlesmeTutari, musteri.odemeler || []);
        
        switch (customerFilters.kalanOdeme) {
          case 'tamamlandi':
            return musteri.hesapYapildi;
          case 'odendi':
            return kalanOdeme === 0 && !musteri.hesapYapildi;
          case 'kalan':
            return kalanOdeme > 0;
          default:
            return true;
        }
      });
    }

    // Ödeme yöntemi filtresi
    if (customerFilters.odemeYontemi) {
      filtered = filtered.filter(musteri => {
        const odemeler = musteri.odemeler || [];
        const hasKart = odemeler.some(o => (o.tur || '').toLowerCase() === 'kredi kartı' || (o.tur || '').toLowerCase() === 'kredi karti');
        const hasNakit = odemeler.some(o => (o.tur || '').toLowerCase() === 'nakit');
        switch (customerFilters.odemeYontemi) {
          case 'kart':
            return hasKart && !hasNakit;
          case 'nakit':
            return hasNakit && !hasKart;
          case 'nakit_ve_kart':
            return hasNakit && hasKart;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [filteredMusteriler, startDate, endDate, customerFilters]);

  // Tarih aralığındaki toplam hesaplamaları - client-side hesaplama
  const totalsForDisplay = React.useMemo(() => {
    let toplamSozlesmeTutari = 0;
    let toplamOdenenTutar = 0;
    let toplamKalanOdeme = 0;

    filteredMusterilerForDisplay.forEach(musteri => {
      const odenenTutar = hesaplaTotalOdenen(musteri.odemeler || []);
      const kalanOdeme = hesaplaKalanOdeme(musteri.sozlesmeTutari, musteri.odemeler || []);
      
      toplamSozlesmeTutari += musteri.sozlesmeTutari || 0;
      toplamOdenenTutar += odenenTutar;
      toplamKalanOdeme += kalanOdeme;
    });

    return {
      toplamSozlesmeTutari,
      toplamOdenenTutar,
      toplamKalanOdeme,
      musteriSayisi: filteredMusterilerForDisplay.length
    };
  }, [filteredMusterilerForDisplay]);

  // Sıralanmış müşteri listesi
  const sortedMusteriler = React.useMemo(() => {
    const arr = [...filteredMusterilerForDisplay];
    if (!sortField) return arr;

    return arr.sort((a, b) => {
      let valA, valB;

      if (sortField === 'kalanOdeme') {
        valA = hesaplaKalanOdeme(a.sozlesmeTutari, a.odemeler);
        valB = hesaplaKalanOdeme(b.sozlesmeTutari, b.odemeler);
      } else {
        valA = a[sortField] || '';
        valB = b[sortField] || '';
      }

      // Tarih alanlarını timestamp'e dönüştür
      if (sortField === 'sozlesmeTarihi' || sortField === 'odemeTaahhutTarihi' || sortField === 'randevuTarihi') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;

      // Eşitlik durumunda: ID'ye göre sıralama (büyük ID = yeni müşteri = üstte)
      // Bu şekilde aynı tarihte eklenen müşteriler için en son eklenen üstte olur
      return (b.id || 0) - (a.id || 0);
    });
  }, [filteredMusterilerForDisplay, sortField, sortOrder]);

  // Seçili müşteri için bekleyen silme talepleri
  const pendingForCustomer = React.useMemo(() => {
    if (!selectedMusteri) return [];
    return pendingPaymentDeletes.filter(p => {
      const customerId = p.customerId || p.CustomerId;
      const paymentId = p.paymentId || p.PaymentId;
      const requestedBy = p.requestedBy || p.RequestedBy;
      
      // Müşteri ID'si eşleşmeli
      if (customerId !== selectedMusteri.id) return false;
      
      // Eğer çalışan ise, sadece kendi taleplerini göster
      if (user.role === 'employee') {
        // requestedBy string veya object olabilir, her ikisini de kontrol et
        const requestUsername = typeof requestedBy === 'object' 
          ? (requestedBy?.username || requestedBy?.Username) 
          : requestedBy;
        return requestUsername === user.username;
      }
      
      // Admin ise tüm talepleri göster
      return true;
    });
  }, [pendingPaymentDeletes, selectedMusteri, user]);

  // Taahhüt düzenleme dialogu
  const [taahhutDialogOpen, setTaahhutDialogOpen] = React.useState(false);
  const [taahhutDate, setTaahhutDate] = React.useState('');
  const [taahhutMusteri, setTaahhutMusteri] = React.useState(null);

  const openTaahhutDialog = React.useCallback((musteri) => {
    setTaahhutMusteri(musteri);
    setTaahhutDate(musteri.odemeTaahhutTarihi || todayStr);
    setTaahhutDialogOpen(true);
  }, [todayStr]);

  const openRandevuDialog = React.useCallback((musteri) => {
    setSelectedRandevuMusteri(musteri);
    setRandevuDate(musteri.randevuTarihi || '');
    setRandevuDialogOpen(true);
  }, []);

  const handleRandevuSave = async () => {
    if (selectedRandevuMusteri && randevuDate) {
      try {
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const response = await fetch(`${base}/customers/${selectedRandevuMusteri.id}/randevu-tarihi`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ randevuTarihi: randevuDate })
        });

        if (response.ok) {
          // API'den dönen güncellenmiş müşteri verisini kullan
          const updatedCustomer = await response.json();
          
          // API'den dönen veriyi doğru şekilde kullan
          const updatedRandevuTarihi = updatedCustomer.RandevuTarihi || updatedCustomer.randevuTarihi || randevuDate;
          
          setMusteriler(prev => prev.map(m => 
            m.id === selectedRandevuMusteri.id 
              ? { ...m, randevuTarihi: updatedRandevuTarihi }
              : m
          ));
        } else {
          const errorText = await response.text();

          alert(`Randevu tarihi güncellenemedi: ${errorText}`);
        }
      } catch (error) {

      }
      
      setRandevuDialogOpen(false);
      setSelectedRandevuMusteri(null);
      setRandevuDate('');
    }
  };

  // Dosya yükleme fonksiyonları
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Dosya boyutu kontrolü (0 KB - 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const minSize = 0; // 0 KB
      
      if (file.size === 0) {
        addNotification({
          id: Date.now(),
          message: 'Boş dosya yüklenemez. Lütfen geçerli bir dosya seçin.',
          type: 'error',
          duration: 5000
        });
        return;
      }
      
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        addNotification({
          id: Date.now(),
          message: `Dosya boyutu çok büyük! Seçilen dosya: ${fileSizeMB} MB. Maksimum dosya boyutu: 10 MB.`,
          type: 'error',
          duration: 7000
        });
        return;
      }
      
      // Dosya tipi kontrolü
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'Bilinmeyen';
        addNotification({
          id: Date.now(),
          message: `Desteklenmeyen dosya formatı: ${fileExtension}. Sadece PDF, DOC, DOCX, JPG, JPEG ve PNG dosyaları yüklenebilir.`,
          type: 'error',
          duration: 7000
        });
        return;
      }
      
      // Eğer müşteri ekleme/düzenleme dialogunda ise form state'ini güncelle
      if (open) {
        setForm(prev => ({ ...prev, sozlesmeDosyasi: file }));
      } else {
        // Eski dosya yükleme dialogunda ise selectedFile'ı güncelle
        setSelectedFile(file);
      }
    }
  };



  const handleFileDownload = async (customerId, fileName) => {
    try {
      const result = await apiDownloadSozlesme(customerId);
      if (!result.success) {
        addNotification({
          id: Date.now(),
          message: typeof result.error === 'object' ? JSON.stringify(result.error) : (result.error || 'Dosya indirilemedi'),
          type: 'error',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        id: Date.now(),
        message: 'Dosya indirilemedi',
        type: 'error',
        duration: 5000
      });
    }
  };

  const handleFileDelete = async (customerId) => {
    if (!window.confirm('Sözleşme dosyasını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const result = await apiDeleteSozlesme(customerId);
      if (result.success) {
        // UI'ı anında güncelle (optimistic update)
        setMusteriler(prev => prev.map(c => c.id === customerId
          ? { ...c, sozlesmeDosyaAdi: null, sozlesmeDosyaBoyutu: null, sozlesmeDosyaTipi: null }
          : c
        ));
        if (jobInfoData?.id === customerId) {
          setJobInfoData(d => d ? ({ ...d, sozlesmeDosyaAdi: null, sozlesmeDosyaBoyutu: null, sozlesmeDosyaTipi: null }) : d);
        }
        // Sunucudan tazele (SignalR gecikirse eşzamanlamak için)
        try { await loadData(); } catch {}
        addNotification({
          id: Date.now(),
          message: 'Sözleşme dosyası başarıyla silindi',
          type: 'success',
          duration: 3000
        });
      } else {
        addNotification({
          id: Date.now(),
          message: typeof result.error === 'object' ? JSON.stringify(result.error) : (result.error || 'Dosya silinirken hata oluştu'),
          type: 'error',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        id: Date.now(),
        message: 'Dosya silinirken hata oluştu',
        type: 'error',
        duration: 5000
      });
    }
  };

  const handleTaahhutSave = async () => {
    if (taahhutMusteri) {
      await updateTaahhutDate(taahhutMusteri.id, taahhutDate);
    }
    setTaahhutDialogOpen(false);
    setTaahhutMusteri(null);
  };

  



  // Handle loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Veriler yükleniyor...</Typography>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Bir hata oluştu
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }



  return (
    <Box sx={{ p:{ xs:1, md:3 }, overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap:'wrap', mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight:'bold',
            background: 'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Müşteriler
        </Typography>
        <Box sx={{ display:'flex', gap:1 }}>
          {user.role==='admin' && (
            <Tooltip title="Silinen Müşteriler">
              <span>
                <Badge badgeContent={deletedCustomers.length} color="error" overlap="circular">
                  <IconButton
                    size="large"
                    color="error"
                    onClick={()=>setDeletedCustomersOpen(true)}
                    disabled={deletedCustomers.length===0}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Badge>
              </span>
            </Tooltip>
          )}
          <Button variant="contained" onClick={() => handleOpen()}>Müşteri Ekle</Button>
        </Box>
      </Box>
      
      {/* Arama Bölümü */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="isim veya tc giriniz"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Filtre Butonu */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ minWidth: 120 }}
        >
          {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
        </Button>
        
        {/* Aktif Filtreler Göstergesi */}
        {(customerFilters.ekleyen || customerFilters.usta || customerFilters.kalanOdeme || customerFilters.odemeYontemi || startDate || endDate) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aktif Filtreler:
            </Typography>
            {customerFilters.ekleyen && (
              <Chip
                label={`Ekleyen: ${customerFilters.ekleyen}`}
                size="small"
                onDelete={() => setCustomerFilters({...customerFilters, ekleyen: ''})}
                variant="outlined"
              />
            )}
            {customerFilters.usta && (
              <Chip
                label={`Usta: ${customerFilters.usta}`}
                size="small"
                onDelete={() => setCustomerFilters({...customerFilters, usta: ''})}
                variant="outlined"
              />
            )}
            {customerFilters.kalanOdeme && (
              <Chip
                label={`Kalan Ödeme: ${customerFilters.kalanOdeme === 'tamamlandi' ? 'Tamamlandı' : 
                       customerFilters.kalanOdeme === 'odendi' ? 'Ödendi' : 
                       customerFilters.kalanOdeme === 'kalan' ? 'Kalan Ödemesi Olan' : customerFilters.kalanOdeme}`}
                size="small"
                onDelete={() => setCustomerFilters({...customerFilters, kalanOdeme: ''})}
                variant="outlined"
              />
            )}
            {customerFilters.odemeYontemi && (
              <Chip
                label={`Ödeme Yöntemi: ${customerFilters.odemeYontemi === 'kart' ? 'Kart' : customerFilters.odemeYontemi === 'nakit' ? 'Nakit' : 'Nakit ve Kart'}`}
                size="small"
                onDelete={() => setCustomerFilters({...customerFilters, odemeYontemi: ''})}
                variant="outlined"
              />
            )}
            {startDate && (
              <Chip
                label={`Başlangıç: ${startDate}`}
                size="small"
                onDelete={() => setStartDate('')}
                variant="outlined"
              />
            )}
            {endDate && (
              <Chip
                label={`Bitiş: ${endDate}`}
                size="small"
                onDelete={() => setEndDate('')}
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Müşteri Filtreleme - Açılır/Kapanır */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl size="medium" fullWidth>
                <InputLabel>Ekleyen</InputLabel>
                <Select
                  value={customerFilters.ekleyen}
                  onChange={(e) => setCustomerFilters({...customerFilters, ekleyen: e.target.value})}
                  label="Ekleyen"
                  disabled={loadingFilters}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {filterOptions.ekleyenler.map((ekleyen) => (
                    <MenuItem key={ekleyen} value={ekleyen}>
                      {ekleyen}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl size="medium" fullWidth>
                <InputLabel>Usta</InputLabel>
                <Select
                  value={customerFilters.usta}
                  onChange={(e) => setCustomerFilters({...customerFilters, usta: e.target.value})}
                  label="Usta"
                  disabled={loadingFilters}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {filterOptions.ustalar.map((usta) => (
                    <MenuItem key={usta} value={usta}>
                      {usta}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl size="medium" fullWidth>
                <InputLabel>Kalan Ödeme</InputLabel>
                <Select
                  value={customerFilters.kalanOdeme}
                  onChange={(e) => setCustomerFilters({...customerFilters, kalanOdeme: e.target.value})}
                  label="Kalan Ödeme"
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="tamamlandi">Tamamlandı (Hesap Yapıldı)</MenuItem>
                  <MenuItem value="odendi">Ödendi (Hesap Yapılmadı)</MenuItem>
                  <MenuItem value="kalan">Kalan Ödemesi Olan</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl size="medium" fullWidth>
                <InputLabel>Ödeme Yöntemi</InputLabel>
                <Select
                  value={customerFilters.odemeYontemi}
                  onChange={(e) => setCustomerFilters({...customerFilters, odemeYontemi: e.target.value})}
                  label="Ödeme Yöntemi"
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="kart">Kart</MenuItem>
                  <MenuItem value="nakit">Nakit</MenuItem>
                  <MenuItem value="nakit_ve_kart">Nakit ve Kart</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                size="medium"
                type="date"
                label="Başlangıç Tarihi"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                size="medium"
                type="date"
                label="Bitiş Tarihi"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
                fullWidth
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setCustomerFilters({ ekleyen: '', usta: '', kalanOdeme: '', odemeYontemi: '' });
                setStartDate('');
                setEndDate('');
              }}
              startIcon={<ClearIcon />}
            >
              Filtreleri Temizle
            </Button>
          </Box>
        </Paper>
      )}

      {/* Toplam Bilgileri */}
      {(startDate || endDate) && (
        <Box sx={{ 
          mb: 2, 
          p: 2.5, 
          bgcolor: '#f8f9fa', 
          borderRadius: 1.5, 
          color: 'text.primary',
          boxShadow: 1,
          border: '1px solid #e9ecef'
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
            Seçilen Tarih Aralığındaki Toplamlar
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#FFD700', mb: 0.5 }}>
                  {totalsForDisplay.musteriSayisi}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, color: 'text.secondary' }}>Müşteri Sayısı</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#90EE90', mb: 0.5 }}>
                  {formatNumber(totalsForDisplay.toplamSozlesmeTutari)} ₺
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, color: 'text.secondary' }}>Sözleşme Tutarı</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#87CEEB', mb: 0.5 }}>
                  {formatNumber(totalsForDisplay.toplamOdenenTutar)} ₺
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, color: 'text.secondary' }}>Ödenen Tutar</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ 
                  color: totalsForDisplay.toplamKalanOdeme > 0 ? '#FFB6C1' : '#98FB98', 
                  mb: 0.5 
                }}>
                  {formatNumber(totalsForDisplay.toplamKalanOdeme)} ₺
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, color: 'text.secondary' }}>Kalan Ödeme</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/** Masaüstü (md ve üstü) tablo görünümü **/}
      {isMdUp && (
        <ClientTableMemoized
          sortedMusteriler={sortedMusteriler}
          user={user}
          sortField={sortField}
          sortOrder={sortOrder}
          handleSort={handleSort}
          handleOpen={handleOpen}
          handleOdemeDetayOpen={handleOdemeDetayOpen}
          handleOdemeEkleOpen={handleOdemeEkleOpen}
          handleDeleteClick={handleDeleteClick}
          buildJobInfo={buildJobInfo}
          setJobInfoData={setJobInfoData}
          setJobInfoOpen={setJobInfoOpen}
          getPendingDeleteCount={getPendingDeleteCount}
          openTaahhutDialog={openTaahhutDialog}
          openRandevuDialog={openRandevuDialog}
          orders={orders}
          stokHareketleri={stokHareketleri}
        />
      )}
      {/* ESKİ TABLO KODU - YEDEK (silinecek)
      {isMdUp && (
      <TableContainer component={Paper} sx={{ 
        overflowX: 'auto', 
        boxShadow: 3, 
        borderRadius: 2, 
        maxHeight: 600,
        '& .MuiTable-root': {
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
        },
        '& .MuiTableCell-root': {
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          padding: { xs: '8px 4px', sm: '12px 8px' }
        },
        '& .numeric': {
          whiteSpace: 'nowrap',
          writingMode: 'horizontal-tb',
          direction: 'ltr'
        }
      }}>
        <Table size="small" sx={{ tableLayout: 'auto' }}>
          <TableHead sx={{ bgcolor:'primary.main', '& .MuiTableCell-root': { color:'#fff', fontWeight:'bold', py: 1 } }}>
            <TableRow>
              <TableCell>Ad Soyad</TableCell>
              <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>TC Kimlik No</TableCell>
              <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Telefon</TableCell>
              <TableCell className="numeric">
                <TableSortLabel
                  active={sortField==='sozlesmeTutari'}
                  direction={sortField==='sozlesmeTutari'?sortOrder:'asc'}
                  onClick={()=>handleSort('sozlesmeTutari')}
                >
                  Sözleşme Tutarı
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <TableSortLabel
                  active={sortField==='sozlesmeTarihi'}
                  direction={sortField==='sozlesmeTarihi'?sortOrder:'asc'}
                  onClick={()=>handleSort('sozlesmeTarihi')}
                >
                  Sözleşme Tarihi
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                <TableSortLabel
                  active={sortField==='odemeTaahhutTarihi'}
                  direction={sortField==='odemeTaahhutTarihi'?sortOrder:'asc'}
                  onClick={()=>handleSort('odemeTaahhutTarihi')}
                >
                  Ödeme Taahhüt Tarihi
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                <TableSortLabel
                  active={sortField==='randevuTarihi'}
                  direction={sortField==='randevuTarihi'?sortOrder:'asc'}
                  onClick={()=>handleSort('randevuTarihi')}
                >
                  Randevu Tarihi
                </TableSortLabel>
              </TableCell>
              <TableCell className="numeric">Ödenen Tutar</TableCell>
              <TableCell className="numeric">
                <TableSortLabel
                  active={sortField==='kalanOdeme'}
                  direction={sortField==='kalanOdeme'?sortOrder:'asc'}
                  onClick={()=>handleSort('kalanOdeme')}
                >
                  Kalan Ödeme
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                <TableSortLabel
                  active={sortField==='createdByUsername'}
                  direction={sortField==='createdByUsername'?sortOrder:'asc'}
                  onClick={()=>handleSort('createdByUsername')}
                >
                  Ekleyen
                </TableSortLabel>
              </TableCell>
              
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                Durum
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                Sözleşme Dosyası
              </TableCell>
              {['admin', 'employee'].includes(user.role) && <TableCell>İşlemler</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedMusteriler.map(musteri => {
              const toplamOdenen = hesaplaTotalOdenen(musteri.odemeler || []);
              const kalanOdeme = hesaplaKalanOdeme(musteri.sozlesmeTutari, musteri.odemeler || []);
              
              // Stok kontrolü (artık kullanılmıyor ama referans için tutuyoruz)
               // stokDurumu kontrolü kaldırıldı
              
              return (
                <TableRow 
                  key={musteri.id} 
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: 'grey.50' }, 
                    '& .MuiTableCell-root': { py: 1 }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                      {musteri.adSoyad}
                      <IconButton size="small" color="info" onClick={async ()=>{const info=buildJobInfo(musteri);  setJobInfoData(info); setJobInfoOpen(true); if(info?.id && info?.sozlesmeDosyaAdi){ const res = await apiGetSozlesmeBlobUrl(info.id); setBlobPreviewUrl(res.success?res.url:''); } else { setBlobPreviewUrl(''); } }}>
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{musteri.tcKimlik}</TableCell>
                  <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{musteri.telefon}</TableCell>
                  <TableCell className="numeric"><Chip label={`${formatNumber(musteri.sozlesmeTutari)} ₺`} color="info" size="small"/></TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{musteri.sozlesmeTarihi}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                       <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                         {kalanOdeme !== 0 ? musteri.odemeTaahhutTarihi : '-'}
                         {kalanOdeme !== 0 && ['admin','employee'].includes(user.role) && (
                           <IconButton size="small" onClick={()=>openTaahhutDialog(musteri)}>
                             <DateRangeIcon fontSize="small" />
                           </IconButton>
                         )}
                       </Box>
                     </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                      {musteri.randevuTarihi || '-'}
                      {['admin','employee'].includes(user.role) && (
                        <IconButton size="small" onClick={()=>openRandevuDialog(musteri)}>
                          <DateRangeIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell className="numeric">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`${formatNumber(toplamOdenen)} ₺`} 
                        color={toplamOdenen === musteri.sozlesmeTutari ? "primary" : "default"} 
                        size="small" 
                      />
                      <Badge 
                        badgeContent={user.role === 'admin' ? getPendingDeleteCount(musteri.id) : 0} 
                        color="error"
                        invisible={user.role !== 'admin' || getPendingDeleteCount(musteri.id) === 0}
                      >
                        <IconButton 
                          size="small" 
                          onClick={() => handleOdemeDetayOpen(musteri)}
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Badge>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOdemeEkleOpen(musteri)}
                        color="success"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell className="numeric">
                    {musteri.hesapYapildi ? (
                      <Chip label="Tamamlandı" color="info" size="small" />
                    ) : kalanOdeme === 0 ? (
                      <Chip label="Ödendi" color="success" size="small" />
                    ) : (
                      <Chip label={`${formatNumber(kalanOdeme)} ₺`} color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        <Chip 
                      label={musteri.createdByUsername || (musteri.createdAt ? 'Eski Kayıt' : 'Bilinmiyor')} 
                      color="secondary" 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {(() => {
                      // Bu müşterinin siparişlerini bul
                      const customerOrders = orders ? orders.filter(order => order.customerId === musteri.id) : [];
                      
                      // Bu müşterinin stok hareketlerini bul (çıkış işlemleri)
                      const customerStokHareketleri = stokHareketleri ? 
                        stokHareketleri.filter(hareket => 
                          hareket.customerId === musteri.id && 
                          hareket.hareketTipi === 'Çıkış'
                        ) : [];
                      
                      // Eğer sipariş varsa, sipariş durumunu öncelikli olarak göster
                      if (customerOrders.length > 0) {
                        const latestOrder = customerOrders.sort((a, b) => 
                          new Date(b.siparisTarihi) - new Date(a.siparisTarihi)
                        )[0];
                        
                        switch (latestOrder.status) {
                          case 'Bekliyor':
                            return <Chip label="Bekliyor" color="warning" size="small" variant="outlined" />;
                          case 'TahsisEdildi':
                            return <Chip label="Tahsis Edildi" color="info" size="small" variant="outlined" />;
                          // 'Tamamlandı' ve 'İptal' gösterimi kaldırıldı
                          default:
                            return <Chip label="Bekliyor" color="warning" size="small" variant="outlined" />;
                        }
                      }
                      
                      // Eğer stok hareketi varsa ama sipariş yoksa tahsis edildi
                      if (customerStokHareketleri.length > 0) {
                        return <Chip label="Tahsis Edildi" color="info" size="small" variant="outlined" />;
                      }
                      
                      // Hiçbiri yoksa tahsis edilmedi
                      return <Chip label="Tahsis Edilmedi" color="default" size="small" variant="outlined" />;
                    })()}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    {musteri.sozlesmeDosyaAdi ? (
                      <Chip label="Var" color="success" size="small" />
                    ) : (
                      <Chip label="Yok" color="default" size="small" />
                    )}
                  </TableCell>
                  {['admin', 'employee'].includes(user.role) && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" color="primary" onClick={() => handleOpen(musteri)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {user.role === 'admin' && (
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(musteri)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      )} */}

      {/** Mobil kart görünümü **/}
      {!isMdUp && (
        <>
          {/* Mobil Tarih Filtresi */}
          {showDateFilter && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Başlangıç Tarihi"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Bitiş Tarihi"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary" align="center">
                  {startDate && endDate 
                    ? `${startDate} - ${endDate} arası`
                    : startDate 
                      ? `${startDate} ve sonrası`
                      : endDate 
                        ? `${endDate} ve öncesi`
                        : 'Tarih aralığı seçilmedi'
                  }
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Mobil Toplam Bilgileri */}
          {(startDate || endDate) && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'white' }}>
              <Typography variant="h6" gutterBottom align="center">
                Seçilen Tarih Aralığındaki Toplamlar
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Müşteri Sayısı:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {totalsForDisplay.musteriSayisi}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Sözleşme Tutarı:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatNumber(totalsForDisplay.toplamSozlesmeTutari)} ₺
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Ödenen Tutar:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatNumber(totalsForDisplay.toplamOdenenTutar)} ₺
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Kalan Ödeme:</Typography>
                  <Typography variant="h6" fontWeight="bold" color={totalsForDisplay.toplamKalanOdeme > 0 ? 'error.light' : 'success.light'}>
                    {formatNumber(totalsForDisplay.toplamKalanOdeme)} ₺
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Stack spacing={2} sx={{ mt: 2 }}>
            {sortedMusteriler.map(musteri => {
            const toplamOdenen = hesaplaTotalOdenen(musteri.odemeler || []);
            const kalanOdeme = hesaplaKalanOdeme(musteri.sozlesmeTutari, musteri.odemeler || []);
            return (
              <Paper key={musteri.id} sx={{ p:2 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                      <Typography variant="subtitle1" fontWeight="bold">{musteri.adSoyad}</Typography>
                      <IconButton size="small" color="info" onClick={async ()=>{const info=buildJobInfo(musteri);  setJobInfoData(info); setJobInfoOpen(true); if(info?.id && info?.sozlesmeDosyaAdi){ const res = await apiGetSozlesmeBlobUrl(info.id); setBlobPreviewUrl(res.success?res.url:''); } else { setBlobPreviewUrl(''); } }}>
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2">TC: {musteri.tcKimlik}</Typography>
                    <Typography variant="body2">Telefon: {musteri.telefon}</Typography>
                    <Typography variant="body2">Sözleşme: {formatNumber(musteri.sozlesmeTutari)}₺ ({musteri.sozlesmeTarihi})</Typography>
                    {kalanOdeme !== 0 && (
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                         <Typography variant="body2">Taahhüt: {musteri.odemeTaahhutTarihi}</Typography>
                         {['admin','employee'].includes(user.role) && (
                           <IconButton size="small" onClick={()=>openTaahhutDialog(musteri)}>
                             <DateRangeIcon fontSize="small" />
                           </IconButton>
                         )}
                       </Box>
                    )}
                    <Typography variant="body2">Randevu: {musteri.randevuTarihi || '-'}</Typography>
                    <Typography variant="body2">Ödenen: {formatNumber(toplamOdenen)}₺</Typography>
                    <Typography variant="body2" color={musteri.hesapYapildi ? 'info.main' : kalanOdeme>0?'error.main':'success.main'} fontWeight="bold">
                      {musteri.hesapYapildi ? 'Tamamlandı' : kalanOdeme === 0 ? 'Ödendi' : `Kalan: ${formatNumber(kalanOdeme)}₺`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ekleyen: {musteri.createdByUsername || (musteri.createdAt ? 'Eski Kayıt' : 'Bilinmiyor')}
                    </Typography>
                  </Box>
                  <Box>
                    <Badge 
                      badgeContent={user.role === 'admin' ? getPendingDeleteCount(musteri.id) : 0} 
                      color="error"
                      invisible={user.role !== 'admin' || getPendingDeleteCount(musteri.id) === 0}
                    >
                      <IconButton size="small" color="primary" onClick={()=>handleOdemeDetayOpen(musteri)}><VisibilityIcon/></IconButton>
                    </Badge>
                    <IconButton size="small" color="primary" onClick={()=>handleOpen(musteri)}><EditIcon/></IconButton>
                    <IconButton size="small" color="success" onClick={()=>handleOdemeEkleOpen(musteri)}><AddIcon/></IconButton>
                    {user.role==='admin' && (
                      <IconButton size="small" color="error" onClick={()=>handleDeleteClick(musteri)}><DeleteIcon/></IconButton>
                    )}
                  </Box>
                </Box>
              </Paper>
            )})}
          {sortedMusteriler.length===0 && (<Typography align="center">Kayıt bulunamadı</Typography>)}
        </Stack>
        </>
      )}
      
      {/* Müşteri Ekleme/Düzenleme Dialog */}
      {/* Conditional rendering: Sadece open olduğunda render et */}
      {open && (
      <Dialog 
        open={true}
        onClose={handleClose} 
        maxWidth="xl" 
        fullWidth 
        fullScreen={!isMdUp}
        disableEnforceFocus
        disableAutoFocus
        keepMounted={false}
        transitionDuration={{ enter: 225, exit: 195 }}
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2, md: 4 },
            maxWidth : 1320,
            width: { md: '80vw', lg: '75vw', xl: '70vw' }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>{editMusteri ? 'Müşteri Düzenle' : 'Müşteri Ekle'}</DialogTitle>
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
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
             <Grid container spacing={1.5}>
              {/* Müşteri Bilgileri */}
              <Grid item xs={12} sx={{ mt: 1, flexBasis: '100% !important' }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>Müşteri Bilgileri</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  margin="dense"
                  required
                  fullWidth
                  label="Ad Soyad"
                  name="adSoyad"
                  size="small"
                  defaultValue={form.adSoyad}
                  onBlur={(e)=> setForm(prev => ({ ...prev, adSoyad: e.target.value }))}
                  autoComplete="off"
                  inputProps={{ autoComplete: 'new-password', form: { autoComplete: 'off' } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  margin="dense"
                  required
                  sx={{ width: { xs: '100%', md: 200 } }}
                  label="TC Kimlik No"
                  name="tcKimlik"
                  type="text"
                  slotProps={{ input: { maxLength: 11, inputMode: 'numeric', pattern: '[0-9]*' } }}
                  size="small"
                  defaultValue={form.tcKimlik}
                  onChange={(e)=> {
                    const v = (e.target.value||'').replace(/\D/g,'').slice(0,11);
                    if (v !== e.target.value) e.target.value = v;
                  }}
                  onBlur={(e)=> {
                    const v = (e.target.value||'').replace(/\D/g,'').slice(0,11);
                    setForm(prev => ({ ...prev, tcKimlik: v }));
                  }}
                  autoComplete="off"
                  inputProps={{ autoComplete: 'new-password', placeholder: '11 hane', form: { autoComplete: 'off' } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  margin="dense"
                  required
                  sx={{ width: { xs: '100%', md: 200 } }}
                  label="Telefon (5XX-XXX-XXXX)"
                  name="telefon"
                  type="text"
                  slotProps={{ input: { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 12 } }}
                  size="small"
                  defaultValue={form.telefon}
                  onChange={(e) => {
                    const numbers = (e.target.value||'').replace(/\D/g, '').slice(0,10);
                    const formatted = formatPhoneNumber(numbers);
                    e.target.value = formatted;
                  }}
                  onBlur={(e) => {
                    const numbers = (e.target.value||'').replace(/\D/g, '').slice(0,10);
                    const formatted = formatPhoneNumber(numbers);
                    setForm(prev => ({ ...prev, telefon: formatted }));
                  }}
                  autoComplete="off"
                  inputProps={{
                    placeholder: "5XX-XXX-XXXX",
                    autoComplete: 'new-password',
                    form: { autoComplete: 'off' }
                  }}
                  error={form.telefon !== '' && !validatePhoneNumber(form.telefon)}
                  FormHelperTextProps={{ sx: { minHeight: 20 } }}
                  helperText={form.telefon !== '' && !validatePhoneNumber(form.telefon) ? 
                    'Telefon numarası 10 rakam olmalıdır (5XX-XXX-XXXX)' : 
                    form.telefon !== '' && validatePhoneNumber(form.telefon) ? '✓ Geçerli telefon numarası' : '5XX-XXX-XXXX formatında giriniz'}
                />
              </Grid>
              {/* Adres alanı bileşenleri */}
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  label="İl"
                  name="il"
                  size="small"
                  value={form.il || ''}
                  onChange={(e)=> handleProvinceChange(e.target.value)}
                  /*required*/
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {(provinces || []).map((p)=> (
                    <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  label="İlçe"
                  name="ilce"
                  size="small"
                  value={form.ilce || ''}
                  onChange={(e)=> handleDistrictChange(e.target.value)}
                  disabled={!form.il}
                  /*required*/
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {(districts || []).map((d)=> (
                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  sx={{ width:100}}
                  label="Mahalle"
                  name="mahalle"
                  size="small"
                  value={form.mahalle || ''}
                  onChange={(e)=> setForm(prev=> ({ ...prev, mahalle: e.target.value }))}
                  disabled={!form.ilce}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {(neighborhoods || []).map((n)=> (
                    <MenuItem key={n.id} value={n.name}>{n.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  margin="dense"
                  sx={{ width:200 }}
                  label="Cadde"
                  name="cadde"
                  size="small"
                  defaultValue={form.cadde || ''}
                  onBlur={(e)=>{
                    const raw = (e.target.value || '').trim();
                    if (!raw) { setForm(prev=>({ ...prev, cadde: '' })); return; }
                    // Varsa sonundaki cadde eklerini sil, tek tip 'Cd.' ekle
                    const base = raw.replace(/\s+(cadde|caddesi|cd\.?|cd)$/i, '');
                    const suffixed = `${base.trim()} Cd.`;
                    setForm(prev=>({ ...prev, cadde: suffixed }));
                  }}
                  autoComplete="off"
                  inputProps={{ autoComplete: 'new-password' }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  margin="dense"
                  sx={{ width:160 }}
                  label="Sokak"
                  name="sokak"
                  size="small"
                  defaultValue={form.sokak || ''}
                  onBlur={(e)=>{
                    const raw = (e.target.value || '').trim();
                    if (!raw) { setForm(prev=>({ ...prev, sokak: '' })); return; }
                    // Varsa sonundaki sokak eklerini sil, tek tip 'Sk.' ekle
                    const base = raw.replace(/\s+(sokak|sokağı|sk\.?|sk)$/i, '');
                    const suffixed = `${base.trim()} Sk.`;
                    setForm(prev=>({ ...prev, sokak: suffixed }));
                  }}
                  autoComplete="off"
                  inputProps={{ autoComplete: 'new-password' }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  margin="dense"
                  sx={{ width:100 }}
                  label="Bina No"
                  name="binaNo"
                  size="small"
                  defaultValue={form.binaNo || ''}
                  onBlur={(e)=> setForm(prev=>({ ...prev, binaNo: (e.target.value||'').trim() }))}
                  autoComplete="off"
                  inputProps={{ autoComplete: 'new-password' }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  margin="dense"
                  sx={{ width:100 }}
                  label="Daire No"
                  name="daireNo"
                  size="small"
                  defaultValue={form.daireNo || ''}
                  onBlur={(e)=> setForm(prev=>({ ...prev, daireNo: (e.target.value||'').trim() }))}
                  autoComplete="off"
                  inputProps={{ autoComplete: 'new-password' }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  margin="dense"
                  fullWidth
                  label="Adres (Ek Not)"
                  name="adresEk"
                  size="small"
                  defaultValue={form.adresEk || ''}
                  onBlur={(e)=> setForm(prev=>({ ...prev, adresEk: (e.target.value||'').trim() }))}
                  placeholder="Örn: Apartman adı, kapı tarifi vb."
                  autoComplete="off"
                  inputProps={{ autoComplete: 'new-password' }}
                />
              </Grid>

              {/* Sözleşme Bilgileri */}
              <Grid item xs={12} sx={{ mt: 1, flexBasis: '100% !important' }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>Sözleşme Bilgileri</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  margin="dense"
                  required
                  sx={{ width:140 }}
                  label="Sözleşme Tutarı"
                  name="sozlesmeTutari"
                  type="text"
                  slotProps={{ input: { inputMode:'decimal' } }}
                  size="small"
                  defaultValue={formatNumber(form.sozlesmeTutari || '')}
                  onChange={(e)=>{
                    const digits = (e.target.value||'').replace(/\D/g,'');
                    e.target.value = digits ? Number(digits).toLocaleString('tr-TR') : '';
                  }}
                  onBlur={(e)=>{
                    const raw = (e.target.value||'').replace(/\./g,'').replace(/,/g,'.');
                    const num = raw === '' ? '' : String(Math.max(0, parseFloat(raw)||0));
                    setForm(prev => ({ ...prev, sozlesmeTutari: num }));
                  }}
                  autoComplete="off"
                  inputProps={{ autoComplete: 'new-password', form: { autoComplete: 'off' } }}
                />
              </Grid>
                <Grid item xs={12} md={4}>
                <TextField
                  margin="dense"
                  required
                  fullWidth
                  label="Sözleşme Tarihi"
                  name="sozlesmeTarihi"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true }, input: { min: minDateStr } }}
                  size="small"
                  value={form.sozlesmeTarihi}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  margin="dense"
                  fullWidth
                  label="Randevu Tarihi"
                  name="randevuTarihi"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true }, input: { min: minDateStr } }}
                  size="small"
                  value={form.randevuTarihi}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  margin="dense"
                  required
                  fullWidth
                  label="Ödeme Taahhüt Tarihi"
                  name="odemeTaahhutTarihi"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true }, input: { min: minDateStr } }}
                  size="small"
                  value={form.odemeTaahhutTarihi}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" edge="end" disabled>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              {/* İş Detayları */}
              <Grid item xs={12} sx={{ mt: 2, flexBasis: '100% !important' }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                 İş Detayları
                </Typography>
              </Grid>

          
              {/* İş Seçimi - Ön Ödeme mantığında form + alt liste */}
              <Grid item xs={12}>
                  <Box sx={{ display:'grid', gridTemplateColumns:'180px 180px 220px 140px 140px 90px 120px 84px', gap:1, px:0.5, py:0.5, borderRadius:1, mb:0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight:'bold', color:'text.secondary', alignSelf:'end' }}>İş</Typography>
                    <Typography variant="caption" sx={{ fontWeight:'bold', color:'text.secondary', alignSelf:'end' }}>Marka</Typography>
                    <Typography variant="caption" sx={{ fontWeight:'bold', color:'text.secondary', alignSelf:'end' }}>Model</Typography>
                    <Typography variant="caption" sx={{ fontWeight:'bold', color:'text.secondary', alignSelf:'end' }}>Boru Tipi</Typography>
                    <Typography variant="caption" sx={{ fontWeight:'bold', color:'text.secondary', alignSelf:'end' }}>Termostat</Typography>
                    <Typography variant="caption" sx={{ fontWeight:'bold', color:'text.secondary', alignSelf:'end' }}>Adet</Typography>
                    <Typography variant="caption" sx={{ fontWeight:'bold', color:'text.secondary', alignSelf:'end' }}>Daire/Not</Typography>
                    <Typography variant="caption" sx={{ fontWeight:'bold', color:'text.secondary', alignSelf:'end' }}></Typography>
                  </Box>
                  {/* Üst form (sabit label, inputlar) */}
                  <Box sx={{ display:'grid', gridTemplateColumns:'180px 180px 220px 140px 140px 90px 120px 84px', gap:1, alignItems:'center' }}>
                    <TextField select size="small" fullWidth name="yapilanIs" value={jobForm.yapilanIs} onChange={handleJobChange} error={!!jobErr.yapilanIs} helperText={jobErr.yapilanIs || ''}>
                      <MenuItem value="" disabled>Seçiniz</MenuItem>
                      {jobs.map(opt => (<MenuItem key={opt.id} value={opt.ad}>{opt.ad}</MenuItem>))}
                    </TextField>
                    <TextField select size="small" fullWidth name="brandId" value={jobForm.brandId || ''} onChange={handleJobChange} disabled={!jobForm.yapilanIs}>
                      <MenuItem value="">Seçiniz</MenuItem>
                      {(jobForm._brandOptions || []).map(b => (<MenuItem key={b.id} value={b.id}>{b.ad}</MenuItem>))}
                    </TextField>
                    <TextField select size="small" fullWidth name="modelName" value={jobForm.modelName || ''} onChange={handleJobChange} disabled={!jobForm.brandId}>
                      <MenuItem value="">Seçiniz</MenuItem>
                      {(jobForm._modelOptions || []).map(m => (<MenuItem key={m} value={m}>{m}</MenuItem>))}
                    </TextField>
                    <TextField select size="small" fullWidth name="boruTipi" value={jobForm.boruTipi} onChange={handleJobChange}>
                      <MenuItem value="">Seçiniz</MenuItem>
                      {pipeOptions.map(opt => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                    </TextField>
                    <TextField select size="small" fullWidth name="termostat" value={jobForm.termostat} onChange={handleJobChange} disabled={isDeviceOptionalJobName(jobForm.yapilanIs)}>
                      <MenuItem value="">Seçiniz</MenuItem>
                      {thermostatOptions.map(opt => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                    </TextField>
                    <TextField type="number" size="small" fullWidth name="quantity" value={jobForm.quantity} onChange={handleJobChange} slotProps={{ input: { min: 1 } }} error={!!jobErr.quantity} helperText={jobErr.quantity || ''} disabled={isDeviceOptionalJobName(jobForm.yapilanIs)} />
                    <TextField size="small" sx={{ width: 120 }} name="note" value={jobForm.note} onChange={handleJobChange} />
                    <Button variant="contained" color="primary" size="small" onClick={addJobItem} startIcon={<AddIcon fontSize="small" />} sx={{ minWidth: 72, px: 1.25, width: '100%' }}>Ekle</Button>
                  </Box>

                  {/* Geçici İş Listesi */}
                  {jobTableRows.length > 0 && (
                    <TableContainer component={Paper} sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>İş</TableCell>
                        <TableCell>Marka</TableCell>
                        <TableCell>Model</TableCell>
                            <TableCell>Boru Tipi</TableCell>
                            <TableCell>Termostat</TableCell>
                            <TableCell>Adet</TableCell>
                            <TableCell>Daire/Not</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                        {jobTableRows.map((row, idx) => (
                            <TableRow key={`${row._isPrimary?'p':'x'}-${idx}`}>
                              <TableCell>{row.yapilanIs || '-'}</TableCell>
                              {(() => { const bm = resolveBrandModelFromRow(row); return <>
                                <TableCell>{bm.brand || '-'}</TableCell>
                                <TableCell>{bm.model || '-'}</TableCell>
                              </>; })()}
                              <TableCell>{row.boruTipi || '-'}</TableCell>
                              <TableCell>{row.termostat || '-'}</TableCell>
                              <TableCell>{row.quantity || '-'}</TableCell>
                              <TableCell>{row.note || '-'}</TableCell>
                              <TableCell>
                                <IconButton size="small" color="error" onClick={() => deleteJobRow(idx, row)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                
              </Grid>

              {/* İlk Ödemeler Bölüm Başlığı */}
              <Grid item xs={12} sx={{ mt: 3, flexBasis: '100% !important' }}>
                <Typography variant="h6" sx={{ mb: 2}}>
                  Ön Ödeme
                </Typography>
              </Grid>

              

              {/* Toptancı alanı kaldırıldı */}
              <Grid item xs={12} md={3}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                  Tutar
                </Typography>
                 <TextField 
                   name="tutar" 
                   type="text" 
                   sx={{ width:140 }} 
                   size="small" 
                   defaultValue={formatNumber(custPayForm.tutar || '')}
                   onBlur={(e)=>{
                     const raw = (e.target.value||'').replace(/\./g,'').replace(/,/g,'.');
                     handleCustPayChange({ target: { name:'tutar', value: raw } });
                   }} 
                   onChange={(e)=>{
                     const digits = (e.target.value||'').replace(/\D/g,'');
                     e.target.value = digits ? Number(digits).toLocaleString('tr-TR') : '';
                   }}
                   autoComplete="off"
                   inputProps={{ autoComplete: 'new-password', form: { autoComplete: 'off' }, inputMode: 'decimal' }}
                   error={!!custPayErr.tutar} 
                   helperText={custPayErr.tutar} 
                 />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                  Tarih
                </Typography>
                <TextField name="tarih" type="date" fullWidth size="small" slotProps={{ inputLabel: { shrink: true }, input: { min: minDateStr } }} value={custPayForm.tarih} onChange={handleCustPayChange} error={!!custPayErr.tarih} helperText={custPayErr.tarih} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                  Tür
                </Typography>
                <TextField select name="tur" fullWidth size="small" sx={{ minWidth:160 }} value={custPayForm.tur} onChange={handleCustPayChange} error={!!custPayErr.tur} helperText={custPayErr.tur}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 200
                        }
                      }
                    }
                  }}>
                  {odemeTurleri.map(t => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                </TextField>
              </Grid>
              {custPayForm.tur === 'Kredi Kartı' && (
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                    Toptancı
                  </Typography>
                  <TextField select name="toptanci" fullWidth size="small" sx={{ minWidth:160 }} value={custPayForm.toptanci} onChange={handleCustPayChange} error={!!custPayErr.toptanci} helperText={custPayErr.toptanci}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          style: {
                            maxHeight: 200
                          }
                        }
                      }
                    }}>
                    {supplierOptions.map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
                  </TextField>
                </Grid>
              )}
              
              <Grid item xs={12} sx={{mt:3}}>
                <Button size="small" variant="outlined" onClick={addCustPayment} startIcon={<AddIcon />}>Ödeme Ekle</Button>
              </Grid>

              {/* Geçici Ödeme Listesi */}
              {custPayments.length > 0 && (
                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tarih</TableCell>
                          <TableCell>Tutar</TableCell>
                          <TableCell>Tür</TableCell>
                          <TableCell>Toptancı</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {custPayments.map(p => (
                          <TableRow key={p.id}>
                            <TableCell>{p.tarih}</TableCell>
                            <TableCell>{formatNumber(p.tutar)} ₺</TableCell>
                            <TableCell>{p.tur}</TableCell>
                            <TableCell>{p.toptanci}</TableCell>
                            <TableCell>
                              <IconButton size="small" color="error" onClick={() => deleteCustPayment(p.id)}><DeleteIcon fontSize="small"/></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              {/* Silinen Müşteri Ödemeleri - Geri Alma Bölümü */}
              {deletedCustPayments.length > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Silinen Ödemeler (Geri Alabilirsiniz)
                    </Typography>
                    {deletedCustPayments.map((deletedPayment, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2">
                          {deletedPayment.tarih} - {formatNumber(deletedPayment.tutar)} ₺ - {deletedPayment.tur}
                        </Typography>
                        <Button 
                          size="small" 
                          variant="text" 
                          color="inherit"
                          onClick={() => handleUndoCustDelete(deletedPayment)}
                        >
                          Geri Al
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
<Grid item xs={12} sx={{ mt: 1, flexBasis: '100% !important' }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>Usta Atamaları</Typography>
              </Grid>
              {/* Usta Atamaları - İş Detayları stilinde */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Usta ve açıklama satırları</Typography>
                    <Button size="small" variant="outlined" onClick={()=> setUstaAtamalari(prev=> [...prev, { ustaId: '', note: '' }])}>Satır Ekle</Button>
                  </Box>
                  {ustaAtamalari.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Henüz satır eklenmedi</Typography>
                  )}
                  {ustaAtamalari.map((row, idx) => (
                    <Grid key={idx} container spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <Grid item xs={12} md={5}>
                        <TextField
                          select
                          size="small"
                          label="Usta"
                          sx={{ minWidth: 100 }}
                          value={row.ustaId || ''}
                          onChange={(e)=>{
                            const v = parseInt(e.target.value,10);
                            setUstaAtamalari(prev=> prev.map((r,i)=> i===idx?{...r, ustaId: v}:r));
                          }}
                        >
                          <MenuItem value="">Seçiniz</MenuItem>
                          {filteredUstalar.map(u=> (
                            <MenuItem key={u.id} value={u.id}>{u.adSoyad}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Açıklama (ör. Daire 1)"
                          value={row.note || ''}
                          onChange={(e)=> setUstaAtamalari(prev=> prev.map((r,i)=> i===idx?{...r, note: e.target.value}:r))}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button fullWidth size="small" color="error" variant="outlined" onClick={()=> setUstaAtamalari(prev=> prev.filter((_,i)=> i!==idx))}>Sil</Button>
                      </Grid>
                    </Grid>
                  ))}
                </Paper>
              </Grid>
              {/* Sözleşme Dosyası Yükleme Bölümü */}
              <Grid item xs={12} sx={{ mt: 3, flexBasis: '100% !important' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Sözleşme Dosyası
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  📎 Desteklenen formatlar: PDF, DOC, DOCX, JPG, JPEG, PNG | 📏 Maksimum boyut: 10 MB
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ border: '2px dashed', borderColor: 'grey.300', borderRadius: 2, p: 3, textAlign: 'center' }}>
                  <input
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    id="customer-file-upload"
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="customer-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      sx={{ mb: 2 }}
                      disabled={uploadingFile}
                      startIcon={<UploadIcon />}
                    >
                      {form.sozlesmeDosyasi ? form.sozlesmeDosyasi.name : 'Sözleşme Dosyası Seç'}
                    </Button>
                  </label>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    💡 Dosya seçmeden önce boyutunu kontrol edin
                  </Typography>
                  
                  {form.sozlesmeDosyasi && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Dosya Adı:</strong> {form.sozlesmeDosyasi.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Boyut:</strong> {formatFileSize(form.sozlesmeDosyasi.size)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Tip:</strong> {form.sozlesmeDosyasi.type}
                      </Typography>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => setForm(prev => ({ ...prev, sozlesmeDosyasi: null }))}
                        sx={{ mt: 1 }}
                      >
                        Dosyayı Kaldır
                      </Button>
                    </Box>
                  )}
                  
                  {editMusteri && editMusteri.sozlesmeDosyaAdi && !form.sozlesmeDosyasi && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Mevcut Dosya:</strong> {editMusteri.sozlesmeDosyaAdi} ({formatFileSize(editMusteri.sozlesmeDosyaBoyutu)})
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Yeni dosya seçerseniz mevcut dosya değiştirilecektir.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
            <DialogActions sx={{ mt: 2, display:'flex', justifyContent:'space-between', alignItems:'center', gap: 2, flexWrap:'wrap', borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              {user.role === 'admin' && (() => {
                const sozNum = parseFloat(form.sozlesmeTutari);
                const toplamOdenen = custPayments.reduce((t, p) => t + parseFloat(p.tutar || 0), 0);
                const kalanOdeme = sozNum - toplamOdenen;
                return kalanOdeme === 0;
              })() && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.hesapYapildi}
                      onChange={e => setForm(f => ({ ...f, hesapYapildi: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label="Hesap Yapıldı (Ortaklara bölüştürüldü)"
                />
              )}
              <Box sx={{ display:'flex', gap: 1, ml:'auto' }}>
                <Button onClick={handleClose}>İptal</Button>
                <Button type="submit" variant="contained">Kaydet</Button>
              </Box>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      )}

      {/* Ödeme Detayları Dialog - Lazy */}
      <React.Suspense fallback={null}>
        <PaymentDetailsDialog
          open={odemeDetayOpen}
          onClose={handleOdemeDetayClose}
          selectedMusteri={selectedMusteri}
          deletedPayments={deletedPayments}
          pendingForCustomer={pendingForCustomer}
          user={user}
          onDeletePayment={handleOdemeSil}
          onUndoDelete={handleUndoDelete}
          onApproveDelete={approvePaymentDelete}
          onRejectDelete={rejectPaymentDelete}
        />
      </React.Suspense>

      {/* Ödeme Ekleme Dialog */}
      <Dialog 
        open={odemeEkleOpen} 
        onClose={handleOdemeEkleClose} 
        maxWidth="md" 
        fullWidth 
        fullScreen={!isMdUp}
        disableEnforceFocus
        disableAutoFocus
      >
        <DialogTitle>
          {selectedMusteri?.adSoyad} - Yeni Ödeme Ekle
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleOdemeEkle} sx={{ mt: 1 }}>
            {/* Kullanıcı Bilgisi */}
            <TextField
              margin="normal"
              fullWidth
              label="Ekleyen Kullanıcı"
              name="ekleyenKullanici"
              value={user?.username || 'Bilinmiyor'}
              InputProps={{
                readOnly: true,
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Ödeme Tutarı"
              name="tutar"
              type="text"
              slotProps={{ input: { inputMode: 'decimal' } }}
              defaultValue={formatNumber(odemeForm.tutar || '')}
              onChange={(e)=>{
                const digits = (e.target.value||'').replace(/\D/g,'');
                e.target.value = digits ? Number(digits).toLocaleString('tr-TR') : '';
              }}
              onBlur={(e)=>{
                const raw = (e.target.value||'').replace(/\./g,'').replace(/,/g,'.');
                handleOdemeChange({ target: { name:'tutar', value: raw } });
              }}
              autoComplete="off"
              inputProps={{ autoComplete: 'new-password', form: { autoComplete: 'off' } }}
              error={!!payErr.tutar}
              helperText={payErr.tutar}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Tarih"
              name="tarih"
              type="date"
              slotProps={{ inputLabel: { shrink: true }, input: { min: minDateStr } }}
              value={odemeForm.tarih}
              onChange={handleOdemeChange}
              error={!!payErr.tarih}
              helperText={payErr.tarih}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Ödeme Türü"
              name="tur"
              value={odemeForm.tur}
              onChange={handleOdemeChange}
              error={!!payErr.tur}
              helperText={payErr.tur}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 200
                    }
                  }
                }
              }}
            >
              {odemeTurleri.map(tur => (
                <MenuItem key={tur} value={tur}>{tur}</MenuItem>
              ))}
            </TextField>
            {odemeForm.tur === 'Kredi Kartı' && (
              <TextField
                margin="normal"
                required
                fullWidth
                select
                label="Toptancı"
                name="toptanci"
                value={odemeForm.toptanci}
                onChange={handleOdemeChange}
                sx={{ minWidth: 160 }}
                error={!!payErr.toptanci}
                helperText={payErr.toptanci}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 200
                      }
                    }
                  }
                }}
              >
                {supplierOptions.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOdemeEkleClose}>İptal</Button>
          <Button onClick={handleOdemeEkle} variant="contained">Ödeme Ekle</Button>
        </DialogActions>
      </Dialog>

            {/* Silinen Müşteriler Dialog */}
      <Dialog
        open={deletedCustomersOpen}
        onClose={() => setDeletedCustomersOpen(false)}
        onOpen={() => {
          // Dialog açıldığında silinen müşteriler listesini yenile
          const refreshDeletedCustomers = async () => {
            const result = await apiGetDeletedCustomers();
            if (result.success) {
              setDeletedCustomers(result.data);
            }
          };
          refreshDeletedCustomers();
        }}
        maxWidth="lg"
        fullWidth
        fullScreen={!isMdUp}
        disableEnforceFocus
        disableAutoFocus
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            Silinen Müşteriler ({deletedCustomers.length})
          </Box>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bu müşteriler silinmiş durumda. Geri almak için "Geri Al" butonuna tıklayın.
          </Typography>
          
          {deletedCustomers.map((deletedCustomer) => (
            <Box 
              key={`deleted-${deletedCustomer.id}`} 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2, 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {deletedCustomer.adSoyad}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  TC: {deletedCustomer.tcKimlik}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sözleşme Tutarı: {formatNumber(deletedCustomer.sozlesmeTutari)} ₺
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sözleşme Tarihi: {deletedCustomer.sozlesmeTarihi || '-'}
                </Typography>
                {deletedCustomer.yapilanIs && (
                  <Typography variant="body2" color="text.secondary">
                    İş: {deletedCustomer.yapilanIs}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => {
                    handleUndoCustomerDelete(deletedCustomer);
                    if (deletedCustomers.length === 1) {
                      setDeletedCustomersOpen(false);
                    }
                  }}
                >
                  Geri Al
                </Button>
                <Tooltip title="Kalıcı Sil">
                  <IconButton 
                    color="error" 
                    onClick={() => {
                      if (window.confirm(`${deletedCustomer.adSoyad} isimli müşteriyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
                        handlePermanentDelete(deletedCustomer.id);
                        // Eğer son müşteri ise dialog'u kapat
                        if (deletedCustomers.length === 1) {
                          setTimeout(() => {
                            setDeletedCustomersOpen(false);
                          }, 100);
                        }
                      }
                    }}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button color="warning" onClick={() => {
            handleCleanupAllDeletedCustomers();
            // Tüm müşteriler silindiğinde dialog'u kapat
            if (deletedCustomers.length > 0) {
              setTimeout(() => {
                setDeletedCustomersOpen(false);
              }, 100);
            }
          }}>Tümünü Temizle</Button>
          <Button onClick={() => setDeletedCustomersOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Müşteri Silme Onay Dialogu */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={handleDeleteCancel} 
        maxWidth="md"
        fullScreen={!isMdUp}
        disableEnforceFocus
        disableAutoFocus
      >
        <DialogTitle>Müşteri Sil</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{customerToDelete?.adSoyad}</strong> isimli müşteriyi silmek istediğinizden emin misiniz?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Bu işlem geri alınabilir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">İptal</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>

      {/* Görsel Büyütme Dialogu */}
      <Dialog 
        open={imagePreviewOpen} 
        onClose={() => setImagePreviewOpen(false)}
        maxWidth="lg" 
        fullWidth 
        fullScreen={!isMdUp}
        PaperProps={{ sx: { m: { xs: 1, sm: 2, md: 4 } } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box 
            component="img"
            src={imagePreviewSrc}
            alt="Önizleme"
            sx={{ width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain' }}
            onClick={() => setImagePreviewOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Randevu Tarihi Düzenleme Dialogu */}
      <Dialog 
        open={randevuDialogOpen} 
        onClose={()=>setRandevuDialogOpen(false)} 
        maxWidth="md" 
        fullWidth 
        fullScreen={!isMdUp}
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{ sx: { m: { xs: 1, sm: 2, md: 4 } } }}
      >
        <DialogTitle>Randevu Tarihini Düzenle</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            type="date"
            label="Randevu Tarihi"
            value={randevuDate}
            onChange={(e)=>setRandevuDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, input: { min: minDateStr } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setRandevuDialogOpen(false)}>İptal</Button>
          <Button onClick={handleRandevuSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Taahhüt Tarihi Düzenleme Dialogu */}
      <Dialog 
        open={taahhutDialogOpen} 
        onClose={()=>setTaahhutDialogOpen(false)} 
        maxWidth="md" 
        fullWidth 
        fullScreen={!isMdUp}
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{ sx: { m: { xs: 1, sm: 2, md: 4 } } }}
      >
        <DialogTitle>Ödeme Taahhüt Tarihini Düzenle</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            type="date"
            label="Taahhüt Tarihi"
            value={taahhutDate}
            onChange={(e)=>setTaahhutDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, input: { min: minDateStr } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setTaahhutDialogOpen(false)}>İptal</Button>
          <Button onClick={handleTaahhutSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* İş Detayları Dialogu - PDF Önizlemesi ile */}
      <JobInfoDialog
        open={jobInfoOpen}
        onClose={() => setJobInfoOpen(false)}
        jobInfoData={jobInfoData}
        onDownload={handleFileDownload}
        onDeleteFile={handleFileDelete}
      />

    </Box>
  );
}