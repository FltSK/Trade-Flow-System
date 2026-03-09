import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Restore as RestoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { apiGetActivityLogs, apiGetActivityUsers } from '../utils/helpers';

export default function TransactionHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [users, setUsers] = useState([]);
  const [selectedActionCategory, setSelectedActionCategory] = useState('');
  const categoriesInTable = useMemo(() => {
    const set = new Set(activityLogs.map(l => l.entityType).filter(Boolean));
    return Array.from(set);
  }, [activityLogs]);

  // Sadece admin kullanıcıların erişimine izin ver
  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece yöneticiler işlem hareketlerini görüntüleyebilir.
        </Alert>
      </Box>
    );
  }

  // ActivityLog'ları yükle
  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const result = await apiGetActivityLogs(filters);
      
      if (result.success) {
        setActivityLogs(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('İşlem hareketleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı listesini yükle
  const loadUsers = async () => {
    try {
      const result = await apiGetActivityUsers();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      // Hata durumunda sessizce devam et
    }
  };

  const normalizeActionCategory = (actionRaw) => {
    const a = String(actionRaw || '').toLowerCase();
    if (['create','add','insert','new','register'].some(k => a.includes(k))) return 'CREATE';
    if (['update','edit','modify','change'].some(k => a.includes(k))) return 'UPDATE';
    if (['delete','remove','destroy'].some(k => a.includes(k))) return 'DELETE';
    if (['approve','confirm','accept'].some(k => a.includes(k))) return 'APPROVE';
    if (['reject','deny','cancel','cancelled','canceled'].some(k => a.includes(k))) return 'REJECT';
    if (['restore','undo','recover','rollback'].some(k => a.includes(k))) return 'RESTORE';
    return 'OTHER';
  };

  const getActionCategoryDisplay = (cat) => {
    switch (cat) {
      case 'CREATE': return 'Oluşturma';
      case 'UPDATE': return 'Güncelleme';
      case 'DELETE': return 'Silme';
      case 'APPROVE': return 'Onay';
      case 'REJECT': return 'Reddetme';
      case 'RESTORE': return 'Geri Alma';
      default: return 'Diğer';
    }
  };

  useEffect(() => {
    loadActivityLogs();
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, []);

  const getActionIcon = (action) => {
    switch (normalizeActionCategory(action)) {
      case 'CREATE':
        return <PersonAddIcon />;
      case 'UPDATE':
        return <PaymentIcon />;
      case 'DELETE':
        return <DeleteIcon />;
      case 'APPROVE':
        return <CheckIcon />;
      case 'REJECT':
        return <CloseIcon />;
      case 'RESTORE':
        return <RestoreIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  const getActionColor = (action) => {
    switch (normalizeActionCategory(action)) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'primary';
      case 'DELETE':
        return 'error';
      case 'APPROVE':
        return 'success';
      case 'REJECT':
        return 'error';
      case 'RESTORE':
        return 'info';
      default:
        return 'default';
    }
  };

  const getActionDisplayName = (action) => getActionCategoryDisplay(normalizeActionCategory(action));
  const actionCategoriesInTable = useMemo(() => {
    const set = new Set(activityLogs.map(l => normalizeActionCategory(l.action)));
    return Array.from(set);
  }, [activityLogs]);

  const visibleLogs = useMemo(() => {
    if (!selectedActionCategory) return activityLogs;
    return activityLogs.filter(l => normalizeActionCategory(l.action) === selectedActionCategory);
  }, [activityLogs, selectedActionCategory]);

  const getEntityTypeDisplayName = (entityType) => {
    switch (entityType) {
      case 'CUSTOMER':
        return 'Müşteri';
      case 'PAYMENT':
        return 'Ödeme';
      case 'SUPPLIER':
        return 'Tedarikçi';
      case 'DELETE_REQUEST':
        return 'Silme Talebi';
      default:
        return entityType;
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        İşlem Hareketleri
      </Typography>

      {/* Filtreler */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <FormControl size="medium">
              <InputLabel>Kategori</InputLabel>
              <Select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                label="Kategori"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Tümü</MenuItem>
                {categoriesInTable.map((cat) => (
                  <MenuItem key={cat} value={cat}>{getEntityTypeDisplayName(cat)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl size="medium">
              <InputLabel>İşlem</InputLabel>
              <Select
                value={selectedActionCategory}
                onChange={(e) => setSelectedActionCategory(e.target.value)}
                label="İşlem Türü"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Tümü</MenuItem>
                {actionCategoriesInTable.map((cat) => (
                  <MenuItem key={cat} value={cat}>{getActionCategoryDisplay(cat)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl size="medium">
              <InputLabel>İşlem Yapan</InputLabel>
              <Select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                label="İşlem Yapan"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Tümü</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.userId} value={user.userId}>
                    {user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              size="medium"
              type="date"
              label="Başlangıç Tarihi"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              size="medium"
              type="date"
              label="Bitiş Tarihi"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: '60vh' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>İşlem</TableCell>
                <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Kategori</TableCell>
                <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Açıklama</TableCell>
                <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>İşlemi Yapan Kişi</TableCell>
                <TableCell sx={{ backgroundColor: 'background.paper', fontWeight: 'bold' }}>Tarih</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activityLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      İşlem hareketi bulunamadı
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getActionIcon(log.action)}
                        <Chip
                          label={getActionDisplayName(log.action)}
                          color={getActionColor(log.action)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getEntityTypeDisplayName(log.entityType)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.description || log.entityName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
} 