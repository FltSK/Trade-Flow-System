import React, { createContext, useContext, useEffect, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from './AuthContext';

const RealTimeContext = createContext();

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

export const RealTimeProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const isLocalHost = typeof window !== 'undefined' && (/^localhost$/i.test(window.location.hostname) || window.location.hostname === '127.0.0.1');
    const envApiUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
    const hubUrl = envApiUrl
      ? envApiUrl.replace(/\/api\/?$/, '') + '/notificationHub'
      : isLocalHost
        ? 'http://localhost:5000/notificationHub'
        : '';

    if (!hubUrl) return;

    const newConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true, transport: 1 })
      .configureLogging(LogLevel.None)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [user]);

  useEffect(() => {
    if (!connection || !user) return;

    const startConnection = async () => {
      try {
        await connection.start();

        // Kullanıcı grubuna katıl
        await connection.invoke('JoinUserGroup', user.id || user.username);

        // Admin ise admin grubuna da katıl
        if (user.role === 'admin') {
          await connection.invoke('JoinAdminGroup');
        }

        // Event listener'ları kaldırdım çünkü bunlar useCustomers'ta dinleniyor
        // Bu şekilde çakışma olmayacak

        // Stok güncellemeleri için event listener'lar
        connection.on('ReceiveStokUpdated', (stokData) => {
          // localStorage'ı güncelle
          const currentStoklar = JSON.parse(localStorage.getItem('stoklar') || '[]');
          const updatedStoklar = currentStoklar.map(stok => 
            stok.id === stokData.id ? stokData : stok
          );
          localStorage.setItem('stoklar', JSON.stringify(updatedStoklar));
        });

        connection.on('ReceiveStokDeleted', (stokId, deletedStokData) => {
          // localStorage'dan silinen stoku çıkar
          const currentStoklar = JSON.parse(localStorage.getItem('stoklar') || '[]');
          const updatedStoklar = currentStoklar.filter(stok => stok.id !== stokId);
          localStorage.setItem('stoklar', JSON.stringify(updatedStoklar));
        });

        connection.on('ReceiveStokRestored', (stokId, restoredStokData) => {
          // localStorage'a geri yüklenen stoku ekle
          const currentStoklar = JSON.parse(localStorage.getItem('stoklar') || '[]');
          const existingIndex = currentStoklar.findIndex(stok => stok.id === stokId);
          
          if (existingIndex >= 0) {
            currentStoklar[existingIndex] = restoredStokData;
          } else {
            currentStoklar.push(restoredStokData);
          }
          
          localStorage.setItem('stoklar', JSON.stringify(currentStoklar));
        });

        connection.on('ReceiveStokHareketiAdded', (hareketData) => {
          // Stok hareketi eklendiğinde localStorage'ı güncelle
          // Bu durumda stok miktarı değişmiş olabilir
          const currentStoklar = JSON.parse(localStorage.getItem('stoklar') || '[]');
          const stokIndex = currentStoklar.findIndex(stok => stok.id === hareketData.stokId);
          
          if (stokIndex >= 0) {
            const stok = currentStoklar[stokIndex];
            if (hareketData.hareketTipi === 'Giriş') {
              stok.miktar += hareketData.miktar;
            } else if (hareketData.hareketTipi === 'Çıkış') {
              stok.miktar -= hareketData.miktar;
            }
            localStorage.setItem('stoklar', JSON.stringify(currentStoklar));
          }
        });

        // Sözleşme dosyası işlemleri için event listener'lar
        connection.on('ReceiveSozlesmeUploaded', (customerId, sozlesmeData) => {
          // localStorage'daki müşteri listesini güncelle
          const currentCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
          const customerIndex = currentCustomers.findIndex(customer => customer.id === customerId);
          
          if (customerIndex >= 0) {
            currentCustomers[customerIndex] = {
              ...currentCustomers[customerIndex],
              sozlesmeDosyaAdi: sozlesmeData.fileName,
              sozlesmeDosyaBoyutu: sozlesmeData.fileSize,
              sozlesmeDosyaTipi: sozlesmeData.fileType
            };
            localStorage.setItem('customers', JSON.stringify(currentCustomers));
          }
        });

        connection.on('ReceiveSozlesmeDeleted', (customerId) => {
          // localStorage'daki müşteri listesini güncelle
          const currentCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
          const customerIndex = currentCustomers.findIndex(customer => customer.id === customerId);
          
          if (customerIndex >= 0) {
            currentCustomers[customerIndex] = {
              ...currentCustomers[customerIndex],
              sozlesmeDosyaAdi: null,
              sozlesmeDosyaBoyutu: null,
              sozlesmeDosyaTipi: null
            };
            localStorage.setItem('customers', JSON.stringify(currentCustomers));
          }
        });

      } catch (err) {
        // Bağlantı hatası sessizce devam et
      }
    };

    startConnection();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [connection, user]);

  const sendDeleteRequest = async (userId, message) => {
    if (connection) {
      try {
        await connection.invoke('SendDeleteRequest', userId, message);
      } catch (err) {
        // Hata durumunda sessizce devam et
      }
    }
  };

  const sendNotification = async (userId, message) => {
    if (connection) {
      try {
        await connection.invoke('SendNotification', userId, message);
      } catch (err) {
        // Hata durumunda sessizce devam et
      }
    }
  };

  const sendGlobalNotification = async (message) => {
    if (connection) {
      try {
        await connection.invoke('SendGlobalNotification', message);
      } catch (err) {
        // Hata durumunda sessizce devam et
      }
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Bildirim sayısını hesapla
  const notificationCount = notifications.length;

  const value = {
    connection,
    notifications,
    pendingRequests,
    notificationCount,
    sendDeleteRequest,
    sendNotification,
    sendGlobalNotification,
    clearNotifications,
    removeNotification,
    setPendingRequests,
    setNotifications // setNotifications'ı da ekle
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
}; 