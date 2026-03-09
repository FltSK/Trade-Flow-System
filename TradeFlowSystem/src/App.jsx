import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AuthProvider from './context/AuthContext';
import { RealTimeProvider } from './context/RealTimeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ClientPage = lazy(() => import('./pages/ClientPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const UstaPage = lazy(() => import('./pages/UstaPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const StokPage = lazy(() => import('./pages/StokPage'));
const TransactionHistoryPage = lazy(() => import('./pages/TransactionHistoryPage'));
const ProductTypesPage = lazy(() => import('./pages/ProductTypesPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const ModelsPage = lazy(() => import('./pages/ModelsPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const StokTakipPage = lazy(() => import('./pages/StokTakipPage'));
const DukkanCarisiPage = lazy(() => import('./pages/DukkanCarisiPage'));

import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f4f6f8' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RealTimeProvider>
          <Suspense fallback={<div />}> 
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/musteriler" element={<ClientPage />} />
                <Route path="/ustalar" element={<UstaPage />} />
                <Route path="/toptancilar" element={<SuppliersPage />} />
                <Route path="/stok" element={<StokPage />} />
                <Route path="/siparisler" element={<OrdersPage />} />
                <Route path="/stok-takip" element={<StokTakipPage />} />
                <Route path="/dukkan-carisi" element={
                  <AdminRoute>
                    <DukkanCarisiPage />
                  </AdminRoute>
                } />

                <Route path="/islem-hareketleri" element={
                  <AdminRoute>
                    <TransactionHistoryPage />
                  </AdminRoute>
                } />
                <Route path="/admin" element={<AdminPage />} />
                
                {/* Ürün Yönetimi Sayfaları */}
                <Route path="/urun-turleri" element={
                  <AdminRoute>
                    <ProductTypesPage />
                  </AdminRoute>
                } />
                <Route path="/markalar" element={
                  <AdminRoute>
                    <BrandsPage />
                  </AdminRoute>
                } />
                <Route path="/modeller" element={
                  <AdminRoute>
                    <ModelsPage />
                  </AdminRoute>
                } />
                <Route path="/is-tanimlari" element={
                  <AdminRoute>
                    <JobsPage />
                  </AdminRoute>
                } />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Suspense>
        </RealTimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 