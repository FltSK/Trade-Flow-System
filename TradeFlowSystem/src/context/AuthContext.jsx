import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin } from '../utils/helpers';

const AuthContext = createContext();

// Oturum süresi (ms)
// Admin için 30 dakika hareketsizlik; çalışanlar için mevcut 2 saat
const SESSION_TIMEOUT_EMP = 2 * 60 * 60 * 1000; // 2 saat
const SESSION_TIMEOUT_ADMIN_IDLE = 30 * 60 * 1000; // 30 dk

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Oturum süresini kontrol et
  const checkSessionTimeout = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - parseInt(loginTime);
      const isAdmin = (user?.role === 'admin' || user?.role === 'superadmin');
      const limit = isAdmin ? SESSION_TIMEOUT_ADMIN_IDLE : SESSION_TIMEOUT_EMP;

      if (timeDifference > limit) {
        // Oturum süresi dolmuş, çıkış yap
        logout();
        return false;
      }
    }
    return true;
  };

  // Kullanıcı aktiflik zamanını güncelle
  const updateLastActivity = () => {
    if (user) {
      localStorage.setItem('loginTime', new Date().getTime().toString());
    }
  };

  // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini kontrol et
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Oturum süresini kontrol et
        if (checkSessionTimeout()) {
          setUser(parsedUser);
          // Aktiflik zamanını güncelle
          updateLastActivity();
        } else {
          logout();
        }
      } catch (error) {

        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
      }
    }
    setIsLoading(false);
  }, []);

  // Kullanıcı aktivitesini takip et (mouse, klavye, scroll)
  useEffect(() => {
    if (user) {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => {
        updateLastActivity();
      };

      // Event listener'ları ekle
      activityEvents.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      // Periyodik oturum kontrolü (her 5 dakikada bir)
      const sessionCheckInterval = setInterval(() => {
        if (!checkSessionTimeout()) {
          clearInterval(sessionCheckInterval);
        }
      }, 5 * 60 * 1000); // 5 dakika

      // Cleanup function
      return () => {
        activityEvents.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
        clearInterval(sessionCheckInterval);
      };
    }
  }, [user]);

  const login = async (username, password) => {
    try {
      const result = await apiLogin(username, password);
      
      if (result.success) {
        const { username: userName, role, token, expires } = result.data;
        
        const userData = { username: userName, role };
        const currentTime = new Date().getTime().toString();
        
        setUser(userData);
        
        // Kullanıcı bilgilerini ve giriş zamanını localStorage'a kaydet
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('loginTime', currentTime);
        // Token zaten apiLogin fonksiyonunda kaydediliyor
        
        navigate('/');
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Bağlantı hatası. Lütfen tekrar deneyin.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    // localStorage'dan tüm oturum bilgilerini temizle
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // Loading durumunda loading spinner döndür
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
} 