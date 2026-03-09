import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import { apiCreateEmployee, apiChangePassword, validatePassword, apiUpdateEmail, apiGetUsers, apiDeleteUser } from '../utils/helpers';
import NotificationCenter from './NotificationCenter';

export default function Navbar({ toggleDrawer, showMenu }) {
  const { user, logout } = useAuth();
  
  // Admin menü state'leri
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = React.useState(false);
  const [employeeForm, setEmployeeForm] = React.useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  // Admin için çalışan listesi dialog state'leri
  const [employeeListOpen, setEmployeeListOpen] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  const [employeesLoading, setEmployeesLoading] = React.useState(false);
  const [employeesError, setEmployeesError] = React.useState('');

  // Şifre değiştirme state'leri
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = React.useState(false);
  const [changePasswordForm, setChangePasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Email ayarları state'leri
  const [emailSettingsDialogOpen, setEmailSettingsDialogOpen] = React.useState(false);
  const [emailSettingsForm, setEmailSettingsForm] = React.useState({
    email: ''
  });

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddEmployee = () => {
    setEmployeeDialogOpen(true);
    handleMenuClose();
  };

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    setEmployeesError('');
    try {
      const result = await apiGetUsers();
      const list = (result?.data || result || []).filter(u => (u.role || '').toLowerCase() === 'employee');
      setEmployees(list);
    } catch (e) {
      setEmployeesError('Kullanıcılar yüklenemedi');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleOpenEmployees = async () => {
    handleMenuClose();
    setEmployeeListOpen(true);
    await loadEmployees();
  };

  const handleCloseEmployees = () => {
    setEmployeeListOpen(false);
    setEmployees([]);
    setEmployeesError('');
  };

  const handleDeleteEmployee = async (u) => {
    if (!u?.id) {
      alert('Silmek için kullanıcı ID bilgisi gerekli.');
      return;
    }
    const ok = window.confirm(`${u.username} kullanıcısını silmek istediğinize emin misiniz?`);
    if (!ok) return;
    try {
      const res = await apiDeleteUser(u.id);
      if (res?.success) {
        // Listeyi yeniden yükle ki tutarlılık sağlansın
        await loadEmployees();
      } else {
        alert(res?.error || 'Kullanıcı silinemedi');
      }
    } catch (e) {
      alert('Kullanıcı silinirken hata oluştu');
    }
  };

  const handleEmployeeFormChange = (field) => (event) => {
    setEmployeeForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

    const handleEmployeeSubmit = async () => {
    try {
      // Şifre validasyonu
      const passwordErrors = validatePassword(employeeForm.password, `${employeeForm.name}-tfs`);
      if (passwordErrors.length > 0) {
        alert(passwordErrors.join('\n'));
        return;
      }

      const employeeData = {
        username: `${employeeForm.name}-tfs`,
        password: employeeForm.password
      };

      const result = await apiCreateEmployee(employeeData);
      
      if (result.success) {
        alert('Çalışan başarıyla eklendi!');
        // Formu temizle ve dialog'u kapat
        setEmployeeForm({
          name: '',
          password: '',
          confirmPassword: ''
        });
        setEmployeeDialogOpen(false);
        // Liste açıksa anında yenile
        if (employeeListOpen) {
          await loadEmployees();
        }
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Çalışan eklenemedi');
        alert(errorMessage);
      }
    } catch (error) {
      alert('Çalışan eklenirken hata oluştu: ' + error.message);
    }
  };

  const handleEmployeeCancel = () => {
    setEmployeeForm({
      name: '',
      password: '',
      confirmPassword: ''
    });
    setEmployeeDialogOpen(false);
  };

  const handleChangePassword = () => {
    setChangePasswordDialogOpen(true);
    handleMenuClose();
  };

  const handleChangePasswordFormChange = (field) => (event) => {
    setChangePasswordForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleChangePasswordSubmit = async () => {
    try {
      // Şifre validasyonu
      const passwordErrors = validatePassword(changePasswordForm.newPassword, user.username);
      if (passwordErrors.length > 0) {
        alert(passwordErrors.join('\n'));
        return;
      }

      const passwordData = {
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword
      };

      const result = await apiChangePassword(passwordData);
      
      if (result.success) {
        alert('Şifre başarıyla değiştirildi!');
        // Formu temizle ve dialog'u kapat
        setChangePasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        setChangePasswordDialogOpen(false);
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Şifre değiştirilemedi');
        alert(errorMessage);
      }
    } catch (error) {
      alert('Şifre değiştirilirken hata oluştu: ' + error.message);
    }
  };

  const handleChangePasswordCancel = () => {
    setChangePasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setChangePasswordDialogOpen(false);
  };

  const handleEmailSettings = () => {
    setEmailSettingsForm({ email: user?.email || '' });
    setEmailSettingsDialogOpen(true);
    handleMenuClose();
  };

  const handleEmailSettingsFormChange = (field) => (event) => {
    setEmailSettingsForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleEmailSettingsSubmit = async () => {
    try {
      // Email validasyonu
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailSettingsForm.email)) {
        alert('Geçerli bir email adresi giriniz');
        return;
      }

      const emailData = {
        email: emailSettingsForm.email
      };

      const result = await apiUpdateEmail(emailData);
      
      if (result.success) {
        alert('Email ayarları başarıyla güncellendi!');
        setEmailSettingsDialogOpen(false);
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? (result.error.message || JSON.stringify(result.error))
          : (result.error || 'Email ayarları güncellenemedi');
        alert(errorMessage);
      }
    } catch (error) {
      alert('Email ayarları güncellenirken hata oluştu: ' + error.message);
    }
  };

  const handleEmailSettingsCancel = () => {
    setEmailSettingsForm({ email: '' });
    setEmailSettingsDialogOpen(false);
  };

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        {showMenu && (
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={toggleDrawer}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Trade Flow System
        </Typography>
                 {user && (
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <NotificationCenter />
             <Typography 
               variant="body1" 
               sx={{ 
                 cursor: 'pointer',
                 '&:hover': { textDecoration: 'underline' }
               }}
               onClick={handleMenuClick}
             >
               {user.username} ({user.role === 'superadmin' ? 'Süper Admin' : user.role === 'admin' ? 'Yönetici' : 'Çalışan'})
             </Typography>
              <Menu
               anchorEl={anchorEl}
               open={Boolean(anchorEl)}
               onClose={handleMenuClose}
               anchorOrigin={{
                 vertical: 'bottom',
                 horizontal: 'right',
               }}
               transformOrigin={{
                 vertical: 'top',
                 horizontal: 'right',
               }}
              >
               {user.role === 'admin' && (
                 <MenuItem onClick={handleOpenEmployees}>Çalışanlar</MenuItem>
               )}
               {user.role === 'superadmin' && (
                 <MenuItem onClick={() => window.location.href = '/admin'}>Kullanıcı Yönetimi</MenuItem>
               )}
               <MenuItem onClick={handleChangePassword}>Şifre Değiştir</MenuItem>
               {(user.role === 'admin' || user.role === 'superadmin') && (
                 <MenuItem onClick={handleEmailSettings}>Email Ayarları</MenuItem>
               )}
             </Menu>
             <Button color="inherit" onClick={logout}>Çıkış</Button>
           </Box>
         )}
      </Toolbar>

        {/* Çalışan Ekleme Dialog'u (sadece Çalışanlar diyalogundan açılır) */}
       <Dialog 
         open={employeeDialogOpen} 
         onClose={handleEmployeeCancel} 
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
               <PersonAddIcon sx={{ fontSize: 30 }} />
             </Box>
             <Typography variant="h5" fontWeight="bold">
               Yeni Çalışan Ekle
             </Typography>
           </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Sisteme yeni çalışan hesabı oluşturun
            </Typography>
         </Box>
         
         <DialogContent sx={{ p: 4 }}>
           <Grid container spacing={3}>
                           <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Çalışan Adı"
                 value={employeeForm.name}
                 onChange={handleEmployeeFormChange('name')}
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
                       <PersonIcon sx={{ color: 'text.secondary' }} />
                     </InputAdornment>
                   ),
                 }}
               />
             </Grid>
             
                           <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Kullanıcı Adı"
                 value={`${employeeForm.name}-tfs`}
                 disabled
                 variant="outlined"
                 helperText={
                   <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                     <InfoIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
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
                       <AccountCircleIcon sx={{ color: 'text.secondary' }} />
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
                 value={employeeForm.password}
                 onChange={handleEmployeeFormChange('password')}
                 required
                 variant="outlined"
                 helperText={
                   <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                     <InfoIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                     <Typography variant="caption" color="text.secondary">
                       En az 6 karakter, çalışan adının isim kısmını içeremez
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
                       <LockIcon sx={{ color: 'text.secondary' }} />
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
                 value={employeeForm.confirmPassword}
                 onChange={handleEmployeeFormChange('confirmPassword')}
                 required
                 variant="outlined"
                 error={employeeForm.password !== employeeForm.confirmPassword && employeeForm.confirmPassword !== ''}
                 helperText={
                   employeeForm.password !== employeeForm.confirmPassword && employeeForm.confirmPassword !== '' 
                     ? (
                       <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                         <ErrorIcon sx={{ fontSize: 16, mr: 0.5, color: 'error.main' }} />
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
                       <LockIcon sx={{ color: 'text.secondary' }} />
                     </InputAdornment>
                   ),
                 }}
               />
             </Grid>
           </Grid>
         </DialogContent>
         
         <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={handleEmployeeCancel}
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
              onClick={handleEmployeeSubmit}
              variant="contained"
             disabled={!employeeForm.name || !employeeForm.password || employeeForm.password !== employeeForm.confirmPassword}
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
             Çalışan Ekle
           </Button>
         </DialogActions>
       </Dialog>

        {/* Çalışan Listesi Dialog'u (Admin) */}
        <Dialog 
          open={employeeListOpen}
          onClose={handleCloseEmployees}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Çalışanlar
            <Button variant="contained" onClick={() => setEmployeeDialogOpen(true)} startIcon={<PersonAddIcon />}>Çalışan Ekle</Button>
          </DialogTitle>
          <DialogContent dividers>
            {employeesLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            )}
            {!!employeesError && (
              <Alert severity="error" sx={{ mb: 2 }}>{employeesError}</Alert>
            )}
            {!employeesLoading && !employeesError && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Kullanıcı Adı</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Oluşturma</TableCell>
                    <TableCell align="right">İşlem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map(u => (
                    <TableRow key={u.id || u.username} hover>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleString('tr-TR') : '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="error" size="small" onClick={() => handleDeleteEmployee(u)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Kayıt bulunamadı</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEmployees}>Kapat</Button>
          </DialogActions>
        </Dialog>

      {/* Şifre Değiştirme Dialog'u */}
      <Dialog 
        open={changePasswordDialogOpen} 
        onClose={handleChangePasswordCancel} 
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              <LockIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="h5" fontWeight="bold">
              Şifre Değiştir
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Güvenliğiniz için güçlü bir şifre seçin
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mevcut Şifre"
                type="password"
                value={changePasswordForm.currentPassword}
                onChange={handleChangePasswordFormChange('currentPassword')}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Yeni Şifre"
                type="password"
                value={changePasswordForm.newPassword}
                onChange={handleChangePasswordFormChange('newPassword')}
                required
                variant="outlined"
                helperText={
                  <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <InfoIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      En az 6 karakter, kullanıcı adınızın isim kısmını içeremez
                    </Typography>
                  </span>
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Yeni Şifre Tekrar"
                type="password"
                value={changePasswordForm.confirmNewPassword}
                onChange={handleChangePasswordFormChange('confirmNewPassword')}
                required
                variant="outlined"
                error={changePasswordForm.newPassword !== changePasswordForm.confirmNewPassword && changePasswordForm.confirmNewPassword !== ''}
                helperText={
                  changePasswordForm.newPassword !== changePasswordForm.confirmNewPassword && changePasswordForm.confirmNewPassword !== '' 
                    ? (
                      <span style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                        <ErrorIcon sx={{ fontSize: 16, mr: 0.5, color: 'error.main' }} />
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
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleChangePasswordCancel}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#5a6fd8',
                backgroundColor: 'rgba(102, 126, 234, 0.04)',
              }
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleChangePasswordSubmit}
            variant="contained"
            disabled={!changePasswordForm.currentPassword || !changePasswordForm.newPassword || changePasswordForm.newPassword !== changePasswordForm.confirmNewPassword}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e',
              }
            }}
          >
            Şifre Değiştir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Ayarları Dialog'u */}
      <Dialog 
        open={emailSettingsDialogOpen} 
        onClose={handleEmailSettingsCancel} 
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
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
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
              <InfoIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Email Ayarları
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Hesap durumu değişikliklerinde email almak için ayarlarınızı güncelleyin
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Adresi"
                type="email"
                value={emailSettingsForm.email}
                onChange={handleEmailSettingsFormChange('email')}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#2196F3',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InfoIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleEmailSettingsCancel}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              borderColor: '#2196F3',
              color: '#2196F3',
              '&:hover': {
                borderColor: '#1976D2',
                backgroundColor: 'rgba(33, 150, 243, 0.04)',
              }
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleEmailSettingsSubmit}
            variant="contained"
            disabled={!emailSettingsForm.email}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#9e9e9e',
              }
            }}
          >
            Email Ayarlarını Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
} 