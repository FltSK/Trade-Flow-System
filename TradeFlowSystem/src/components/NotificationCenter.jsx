import React, { useState } from 'react';
import { useRealTime } from '../context/RealTimeContext';
import { useAuth } from '../context/AuthContext';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function NotificationCenter() {
  const { notifications, removeNotification, clearNotifications, notificationCount } = useRealTime();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    // Notification'a tıklandığında yapılacak işlemler
    removeNotification(notification.id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deleteRequest':
      case 'payment_delete_request':
      case 'new_delete_request':
        return <DeleteIcon color="warning" />;
      case 'requestApproved':
      case 'request_approved':
        return <CheckCircleIcon color="success" />;
      case 'requestRejected':
      case 'request_rejected':
        return <CancelIcon color="error" />;
      case 'customer_created':
        return <PersonAddIcon color="success" />;
      case 'customer_deleted':
        return <DeleteIcon color="error" />;
      case 'payment_created':
        return <CheckCircleIcon color="success" />;
      case 'notification':
        return <InfoIcon color="info" />;
      case 'globalNotification':
        return <InfoIcon color="primary" />;
      default:
        return <InfoIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'deleteRequest':
      case 'payment_delete_request':
      case 'new_delete_request':
        return 'warning';
      case 'requestApproved':
      case 'request_approved':
        return 'success';
      case 'requestRejected':
      case 'request_rejected':
        return 'error';
      case 'customer_created':
        return 'success';
      case 'customer_deleted':
        return 'error';
      case 'payment_created':
        return 'success';
      case 'notification':
        return 'info';
      case 'globalNotification':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return time.toLocaleDateString('tr-TR');
  };

  // Bildirimleri filtrele
  const filteredNotifications = notifications.filter(notification => {
    // Kişisel bildirimler sadece isteyen kişi görsün
    if (notification.isPersonal) {
      return notification.requestedBy === user?.username;
    }
    // Global bildirimler herkes görsün
    return true;
  });

  const unreadCount = notificationCount;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Bildirimler</Typography>
            {filteredNotifications.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {filteredNotifications.length} bildirim
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={clearNotifications}
                  title="Tüm bildirimleri temizle"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        {filteredNotifications.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              Bildirim yok
            </Typography>
          </MenuItem>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                    <Box sx={{ mr: 1, mt: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={notification.type === 'deleteRequest' || notification.type === 'payment_delete_request' || notification.type === 'new_delete_request' ? 'Silme İsteği' :
                                 notification.type === 'requestApproved' || notification.type === 'request_approved' ? 'Onaylandı' :
                                 notification.type === 'requestRejected' || notification.type === 'request_rejected' ? 'Reddedildi' :
                                 notification.type === 'customer_created' ? 'Yeni Müşteri' :
                                 notification.type === 'customer_deleted' ? 'Müşteri Silindi' :
                                 notification.type === 'payment_created' ? 'Yeni Ödeme' :
                                 notification.type === 'globalNotification' ? 'Genel Bildirim' : 'Bildirim'}
                          size="small"
                          color={getNotificationColor(notification.type)}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
} 