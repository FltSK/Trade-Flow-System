// Sayı formatlama fonksiyonu - binlik ayırıcılarla
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  return parseFloat(String(number).replace(/\./g, '').replace(/,/g, '.')).toLocaleString('tr-TR');
};

// Metin kısaltma fonksiyonu
export const truncateText = (text, maxLength = 30) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};



// Toplam ödenen tutarı hesaplama
export const hesaplaTotalOdenen = (odemeler) => {
  if (!odemeler || !Array.isArray(odemeler)) {
    return 0;
  }
  return odemeler.reduce((total, odeme) => total + parseFloat(odeme.tutar || 0), 0);
};

// Kalan ödeme hesaplama fonksiyonu - Sözleşme Tutarı - Toplam Ödenen
export const hesaplaKalanOdeme = (sozlesmeTutari, odemeler) => {
  const sozlesmeNum = parseFloat(sozlesmeTutari) || 0;
  const toplamOdenen = hesaplaTotalOdenen(odemeler);
  return sozlesmeNum - toplamOdenen;
};

// Ödeme türleri
export const odemeTurleri = ['Nakit', 'Kredi Kartı', 'Banka Havalesi', 'Çek', 'Senet'];

// Telefon formatı fonksiyonları
export const formatPhoneNumber = (value) => {
  if (!value) return '';
  
  // Sadece rakamları al
  const numbers = value.replace(/\D/g, '');
  
  // Maksimum 10 rakam - fazlasını kabul etme
  if (numbers.length > 10) {
    return value; // Mevcut değeri koru
  }
  
  // Format: 5XX-XXX-XXXX
  if (numbers.length >= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  } else if (numbers.length >= 4) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}`;
  } else if (numbers.length >= 1) {
    return numbers.slice(0, 3);
  }
  
  return numbers;
};

// Dosya boyutu formatı fonksiyonu
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') return false;
  const numbers = phone.replace(/\D/g, '');
  return numbers.length === 10;
};

// Genel silme ve geri alma yardımcı fonksiyonları
export const createDeletedItem = (item, additionalData = {}) => ({
  ...item,
  ...additionalData,
  deletedAt: Date.now()
});

export const addToDeletedList = (deletedList, item, additionalData = {}) => [
  ...deletedList,
  createDeletedItem(item, additionalData)
];

export const removeFromDeletedList = (deletedList, deletedAt) =>
  deletedList.filter(item => item.deletedAt !== deletedAt);

export const restoreDeletedItem = (deletedItem) => {
  const { deletedAt, ...restoredItem } = deletedItem;
  return restoredItem;
};

// Öğe silme (listeden çıkarma)
export const removeItemById = (list, id) =>
  list.filter(item => item.id !== id);

// Öğe ekleme (listeye geri koyma)
export const addItemToList = (list, item) => [...list, item];

// Form validation helpers
export const validatePaymentForm = (form, isCardPayment = false) => {
  const errors = {};
  if (!form.tutar) errors.tutar = 'Zorunlu';
  if (!form.tarih) errors.tarih = 'Zorunlu';
  if (!form.tur) errors.tur = 'Zorunlu';
  if (isCardPayment && !form.toptanci) errors.toptanci = 'Zorunlu';
  return errors;
};

// Payment amount validation
export const validatePaymentAmount = (newAmount, currentTotal, contractAmount) => {
  const newTotal = currentTotal + parseFloat(newAmount || 0);
  return newTotal <= parseFloat(contractAmount || 0);
};

// Form clearing helpers
export const getEmptyCustomerForm = () => {
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, timezone kayması olmaz
  
  return {
    adSoyad: '', 
    tcKimlik: '',
    telefon: '', 
    adres: '', 
    il: 'Uşak',
    ilce: 'Eşme',
    mahalle: '',
    cadde: '',
    sokak: '',
    binaNo: '',
    daireNo: '',
    adresEk: '',
    sozlesmeTutari: '',
    sozlesmeTarihi: '',
    odemeTaahhutTarihi: today, // Bugünün tarihi varsayılan değer
    randevuTarihi: '',
    ustaIsmi: '',
    toptanciIsmi: '',
    yapilanIs: '',
    boruTipi: '',
    satilanCihaz: '',
    termostat: '',
    hesapYapildi: false,
    sozlesmeDosyasi: null // Sözleşme dosyası alanı
  };
};

export const getEmptyPaymentForm = () => ({
  tutar: '',
  tarih: '',
  tur: '',
  toptanci: ''
});

// Search/filter helpers
// Türkçe karakterleri normalize et (ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c, İ→i)
export const normalizeTurkish = (text) => {
  if (!text) return '';
  return text
    .replace(/İ/g, 'i') // İ'yi ÖNCELİKLE değiştir (toLowerCase'den ÖNCE!)
    .replace(/I/g, 'ı') // Büyük I'yı ı'ya çevir (Türkçe'de I→ı olmalı)
    .toLocaleLowerCase('tr') // Türkçe locale ile küçük harfe çevir
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

export const filterCustomersBySearch = (customers, searchTerm) => {
  const term = (searchTerm || '').trim();
  if (!term) return customers;
  
  // Türkçe karakterleri normalize et
  const normalizedTerm = normalizeTurkish(term);
  const tokens = normalizedTerm.split(/\s+/).filter(Boolean);
  
  return customers.filter(customer => {
    // Müşteri adını da normalize et
    const nameOriginal = (customer.adSoyad || '').replace(/\s+/g, ' ').trim();
    const nameNormalized = normalizeTurkish(nameOriginal);
    
    const tc = String(customer.tcKimlik || '');
    
    // Normalize edilmiş adda ara
    const nameMatches = tokens.every(t => nameNormalized.includes(t));
    
    // TC'de direkt ara (normalize etmeye gerek yok)
    const tcMatches = tc.startsWith(searchTerm);
    
    return nameMatches || tcMatches;
  });
};

// Payment form change handler
export const handlePaymentFormChange = (currentForm, fieldName, fieldValue) => {
  const newForm = { ...currentForm, [fieldName]: fieldValue || '' };
  
  // Ödeme türü değiştiğinde ve kredi kartı değilse toptancı alanını temizle
  if (fieldName === 'tur' && fieldValue !== 'Kredi Kartı') {
    newForm.toptanci = '';
  }
  
  return newForm;
};

// Payment creation helper
export const createPayment = (paymentForm, isCardPayment) => ({
  id: Date.now(),
  tutar: parseFloat(paymentForm.tutar),
  tarih: paymentForm.tarih,
  tur: paymentForm.tur,
  toptanci: isCardPayment ? paymentForm.toptanci : ''
});

// Customer list update helpers
export const updateCustomerPayments = (customers, customerId, newPayments) =>
  customers.map(customer =>
    customer.id === customerId
      ? { ...customer, odemeler: newPayments }
      : customer
  );

export const addPaymentToCustomer = (customers, customerId, newPayment) =>
  customers.map(customer =>
    customer.id === customerId
      ? { ...customer, odemeler: [...customer.odemeler, newPayment] }
      : customer
  );

// LocalStorage helpers
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {

  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {

    return defaultValue;
  }
};

// Time-based cleanup helpers
export const filterByTimeLimit = (items, timeLimitMs) => {
  const now = Date.now();
  return items.filter(item => (now - item.deletedAt) < timeLimitMs);
};

export const isWithinTimeLimit = (timestamp, timeLimitMs) => {
  const now = Date.now();
  return (now - timestamp) < timeLimitMs;
};

// ===========================================
// API FUNCTIONS - TradeFlowSystemAPI Backend Integration
// ===========================================

import axios from 'axios';

// Retry utility function for API calls
const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;
      
      // CORS hatası veya network error'unda retry yap
      if (error.code === 'ERR_NETWORK' || 
          error.code === 'ERR_FAILED' ||
          (error.response?.status >= 500 && error.response?.status < 600) ||
          !error.response) {
        
        if (attempt < maxRetries) {
          console.warn(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
      }
      
      // Diğer hatalar için hemen fırlat
      throw error;
    }
  }
  
  throw lastError;
};

// API Base URL — production için VITE_API_URL ortam değişkeni kullanın (güvenlik)
const isLocalHost = typeof window !== 'undefined' && (/^localhost$/i.test(window.location.hostname) || window.location.hostname === '127.0.0.1');
const envApiUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
export const API_BASE_URL = envApiUrl || (isLocalHost ? 'http://localhost:5000/api' : '/api');

// Axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 saniye timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token'ı request header'ına ekle ve CORS-friendly headers ayarla
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // CORS için gerekli header'ları ekle
  config.headers['Accept'] = 'application/json';
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  
  return config;
});

// Response interceptor - 401 durumunda logout ve error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // CORS hatası logging
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      console.error('CORS Error detected:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
    }
    
    // 401 durumunda logout
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('loginTime');
      window.location.href = '/login';
    }
    
    // 503 Service Unavailable durumunda özel mesaj
    if (error.response?.status === 503) {
      console.warn('Service temporarily unavailable, will retry...');
    }
    
    return Promise.reject(error);
  }
);

// ===========================================
// AUTH API FUNCTIONS
// ===========================================

export const apiLogin = async (username, password) => {
  try {
    const response = await retryApiCall(async () => {
      return await apiClient.post('/auth/login', {
        username,
        password
      });
    });
    
    const { token, username: userName, role, expires, userId } = response.data;
    
    // Token'ı localStorage'a kaydet
    localStorage.setItem('authToken', token);
    
    return {
      success: true,
      data: { username: userName, role, token, expires, id: userId }
    };
  } catch (error) {
    console.error('Login API Error:', error);
    
    // CORS hatası özel mesajı
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      return {
        success: false,
        error: 'Sunucuya bağlanırken hata oluştu. CORS yapılandırması kontrol edilmeli.'
      };
    }
    
    return {
      success: false,
      error: error.response?.data || 'Giriş başarısız'
    };
  }
};

export const apiRegister = async (username, password, role = 'user') => {
  try {
    const response = await apiClient.post('/auth/register', {
      username,
      password,
      role
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Kayıt başarısız'
    };
  }
};

// Session API functions
export const apiCreateSession = async (token) => {
  try {
    const response = await apiClient.post('/session/create', { token });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Session oluşturulamadı' };
  }
};

export const apiLogout = async () => {
  try {
    await apiClient.post('/session/logout');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Çıkış yapılamadı' };
  }
};

export const apiGetUserSessions = async () => {
  try {
    const response = await apiClient.get('/session/user-sessions');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Session bilgileri alınamadı' };
  }
};

// DeleteRequest API functions
export const apiCreateDeleteRequest = async (customerId, paymentId, reason) => {
  try {
    const response = await apiClient.post('/deleterequest', {
      customerId,
      paymentId,
      reason
    });
    
    return { success: true, data: response.data };
  } catch (error) {

    return { success: false, error: error.response?.data || 'Silme isteği oluşturulamadı' };
  }
};

export const apiGetPendingRequests = async () => {
  try {
    const response = await apiClient.get('/deleterequest/pending');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Bekleyen istekler alınamadı' };
  }
};

export const apiGetMyRequests = async () => {
  try {
    const response = await apiClient.get('/deleterequest/my-requests');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'İsteklerim alınamadı' };
  }
};

export const apiApproveRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/deleterequest/${requestId}/approve`);
    return { success: true, data: response.data };
  } catch (error) {
    // console.error('API error details:', {
    //   statusText: error.response?.statusText,
    //   data: error.response?.data,
    //   message: error.message
    // });
    return { success: false, error: error.response?.data || 'İstek onaylanamadı' };
  }
};

