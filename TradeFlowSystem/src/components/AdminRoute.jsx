import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kullanıcı admin değilse ana sayfaya yönlendir
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Admin kullanıcı ise içeriği göster
  return children;
} 