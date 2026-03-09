import React, { useState, useEffect, useMemo } from 'react';
import { useRealTime } from '../context/RealTimeContext';
import { useAuth } from '../context/AuthContext';
import {
  // Keep utility functions
  loadFromLocalStorage,
  saveToLocalStorage,
  filterByTimeLimit,
  getEmptyCustomerForm,
  getEmptyPaymentForm,
  filterCustomersBySearch,
  handlePaymentFormChange,
  validatePaymentForm,
  validatePaymentAmount,
  createPayment,
  addPaymentToCustomer,
  addToDeletedList,
  removeFromDeletedList,
  restoreDeletedItem,
  removeItemById,
  addItemToList,
  hesaplaTotalOdenen,
  formatNumber,
  // Add API functions
  apiGetCustomers,
  apiCreateCustomer,
  apiUpdateCustomer,
  apiDeleteCustomer,
  apiGetPayments,
  apiCreatePayment,
  apiUpdatePayment,
  apiDeletePayment,
  apiGetActiveSuppliers,
  apiCreateDeleteRequest,
  apiGetPendingRequests,
  apiGetMyRequests,
  apiApproveRequest,
  apiRejectRequest,
  apiGetDeletedCustomers,
  apiRestoreCustomer,
  apiPermanentlyDeleteCustomer,
  apiCleanupDeletedCustomer,
  apiCleanupAllDeletedCustomers,
  apiGetCustomersByDateRange,
  apiGetCustomerAssignments,
  apiUpsertCustomerAssignments,
  // Stok API functions
  apiGetStoklar,
  apiGetActiveStoklar,
  apiCreateStokHareketi,
  // Order API functions
  apiGetOrders,
  apiCreateOrder,
  apiUpdateOrder,
  apiDeleteOrder,
  // Stok Hareketi API functions
  apiGetStokHareketleri,
  // Sözleşme dosyası API functions
  apiUploadSozlesme
} from '../utils/helpers';

const initialMusteriler = [];