export const apiRejectRequest = async (requestId, reason) => {
  try {
    const response = await apiClient.post(`/deleterequest/${requestId}/reject`, { reason });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'İstek reddedilemedi' };
  }
};

// ===========================================
// CUSTOMER API FUNCTIONS
// ===========================================

export const apiGetCustomers = async () => {
  try {
    const response = await apiClient.get('/customers');
    // Mapping: payments -> odemeler
    const mappedData = Array.isArray(response.data)
      ? response.data.map(musteri => ({
          ...musteri,
          odemeler: musteri.payments || [],
          soldDevices: Array.isArray(musteri.soldDevices && musteri.soldDevices.length?musteri.soldDevices:musteri.SoldDevices) ? (musteri.soldDevices&&musteri.soldDevices.length?musteri.soldDevices:musteri.SoldDevices).map(sd=>({
            yapilanIs: sd.yapilanIs || sd.YapilanIs || '',
            deviceName: sd.deviceName || sd.satilanCihaz || sd.SatilanCihaz || '',
            boruTipi: sd.boruTipi || sd.BoruTipi || '',
            termostat: sd.termostat || sd.Termostat || '',
            quantity: sd.quantity || sd.Quantity || 1,
            note: sd.note || sd.daireBilgisi || sd.DaireBilgisi || ''
          })) : [],
          // Özet alanlar (ilk satır)
          ...(function(){
            const rows = (musteri.soldDevices && musteri.soldDevices.length?musteri.soldDevices:musteri.SoldDevices)||[];
            if(!rows.length) return {};
            const p = rows[0];
            const device = p.deviceName || p.satilanCihaz || p.SatilanCihaz || '';
            return {
              yapilanIs: p.yapilanIs || p.YapilanIs || '',
              boruTipi: p.boruTipi || p.BoruTipi || '',
              satilanCihaz: device,
              termostat: p.termostat || p.Termostat || ''
            };
          })(),
        }))
      : [];
    return {
      success: true,
      data: mappedData
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Müşteriler yüklenemedi'
    };
  }
};

