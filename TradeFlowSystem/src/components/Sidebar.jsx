import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 220;

const menuItems = [
  { label: 'Anasayfa', path: '/', icon: <DashboardIcon />, roles: ['admin', 'employee'] },
  { label: 'Müşteriler', path: '/musteriler', icon: <PeopleIcon />, roles: ['admin', 'employee'] },
  { label: 'Usta Yönetimi', path: '/ustalar', icon: <BuildIcon />, roles: ['admin'] },
  { label: 'Stok Yönetimi', path: '/stok', icon: <InventoryIcon />, roles: ['admin'] },
  { label: 'Siparişler', path: '/siparisler', icon: <ShoppingCartIcon />, roles: ['admin'] },
  { label: 'Stok Takip', path: '/stok-takip', icon: <AssessmentIcon />, roles: ['admin', 'employee'] },
  // { label: 'Faturalar', path: '/faturalar', icon: <ReceiptIcon />, roles: ['admin'] },
  // { label: 'Ödemeler', path: '/odemeler', icon: <PaymentIcon />, roles: ['admin'] },
  { label: 'Toptancı Carisi', path: '/toptancilar', icon: <StorefrontIcon />, roles: ['admin'] },
  { label: 'Dükkan Carisi', path: '/dukkan-carisi', icon: <AccountBalanceWalletIcon />, roles: ['admin'] },
  { label: 'İşlem Hareketleri', path: '/islem-hareketleri', icon: <HistoryIcon />, roles: ['admin'] },
];

export default function Sidebar({ variant = 'permanent', mobileOpen = false, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;
  
  // Süper admin için sidebar gizle
  if (user?.role === 'superadmin') {
    return null;
  }

  return (
    <Drawer
      variant={variant}
      open={variant === 'permanent' ? true : mobileOpen}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#fff', display: 'flex', flexDirection: 'column' },
      }}
    >
      <List sx={{ flex: 1 }}>
        {menuItems.filter(item => item.roles.includes(user.role)).map(item => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1.5, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          2025 Hakları Saklıdır • ® SerhunKaradeniz
        </Typography>
      </Box>
    </Drawer>
  );
} 