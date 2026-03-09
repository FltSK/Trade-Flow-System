import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, IconButton, Chip, FormControl, Select, MenuItem, Grid
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Work as WorkIcon, Link as LinkIcon, LinkOff as LinkOffIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { 
  apiGetJobs, apiCreateJob, apiUpdateJob, apiDeleteJob,
  apiGetProductTypes, apiGetJobProductTypes, apiAddProductTypeToJob, apiRemoveProductTypeFromJob
} from '../utils/helpers';

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [jobProductTypes, setJobProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openProductTypeDialog, setOpenProductTypeDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState({ ad: '' });
  const [productTypeForm, setProductTypeForm] = useState({ productTypeId: '' });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      loadJobs();
      loadProductTypes();
    }
  }, [user]);

  const loadJobs = async () => {
    try {
      const result = await apiGetJobs();
      if (result.success) setJobs(result.data);
      else setError(result.error);
    } catch {
      setError('İş tanımları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadProductTypes = async () => {
    try {
      const result = await apiGetProductTypes();
      if (result.success) setProductTypes(result.data);
    } catch {}
  };

  const loadJobProductTypes = async (jobId) => {
    try {
      const result = await apiGetJobProductTypes(jobId);
      if (result.success) setJobProductTypes(result.data);
    } catch {}
  };

  const handleOpenDialog = (job = null) => {
    if (job) {
      setEditMode(true);
      setSelectedJob(job);
      setForm({ ad: job.ad });
    } else {
      setEditMode(false);
      setSelectedJob(null);
      setForm({ ad: '' });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedJob(null);
    setForm({ ad: '' });
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.ad.trim()) { setError('İş adı boş olamaz'); return; }
    try {
      let result;
      if (editMode) result = await apiUpdateJob(selectedJob.id, form);
      else result = await apiCreateJob(form);
      if (result.success) { handleCloseDialog(); loadJobs(); }
      else setError(result.error);
    } catch { setError('İşlem sırasında hata oluştu'); }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Bu işi silmek istediğinize emin misiniz?')) return;
    try {
      const result = await apiDeleteJob(id);
      if (result.success) loadJobs(); else setError(result.error);
    } catch { setError('İş silinirken hata oluştu'); }
  };

  const handleOpenProductTypeDialog = (job) => {
    setSelectedJob(job);
    setProductTypeForm({ productTypeId: '' });
    loadJobProductTypes(job.id);
    setOpenProductTypeDialog(true);
  };

  const handleCloseProductTypeDialog = () => {
    setOpenProductTypeDialog(false);
    setSelectedJob(null);
    setJobProductTypes([]);
    setProductTypeForm({ productTypeId: '' });
  };

  const handleAddProductType = async () => {
    if (!productTypeForm.productTypeId) { setError('Lütfen bir ürün türü seçin'); return; }
    const result = await apiAddProductTypeToJob(selectedJob.id, productTypeForm.productTypeId);
    if (result.success) { loadJobProductTypes(selectedJob.id); setProductTypeForm({ productTypeId: '' }); }
    else setError(result.error);
  };

  const handleRemoveProductType = async (productTypeId) => {
    if (!window.confirm('Bu bağlantıyı kaldırmak istediğinize emin misiniz?')) return;
    const result = await apiRemoveProductTypeFromJob(selectedJob.id, productTypeId);
    if (result.success) loadJobProductTypes(selectedJob.id); else setError(result.error);
  };

  if (!(user?.role === 'admin' || user?.role === 'superadmin')) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Container>
    );
  }

  if (loading) return (<Container maxWidth="lg" sx={{ mt: 4 }}><Typography>Yükleniyor...</Typography></Container>);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <WorkIcon sx={{ mr: 2 }} />
          İş Tanımları
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          İş Ekle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'string' ? error : 'Bir hata oluştu'}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>İş Adı</TableCell>
              <TableCell>Oluşturulma Tarihi</TableCell>
              <TableCell>Güncellenme Tarihi</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell><Chip label={job.ad} color="secondary" variant="outlined" /></TableCell>
                <TableCell>{new Date(job.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                <TableCell>{job.updatedAt ? new Date(job.updatedAt).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenDialog(job)} size="small" title="Düzenle"><EditIcon/></IconButton>
                  <IconButton color="info" onClick={() => handleOpenProductTypeDialog(job)} size="small" title="Ürün Türleri"><LinkIcon/></IconButton>
                  <IconButton color="error" onClick={() => handleDeleteJob(job.id)} size="small" title="Sil"><DeleteIcon/></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* İş Ekle/Düzenle */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'İş Düzenle' : 'Yeni İş Ekle'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="İş Adı" value={form.ad} onChange={(e)=>setForm({ ad: e.target.value })} required sx={{ mt: 2 }}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">{editMode ? 'Güncelle' : 'Ekle'}</Button>
        </DialogActions>
      </Dialog>

      {/* Ürün Türü Bağlantıları */}
      <Dialog open={openProductTypeDialog} onClose={handleCloseProductTypeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedJob?.ad} - Ürün Türleri</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Select value={productTypeForm.productTypeId} onChange={(e)=>setProductTypeForm({ productTypeId: e.target.value })} displayEmpty>
                  <MenuItem value="" disabled>Ürün Türü Seçin</MenuItem>
                  {productTypes.filter(pt => !jobProductTypes.some(jpt => jpt.productTypeId === pt.id)).map(pt => (
                    <MenuItem key={pt.id} value={pt.id}>{pt.ad}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button variant="contained" onClick={handleAddProductType} disabled={!productTypeForm.productTypeId} fullWidth sx={{ mt: 1 }}>Ürün Türü Ekle</Button>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Mevcut Ürün Türleri:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {jobProductTypes.map(jpt => (
                <Chip key={jpt.id} label={jpt.productType?.ad || 'Bilinmeyen'} color="primary" onDelete={() => handleRemoveProductType(jpt.productTypeId)} deleteIcon={<LinkOffIcon/>} />
              ))}
              {jobProductTypes.length === 0 && (<Typography color="text.secondary">Henüz ürün türü eklenmemiş</Typography>)}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductTypeDialog}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}