export const apiGetCustomersByDateRange = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/customers/date-range?${params.toString()}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Tarih aralığına göre müşteriler yüklenemedi'
    };
  }
};

// Stok Takip - Hangi müşteriye hangi ürün satıldı
export const apiGetStockTracking = async () => {
  try {
    const response = await apiClient.get('/customers/stock-tracking');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.title 
      || error.message 
      || 'Stok takip verileri yüklenemedi';
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const apiCreateCustomer = async (customerData) => {
  try {
    const response = await apiClient.post('/customers', customerData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Müşteri oluşturulamadı'
    };
  }
};

export const apiUpdateCustomer = async (id, customerData) => {
  try {
    const response = await apiClient.put(`/customers/${id}`, customerData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {

    return {
      success: false,
      error: error.response?.data || 'Müşteri güncellenemedi'
    };
  }
};

export const apiDeleteCustomer = async (id) => {
  try {
    await apiClient.delete(`/customers/${id}`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Müşteri silinemedi'
    };
  }
};

// Silinen müşterileri getir
export const apiGetDeletedCustomers = async () => {
  try {
    const response = await apiClient.get('/customers/deleted');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Silinen müşteriler getirilemedi'
    };
  }
};

// Müşteriyi geri al
export const apiRestoreCustomer = async (id) => {
  try {
    const response = await apiClient.post(`/customers/deleted/${id}/restore`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Müşteri geri alınamadı'
    };
  }
};

// Müşteriyi kalıcı olarak sil
export const apiPermanentlyDeleteCustomer = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers/deleted/${id}/permanent`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true, message: 'Müşteri kalıcı olarak silindi' };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Tek bir silinen müşteriyi temizle
export const apiCleanupDeletedCustomer = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers/deleted/${id}/cleanup`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true, message: 'Silinen müşteri temizlendi' };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Tüm silinen müşterileri temizle
export const apiCleanupAllDeletedCustomers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers/deleted/cleanup-all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      return { success: true, message: result.message };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===========================================
// PAYMENT API FUNCTIONS
// ===========================================

export const apiGetPayments = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.paymentType) params.append('tur', filters.paymentType); // Backend'de 'tur' parametresi
    if (filters.supplierName) params.append('toptanci', filters.supplierName); // Backend'de 'toptanci' parametresi
    
    const response = await apiClient.get(`/payments?${params.toString()}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Ödemeler yüklenemedi'
    };
  }
};

export const apiCreatePayment = async (paymentData) => {
  try {
    const response = await apiClient.post('/payments', paymentData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Ödeme oluşturulamadı'
    };
  }
};

export const apiUpdatePayment = async (id, paymentData) => {
  try {
    const response = await apiClient.put(`/payments/${id}`, paymentData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Ödeme güncellenemedi'
    };
  }
};

export const apiDeletePayment = async (id) => {
  try {
    await apiClient.delete(`/payments/${id}`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Ödeme silinemedi'
    };
  }
};

export const apiGetCustomerPaymentSummary = async (customerId) => {
  try {
    const response = await apiClient.get(`/payments/customer/${customerId}/summary`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Müşteri özeti yüklenemedi'
    };
  }
};

// ===========================================
// SUPPLIER API FUNCTIONS
// ===========================================

export const apiGetSuppliers = async () => {
  try {
    const response = await apiClient.get('/suppliers');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Toptancılar yüklenemedi'
    };
  }
};

export const apiGetActiveSuppliers = async () => {
  try {
    const response = await apiClient.get('/suppliers/active');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Aktif toptancılar yüklenemedi'
    };
  }
};

export const apiCreateSupplier = async (supplierData) => {
  try {
    const response = await apiClient.post('/suppliers', supplierData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Toptancı oluşturulamadı'
    };
  }
};

export const apiUpdateSupplier = async (id, supplierData) => {
  try {
    const response = await apiClient.put(`/suppliers/${id}`, supplierData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Toptancı güncellenemedi'
    };
  }
};

export const apiDeleteSupplier = async (id) => {
  try {
    await apiClient.delete(`/suppliers/${id}`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Toptancı silinemedi'
    };
  }
};

export const apiActivateSupplier = async (id) => {
  try {
    await apiClient.patch(`/suppliers/${id}/activate`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Toptancı aktif hale getirilemedi'
    };
  }
};

// Çalışan ekleme API fonksiyonu (Auth Controller)
export const apiCreateEmployeeAuth = async (employeeData) => {
  try {
    const response = await apiClient.post('/auth/create-employee', employeeData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};

// Şifre validasyon fonksiyonları
export const validatePassword = (password, username = '') => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Şifre en az 6 karakter olmalıdır');
  }
  
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push('Şifre kullanıcı adınızı içeremez');
  }
  
  return errors;
};

// Şifre değiştirme API fonksiyonu
export const apiChangePassword = async (passwordData) => {
  try {
    const response = await apiClient.post('/auth/change-password', passwordData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};

export const apiUpdateEmail = async (emailData) => {
  try {
    const response = await apiClient.post('/auth/update-email', emailData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}; 

// ===========================================
// ADMIN API FUNCTIONS
// ===========================================

export const apiGetUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Kullanıcılar yüklenemedi'
    };
  }
};

export const apiCreateAdmin = async (adminData) => {
  try {
    const response = await apiClient.post('/admin/create-admin', adminData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Admin oluşturulamadı'
    };
  }
};

export const apiCreateEmployee = async (employeeData) => {
  try {
    const response = await apiClient.post('/admin/create-employee', employeeData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Çalışan oluşturulamadı'
    };
  }
};

export const apiDeleteUser = async (userId) => {
  try {
    await apiClient.delete(`/admin/users/${userId}`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Kullanıcı silinemedi'
    };
  }
};

// Yetki kontrol fonksiyonları
export const canCreateAdmin = (userRole) => userRole === 'superadmin';
export const canCreateEmployee = (userRole) => userRole === 'superadmin' || userRole === 'admin';
export const canViewUsers = (userRole) => userRole === 'superadmin' || userRole === 'admin';
export const canDeleteUser = (userRole) => userRole === 'superadmin';

// Role display names
export const getRoleDisplayName = (role) => {
  switch (role) {
    case 'superadmin': return 'Süper Admin';
    case 'admin': return 'Yönetici';
    case 'employee': return 'Çalışan';
    default: return role;
  }
};

// ActivityLog API functions
export const apiGetActivityLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.action) params.append('action', filters.action);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/activitylog?${params.toString()}`);
    return response.data;
  } catch (error) {

    return { success: false, error: error.response?.data?.error || 'İşlem hareketleri yüklenemedi' };
  }
};

