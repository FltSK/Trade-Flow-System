import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Chip,
  Grid,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Person,
  AccountCircle,
  Lock,
  Email,
  Info,
  Error,
  PersonAdd
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  apiGetUsers,
  apiCreateAdmin,
  apiCreateEmployee,
  apiDeleteUser,
  canCreateAdmin,
  canCreateEmployee,
  canViewUsers,
  canDeleteUser,
  getRoleDisplayName,
  validatePassword
} from '../utils/helpers';

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'admin' veya 'employee'
  const [form, setForm] = useState({ 
    name: '', 
    password: '', 
    confirmPassword: '',
    email: ''
  });

  useEffect(() => {
    if (canViewUsers(user?.role)) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const result = await apiGetUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setForm({ name: '', password: '', confirmPassword: '', email: '' });
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setForm({ name: '', password: '', confirmPassword: '', email: '' });
    setError('');
  };

  const handleFormChange = (field) => (event) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Şifre validasyonu
      const passwordErrors = validatePassword(form.password, `${form.name}-tfs`);
      if (passwordErrors.length > 0) {
        alert(passwordErrors.join('\n'));
        return;
      }

      const userData = {
        username: `${form.name}-tfs`,
        password: form.password,
        email: dialogType === 'admin' ? form.email : '' // Email sadece admin için
      };

      let result;
      if (dialogType === 'admin') {
        result = await apiCreateAdmin(userData);
      } else {
        result = await apiCreateEmployee(userData);
      }

      if (result.success) {
        alert(dialogType === 'admin' ? 'Admin başarıyla eklendi!' : 'Çalışan başarıyla eklendi!');
        handleCloseDialog();
        loadUsers();
        setError('');
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || (dialogType === 'admin' ? 'Admin oluşturulamadı' : 'Çalışan oluşturulamadı'));
        alert(errorMessage);
      }
    } catch (error) {
      alert((dialogType === 'admin' ? 'Admin' : 'Çalışan') + ' eklenirken hata oluştu: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        const result = await apiDeleteUser(userId);
        if (result.success) {
          loadUsers();
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('Kullanıcı silinirken hata oluştu');
      }
    }
  };

  if (!canViewUsers(user?.role)) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Bu sayfaya erişim yetkiniz bulunmamaktadır.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Kullanıcı Yönetimi
        </Typography>
        <Box>
          {canCreateAdmin(user?.role) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('admin')}
              sx={{ mr: 1 }}
            >
              Admin Ekle
            </Button>
          )}
          {canCreateEmployee(user?.role) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('employee')}
            >
              Çalışan Ekle
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Kullanıcı Adı</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Oluşturulma Tarihi</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((userItem) => (
              <TableRow key={userItem.id}>
                <TableCell>{userItem.username}</TableCell>
                <TableCell>
                  <Chip 
                    label={getRoleDisplayName(userItem.role)}
                    color={
                      userItem.role === 'superadmin' ? 'error' :
                      userItem.role === 'admin' ? 'warning' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(userItem.createdAt).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  {canDeleteUser(user?.role) && userItem.id !== user?.id && (
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteUser(userItem.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Kullanıcı Ekleme Dialog'u */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
          color: 'white',
          p: 3,
          textAlign: 'center'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            mb: 2 
          }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}>
              <PersonAdd sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="h5" fontWeight="bold">
              {dialogType === 'admin' ? 'Yeni Admin Ekle' : 'Yeni Çalışan Ekle'}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Sisteme yeni {dialogType === 'admin' ? 'admin' : 'çalışan'} hesabı oluşturun
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={dialogType === 'admin' ? 'Admin Adı' : 'Çalışan Adı'}
                value={form.name}
                onChange={handleFormChange('name')}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#4CAF50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kullanıcı Adı"
                value={`${form.name}-tfs`}
                disabled
                variant="outlined"
                helperText={
                  <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <Info sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Otomatik oluşturulur
                    </Typography>
                  </span>
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f5f5f5',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Şifre"
                type="password"
                value={form.password}
                onChange={handleFormChange('password')}
                required
                variant="outlined"
                helperText={
                  <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <Info sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      En az 6 karakter, {dialogType === 'admin' ? 'admin' : 'çalışan'} adının isim kısmını içeremez
                    </Typography>
                  </span>
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#4CAF50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Şifre Tekrar"
                type="password"
                value={form.confirmPassword}
                onChange={handleFormChange('confirmPassword')}
                required
                variant="outlined"
                error={form.password !== form.confirmPassword && form.confirmPassword !== ''}
                helperText={
                  form.password !== form.confirmPassword && form.confirmPassword !== '' 
                    ? (
                      <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                        <Error sx={{ fontSize: 16, mr: 0.5, color: 'error.main' }} />
                        <Typography variant="caption" color="error.main">
                          Şifreler eşleşmiyor
                        </Typography>
                      </span>
                    ) : ''
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#4CAF50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {dialogType === 'admin' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="E-posta"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange('email')}
                  required
                  variant="outlined"
                  helperText={
                    <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                      <Email sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Admin hesabı için e-posta adresi
                      </Typography>
                    </span>
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#4CAF50',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4CAF50',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              borderColor: '#4CAF50',
              color: '#4CAF50',
              '&:hover': {
                borderColor: '#45a049',
                backgroundColor: 'rgba(76, 175, 80, 0.04)',
              }
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !form.name || 
              !form.password || 
              form.password !== form.confirmPassword ||
              (dialogType === 'admin' && !form.email)
            }
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e',
              }
            }}
          >
            {dialogType === 'admin' ? 'Admin Ekle' : 'Çalışan Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 