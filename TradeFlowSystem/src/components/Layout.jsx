import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => setMobileOpen(!mobileOpen);

  // Süper admin için sadece navbar ve içerik, sidebar yok
  if (user?.role === 'superadmin') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
        <Navbar toggleDrawer={handleToggle} showMenu={false} />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        variant={isMdUp ? 'permanent' : 'temporary'}
        mobileOpen={mobileOpen}
        onClose={handleToggle}
      />
      <Box sx={{ flexGrow: 1 }}>
        <Navbar toggleDrawer={handleToggle} showMenu={!isMdUp} />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
} 