export const apiGetRecentActivityLogs = async (count = 50) => {
  try {
    const response = await apiClient.get(`/activitylog/recent?count=${count}`);
    return response.data;
  } catch (error) {

    return { success: false, error: error.response?.data?.error || 'Son işlemler yüklenemedi' };
  }
};

export const apiGetActivityUsers = async () => {
  try {
    const response = await apiClient.get('/activitylog/users');
    return response.data;
  } catch (error) {

    return { success: false, error: error.response?.data?.error || 'Kullanıcı listesi yüklenemedi' };
  }
};

export const apiGetActivityActions = async () => {
  try {
    const response = await apiClient.get('/activitylog/actions');
    return response.data;
  } catch (error) {

    return { success: false, error: error.response?.data?.error || 'İşlem türleri yüklenemedi' };
  }
};

export const clearLocalStorage = () => {
  try {
    localStorage.clear();
    return { success: true, message: 'LocalStorage başarıyla temizlendi' };
  } catch (error) {
    return { success: false, error: 'LocalStorage temizlenirken hata oluştu: ' + error.message };
  }
};

export const clearSpecificLocalStorage = (keys) => {
  try {
    if (Array.isArray(keys)) {
      keys.forEach(key => localStorage.removeItem(key));
    } else {
      localStorage.removeItem(keys);
    }
    return { success: true, message: 'Belirtilen LocalStorage öğeleri temizlendi' };
  } catch (error) {
    return { success: false, error: 'LocalStorage temizlenirken hata oluştu: ' + error.message };
  }
};