export const useCustomers = () => {
  const { sendNotification, sendGlobalNotification, connection, setNotifications } = useRealTime();
  const { user } = useAuth();
  const parseMoney = (value) => parseFloat(String(value || '').replace(/\./g, '').replace(/,/g, '.')) || 0;
  
  // State Management
  const [musteriler, setMusteriler] = useState(initialMusteriler);
  const [isFormPending, startFormTransition] = React.useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(getEmptyCustomerForm());
  const [editMusteri, setEditMusteri] = useState(null);
  // Çoklu satılan cihazlar
  const [soldDevices, setSoldDevices] = useState([]); // [{ deviceName: string, quantity: number, note?: string }]
  
  // Dialog States
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [odemeDetayOpen, setOdemeDetayOpen] = useState(false);
  const [odemeEkleOpen, setOdemeEkleOpen] = useState(false);
  const [selectedMusteri, setSelectedMusteri] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deletedCustomersOpen, setDeletedCustomersOpen] = useState(false);

  // Payment States
  const [custPayments, setCustPayments] = useState([]);
  const [custPayForm, setCustPayForm] = useState(getEmptyPaymentForm());
  const [custPayErr, setCustPayErr] = useState({});
  const [odemeForm, setOdemeForm] = useState(getEmptyPaymentForm());
  const [payErr, setPayErr] = useState({});

  // Deleted Items States
  const [deletedPayments, setDeletedPayments] = useState([]);
  const [deletedCustPayments, setDeletedCustPayments] = useState([]);
  const [deletedCustomers, setDeletedCustomers] = useState([]);
  // Ödeme silme talepleri (çalışan -> admin onayı)
  const [pendingPaymentDeletes, setPendingPaymentDeletes] = useState([]);

  // Bildirim state'i - artık RealTimeContext'ten geliyor
  // const [notifications, setNotifications] = useState(() => {
  //   return loadFromLocalStorage('notifications', []);
  // });

  // Pasif toptancıları takip et
  const [inactiveSuppliers, setInactiveSuppliers] = useState(() => {
    const stored = localStorage.getItem('inactiveSuppliers');
    return stored ? JSON.parse(stored) : [];
  });

  // State for suppliers from API
  const [suppliers, setSuppliers] = useState([]);
  
  // Order states
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // Stok Hareketleri state
  const [stokHareketleri, setStokHareketleri] = useState([]);
  const [stokHareketleriLoading, setStokHareketleriLoading] = useState(false);
  // Usta atama state'i (form için)
  const [ustaAtamalari, setUstaAtamalari] = useState([]); // [{ustaId, note}]
  const [kolonOnly, setKolonOnly] = useState(false);
  
  // Flag to prevent duplicate notifications when creating customer with payments
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  
  // Stok state'i
  const [stoklar, setStoklar] = useState([]);

  // Tarih aralığı filtresi state'leri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilteredMusteriler, setDateFilteredMusteriler] = useState([]);
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [dateRangeTotals, setDateRangeTotals] = useState({
    toplamSozlesmeTutari: 0,
    toplamOdenenTutar: 0,
    toplamKalanOdeme: 0,
    musteriSayisi: 0
  });

  // Computed Values
  const supplierOptions = useMemo(() => {
    // Use only API suppliers
    const apiSuppliers = suppliers.map(s => s.name);
    return apiSuppliers.filter(supplier => !inactiveSuppliers.includes(supplier));
  }, [suppliers, inactiveSuppliers]);
  
  const filteredMusteriler = useMemo(() => {
    return filterCustomersBySearch(musteriler, searchTerm);
  }, [musteriler, searchTerm]);

  // Adres birleştirme yardımcı fonksiyonu
  const composeAddress = (f) => [
    f.il,
    f.ilce,
    f.mahalle,
    f.cadde,
    f.sokak,
    f.binaNo && `No:${f.binaNo}`,
    f.daireNo && `D:${f.daireNo}`,
    f.adresEk && `${f.adresEk}`
  ].filter(Boolean).join(' / ');

  // Adresi parçalama yardımcı fonksiyonu (tek satır string → form alanları)
  const parseAddress = (adresStr) => {
    const result = { il: '', ilce: '', mahalle: '', cadde: '', sokak: '', binaNo: '', daireNo: '', adresEk: '' };
    if (!adresStr || typeof adresStr !== 'string') return result;
    const parts = adresStr.split(' / ').map(p => (p || '').trim()).filter(Boolean);
    // Sıralama: il, ilce, mahalle, cadde, sokak, No:x, D:y, adresEk
    if (parts[0]) result.il = parts[0];
    if (parts[1]) result.ilce = parts[1];
    if (parts[2]) result.mahalle = parts[2];
    if (parts[3]) result.cadde = parts[3];
    if (parts[4]) result.sokak = parts[4];
    // Kalanlarda No: ve D: ara
    for (let i = 5; i < parts.length; i++) {
      const p = parts[i];
      if (/^No:\s*/i.test(p)) {
        result.binaNo = p.replace(/^No:\s*/i, '').trim();
      } else if (/^D:\s*/i.test(p)) {
        result.daireNo = p.replace(/^D:\s*/i, '').trim();
      } else {
        // İlk serbest metni adresEk olarak al (varsa)
        if (!result.adresEk) result.adresEk = p;
      }
    }
    return result;
  };

  // Load customers, payments and suppliers (full)
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Yeni adres yapısını tek satır string olarak birleştir
      const composedAddress = composeAddress(form);
      // Load suppliers first
      const suppliersResult = await apiGetActiveSuppliers();
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data);
      }

              // Load customers with payments included
        const customersResult = await apiGetCustomers();
        if (customersResult.success) {
          // Customers already include payments from API
          const customersWithPayments = customersResult.data.map(customer => {
            return {
              id: customer.id,
              adSoyad: customer.adSoyad,
              tcKimlik: customer.tcKimlik,
              telefon: customer.telefon,
              adres: customer.adres,
              sozlesmeTutari: customer.sozlesmeTutari,
              sozlesmeTarihi: customer.sozlesmeTarihi,
              odemeTaahhutTarihi: customer.odemeTaahhutTarihi,
              randevuTarihi: customer.randevuTarihi,
              yapilanIs: customer.yapilanIs,
              boruTipi: customer.boruTipi,
              satilanCihaz: customer.satilanCihaz,
              termostat: customer.termostat,
              soldDevices: (customer.soldDevices || []).map(sd => ({
                yapilanIs: sd.yapilanIs || sd.YapilanIs || '',
                deviceName: sd.satilanCihaz || sd.SatilanCihaz || sd.deviceName || '',
                boruTipi: sd.boruTipi || sd.BoruTipi || '',
                termostat: sd.termostat || sd.Termostat || '',
                quantity: sd.quantity || sd.Quantity || 1,
                note: sd.daireBilgisi || sd.DaireBilgisi || ''
              })),
              toptanciIsmi: customer.toptanciIsmi,
              ustaIsmi: customer.ustaIsmi,
              createdByUsername: customer.createdByUsername,
              odemeler: customer.payments || [],
              hesapYapildi: customer.hesapYapildi,
              sozlesmeDosyaAdi: customer.sozlesmeDosyaAdi,
              sozlesmeDosyaBoyutu: customer.sozlesmeDosyaBoyutu,
              sozlesmeDosyaTipi: customer.sozlesmeDosyaTipi
            };
          });
        
        setMusteriler(customersWithPayments);
      } else {
        setError(customersResult.error || 'Müşteriler yüklenemedi');
      }

                     // Load pending delete requests
        if (user) {
          let requestsResult;
          if (user.role === 'admin') {
            // Admin tüm bekleyen talepleri görür
            requestsResult = await apiGetPendingRequests();
          } else {
            // Çalışan sadece kendi taleplerini görür
            requestsResult = await apiGetMyRequests();
          }
          
          if (requestsResult.success) {
            // API'den gelen veriyi frontend formatına çevir
            const mappedRequests = requestsResult.data.map(request => {
              return {
                id: request.id,
                customerId: request.customerId,
                paymentId: request.paymentId,
                customerName: request.customer?.adSoyad || 'Bilinmeyen Müşteri',
                paymentAmount: request.payment?.tutar || 0,
                paymentDate: request.payment?.tarih || '',
                paymentType: request.payment?.tur || '',
                requestedBy: request.requestedBy?.username || 'Bilinmeyen',
                requestedAt: request.requestedAt,
                reason: request.reason || '',
                status: request.status
              };
            });
            
            // API'den gelen verileri direkt olarak set et, local storage'dan birleştirme yapma
            setPendingPaymentDeletes(mappedRequests);
                   }
       }

       // Load deleted customers from API
       const deletedCustomersResult = await apiGetDeletedCustomers();
       if (deletedCustomersResult.success) {
         setDeletedCustomers(deletedCustomersResult.data);
       }

       // Load orders and stock movements
       await Promise.all([
         loadOrders(),
         loadStokHareketleri()
       ]);
     } catch (err) {
       setError('Veriler yüklenirken hata oluştu');

     } finally {
       setLoading(false);
     }
   };

  // Lighter initial load: only suppliers + customers
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const suppliersResult = await apiGetActiveSuppliers();
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data);
      }

      const customersResult = await apiGetCustomers();
      if (customersResult.success) {
        const customersWithPayments = customersResult.data.map(customer => ({
          id: customer.id,
          adSoyad: customer.adSoyad,
          tcKimlik: customer.tcKimlik,
          telefon: customer.telefon,
          adres: customer.adres,
          sozlesmeTutari: customer.sozlesmeTutari,
          sozlesmeTarihi: customer.sozlesmeTarihi,
          odemeTaahhutTarihi: customer.odemeTaahhutTarihi,
          randevuTarihi: customer.randevuTarihi,
          yapilanIs: customer.yapilanIs,
          boruTipi: customer.boruTipi,
          satilanCihaz: customer.satilanCihaz,
          termostat: customer.termostat,
          soldDevices: (customer.soldDevices || []).map(sd => ({
            yapilanIs: sd.yapilanIs || sd.YapilanIs || '',
            deviceName: sd.satilanCihaz || sd.SatilanCihaz || sd.deviceName || '',
            boruTipi: sd.boruTipi || sd.BoruTipi || '',
            termostat: sd.termostat || sd.Termostat || '',
            quantity: sd.quantity || sd.Quantity || 1,
            note: sd.daireBilgisi || sd.DaireBilgisi || ''
          })),
          toptanciIsmi: customer.toptanciIsmi,
          ustaIsmi: customer.ustaIsmi,
          createdByUsername: customer.createdByUsername,
          odemeler: customer.payments || [],
          hesapYapildi: customer.hesapYapildi,
          sozlesmeDosyaAdi: customer.sozlesmeDosyaAdi,
          sozlesmeDosyaBoyutu: customer.sozlesmeDosyaBoyutu,
          sozlesmeDosyaTipi: customer.sozlesmeDosyaTipi
        }));
        setMusteriler(customersWithPayments);
      } else {
        setError(customersResult.error || 'Müşteriler yüklenemedi');
      }
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');

    } finally {
      setLoading(false);
    }
  };

  // Ancillary data (deferred): requests, deleted customers, orders, stock movements
  const loadAncillaryData = async () => {
    try {
      if (user) {
        let requestsResult;
        if (user.role === 'admin') {
          requestsResult = await apiGetPendingRequests();
        } else {
          requestsResult = await apiGetMyRequests();
        }
        if (requestsResult.success) {
          const mappedRequests = requestsResult.data.map(request => ({
            id: request.id,
            customerId: request.customerId,
            paymentId: request.paymentId,
            customerName: request.customer?.adSoyad || 'Bilinmeyen Müşteri',
            paymentAmount: request.payment?.tutar || 0,
            paymentDate: request.payment?.tarih || '',
            paymentType: request.payment?.tur || '',
            requestedBy: request.requestedBy?.username || 'Bilinmeyen',
            requestedAt: request.requestedAt,
            reason: request.reason || '',
            status: request.status
          }));
          setPendingPaymentDeletes(mappedRequests);
        }
      }

      const deletedCustomersResult = await apiGetDeletedCustomers();
      if (deletedCustomersResult.success) {
        setDeletedCustomers(deletedCustomersResult.data);
      }

      await Promise.all([
        loadOrders(),
        loadStokHareketleri()
      ]);
    } catch (err) {
      // Sessizce geç
     }
   };

  // Stokları yükle
  const loadStoklar = async () => {
    try {
      const result = await apiGetActiveStoklar();
      if (result.success && result.data && Array.isArray(result.data)) {
        // Stok verilerini localStorage'a kaydet (ClientPage'de kullanılacak)
        localStorage.setItem('stoklar', JSON.stringify(result.data));
        
        // Stok güncellendiğinde müşteri renklerini kontrol et
        checkAndUpdateCustomerColors(result.data);
      } else {

      }
    } catch (error) {

    }
  };

  // Siparişleri yükle
  const loadOrders = async () => {
    try {
      setOrderLoading(true);
      const result = await apiGetOrders();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {

    } finally {
      setOrderLoading(false);
    }
  };

  // Stok hareketlerini yükle
  const loadStokHareketleri = async () => {
    try {
      setStokHareketleriLoading(true);
      const result = await apiGetStokHareketleri();
      if (result.success) {
        setStokHareketleri(result.data);
      }
    } catch (error) {

    } finally {
      setStokHareketleriLoading(false);
    }
  };

  // Stok güncellendiğinde müşteri renklerini kontrol et ve güncelle
  const checkAndUpdateCustomerColors = (stoklar) => {
    // Müşteri listesini al
    const currentMusteriler = musteriler || [];
    
    // Stoklar array değilse işlemi durdur
    if (!Array.isArray(stoklar)) {

      return;
    }
    
    // Her stok için, o stoktan satılan müşterileri bul
    stoklar.forEach(stok => {
      if (stok.miktar >= 0) {
        // Stok pozitif veya sıfır olduğunda, bu stoktan satılan müşterileri kontrol et
        const affectedCustomers = currentMusteriler.filter(musteri => {
          if (!musteri.yapilanIs || !musteri.satilanCihaz) return false;
          
          // İş türüne göre ürün türü mapping'i
          const jobToProductType = {
            'dönüşüm-kolon': 'Kombi', 'dönüşüm': 'Kombi', 'dönüşüm-kolon-full': 'Kombi',
            'kolon-kombi-gaz': 'Kombi', 'dönüşüm-kombi': 'Kombi', 'dönüşüm-kombi-kolon': 'Kombi',
            'klima-montaj-satış': 'Klima', 'klima-satış': 'Klima'
          };
          
          const productType = jobToProductType[musteri.yapilanIs];
          if (!productType || stok.urunTuru !== productType) return false;
          
          // Satılan cihaz metnini kontrol et
          const deviceText = musteri.satilanCihaz.toLowerCase();
          return `${stok.marka} ${stok.model}`.toLowerCase().includes(deviceText);
        });
        
        // Etkilenen müşterileri randevu tarihine göre sırala
        const sortedCustomers = affectedCustomers.sort((a, b) => {
          const dateA = a.randevuTarihi ? new Date(a.randevuTarihi) : new Date('9999-12-31');
          const dateB = b.randevuTarihi ? new Date(b.randevuTarihi) : new Date('9999-12-31');
          return dateA - dateB;
        });
        
        // En yakın randevu tarihine sahip müşteriyi normale çevir
        if (sortedCustomers.length > 0) {
          const customerToNormalize = sortedCustomers[0];

          
          // Burada müşteri listesini güncelleyebiliriz, ancak şu anda sadece log yazıyoruz
          // Gerçek uygulamada bu müşterinin rengini normale çevirmek için state güncellemesi gerekir
        }
      }
    });
  };

  // Stok bulma fonksiyonu
  const findStokByDevice = (yapilanIs, satilanCihaz) => {
    if (!yapilanIs || !satilanCihaz) return null;
    
    // İş türüne göre ürün türü mapping'i
    const jobToProductType = {
      'dönüşüm-kolon': 'Kombi',
      'dönüşüm': 'Kombi',
      'dönüşüm-kolon-full': 'Kombi',
      'kolon-kombi-gaz': 'Kombi',
      'dönüşüm-kombi': 'Kombi',
      'dönüşüm-kombi-kolon': 'Kombi',
      'klima-montaj-satış': 'Klima',
      'klima-satış': 'Klima'
    };
    
    const productType = jobToProductType[yapilanIs];
    if (!productType) return null;

    // localStorage'dan stokları al
    const storedStoklar = localStorage.getItem('stoklar');
    if (!storedStoklar) return null;
    
    const stoklar = JSON.parse(storedStoklar);
    
    // Satılan cihaz metnini parçala (örn: "Daikin CSU 24kW")
    const deviceText = satilanCihaz.toLowerCase();
    
    // Stokta bu ürün türünde ve marka/model eşleşen ürün var mı kontrol et
    const stokUrunu = stoklar.find(s => 
      s.urunTuru === productType && 
      `${s.marka} ${s.model}`.toLowerCase().includes(deviceText)
    );

    return stokUrunu;
  };

  // Tarih aralığına göre müşterileri yükle
  const loadCustomersByDateRange = React.useCallback(async (start, end) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiGetCustomersByDateRange(start, end);
      
      if (result.success && result.data) {
        // API'den gelen veriyi güvenli bir şekilde kontrol et
        const customers = result.data.Customers || [];
        const totals = result.data.Totals || {};
        
        const customersWithPayments = customers.map(customer => {
          return {
            id: customer.id,
            adSoyad: customer.adSoyad,
            tcKimlik: customer.tcKimlik,
            telefon: customer.telefon,
            adres: customer.adres,
            sozlesmeTutari: customer.sozlesmeTutari,
            sozlesmeTarihi: customer.sozlesmeTarihi,
            odemeTaahhutTarihi: customer.odemeTaahhutTarihi,
            randevuTarihi: customer.randevuTarihi,
            yapilanIs: customer.yapilanIs,
            boruTipi: customer.boruTipi,
            satilanCihaz: customer.satilanCihaz,
            termostat: customer.termostat,
            soldDevices: (customer.soldDevices || []).map(sd => ({
              yapilanIs: sd.yapilanIs || '',
              deviceName: sd.satilanCihaz || '',
              boruTipi: sd.boruTipi || '',
              termostat: sd.termostat || '',
              quantity: sd.quantity || 1,
              note: sd.daireBilgisi || ''
            })),
            toptanciIsmi: customer.toptanciIsmi,
            ustaIsmi: customer.ustaIsmi,
            createdByUsername: customer.createdByUsername,
            odemeler: customer.Payments || []
          };
        });
        
        setDateFilteredMusteriler(customersWithPayments);
        setIsDateFiltered(true);
        setDateRangeTotals({
          toplamSozlesmeTutari: totals.ToplamSozlesmeTutari || 0,
          toplamOdenenTutar: totals.ToplamOdenenTutar || 0,
          toplamKalanOdeme: totals.ToplamKalanOdeme || 0,
          musteriSayisi: totals.MusteriSayisi || 0
        });
      } else {
        setError(result.error || 'Veri yüklenemedi');
      }
    } catch (error) {
      setError('Tarih aralığına göre veriler yüklenirken bir hata oluştu');

    } finally {
      setLoading(false);
    }
  }, []);

  // Tarih filtresini temizle
  const clearDateFilter = React.useCallback(() => {
    setStartDate('');
    setEndDate('');
    setDateFilteredMusteriler([]);
    setIsDateFiltered(false);
    setDateRangeTotals({
      toplamSozlesmeTutari: 0,
      toplamOdenenTutar: 0,
      toplamKalanOdeme: 0,
      musteriSayisi: 0
    });
  }, []);

  // Effects
  useEffect(() => {
    // İlk yükte hafif veri getir
    loadInitialData();
    // Kritik olmayan verileri idle zamanda getir
    const t = setTimeout(() => {
    loadStoklar();
      loadAncillaryData();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Real-time event listeners
  useEffect(() => {
    if (!connection) {
      return;
    }
    // Sözleşme dosyası yüklendiğinde
    connection.on('ReceiveSozlesmeUploaded', (customerId, sozlesmeData) => {
      setMusteriler(prev => prev.map(c => c.id === customerId
        ? {
            ...c,
            sozlesmeDosyaAdi: sozlesmeData.fileName,
            sozlesmeDosyaBoyutu: sozlesmeData.fileSize,
            sozlesmeDosyaTipi: sozlesmeData.fileType
          }
        : c
      ));
      setSelectedMusteri(prev => prev && prev.id === customerId
        ? {
            ...prev,
            sozlesmeDosyaAdi: sozlesmeData.fileName,
            sozlesmeDosyaBoyutu: sozlesmeData.fileSize,
            sozlesmeDosyaTipi: sozlesmeData.fileType
          }
        : prev
      );
    });

    // Sözleşme dosyası silindiğinde
    connection.on('ReceiveSozlesmeDeleted', (customerId) => {
      setMusteriler(prev => prev.map(c => c.id === customerId
        ? {
            ...c,
            sozlesmeDosyaAdi: null,
            sozlesmeDosyaBoyutu: null,
            sozlesmeDosyaTipi: null
          }
        : c
      ));
      setSelectedMusteri(prev => prev && prev.id === customerId
        ? {
            ...prev,
            sozlesmeDosyaAdi: null,
            sozlesmeDosyaBoyutu: null,
            sozlesmeDosyaTipi: null
          }
        : prev
      );
    });

    // Ödeme silme talebi onaylandığında
    connection.on('ReceiveRequestApproved', (message) => {

      
      // Talebi pending listesinden kaldır
      setPendingPaymentDeletes(prev => {
        const filtered = prev.filter(r => r.id !== message.requestId);

        return filtered;
      });
      
      // Ödeme silme talebi bildirimini kaldır (eğer varsa)
      setNotifications(prev => {
        const filtered = prev.filter(n => 
          !(n.type === 'payment_delete_request' && n.odemeId === message.paymentId && n.musteriId === message.customerId)
        );
        return filtered;
      });
      
      // Eğer ödeme silindiyse local state'i güncelle
      if (message.paymentId && message.customerId) {

        
        setMusteriler(prev => {
          const updated = prev.map(m => 
            m.id === message.customerId 
              ? { ...m, odemeler: (m.odemeler || []).filter(o => o.id !== message.paymentId) }
              : m
          );

          return updated;
        });
        
        // Seçili müşteriyi de güncelle
        setSelectedMusteri(prev => {
          if (!prev || prev.id !== message.customerId) return prev;
          const updated = { ...prev, odemeler: (prev.odemeler || []).filter(o => o.id !== message.paymentId) };

          return updated;
        });
      }

      // Bildirim ekle
      const notification = {
        type: 'request_approved',
        title: 'Ödeme Silme Talebi Onaylandı',
        message: `${message.customerName} müşterisinin ${message.paymentDate ? message.paymentDate.split('T')[0] : '-'} tarihli ${formatNumber(message.paymentAmount || 0)}₺ tutarındaki ödemesi silindi (Onaylayan: ${message.approvedBy || 'Admin'})`,
        isPersonal: false,
        id: Date.now(),
        createdAt: Date.now()
      };
      
      setNotifications(prev => {
        const updated = [...prev, notification];
        return updated;
      });
    });

    // Ödeme silme talebi reddedildiğinde
    connection.on('ReceiveRequestRejected', (message) => {
      
      // Talebi pending listesinden kaldır
      setPendingPaymentDeletes(prev => {
        const filtered = prev.filter(r => r.id !== message.requestId);
        return filtered;
      });

      // Ödeme silme talebi bildirimini kaldır (eğer varsa)
      setNotifications(prev => {
        const filtered = prev.filter(n => 
          !(n.type === 'payment_delete_request' && n.odemeId === message.paymentId && n.musteriId === message.customerId)
        );
        return filtered;
      });

      // Bildirim ekle
      const notification = {
        type: 'request_rejected',
        title: 'Ödeme Silme Talebi Reddedildi',
        message: `${message.customerName} müşterisinin ${message.paymentDate ? message.paymentDate.split('T')[0] : '-'} tarihli ${formatNumber(message.paymentAmount || 0)}₺ tutarındaki ödeme silme talebi reddedildi (Reddeden: ${message.rejectedBy || 'Admin'})`,
        isPersonal: false,
        id: Date.now(),
        createdAt: Date.now()
      };
      
      setNotifications(prev => {
        const updated = [...prev, notification];
        return updated;
      });
    });

    // Yeni silme talebi geldiğinde
    connection.on('ReceiveDeleteRequest', (userId, message) => {
      const newRequest = {
        id: message.requestId,
        customerId: message.customerId,
        paymentId: message.paymentId,
        customerName: message.customerName || 'Bilinmeyen Müşteri',
        paymentAmount: message.paymentAmount || 0,
        paymentDate: message.paymentDate || '',
        paymentType: message.paymentType || '',
        requestedBy: message.requestedBy || 'Bilinmeyen',
        requestedAt: new Date(),
        reason: message.reason || '',
        status: 'Pending'
      };
      
      // Yeni talebi ekle (adminler için tüm talepler, çalışanlar için sadece kendi talepleri)
      setPendingPaymentDeletes(prev => {
        const existingRequest = prev.find(r => r.id === newRequest.id);
        if (existingRequest) {
          return prev;
        }
        const updated = [...prev, newRequest];
        return updated;
      });

      // Bildirim ekle (adminler için tüm talepler, çalışanlar için sadece kendi talepleri)
      if (user?.role === 'admin' || message.requestedBy === user?.username) {
        const notification = {
          type: 'new_delete_request',
          title: user?.role === 'admin' ? 'Yeni Silme Talebi' : 'Silme Talebi Oluşturuldu',
          message: user?.role === 'admin' 
            ? `${message.customerName} müşterisinin ${message.paymentDate ? message.paymentDate.split('T')[0] : '-'} tarihli ${formatNumber(message.paymentAmount || 0)}₺ tutarındaki ödeme için silme talebi geldi (Talep eden: ${message.requestedBy || 'Çalışan'})`
            : `${message.paymentDate ? message.paymentDate.split('T')[0] : '-'} tarihli ${formatNumber(message.paymentAmount || 0)}₺ tutarındaki ödeme için silme talebiniz oluşturuldu. Admin onayı bekleniyor.`,
          isPersonal: user?.role !== 'admin',
          id: Date.now(),
          createdAt: Date.now()
        };
        
        setNotifications(prev => {
          const updated = [...prev, notification];
          return updated;
        });
      }
    });

    // Yeni müşteri oluşturulduğunda
    connection.on('CustomerCreated', (customerData) => {
      // Yeni müşteriyi listeye ekle
      setMusteriler(prev => {
        const existingCustomer = prev.find(c => c.id === customerData.id);
        if (existingCustomer) {
          return prev;
        }
        const updated = [...prev, {
          ...customerData,
          createdByUsername: customerData.createdByUsername || customerData.createdBy || 'Bilinmiyor' 
        }];
        return updated;
      });

             // Bildirim ekle - sadece adminler için
       if (user?.role === 'admin') {
         const notification = {
           type: 'customer_created',
           title: 'Yeni Müşteri Eklendi',
           message: `${customerData.adSoyad} müşterisi sisteme eklendi (Ekleyen: ${customerData.createdBy || 'Kullanıcı'})`,
           isPersonal: false,
           id: Date.now(),
           createdAt: Date.now()
         };
        
        setNotifications(prev => {
          const updated = [...prev, notification];
          return updated;
        });
      }
    });

    // Yeni ödeme oluşturulduğunda
    connection.on('PaymentCreated', (paymentData) => {
      
      // Müşterinin ödemelerini güncelle
      setMusteriler(prev => {
        const updated = prev.map(customer => {
          if (customer.id === paymentData.customerId) {
            // Aynı ödeme ID'si var mı kontrol et
            const existingPayment = customer.odemeler?.find(p => p.id === paymentData.id);
            if (existingPayment) {
              return customer; // Zaten varsa güncelleme
            }
            
            const newPayment = {
              id: paymentData.id,
              tutar: paymentData.tutar,
              tarih: paymentData.tarih,
              tur: paymentData.tur,
              toptanci: paymentData.toptanci,
              createdByUsername: paymentData.createdByUsername
            };
            
            return {
              ...customer,
              odemeler: [...(customer.odemeler || []), newPayment]
            };
          }
          return customer;
        });
        
        return updated;
      });

      // Seçili müşteriyi de güncelle
      setSelectedMusteri(prev => {
        if (!prev || prev.id !== paymentData.customerId) return prev;
        
        // Aynı ödeme ID'si var mı kontrol et
        const existingPayment = prev.odemeler?.find(p => p.id === paymentData.id);
        if (existingPayment) {
          return prev; // Zaten varsa güncelleme
        }
        
        const newPayment = {
          id: paymentData.id,
          tutar: paymentData.tutar,
          tarih: paymentData.tarih,
          tur: paymentData.tur,
          toptanci: paymentData.toptanci,
          createdByUsername: paymentData.createdByUsername
        };
        
        const updated = {
          ...prev,
          odemeler: [...(prev.odemeler || []), newPayment]
        };
        
        return updated;
      });

             // Bildirim ekle - sadece adminler için ve müşteri oluşturma sırasında değilse
      if (user?.role === 'admin' && !isCreatingCustomer) {
         const notification = {
           type: 'payment_created',
           title: 'Yeni Ödeme Eklendi',
          message: `${(paymentData.customerName || paymentData.customer?.adSoyad || 'Müşteri')} müşterisine ${formatNumber(paymentData.tutar)}₺ tutarında ${paymentData.tur} ödemesi eklendi (Ekleyen: ${paymentData.createdByUsername || 'Kullanıcı'})`,
           isPersonal: false,
           id: Date.now(),
           createdAt: Date.now()
         };
        
        setNotifications(prev => {
          const updated = [...prev, notification];
          return updated;
        });
      }
    });

             // Müşteri silindiğinde
    connection.on('CustomerDeleted', (customerData) => {
      // Silinen müşteriyi silinenler kutusuna ekle
      const deletedCustomer = {
        ...customerData,
        deletedAt: Date.now()
      };
      setDeletedCustomers(prev => [...prev, deletedCustomer]);
      
      // Müşteriyi local state'den kaldır
      setMusteriler(prev => {
        const filtered = prev.filter(c => c.id !== customerData.id);
        return filtered;
      });

      // Seçili müşteriyi de güncelle (eğer silinen müşteri seçiliyse)
      setSelectedMusteri(prev => {
        if (!prev || prev.id !== customerData.id) return prev;
        return null;
      });

             // Bildirim ekle - sadece adminler için
       if (user?.role === 'admin') {
         const notification = {
           type: 'customer_deleted',
           title: 'Müşteri Silindi',
           message: `${customerData.adSoyad} müşterisi başarıyla silindi (Silen: ${customerData.deletedBy || 'Kullanıcı'})`,
           isPersonal: false,
           id: Date.now(),
           createdAt: Date.now()
         };
        
        setNotifications(prev => {
          const updated = [...prev, notification];
          return updated;
        });
      }
    });

    // Ödeme silindiğinde
    connection.on('PaymentDeleted', (paymentData) => {
      // Müşterinin ödemelerini güncelle
      setMusteriler(prev => {
        const updated = prev.map(customer => {
          if (customer.id === paymentData.customerId) {
            return {
              ...customer,
              odemeler: (customer.odemeler || []).filter(p => p.id !== paymentData.id)
            };
          }
          return customer;
        });
        
        return updated;
      });

      // Seçili müşteriyi de güncelle
      setSelectedMusteri(prev => {
        if (!prev || prev.id !== paymentData.customerId) return prev;
        
        const updated = {
          ...prev,
          odemeler: (prev.odemeler || []).filter(p => p.id !== paymentData.id)
        };
        
        return updated;
      });

      // Bildirim ekle - sadece adminler için
      if (user?.role === 'admin') {
        const notification = {
          type: 'payment_deleted',
          title: 'Ödeme Silindi',
          message: `${(paymentData.customerName || paymentData.customer?.adSoyad || 'Müşteri')} müşterisinden ${formatNumber(paymentData.tutar)}₺ tutarında ${paymentData.tur} ödemesi silindi (Silen: ${paymentData.deletedByUsername || 'Kullanıcı'})`,
          isPersonal: false,
          id: Date.now(),
          createdAt: Date.now()
        };
        
        setNotifications(prev => {
          const updated = [...prev, notification];
          return updated;
        });
      }
    });

    return () => {
      connection.off('ReceiveRequestApproved');
      connection.off('ReceiveRequestRejected');
      connection.off('ReceiveDeleteRequest');
      connection.off('CustomerCreated');
      connection.off('PaymentCreated');
      connection.off('CustomerDeleted');
      connection.off('PaymentDeleted');
      connection.off('ReceiveSozlesmeUploaded');
      connection.off('ReceiveSozlesmeDeleted');
    };
  }, [connection, user, setNotifications, isCreatingCustomer]);

  // Remove localStorage save effect - we use API now
  // useEffect(() => {
  //   saveToLocalStorage('musteriler', musteriler);
  // }, [musteriler]);

  // Pending delete'leri artık API'den yüklüyoruz, localStorage'a kaydetmeye gerek yok

  // Deleted customers artık API'den yükleniyor, localStorage sync'e gerek yok

  // Inactive suppliers LocalStorage sync
  useEffect(() => {
    saveToLocalStorage('inactiveSuppliers', inactiveSuppliers);
  }, [inactiveSuppliers]);

  // Notifications LocalStorage sync - artık RealTimeContext'ten geliyor
  // useEffect(() => {
  //   saveToLocalStorage('notifications', notifications);
  // }, [notifications]);

  // Removed periodic auto-clean; deleted customers stay until manual clear

  // Error auto-clear effects
  useEffect(() => {
    if (Object.keys(custPayErr).length > 0) {
      const timer = setTimeout(() => setCustPayErr({}), 3000);
      return () => clearTimeout(timer);
    }
  }, [custPayErr]);

  useEffect(() => {
    if (Object.keys(payErr).length > 0) {
      const timer = setTimeout(() => setPayErr({}), 3000);
      return () => clearTimeout(timer);
    }
  }, [payErr]);

  // Customer Management Functions
  const handleOpen = React.useCallback((musteri = null) => {
    // KRİTİK: Önce dialog'u hemen aç - SADECE bu state değişsin
    setOpen(true);
    
    // Form hazırlığını bir sonraki frame'e ertele (dialog açılışını bloke etme)
    requestAnimationFrame(() => {
      setEditMusteri(musteri);
      
      // Form verilerini güvenli şekilde ayarla
      if (musteri) {
        const parsed = parseAddress(musteri.adres || '');
        setForm((prevForm) => ({
          adSoyad: musteri.adSoyad || '',
          tcKimlik: musteri.tcKimlik || '',
          telefon: musteri.telefon || '',
          adres: musteri.adres || '',
          il: parsed.il || (prevForm.il || ''),
          ilce: parsed.ilce || (prevForm.ilce || ''),
          mahalle: parsed.mahalle || (prevForm.mahalle || ''),
          cadde: parsed.cadde || (prevForm.cadde || ''),
          sokak: parsed.sokak || (prevForm.sokak || ''),
          binaNo: parsed.binaNo || (prevForm.binaNo || ''),
          daireNo: parsed.daireNo || (prevForm.daireNo || ''),
          adresEk: parsed.adresEk || (prevForm.adresEk || ''),
          sozlesmeTutari: musteri.sozlesmeTutari || '',
          sozlesmeTarihi: musteri.sozlesmeTarihi || '',
          odemeTaahhutTarihi: musteri.odemeTaahhutTarihi || '',
          randevuTarihi: musteri.randevuTarihi || '',
          toptanciIsmi: musteri.toptanciIsmi || '',
          ustaIsmi: (musteri.ustaIsmi || '').trim(),
          yapilanIs: '',
          boruTipi: '',
          satilanCihaz: '',
          termostat: '',
          hesapYapildi: musteri.hesapYapildi || false
        }));
        // Kaydedilmiş çoklu iş/cihaz satırlarını tabloya getir (ödeme ekranı gibi dursun)
        try {
          const savedRows = Array.isArray(musteri.soldDevices) ? musteri.soldDevices : [];
          setSoldDevices(savedRows);
        } catch { setSoldDevices([]); }
        // Müşteri için usta atamalarını yükle (asenkron, bloke etmez)
        apiGetCustomerAssignments(musteri.id).then(res => {
          if (res.success) {
            setUstaAtamalari(res.data.map(a => ({ ustaId: a.ustaId, note: a.note || '' })));
          } else {
            setUstaAtamalari([]);
          }
        });
      } else {
        setForm(getEmptyCustomerForm());
        setUstaAtamalari([]);
        setSoldDevices([]); // mevcut çoklu cihaz verisi API'de dönmediği için boş başlat
      }
      
      setCustPayments(musteri ? [...((musteri.odemeler || musteri.payments || musteri.Payments || []))] : []);
      setCustPayForm(getEmptyPaymentForm());
      setDeletedCustPayments([]);
    });
  }, []); // Empty deps - this function should be stable
  // Cihaz adından stok bul (ürün türüne bakmadan marka+model ile)
  const findStokByName = (deviceText) => {
    if (!deviceText) return null;
    const stored = localStorage.getItem('stoklar');
    if (!stored) return null;
    const list = JSON.parse(stored);
    const needle = (deviceText || '').toLowerCase().trim();
    return list.find(s => `${s.marka} ${s.model}`.toLowerCase().trim() === needle) || null;
  };


  // Kolon iş seçildiğinde sadece uzmanlık alanı "kolon" olan ustaları döndürmek için yardımcı
  const filterUstalarForKolon = (ustalar, yapilanIs) => {
    if (!yapilanIs || yapilanIs.trim().toLowerCase() !== 'kolon') return ustalar;
    return (ustalar || []).filter(u => (u.uzmanlikAlani || '').toLowerCase().includes('kolon'));
  };

  const handleClose = React.useCallback(() => {
    setOpen(false);
    setEditMusteri(null);
    setForm(getEmptyCustomerForm());
    setCustPayments([]);
    setCustPayErr({});
    setDeletedCustPayments([]);
    setCustPayForm(getEmptyPaymentForm());
    setUstaAtamalari([]);
  }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return; // double-click guard
    
    // Form validation
    if (!form.adSoyad.trim()) {
      alert('Ad Soyad alanı gereklidir');
      return;
    }
    // TC Kimlik 11 hane kontrolü (sadece rakamlar)
    {
      const digitsTc = String(form.tcKimlik || '').replace(/\D/g, '');
      if (digitsTc.length !== 11) {
        alert('TC Kimlik 11 haneli olmalıdır');
        return;
      }
    }
    
    if (!form.odemeTaahhutTarihi) {
      alert('Ödeme Taahhüt Tarihi alanı gereklidir');
      return;
    }
    // En az bir iş eklenmiş olmalı (ana iş veya tablo satırı)
    {
      const hasPrimaryJob = !!(form.yapilanIs && String(form.yapilanIs).trim());
      const hasTableJob = Array.isArray(soldDevices) && soldDevices.length > 0;
      
      if (!hasPrimaryJob && !hasTableJob) {
        alert('En az bir iş eklenmelidir (İş Detayı seçin veya İş Ekle ile satır ekleyin).');
        return;
      }
    }
    
    // Set flag to prevent duplicate notifications
    if (!editMusteri) {
      setIsCreatingCustomer(true);
    }

    // Sözleşme tutarı toplam ödemelerden küçük olamaz
    const soz = parseFloat(String(form.sozlesmeTutari||'').replace(/\./g,'').replace(/,/g,'.')) || 0;
    const toplamOdenenDialog = (custPayments || []).reduce((t,p)=>t+parseFloat(String(p.tutar||'').replace(/\./g,'').replace(/,/g,'.'))||0,0);
    if (soz < toplamOdenenDialog) {
      console.log('❌ Alert: Sözleşme tutarı küçük');
      alert('Sözleşme tutarı eklediğiniz ödemelerin toplamından küçük olamaz');
      return;
    }

    try {
      setIsSaving(true);
      // Seçilen yeni cihazın stok id'si
      const selectedStok = findStokByDevice(form.yapilanIs, form.satilanCihaz);
      // Düzenleme sırasında eski cihazın stok id'si (iade +1 için)
      const oldStok = editMusteri ? findStokByDevice(editMusteri.yapilanIs, editMusteri.satilanCihaz) : null;
      const composedAddress = composeAddress(form);
      const customerData = {
        adSoyad: (form.adSoyad || '').trim(),
        tcKimlik: form.tcKimlik,
        telefon: form.telefon,
        adres: composedAddress || form.adres,
        sozlesmeTutari: parseMoney(form.sozlesmeTutari),
        sozlesmeTarihi: form.sozlesmeTarihi || null,
        odemeTaahhutTarihi: form.odemeTaahhutTarihi || null,
        randevuTarihi: form.randevuTarihi || null,
        ustaIsmi: form.ustaIsmi,
        // Ana iş/cihaz alanlarını DB'ye yazalım (özellikle kolon/dönüşüm-kolon için)
        yapilanIs: form.yapilanIs,
        boruTipi: form.boruTipi,
        satilanCihaz: form.satilanCihaz,
        satilanStokId: selectedStok?.id,
        oldSatilanStokId: oldStok?.id,
        termostat: form.termostat,
        toptanciIsmi: form.toptanciIsmi,
        hesapYapildi: form.hesapYapildi,
        // Çoklu satılan cihazlar
        soldDevices: (soldDevices || [])
          .map(row => {
            const jobName = (row.yapilanIs || '').trim().toLowerCase();
            const isKolon = jobName === 'kolon' 
              || jobName === 'dönüşüm' || jobName === 'donusum'
              || jobName === 'dönüşüm kolon' || jobName === 'donusum kolon'
              || jobName === 'dönüşüm-kolon' || jobName === 'donusum-kolon'
              || jobName === 'full'
              || jobName === 'z-diğer' || jobName === 'z-diger' 
              || jobName === 'gaz tesisatı' || jobName === 'gaz-tesisatı' || jobName === 'gaz tesisati' || jobName === 'gaz-tesisati'
              || jobName === 'kolon-gaz' || jobName === 'kolon gaz';
            let stok = null;
            
            if (isKolon) {
              // Kolon/dönüşüm-kolon/full satırını DB'ye text alanlarıyla yazalım, stokId kullanmayalım
              const qty = parseInt(row.quantity, 10);
              if (!qty || qty <= 0) {
                return null;
              }
              
              return {
                stokId: 0, // backend bu değeri kolon satırı olarak yorumlamayacak, sadece text alanlarını saklayacak
                quantity: qty,
                daireBilgisi: row.note || '',
                yapilanIs: row.yapilanIs || 'kolon',
                satilanCihaz: row.deviceName || 'Kolon',
                boruTipi: row.boruTipi || '',
                termostat: row.termostat || ''
              };
            } else {
              stok = findStokByName(row.deviceName);
              if (!stok) return null;
            }
            
            return {
              stokId: stok.id,
              quantity: parseInt(row.quantity, 10),
              daireBilgisi: row.note || '',
              yapilanIs: row.yapilanIs || '',
              satilanCihaz: row.deviceName || '',
              boruTipi: row.boruTipi || '',
              termostat: row.termostat || ''
            };
          })
          .filter(Boolean)
      };

      let result;
      if (editMusteri) {
        // Update existing customer
        result = await apiUpdateCustomer(editMusteri.id, customerData);
      } else {
        // Create new customer
        result = await apiCreateCustomer(customerData);
      }

      if (result.success) {

        
        // Müşteri oluşturma/güncelleme başarılı
        if (!editMusteri) {
          // Yeni müşteri oluşturuldu

          // ... existing code ...
        }

        // Frontend tarafında çoklu iş/cihaz satırlarını müşteriye iliştir (yeniden açınca tabloda kalsın)
        try {
          if (editMusteri) {
            setMusteriler(prev => prev.map(c => c.id === editMusteri.id ? { ...c, soldDevices: [...(soldDevices || [])] } : c));
          } else if (result?.data?.id) {
            setMusteriler(prev => {
              const exists = prev.some(c => c.id === result.data.id);
              if (exists) return prev.map(c => c.id === result.data.id ? { ...c, soldDevices: [...(soldDevices || [])] } : c);
              return [{ ...(result.data || {}), soldDevices: [...(soldDevices || [])] }, ...prev];
            });
          }
        } catch {}

        // HesapYapildi değiştiyse bildirim göster
        if (editMusteri && form.hesapYapildi !== editMusteri.hesapYapildi) {
          const status = form.hesapYapildi ? 'görüldü' : 'görülmedi';
          addNotification({
            id: Date.now(),
            message: `${form.adSoyad} müşterisinin hesap durumu "${status}" olarak işaretlendi. Admin'lere email bildirimi gönderildi.`,
            type: 'success',
            duration: 5000
          });
        }

        // Müşteri veritabanına kaydedildikten sonra kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 100));

        // Handle customer payments if any
        if (editMusteri) {
          const customerId = editMusteri.id;
          
          // Önce silinen ödemeleri API'den sil
          for (const deletedPayment of deletedCustPayments) {
            if (deletedPayment.id) {
              await apiDeletePayment(deletedPayment.id);
            }
          }
          
          // Sonra mevcut ödemeleri güncelle/ekle
          for (const payment of custPayments) {
            const isTemp = payment._isTemp || !payment.id;
            if (!isTemp && payment.id) {
              // Mevcut ödeme - güncelle
              const paymentData = {
                id: payment.id,
                customerId: customerId,
                tutar: parseFloat(String(payment.tutar || '').replace(/\./g,'').replace(/,/g,'.')),
                tarih: payment.tarih,
                tur: payment.tur,
                toptanci: payment.toptanci
              };
              await apiUpdatePayment(payment.id, paymentData);
            } else {
              // Yeni ödeme - ekle
              const paymentData = {
                customerId: customerId,
                tutar: parseFloat(String(payment.tutar || '').replace(/\./g,'').replace(/,/g,'.')),
                tarih: payment.tarih,
                tur: payment.tur,
                toptanci: payment.toptanci
              };
              await apiCreatePayment(paymentData);
            }
          }
        } else {
          // Yeni müşteri için ödemeleri ekle
          const customerId = result.data.id;
          
          for (const payment of custPayments) {
            const paymentData = {
              customerId: customerId,
              tutar: parseFloat(String(payment.tutar || '').replace(/\./g,'').replace(/,/g,'.')),
              tarih: payment.tarih,
              tur: payment.tur,
              toptanci: payment.toptanci
            };
            
            await apiCreatePayment(paymentData);
          }
        }

        // Stok işlemleri
       // if (false) { // stok/sipariş işlemleri backend'e taşındı
          // if (!editMusteri) {
          //   // Yeni müşteri eklerken stok kontrolü yap
          //   const bulunanStok = findStokByDevice(form.yapilanIs, form.satilanCihaz);
          //   
          //   if (bulunanStok) {
          //     try {
          //       // Stok miktarını kontrol et
          //       if (bulunanStok.miktar > 0) {
          //         // Stok varsa doğrudan stok hareketi oluştur
          //         const stokHareketiResult = await apiCreateStokHareketi({
          //           stokId: bulunanStok.id,
          //           customerId: result.data.id, // musteriId yerine customerId kullan
          //           hareketTipi: 'Çıkış',
          //           miktar: 1,
          //           aciklama: `${form.adSoyad} müşterisine ${form.satilanCihaz} satışı`,
          //           kullaniciAdi: user?.username || 'Sistem'
          //         });
          //         
          //         if (stokHareketiResult.success) {
          //           // Stokları ve stok hareketlerini yeniden yükle
          //           await Promise.all([
          //             loadStoklar(),
          //             loadStokHareketleri()
          //           ]);
          //           
          //           const yeniStokMiktari = bulunanStok.miktar - 1;
          //           addNotification({
          //             id: Date.now(),
          //             message: `${form.satilanCihaz} stoktan düşürüldü. Kalan stok: ${yeniStokMiktari}`,
          //             type: 'success',
          //             duration: 4000
          //           });
          //         } else {
          //           console.error('Stok hareketi oluşturulamadı:', stokHareketiResult.error);
          //           addNotification({
          //             id: Date.now(),
          //             message: 'Müşteri kaydedildi ancak stok düşürülemedi. Lütfen stok sayfasından manuel olarak düşürün.',
          //             type: 'warning',
          //             duration: 6000
          //           });
          //         }
          //       } else {
          //         // Stok yoksa sipariş oluştur
          //         console.log('Yeni müşteri için sipariş oluşturuluyor:', {
          //           customerId: result.data.id,
          //           stokId: bulunanStok.id,
          //           customerData: result.data
          //         });
          //         
          //         // Customer ID'yi kontrol et
          //         if (!result.data.id) {
          //           console.error('Customer ID bulunamadı:', result.data);
          //           addNotification({
          //             id: Date.now(),
          //             message: 'Müşteri ID bulunamadı, sipariş oluşturulamadı.',
          //             type: 'error',
          //             duration: 6000
          //           });
          //           return;
          //         }
          //         
          //         const orderResult = await apiCreateOrder({
          //           customerId: result.data.id,
          //           stokId: bulunanStok.id,
          //           miktar: 1,
          //           notlar: `${form.adSoyad} müşterisi için oluşturulan sipariş - Stok yetersiz`,
          //           olusturanKullanici: user?.username || 'Sistem'
          //         });
          //         
          //         if (orderResult.success) {
          //           // Siparişleri ve stok hareketlerini yeniden yükle
          //           await Promise.all([
          //             loadOrders(),
          //             loadStokHareketleri()
          //           ]);
          //           
          //           addNotification({
          //             id: Date.now(),
          //             message: `${form.satilanCihaz} için sipariş oluşturuldu. Stok yetersiz olduğu için bekleyen sipariş olarak işaretlendi.`,
          //             type: 'info',
          //             duration: 6000
          //           });
          //         } else {
          //           console.error('Sipariş oluşturulamadı:', orderResult.error);
          //           addNotification({
          //             id: Date.now(),
          //             message: 'Müşteri kaydedildi ancak sipariş oluşturulamadı. Lütfen manuel olarak kontrol edin.',
          //             type: 'warning',
          //             duration: 6000
          //           });
          //         }
          //       }
          //     } catch (error) {
          //       console.error('Stok işlemi hatası:', error);
          //       addNotification({
          //         id: Date.now(),
          //         message: 'Müşteri kaydedildi ancak stok işlemi yapılamadı. Lütfen manuel olarak kontrol edin.',
          //         type: 'warning',
          //         duration: 6000
          //       });
          //     }
          //   } else {
          //     addNotification({
          //       id: Date.now(),
          //       message: `${form.satilanCihaz} stokta bulunamadı. Lütfen stok sayfasından kontrol edin.`,
          //       type: 'warning',
          //       duration: 5000
          //     });
          //   }
          // } else {
          //   // Müşteri güncellerken stok ayarlaması yap
          //   console.log('Müşteri güncelleme sonucu:', result.data);
          //   
          //   const eskiYapilanIs = editMusteri.yapilanIs;
          //   const eskiSatilanCihaz = editMusteri.satilanCihaz;
          //   const yeniYapilanIs = form.yapilanIs;
          //   const yeniSatilanCihaz = form.satilanCihaz;
          //   
          //   // Eski ve yeni cihaz farklı mı kontrol et
          //   if (eskiSatilanCihaz !== yeniSatilanCihaz || eskiYapilanIs !== yeniYapilanIs) {
          //     try {
          //       // Tüm eski siparişleri sil (tabloda görünmesin)
          //       const eskiSiparisler = orders ? orders.filter(order => order.customerId === result.data.id) : [];
          //       console.log('Silinecek eski siparişler:', eskiSiparisler);
          //       for (const eskiSiparis of eskiSiparisler) {
          //         try {
          //           const silResult = await apiDeleteOrder(eskiSiparis.id);
          //           if (!silResult.success) {
          //             console.error(`Sipariş ${eskiSiparis.id} silinemedi:`, silResult.error);
          //           }
          //         } catch (error) {
          //           console.error(`Sipariş ${eskiSiparis.id} silinirken hata:`, error);
          //         }
          //       }
          //       await loadOrders();
          //       
          //   // Stok işlemleri backend'de UpdateCustomer ile yapılır (negatif stoğa izin ver)
          //   // Sadece verileri tazele
          //   await Promise.all([
          //     loadStoklar(),
          //     loadStokHareketleri()
          //   ]);
          //       
          //     } catch (error) {
          //       console.error('Stok güncelleme hatası:', error);
          //       addNotification({
          //         id: Date.now(),
          //         message: 'Müşteri güncellendi ancak stok ayarlaması yapılamadı. Lütfen stok sayfasından manuel olarak kontrol edin.',
          //         type: 'warning',
          //         duration: 6000
          //       });
          //     }
          //   }
          // }
        //}
        
        // Usta atamalarını kaydet
        try {
          const customerIdForAssign = editMusteri ? editMusteri.id : result.data.id;
          await apiUpsertCustomerAssignments(customerIdForAssign, ustaAtamalari);
          // Optimistic: liste state'ine anında yaz
          setMusteriler(prev => prev.map(c => c.id === customerIdForAssign ? { ...c, ustaAtamalari: (ustaAtamalari || []) } : c));
        } catch {}
        
        // Dosya yükleme işlemi
        if (form.sozlesmeDosyasi) {
          try {
            const customerId = editMusteri ? editMusteri.id : result.data.id;
            const uploadResult = await apiUploadSozlesme(customerId, form.sozlesmeDosyasi);
            
            if (!uploadResult.success) {
              addNotification({
                id: Date.now(),
                message: 'Müşteri kaydedildi ancak dosya yüklenirken hata oluştu: ' + (uploadResult.message || uploadResult.error || 'Bilinmeyen hata'),
                type: 'warning',
                duration: 7000
              });
            } else {
              // İyimser güncelleme: müşteride dosya bilgilerini hemen güncelle
              setMusteriler(prev => prev.map(c => c.id === customerId
                ? { 
                    ...c, 
                    sozlesmeDosyaAdi: uploadResult.fileName,
                    sozlesmeDosyaBoyutu: uploadResult.fileSize,
                    sozlesmeDosyaTipi: uploadResult.fileType
                  }
                : c
              ));
              // Formdaki dosya seçimini sıfırla
              setForm(f => ({ ...f, sozlesmeDosyasi: null }));
              // Sunucudan tazele (en geç SignalR gelmeden state senkron olsun)
              try { await loadData(); } catch {}
              addNotification({
                id: Date.now(),
                message: '✅ Müşteri ve sözleşme dosyası başarıyla kaydedildi',
                type: 'success',
                duration: 3000
              });
            }
          } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Bilinmeyen hata';
            addNotification({
              id: Date.now(),
              message: 'Müşteri kaydedildi ancak dosya yüklenirken hata oluştu: ' + errorMessage,
              type: 'warning',
              duration: 7000
            });
          }
        }
        
        // Soft update - local state'i güncelle
        if (editMusteri) {
          // Mevcut müşteriyi güncelle
          setMusteriler(prev => prev.map(m => 
            m.id === editMusteri.id 
              ? { 
                  ...m, 
                  ...customerData,
                  odemeler: custPayments
                }
              : m
          ));
        } else {
          // Yeni müşteri ekle - gerçek zamanlı olay dinleyicisi zaten ekleyecek
          // Burada eklemeye gerek yok, çünkü CustomerCreated olayı gelecek
        }
        
        handleClose();
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'İşlem başarısız');
        alert(errorMessage);
      }
    } catch (err) {
      // Sunucudan dönen hata mesajını ayrıntılı göster
      const serverData = err?.response?.data;
      let msg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      if (serverData) {
        if (typeof serverData === 'string') {
          msg = serverData;
        } else if (serverData.errors) {
          // ModelState hatalarını birleştir
          try {
            const allErrors = Object.values(serverData.errors).flat().join('\n');
            if (allErrors) msg = allErrors;
          } catch {}
        } else if (serverData.error || serverData.message || serverData.details) {
          msg = [serverData.error, serverData.message, serverData.details].filter(Boolean).join(' - ');
        }
      } else if (err?.message) {
        msg = err.message;
      }
      console.error('Müşteri oluşturma/güncelleme hatası:', err?.response?.data || err);
      alert(msg);
    } finally {
      setIsSaving(false);
      // Reset flag
      setIsCreatingCustomer(false);
    }
  };

  // Payment Management Functions
  const handleCustPayChange = (e) => {
    const { name, value } = e.target;
    setCustPayForm(handlePaymentFormChange(custPayForm, name, value || ''));
  };

  const addCustPayment = () => {
    const requireTop = custPayForm.tur === 'Kredi Kartı';
    const errs = validatePaymentForm(custPayForm, requireTop);
    setCustPayErr(errs);
    if (Object.keys(errs).length) return;

    const yeniTutar = parseFloat(String(custPayForm.tutar || '').replace(/\./g,'').replace(/,/g,'.'));
    const mevcutToplam = (custPayments || []).reduce((t,p)=>t+parseFloat(p.tutar||0),0);
    const soz = parseFloat(String(form.sozlesmeTutari||'').replace(/\./g,'').replace(/,/g,'.'))||0;
    
    if (!validatePaymentAmount(yeniTutar, mevcutToplam, soz)) {
      alert('Ödenen tutar kalan ödemeden fazla olmamalıdır');
      return;
    }
    
    const yeni = { ...createPayment(custPayForm, requireTop), id: undefined, _isTemp: true };
    setCustPayments(prev => addItemToList(prev, yeni));
    setCustPayForm(getEmptyPaymentForm());
  };

  const deleteCustPayment = (id) => {
    const silinecekOdeme = custPayments.find(o => o.id === id);
    if (silinecekOdeme) {
      setDeletedCustPayments(prev => addToDeletedList(prev, silinecekOdeme));
    }
    setCustPayments(prev => removeItemById(prev, id));
  };

  const handleUndoCustDelete = (deletedPayment) => {
    const soz = parseFloat(form.sozlesmeTutari) || 0;
    const mevcutToplam = (custPayments || []).reduce((t,p)=>t+parseFloat(String(p.tutar||'').replace(/\./g,'').replace(/,/g,'.'))||0,0);
    if (!validatePaymentAmount(parseFloat(deletedPayment.tutar), mevcutToplam, soz)) {
      alert('Geri alınan ödeme kalan ödemeden fazla olmamalıdır');
      return;
    }

    const odeme = restoreDeletedItem(deletedPayment);
    setCustPayments(prev => addItemToList(prev, odeme));
    setDeletedCustPayments(prev => removeFromDeletedList(prev, deletedPayment.deletedAt));
  };

  // Payment Details Functions
  const handleOdemeDetayOpen = React.useCallback((musteri) => {
    setSelectedMusteri(musteri);
    setDeletedPayments([]);
    setOdemeDetayOpen(true);
  }, []);

  const handleOdemeDetayClose = React.useCallback(() => {
    setOdemeDetayOpen(false);
    setSelectedMusteri(null);
    setDeletedPayments([]);
  }, []);

  const handleOdemeEkleOpen = React.useCallback((musteri) => {
    setSelectedMusteri(musteri);
    setOdemeForm(getEmptyPaymentForm());
    setOdemeEkleOpen(true);
  }, []);

  const handleOdemeEkleClose = React.useCallback(() => {
    setOdemeEkleOpen(false);
    setSelectedMusteri(null);
    setOdemeForm(getEmptyPaymentForm());
    setPayErr({});
  }, []);

  const handleOdemeChange = (e) => {
    const { name, value } = e.target;
    setOdemeForm(handlePaymentFormChange(odemeForm, name, value || ''));
  };

  const handleOdemeEkle = async (e) => {
    e.preventDefault();
    const needTop = odemeForm.tur === 'Kredi Kartı';
    const errs2 = validatePaymentForm(odemeForm, needTop);
    setPayErr(errs2);
    if (Object.keys(errs2).length) return;

    const yeniTutar = parseFloat(String(odemeForm.tutar || '').replace(/\./g,'').replace(/,/g,'.'));
    const musteri = selectedMusteri;
    const mevcutToplam = hesaplaTotalOdenen(musteri.odemeler || []);
    
    if (!validatePaymentAmount(yeniTutar, mevcutToplam, musteri.sozlesmeTutari)) {
      alert('Ödenen tutar kalan ödemeden fazla olmamalıdır');
      return;
    }

    try {
      // API'ye ödeme kaydet
      const paymentData = {
        customerId: selectedMusteri.id,
        tutar: parseFloat(String(odemeForm.tutar || '').replace(/\./g,'').replace(/,/g,'.')),
        tarih: odemeForm.tarih,
        tur: odemeForm.tur,
        toptanci: odemeForm.toptanci
      };
      
      const result = await apiCreatePayment(paymentData);
      
      if (result.success) {
        // Ödeme başarıyla eklendi - gerçek zamanlı olay dinleyicisi zaten güncelleyecek
        // Burada local state güncellemeye gerek yok, çünkü PaymentCreated olayı gelecek
        
        handleOdemeEkleClose();
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Ödeme eklenemedi');
        alert(errorMessage);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleOdemeSil = async (musteriId, odemeId) => {
    const musteri = musteriler.find(m => m.id === musteriId);
    const silinecekOdeme = (musteri?.odemeler || []).find(o => o.id === odemeId);
    
    // Çalışan ise silme talebi oluştur
    if (user.role === 'employee') {
      const reason = prompt('Silme talebi için gerekçe yazın:');
      if (!reason) {
        alert('Gerekçe yazmadan silme talebi oluşturamazsınız.');
        return;
      }
      
      await requestPaymentDelete(musteriId, silinecekOdeme, user.username, reason);
      return;
    }
    
    // Admin ise direkt sil
    if (silinecekOdeme) {
      setDeletedPayments(prev => addToDeletedList(prev, silinecekOdeme, { musteriId }));
    }

    try {
      // API'den ödeme sil
      const result = await apiDeletePayment(odemeId);
      
      if (result.success) {
        // Ödeme başarıyla silindi - local state'i güncelle
        setMusteriler(prev => prev.map(m =>
          m.id === musteriId
            ? { ...m, odemeler: (m.odemeler || []).filter(o => o.id !== odemeId) }
            : m
        ));
        
        // Seçili müşteriyi de güncelle
        setSelectedMusteri(prev => {
          if (!prev || prev.id !== musteriId) return prev;
          return { ...prev, odemeler: (prev.odemeler || []).filter(o => o.id !== odemeId) };
        });
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Ödeme silinemedi');
        alert(errorMessage);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleUndoDelete = async (deletedPayment) => {
    const { musteriId } = deletedPayment;
    const odeme = restoreDeletedItem(deletedPayment);

    // Sözleşme aşımı kontrolü
    const musteri = musteriler.find(m => m.id === musteriId);
    const mevcutToplam = hesaplaTotalOdenen(musteri?.odemeler || []);
    if (!validatePaymentAmount(parseFloat(odeme.tutar), mevcutToplam, musteri?.sozlesmeTutari)) {
      alert('Geri alınan ödeme kalan ödemeden fazla olmamalıdır');
      return;
    }

    try {
      // API'ye ödeme geri ekle
      const paymentData = {
        customerId: musteriId,
        tutar: parseFloat(odeme.tutar),
        tarih: odeme.tarih,
        tur: odeme.tur,
        toptanci: odeme.toptanci
      };
      
      const result = await apiCreatePayment(paymentData);
      
      if (result.success) {
        // Local state'i hemen güncelle
        const restoredOdeme = {
          id: result.data.id,
          tutar: odeme.tutar,
          tarih: odeme.tarih,
          tur: odeme.tur,
          toptanci: odeme.toptanci,
          createdByUsername: user?.username || 'Bilinmiyor'
        };

        // Müşteri listesini güncelle
        setMusteriler(prev => prev.map(m => {
          if (m.id === musteriId) {
            // Aynı ödeme ID'si var mı kontrol et
            const existingPayment = m.odemeler?.find(p => p.id === restoredOdeme.id);
            if (existingPayment) {
              return m; // Zaten varsa güncelleme
            }
            return { ...m, odemeler: [...(m.odemeler || []), restoredOdeme] };
          }
          return m;
        }));

        // Seçili müşteriyi de güncelle
        setSelectedMusteri(prev => {
          if (!prev || prev.id !== musteriId) return prev;
          
          // Aynı ödeme ID'si var mı kontrol et
          const existingPayment = prev.odemeler?.find(p => p.id === restoredOdeme.id);
          if (existingPayment) {
            return prev; // Zaten varsa güncelleme
          }
          
          return { ...prev, odemeler: [...(prev.odemeler || []), restoredOdeme] };
        });

        // Silinen ödemeler listesinden kaldır
        setDeletedPayments(prev => removeFromDeletedList(prev, deletedPayment.deletedAt));
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Ödeme geri alınamadı');
        alert(errorMessage);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Bildirim fonksiyonları
  const addNotification = (notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now(), createdAt: Date.now() }]);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Çalışan isteğiyle ödeme silme talebi oluştur
  const requestPaymentDelete = async (musteriId, odeme, requestedBy = 'employee', reason = '') => {
    try {
      // API'ye talep kaydet - kullanıcının yazdığı gerçek sebep metni gönder
      const result = await apiCreateDeleteRequest(musteriId, odeme.id, reason || `Ödeme silme talebi (Talep eden: ${requestedBy})`);
      

      
      if (result.success) {
        // API'den dönen veriyi frontend formatına çevir
        const mappedRequest = {
          id: result.data.id,
          customerId: result.data.customerId,
          paymentId: result.data.paymentId,
          customerName: result.data.customer?.adSoyad || 'Bilinmeyen Müşteri',
          paymentAmount: result.data.payment?.tutar || 0,
          paymentDate: result.data.payment?.tarih || '',
          paymentType: result.data.payment?.tur || '',
          requestedBy: result.data.requestedBy?.username || 'Bilinmeyen',
          requestedAt: result.data.requestedAt,
          reason: result.data.reason || '',
          status: result.data.status
        };
        
        // Local state'i güncelle - aynı talep varsa ekleme
        setPendingPaymentDeletes(prev => {
          const existingRequest = prev.find(r => r.id === mappedRequest.id);
          if (existingRequest) {
            return prev; // Zaten varsa ekleme
          }
          return [...prev, mappedRequest];
        });

        // İsteyen kişi için bildirim ekle (geri alma bilgisi gibi)
        setNotifications(prev => [...prev, {
          type: 'payment_delete_request',
          title: 'Silme Talebi Oluşturuldu',
          message: `${odeme.tarih ? odeme.tarih.split('T')[0] : '-'} tarihli ${formatNumber(odeme.tutar)}₺ tutarındaki ödeme için silme talebiniz oluşturuldu. Admin onayı bekleniyor.`,
          musteriId,
          odemeId: odeme.id,
          requestedBy,
          isPersonal: true // Sadece isteyen kişi görsün
        }]);

        // Admin'lere bildirim gönder
        sendGlobalNotification(`Yeni ödeme silme talebi: ${odeme.tarih ? odeme.tarih.split('T')[0] : '-'} tarihli ${formatNumber(odeme.tutar)}₺ (Talep eden: ${requestedBy})`);
        
        // Başarı mesajı göster
        alert('Silme talebiniz oluşturuldu. Admin onayı bekleniyor.');
        
        // Force re-render için pending requests'i yeniden yükle
        setTimeout(async () => {
          try {
            const requestsResult = await apiGetMyRequests();
            if (requestsResult.success) {
              const mappedRequests = requestsResult.data.map(request => ({
                id: request.id,
                customerId: request.customerId,
                paymentId: request.paymentId,
                customerName: request.customer?.adSoyad || 'Bilinmeyen Müşteri',
                paymentAmount: request.payment?.tutar || 0,
                paymentDate: request.payment?.tarih || '',
                paymentType: request.payment?.tur || '',
                requestedBy: request.requestedBy?.username || 'Bilinmeyen',
                requestedAt: request.requestedAt,
                reason: request.reason || '',
                status: request.status
              }));
              setPendingPaymentDeletes(mappedRequests);
            }
          } catch (error) {

          }
        }, 500);
      } else {

        alert('Talep oluşturulamadı: ' + (result.error || 'Bilinmeyen hata'));
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const approvePaymentDelete = async (requestId) => {
    try {
      // Önce talebi bul
      const request = pendingPaymentDeletes.find(r => r.id === requestId);
      if (!request) {
        alert('Talep bulunamadı');
        return;
      }

      // API'den talebi onayla
      const result = await apiApproveRequest(requestId);
      
      if (result.success) {
        // Real-time event listener zaten state'i güncelleyecek
        // Burada ekstra işlem yapmaya gerek yok
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Talep onaylanamadı');
        alert(errorMessage);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const rejectPaymentDelete = async (requestId) => {
    try {
      // API'den talebi reddet
      const result = await apiRejectRequest(requestId, 'Admin tarafından reddedildi');
      
      if (result.success) {
        // Real-time event listener zaten state'i güncelleyecek
        // Burada ekstra işlem yapmaya gerek yok
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Talep reddedilemedi');
        alert(errorMessage);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Customer Delete Functions
  const handleDeleteClick = React.useCallback((musteri) => {
    setCustomerToDelete(musteri);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteCancel = React.useCallback(() => {
    setDeleteConfirmOpen(false);
    setCustomerToDelete(null);
  }, []);

  const handleDeleteConfirm = async () => {
    if (customerToDelete) {
      try {
        const result = await apiDeleteCustomer(customerToDelete.id);
        
        if (result.success) {
          // ✅ OPTIMISTIC UPDATE: HEMEN state'i güncelle (SignalR event'ini bekleme)
          // Müşteriyi local state'den HEMEN kaldır
          setMusteriler(prev => prev.filter(c => c.id !== customerToDelete.id));
          
          // Silinen müşteriyi deletedCustomers'a ekle
          const deletedCustomer = {
            ...customerToDelete,
            deletedAt: new Date().toISOString()
          };
          setDeletedCustomers(prev => [...prev, deletedCustomer]);
          
          // Başarı bildirimi
          addNotification({
            id: Date.now(),
            message: `${customerToDelete.adSoyad} başarıyla silindi`,
            type: 'success',
            duration: 3000
          });
          
          // Silinen müşteriler listesini arka planda güncelle (ihtiyaten)
          apiGetDeletedCustomers().then(deletedResult => {
            if (deletedResult.success) {
              setDeletedCustomers(deletedResult.data);
            }
          });
        } else {
          const errorMessage = typeof result.error === 'object' 
            ? (result.error.message || JSON.stringify(result.error))
            : (result.error || 'Müşteri silinemedi');
          alert(errorMessage);
        }
      } catch (err) {
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
    setDeleteConfirmOpen(false);
    setCustomerToDelete(null);
  };

  const handleUndoCustomerDelete = async (deletedCustomer) => {
    try {
      const result = await apiRestoreCustomer(deletedCustomer.id);
      
      if (result.success) {
        // API'den gelen customerId'yi kullan ve deletedCustomer verilerini kullan
        const restoredCustomer = {
          id: result.data.customerId,
          adSoyad: deletedCustomer.adSoyad,
          tcKimlik: deletedCustomer.tcKimlik,
          telefon: deletedCustomer.telefon,
          adres: deletedCustomer.adres,
          sozlesmeTutari: deletedCustomer.sozlesmeTutari,
          sozlesmeTarihi: deletedCustomer.sozlesmeTarihi,
          odemeTaahhutTarihi: deletedCustomer.odemeTaahhutTarihi,
          randevuTarihi: deletedCustomer.randevuTarihi,
          yapilanIs: deletedCustomer.yapilanIs,
          boruTipi: deletedCustomer.boruTipi,
          satilanCihaz: deletedCustomer.satilanCihaz,
          termostat: deletedCustomer.termostat,
          toptanciIsmi: deletedCustomer.toptanciIsmi,
          createdAt: deletedCustomer.createdAt,
          updatedAt: new Date().toISOString(),
          createdByUsername: deletedCustomer.createdByUsername || 'Bilinmiyor',
          odemeler: []
        };
        
        // Aynı ID'ye sahip müşteri var mı kontrol et
        setMusteriler(prev => {
          const existingCustomer = prev.find(m => m.id === restoredCustomer.id);
          if (existingCustomer) {
            // Zaten varsa ekleme, sadece silinen müşteriler listesinden kaldır
            return prev;
          }
          return [...prev, restoredCustomer];
        });
        
        // Silinen müşteriler listesinden kaldır
        setDeletedCustomers(prev => prev.filter(dc => dc.id !== deletedCustomer.id));
        
        alert('Müşteri başarıyla geri alındı');
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Müşteri geri alınamadı');
        alert('Müşteri geri alınamadı: ' + errorMessage);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleClearDeletedCustomers = (e) => {
    e.stopPropagation();
    setDeletedCustomers([]);
    setDeletedCustomersOpen(false);
  };

  // Kalıcı silme - API'den gerçekten sil
  const handlePermanentDelete = async (id) => {
    try {
      const result = await apiCleanupDeletedCustomer(id);
      
      if (result.success) {
        setDeletedCustomers(prev => {
          const updated = prev.filter(dc => dc.id !== id);
          // Eğer son müşteri de silindiyse dialog'u kapat
          if (updated.length === 0) {
            setTimeout(() => {
              setDeletedCustomersOpen(false);
            }, 100);
          }
          return updated;
        });
        alert(result.message);
      } else {
        // Eğer müşteri bulunamadıysa (404), silinen müşteriler listesini yenile
        if (result.error && (result.error.includes('404') || result.error.includes('bulunamadı'))) {
          alert('Müşteri zaten silinmiş. Liste yenileniyor...');
          // Silinen müşteriler listesini yenile
          const deletedResult = await apiGetDeletedCustomers();
          if (deletedResult.success) {
            setDeletedCustomers(deletedResult.data);
          }
        } else {
          alert(result.error);
        }
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Tek bir silinen müşteriyi temizle
  const handleCleanupDeletedCustomer = async (id) => {
    try {
      const result = await apiCleanupDeletedCustomer(id);
      if (result.success) {
        setDeletedCustomers(prev => prev.filter(dc => dc.id !== id));
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Tüm silinen müşterileri temizle
  const handleCleanupAllDeletedCustomers = async () => {
    if (!window.confirm('Tüm silinen müşterileri kalıcı olarak silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const result = await apiCleanupAllDeletedCustomers();
      if (result.success) {
        setDeletedCustomers([]);
        // Tüm müşteriler silindiğinde dialog'u kapat
        setTimeout(() => {
          setDeletedCustomersOpen(false);
        }, 100);
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value || '';
    if (name === 'tcKimlik') {
      v = v.replace(/\D/g, '').slice(0, 11); // only digits, max 11
    }
    // Telefon için formatlama ClientPage.jsx'de özel onChange ile yönetiliyor
    startFormTransition(() => {
      setForm(prev => ({ ...prev, [name]: v }));
    });
  };

  // Ödeme taahhüt tarihi güncelleme
  const updateTaahhutDate = async (musteriId, newDate) => {
    try {
      // Müşteriyi bul
      const musteri = musteriler.find(m => m.id === musteriId);
      if (!musteri) {
        alert('Müşteri bulunamadı');
        return;
      }

      // API'ye güncelleme gönder
      const customerData = {
        adSoyad: musteri.adSoyad,
        tcKimlik: musteri.tcKimlik,
        telefon: musteri.telefon,
        adres: musteri.adres,
        sozlesmeTutari: musteri.sozlesmeTutari,
        sozlesmeTarihi: musteri.sozlesmeTarihi,
        odemeTaahhutTarihi: newDate,
        randevuTarihi: musteri.randevuTarihi,
        ustaIsmi: musteri.ustaIsmi,
        yapilanIs: musteri.yapilanIs,
        boruTipi: musteri.boruTipi,
        satilanCihaz: musteri.satilanCihaz,
        termostat: musteri.termostat,
        toptanciIsmi: musteri.toptanciIsmi
      };

      const result = await apiUpdateCustomer(musteriId, customerData);
      
      if (result.success) {
        // Soft update - local state'i güncelle
        setMusteriler(prev => prev.map(m => m.id === musteriId ? { ...m, odemeTaahhutTarihi: newDate } : m));
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Taahhüt tarihi güncellenemedi');
        alert(errorMessage);
      }
    } catch (err) {

      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Toptancıları yenileme fonksiyonu
  const refreshSuppliers = async () => {
    try {
      const suppliersResult = await apiGetActiveSuppliers();
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data);
      }
    } catch (err) {

    }
  };

  return {
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
    suppliers, // Add suppliers state
    
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
    handleUndoDelete,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleUndoCustomerDelete,
    handleClearDeletedCustomers,
    handlePermanentDelete,
    requestPaymentDelete,
    approvePaymentDelete,
    rejectPaymentDelete,
    updateTaahhutDate,
    refreshSuppliers, // Add refreshSuppliers function
    loadData, // Add loadData function for refreshing data
    loadStoklar, // Stokları yükleme fonksiyonu
    loadOrders, // Siparişleri yükleme fonksiyonu
    findStokByDevice, // Stok bulma fonksiyonu
    checkAndUpdateCustomerColors, // Stok güncellendiğinde müşteri renklerini kontrol et
    loadCustomersByDateRange, // Tarih aralığına göre veri yükleme
    clearDateFilter, // Tarih filtresini temizleme
    addNotification,
    removeNotification,
    clearAllNotifications,
    handleCleanupDeletedCustomer,
    handleCleanupAllDeletedCustomers,
    // Order states
    orders,
    orderLoading,
    // Stok Hareketleri states
    stokHareketleri,
    stokHareketleriLoading,
    // Çoklu cihazlar
    soldDevices,
    setSoldDevices
  };
};