// ===========================================
// USTA API FUNCTIONS
// ===========================================

export const apiGetUstalar = async () => {
  try {
    const response = await apiClient.get('/usta');
    return response.data;
  } catch (error) {

    return [];
  }
};

export const apiGetActiveUstalar = async () => {
  try {
    const response = await apiClient.get('/usta/active');
    return response.data;
  } catch (error) {

    return [];
  }
};

export const apiCreateUsta = async (ustaData) => {
  try {
    const response = await apiClient.post('/usta', ustaData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Usta eklenirken hata oluştu' };
  }
};

export const apiUpdateUsta = async (id, ustaData) => {
  try {
    const response = await apiClient.put(`/usta/${id}`, ustaData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Usta güncellenirken hata oluştu' };
  }
};

export const apiDeleteUsta = async (id) => {
  try {
    const response = await apiClient.delete(`/usta/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Usta silinirken hata oluştu' };
  }
};

export const apiActivateUsta = async (id) => {
  try {
    const response = await apiClient.post(`/usta/${id}/activate`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Usta aktifleştirilirken hata oluştu' };
  }
};

export const apiDeleteUstaPermanent = async (id) => {
  try {
    const response = await apiClient.delete(`/usta/${id}/permanent`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Usta kalıcı olarak silinirken hata oluştu' };
  }
};

// ===========================================
// CUSTOMER FILTER API FUNCTIONS
// ===========================================

export const apiGetCustomerFilters = async () => {
  try {
    const response = await apiClient.get('/customers/filters');
    return response.data;
  } catch (error) {

    return { ekleyenler: [], ustalar: [] };
  }
};

export const apiGetFilteredCustomers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.ekleyen) params.append('ekleyen', filters.ekleyen);
    if (filters.usta) params.append('usta', filters.usta);
    
    const response = await apiClient.get(`/customers/filtered?${params.toString()}`);
    return response.data;
  } catch (error) {

    return { customers: [] };
  }
};

// ===========================================
// STOK API FUNCTIONS
// ===========================================

export const apiGetStoklar = async () => {
  try {
    const response = await apiClient.get('/stok');
    // Backend ApiResponse objesini döndürüyor, bu yüzden response.data.data kullanıyoruz
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Stoklar yüklenemedi'
    };
  }
};

export const apiGetActiveStoklar = async () => {
  try {
    const response = await apiClient.get('/stok?onlyActive=true');
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Aktif stoklar yüklenemedi'
    };
  }
};

export const apiDeactivateStok = async (id) => {
  try {
    const response = await apiClient.post(`/Stok/${id}/deactivate`);
    return { success: response.data.success, message: response.data.message };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Stok pasife alınamadı' };
  }
};

export const apiActivateStok = async (id) => {
  try {
    const response = await apiClient.post(`/Stok/${id}/activate`);
    return { success: response.data.success, message: response.data.message };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Stok aktife alınamadı' };
  }
};

export const apiCreateStok = async (stokData) => {
  try {
    const response = await apiClient.post('/stok', stokData);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Stok oluşturulamadı'
    };
  }
};

export const apiUpdateStok = async (id, stokData) => {
  try {
    const response = await apiClient.put(`/stok/${id}`, stokData);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Stok güncellenemedi'
    };
  }
};

export const apiDeleteStok = async (id) => {
  try {
    const response = await apiClient.delete(`/Stok/${id}`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Stok silinemedi'
    };
  }
};

export const apiRestoreStok = async (id) => {
  try {
    const response = await apiClient.post(`/Stok/${id}/restore`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Stok geri yüklenemedi'
    };
  }
};

export const apiGetStokHareketleri = async () => {
  try {
    const response = await apiClient.get('/stok/hareketler');
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Stok hareketleri yüklenemedi'
    };
  }
};

export const apiCreateStokHareketi = async (hareketData) => {
  try {
    const response = await apiClient.post('/stok/hareket', hareketData);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Stok hareketi oluşturulamadı'
    };
  }
};

// ===========================================
// PRODUCT MANAGEMENT API FUNCTIONS
// ===========================================

// Product Type API functions
export const apiGetProductTypes = async () => {
  try {
    const response = await apiClient.get('/ProductTypes');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Ürün türleri yüklenemedi'
    };
  }
};

// =====================
// JOBS (İş Tanımları)
// =====================
export const apiGetJobs = async () => {
  try {
    const response = await apiClient.get('/Jobs');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'İş tanımları yüklenemedi' };
  }
};

export const apiCreateJob = async (jobData) => {
  try {
    const response = await apiClient.post('/Jobs', jobData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'İş tanımı oluşturulamadı' };
  }
};

export const apiUpdateJob = async (id, jobData) => {
  try {
    await apiClient.put(`/Jobs/${id}`, jobData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || 'İş tanımı güncellenemedi' };
  }
};

export const apiDeleteJob = async (id) => {
  try {
    await apiClient.delete(`/Jobs/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || 'İş tanımı silinemedi' };
  }
};

export const apiGetJobProductTypes = async (jobId) => {
  try {
    const response = await apiClient.get(`/Jobs/${jobId}/ProductTypes`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'İş-ürün türü bağlantıları yüklenemedi' };
  }
};

export const apiAddProductTypeToJob = async (jobId, productTypeId) => {
  try {
    await apiClient.post(`/Jobs/${jobId}/ProductTypes`, productTypeId, {
      headers: { 'Content-Type': 'application/json' }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Ürün türü ilişkilendirilemedi' };
  }
};

export const apiRemoveProductTypeFromJob = async (jobId, productTypeId) => {
  try {
    await apiClient.delete(`/Jobs/${jobId}/ProductTypes/${productTypeId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Ürün türü bağlantısı kaldırılamadı' };
  }
};

export const apiCreateProductType = async (productTypeData) => {
  try {
    const response = await apiClient.post('/ProductTypes', productTypeData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Ürün türü oluşturulamadı'
    };
  }
};

export const apiUpdateProductType = async (id, productTypeData) => {
  try {
    await apiClient.put(`/ProductTypes/${id}`, productTypeData);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Ürün türü güncellenemedi'
    };
  }
};

export const apiDeleteProductType = async (id) => {
  try {
    await apiClient.delete(`/ProductTypes/${id}`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Ürün türü silinemedi'
    };
  }
};

// Brand API functions
export const apiGetBrands = async () => {
  try {
    const response = await apiClient.get('/Brands');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Markalar yüklenemedi'
    };
  }
};

export const apiGetBrandsByProductType = async (productTypeId) => {
  try {
    const response = await apiClient.get(`/Brands/ProductType/${productTypeId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Markalar yüklenemedi'
    };
  }
};

export const apiCreateBrand = async (brandData) => {
  try {
    const response = await apiClient.post('/Brands', brandData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Marka oluşturulamadı'
    };
  }
};

export const apiUpdateBrand = async (id, brandData) => {
  try {
    await apiClient.put(`/Brands/${id}`, brandData);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Marka güncellenemedi'
    };
  }
};

export const apiDeleteBrand = async (id) => {
  try {
    await apiClient.delete(`/Brands/${id}`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Marka silinemedi'
    };
  }
};

export const apiGetBrandProductTypes = async (brandId) => {
  try {
    const response = await apiClient.get(`/Brands/${brandId}/ProductTypes`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Marka ürün türleri yüklenemedi'
    };
  }
};

export const apiAddProductTypeToBrand = async (brandId, productTypeId) => {
  try {
    await apiClient.post(`/Brands/${brandId}/ProductTypes`, productTypeId);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Marka-ürün türü ilişkisi eklenemedi'
    };
  }
};

export const apiRemoveProductTypeFromBrand = async (brandId, productTypeId) => {
  try {
    await apiClient.delete(`/Brands/${brandId}/ProductTypes/${productTypeId}`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Marka-ürün türü ilişkisi silinemedi'
    };
  }
};

// Model API functions
export const apiGetModels = async () => {
  try {
    const response = await apiClient.get('/Models');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Modeller yüklenemedi'
    };
  }
};

export const apiGetModelsByBrand = async (brandId) => {
  try {
    const response = await apiClient.get(`/Models/Brand/${brandId}?onlyActive=true`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Marka modelleri yüklenemedi'
    };
  }
};

export const apiGetModelsByBrandAndProductType = async (brandId, productTypeId) => {
  try {
    const response = await apiClient.get(`/Models/Brand/${brandId}/ProductType/${productTypeId}?onlyActive=true`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Marka-ürün türü modelleri yüklenemedi'
    };
  }
};

// Sadece aktif modelleri çek (müşteri formu için)
export const apiGetActiveModels = async () => {
  try {
    const response = await apiClient.get('/Models?onlyActive=true');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Aktif modeller yüklenemedi' };
  }
};

// Ürün türüne göre aktif modelleri çek
export const apiGetModelsByProductType = async (productTypeId) => {
  try {
    const response = await apiClient.get(`/Models/ProductType/${productTypeId}?onlyActive=true`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Ürün türü modelleri yüklenemedi' };
  }
};

export const apiDeactivateModel = async (id) => {
  try {
    await apiClient.post(`/Models/${id}/deactivate`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Model pasife geçirilemedi' };
  }
};

export const apiActivateModel = async (id) => {
  try {
    await apiClient.post(`/Models/${id}/activate`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Model aktife alınamadı' };
  }
};

export const apiCreateModel = async (modelData) => {
  try {
    const response = await apiClient.post('/Models', modelData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Model oluşturulamadı'
    };
  }
};

export const apiUpdateModel = async (id, modelData) => {
  try {
    await apiClient.put(`/Models/${id}`, modelData);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Model güncellenemedi'
    };
  }
};

export const apiDeleteModel = async (id) => {
  try {
    await apiClient.delete(`/Models/${id}`);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Model silinemedi'
    };
  }
};

// Frontend-only inactive models list (LocalStorage) - optional fallback
export const getInactiveModels = () => {
  try {
    const stored = localStorage.getItem('inactiveModels');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const setInactiveModels = (ids) => {
  try {
    localStorage.setItem('inactiveModels', JSON.stringify(ids));
  } catch {}
};

// Order API functions
export const apiGetOrders = async () => {
  try {
    const response = await apiClient.get('/Order');
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Siparişler yüklenemedi'
    };
  }
};

export const apiGetOrderById = async (id) => {
  try {
    const response = await apiClient.get(`/Order/${id}`);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Sipariş yüklenemedi'
    };
  }
};

export const apiCreateOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/Order', orderData);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Sipariş oluşturulamadı'
    };
  }
};

export const apiUpdateOrder = async (id, orderData) => {
  try {
    const response = await apiClient.put(`/Order/${id}`, orderData);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Sipariş güncellenemedi'
    };
  }
};

export const apiDeleteOrder = async (id) => {
  try {
    const response = await apiClient.delete(`/Order/${id}`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Sipariş silinemedi'
    };
  }
};

// DukkanCarisi API functions
export const apiGetDukkanCarisi = async () => {
  try {
    const response = await apiClient.get('/DukkanCarisi');
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Dükkan carisi getirilemedi'
    };
  }
};

export const apiGetDukkanCarisiById = async (id) => {
  try {
    const response = await apiClient.get(`/DukkanCarisi/${id}`);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Dükkan carisi getirilemedi'
    };
  }
};

export const apiCreateDukkanCarisi = async (data) => {
  try {
    const response = await apiClient.post('/DukkanCarisi', data);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Dükkan carisi oluşturulamadı'
    };
  }
};

export const apiUpdateDukkanCarisi = async (id, data) => {
  try {
    const response = await apiClient.put(`/DukkanCarisi/${id}`, data);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Dükkan carisi güncellenemedi'
    };
  }
};

export const apiDeleteDukkanCarisi = async (id) => {
  try {
    const response = await apiClient.delete(`/DukkanCarisi/${id}`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Dükkan carisi silinemedi'
    };
  }
};

export const apiSearchDukkanCarisi = async (searchTerm, islemFilter, baslangicTarihi = null, bitisTarihi = null) => {
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('searchTerm', searchTerm);
    if (islemFilter) params.append('islemFilter', islemFilter);
    if (baslangicTarihi) {
      const start = new Date(baslangicTarihi);
      start.setHours(0, 0, 0, 0);
      params.append('baslangicTarihi', start.toISOString());
    }
    if (bitisTarihi) {
      const end = new Date(bitisTarihi);
      end.setHours(23, 59, 59, 999);
      params.append('bitisTarihi', end.toISOString());
    }
    
    const response = await apiClient.get(`/DukkanCarisi/search?${params.toString()}`);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Arama yapılamadı'
    };
  }
};

// Sözleşme dosyası API fonksiyonları
export const apiUploadSozlesme = async (customerId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/Customers/${customerId}/upload-sozlesme`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: response.data.success,
      message: response.data.message,
      fileName: response.data.fileName,
      fileSize: response.data.fileSize,
      fileType: response.data.fileType
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Dosya yüklenemedi'
    };
  }
};

export const apiDownloadSozlesme = async (customerId) => {
  try {
    const response = await apiClient.get(`/customers/${customerId}/download-sozlesme`, {
      responseType: 'blob'
    });
    
    // Content-Disposition'dan dosya adını almaya çalış
    const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
    let filename = '';
    if (disposition) {
      // filename*=UTF-8''... veya filename="..." formatlarını destekle
      const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
      const asciiMatch = /filename="?([^";]+)"?/i.exec(disposition);
      if (utf8Match && utf8Match[1]) {
        try {
          filename = decodeURIComponent(utf8Match[1]);
        } catch {
          filename = utf8Match[1];
        }
      } else if (asciiMatch && asciiMatch[1]) {
        filename = asciiMatch[1];
      }
    }

    // İçerik tipine göre uzantı belirle (fallback için)
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || 'application/octet-stream';
    const extMap = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    const fallbackExt = extMap[contentType] || 'bin';
    if (!filename) {
      filename = `sozlesme_${customerId}.${fallbackExt}`;
    }

    // Dosyayı indir
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Dosya indirilemedi'
    };
  }
};

// Sözleşme ön izleme (blob + yeni sekme)
export const apiPreviewSozlesme = async (customerId) => {
  try {
    const response = await apiClient.get(`/customers/${customerId}/download-sozlesme`, {
      params: { inline: true },
      responseType: 'blob'
    });
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // URL.revokeObjectURL'u hemen çağırmıyoruz; yeni sekme açıldıktan sonra kullanıcı kapatana kadar gerekebilir
    return { success: true, url };
  } catch (error) {
    // Blob tipinde error gelirse text'e çevir
    let errorMessage = 'Ön izleme açılamadı';
    if (error.response?.data instanceof Blob) {
      try {
        errorMessage = await error.response.data.text();
      } catch {
        errorMessage = 'Dosya açılırken hata oluştu';
      }
    } else {
      errorMessage = error.response?.data || error.message || errorMessage;
    }
    return { success: false, error: errorMessage };
  }
};

// Sözleşme blob URL'ini döndür (embed için)
export const apiGetSozlesmeBlobUrl = async (customerId) => {
  try {
    const response = await apiClient.get(`/customers/${customerId}/download-sozlesme`, {
      params: { inline: true },
      responseType: 'blob'
    });
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    return { success: true, url, contentType };
  } catch (error) {
    // Blob tipinde error gelirse text'e çevir
    let errorMessage = 'Ön izleme hazırlanamadı';
    if (error.response?.data instanceof Blob) {
      try {
        errorMessage = await error.response.data.text();
      } catch {
        errorMessage = 'Dosya yüklenirken hata oluştu';
      }
    } else {
      errorMessage = error.response?.data || error.message || errorMessage;
    }
    return { success: false, error: errorMessage };
  }
};

export const apiDeleteSozlesme = async (customerId) => {
  try {
    const response = await apiClient.delete(`/Customers/${customerId}/delete-sozlesme`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Dosya silinemedi'
    };
  }
};

// Usta atamaları API'leri
export const apiGetCustomerAssignments = async (customerId) => {
  try {
    const response = await apiClient.get(`/customers/${customerId}/ustalar`);
    return { success: true, data: response.data?.data || [] };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Atamalar alınamadı' };
  }
};

export const apiUpsertCustomerAssignments = async (customerId, assignments) => {
  try {
    const payload = (assignments || [])
      .filter(a => a && a.ustaId)
      .map(a => ({ ustaId: a.ustaId, note: a.note || '' }));
    await apiClient.put(`/customers/${customerId}/ustalar`, payload);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Atamalar kaydedilemedi' };
  }
};