import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

import Chip from '@mui/material/Chip';
import { useAuth } from '../context/AuthContext';
import { useCustomers } from '../hooks/useCustomers';
import { hesaplaKalanOdeme, formatNumber, formatFileSize, API_BASE_URL } from '../utils/helpers';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';

export default function DashboardPage() {
  const { user } = useAuth();
  const { musteriler, loading, error } = useCustomers();
  const navigate = useNavigate();

  // Memoize expensive calculations
  const { toplamNakit, toplamCiro, toplamKart, kalanMusteriler, dueSoon, overdue } = useMemo(() => {
    const parseMoney = (v)=> parseFloat(String(v||'').replace(/\./g,'').replace(/,/g,'.'))||0;
    const toplamNakit = musteriler.flatMap(m=>m.odemeler||[]).filter(o=>o.tur==='Nakit').reduce((t,o)=>t+parseMoney(o.tutar),0);
    const toplamKart = musteriler.flatMap(m=>m.odemeler||[]).filter(o=>o.tur==='Kredi Kartı' || o.tur==='Kart').reduce((t,o)=>t+parseMoney(o.tutar),0);
    
    // Yeni ciro hesaplama: Bu yılın 1 Ocak'ından bugüne kadar
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // 1 Ocak bu yıl
    const endDate = new Date(); // Bugün
    
    const toplamCiro = musteriler
      .filter(m => {
        // Sözleşme tarihi varsa ve belirtilen aralıkta ise dahil et
        if (m.sozlesmeTarihi) {
          const contractDate = new Date(m.sozlesmeTarihi);
          return contractDate >= startDate && contractDate <= endDate;
        }
        // Sözleşme tarihi yoksa dahil etme
        return false;
      })
      .reduce((t, m) => t + parseFloat(m.sozlesmeTutari || 0), 0);
    
    const kalanMusteriler = musteriler.filter(m=>hesaplaKalanOdeme(m.sozlesmeTutari,m.odemeler || [])>0);

    const oneDayMs = 24*60*60*1000;
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const now = todayStart.getTime();
    


    // Vadesi yaklaşanlar (0-3 gün)
    const dueSoon = musteriler
      .map(m=>{
        const kalan = hesaplaKalanOdeme(m.sozlesmeTutari, m.odemeler || []);
        if(kalan<=0 || !m.odemeTaahhutTarihi) return null;
        const target = new Date(m.odemeTaahhutTarihi);
        target.setHours(0,0,0,0);
        const diffMs = target.getTime() - now;
        const diffDays = Math.floor(diffMs / oneDayMs);
        if(diffDays<0 || diffDays>3) return null;
        return { m, kalan, diffDays };
      })
      .filter(Boolean)
      .sort((a,b)=>a.diffDays - b.diffDays);

    // Ödemesi geçenler
    const overdue = musteriler.filter(m=>{
      const kalan = hesaplaKalanOdeme(m.sozlesmeTutari, m.odemeler || []);
      if(kalan<=0) return false;
      if(!m.odemeTaahhutTarihi) return false;
      const target = new Date(m.odemeTaahhutTarihi);
      target.setHours(0,0,0,0);
      const diff = now - target.getTime();
      return diff>0; // geçmiş
    });

    return { toplamNakit, toplamCiro, toplamKart, kalanMusteriler, dueSoon, overdue };
  }, [musteriler]);

  // Job info dialog state
  const [jobInfoOpen, setJobInfoOpen] = useState(false);
  const [jobInfoData, setJobInfoData] = useState(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');
  
  // Ödemesi kalan müşteriler için state'ler
  const [kalanMusterilerExpanded, setKalanMusterilerExpanded] = useState(false);
  const [kalanMusterilerSearch, setKalanMusterilerSearch] = useState('');
  
  // Admin kartları için ayrı ayrı gizleme state'leri
  const [showNakitGelir, setShowNakitGelir] = React.useState(false);
  const [showToplamCiro, setShowToplamCiro] = React.useState(false);
  const [showToplamKart, setShowToplamKart] = React.useState(false);

  const summaryCards = [
    {
      label: 'Ödemesi Kalan Müşteri',
      value: kalanMusteriler.length,
      icon: <PendingActionsIcon fontSize="large"/>,
      bg: 'linear-gradient(135deg,#f85032 0%,#e73827 100%)'
    },

  ];

  // Admin kartları - sadece admin kullanıcılar görebilir
  const adminCards = [
    {
      label: 'Nakit Gelir',
      value: showNakitGelir ? `${formatNumber(toplamNakit)} ₺` : '•••••• ₺',
      icon: null,
      bg: 'linear-gradient(135deg,#38ef7d 0%,#11998e 100%)',
      onClick: () => setShowNakitGelir(!showNakitGelir)
    },
    {
      label: 'Toplam Kart Ödemesi',
      value: showToplamKart ? `${formatNumber(toplamKart)} ₺` : '•••••• ₺',
      icon: null,
      bg: 'linear-gradient(135deg,#7F7FD5 0%,#86A8E7 50%,#91EAE4 100%)',
      onClick: () => setShowToplamKart(!showToplamKart)
    },
    {
      label: 'Toplam Ciro',
      value: showToplamCiro ? `${formatNumber(toplamCiro)} ₺` : '•••••• ₺',
      icon: null,
      bg: 'linear-gradient(135deg,#f7971e 0%,#ffd200 100%)',
      onClick: () => setShowToplamCiro(!showToplamCiro)
    }
  ];



  // Handle loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Ana sayfa yükleniyor...</Typography>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Ana sayfa yüklenemedi
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs:1, md:3 }, textAlign:'center' }}>
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight:'bold',
          background: 'linear-gradient(135deg,#0072ff 0%,#00c6ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 4
        }}
      >
        Hoşgeldin, {user?.username?.toUpperCase()}
      </Typography>
      {/* Kartlar - Süper admin göremez */}
      {user?.role !== 'superadmin' && (
        <Grid container spacing={2} sx={{ mb:2 }} justifyContent="center">
          {/* Admin kartları - sadece admin kullanıcılar görebilir */}
          {user?.role === 'admin' && adminCards.map((card,idx)=>(
            <Grid key={`admin-${idx}`} item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  background:card.bg, 
                  color:'#fff',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }
                }}
                onClick={card.onClick}
              >
                <CardContent sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', p:3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity:0.8 }}>{card.label}</Typography>
                    <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
                  </Box>
                  {card.icon && card.icon}
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {/* Tüm kullanıcılar için kartlar */}
          {summaryCards.map((card,idx)=>(
            <Grid key={idx} item xs={12} sm={6} md={3}>
              <Card sx={{ background:card.bg, color:'#fff' }}>
                <CardContent sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', p:3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity:0.8 }}>{card.label}</Typography>
                    <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
                  </Box>
                  {card.icon && card.icon}
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {/* Debug Butonu - Sadece admin kullanıcılar görebilir */}

        </Grid>
      )}

      {/* Tablolar - Süper admin göremez */}
      {user?.role !== 'superadmin' && (
        <Grid container spacing={2} justifyContent="center" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Grid key="kalan-table" item xs={12} md={6} lg={5} sx={{ minWidth: 400 }}>
          <Paper sx={{ p:2, width:'100%', textAlign:'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Ödemesi Kalan Müşteriler</Typography>
              <IconButton 
                onClick={() => setKalanMusterilerExpanded(!kalanMusterilerExpanded)}
                size="small"
              >
                {kalanMusterilerExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={kalanMusterilerExpanded}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Müşteri adı veya TC ile arama yapın..."
                  value={kalanMusterilerSearch}
                  onChange={(e) => setKalanMusterilerSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ mb: 2 }}
                />
              </Box>
            </Collapse>
            
            <TableContainer sx={{ maxHeight: kalanMusterilerExpanded ? 600 : 360 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ad Soyad</TableCell>
                    <TableCell>Kalan Ödeme</TableCell>
                    <TableCell>Ödeme Taahhüt Tarihi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kalanMusteriler
                    .filter(m => {
                      if (!kalanMusterilerSearch) return true;
                      const searchTerm = kalanMusterilerSearch.toLowerCase();
                      return m.adSoyad?.toLowerCase().includes(searchTerm) || 
                             m.tcKimlik?.includes(searchTerm);
                    })
                    .map(m=>{
                      const kalan = hesaplaKalanOdeme(m.sozlesmeTutari,m.odemeler || []);
                      return (
                        <TableRow key={`kalan-${m.id}`} hover sx={{ cursor:'pointer', '&:nth-of-type(odd)': { backgroundColor: 'rgba(255,0,0,0.03)' } }} onClick={()=>{setJobInfoData(m); setJobInfoOpen(true);}}>
                          <TableCell>{m.adSoyad}</TableCell>
                          <TableCell>
                            <Chip label={`${formatNumber(kalan)} ₺`} color="error" size="small" />
                          </TableCell>
                          <TableCell>{m.odemeTaahhutTarihi||'-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  {kalanMusteriler.filter(m => {
                    if (!kalanMusterilerSearch) return true;
                    const searchTerm = kalanMusterilerSearch.toLowerCase();
                    return m.adSoyad?.toLowerCase().includes(searchTerm) || 
                           m.tcKimlik?.includes(searchTerm);
                  }).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        {kalanMusterilerSearch ? 'Arama sonucu bulunamadı' : 'Tüm ödemeler tamamlanmış'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {dueSoon.length>0 && (
          <Grid key="dueSoon-table" item xs={12} md={6} lg={5} sx={{ minWidth: 400 }}>
            <Paper sx={{ p:2, width:'100%', textAlign:'center', border:'2px solid', borderColor:'error.main' }}>
              <Typography variant="h6" gutterBottom color="error">Vadesi Yaklaşan Müşteriler</Typography>
              <TableContainer sx={{ maxHeight:360 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ad Soyad</TableCell>
                      <TableCell>Kalan Ödeme</TableCell>
                      <TableCell>Ödeme Taahhüt Tarihi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dueSoon.map(item=>{
                      const colorMap={0:'error',1:'warning',2:'info',3:'success'};
                      const rowColor=colorMap[item.diffDays];
                      return (
                        <TableRow key={`due-${item.m.id}`} hover sx={{ cursor:'pointer', '&:nth-of-type(odd)': { backgroundColor:`rgba(0,0,0,0.02)` } }} onClick={()=>{setJobInfoData(item.m); setJobInfoOpen(true);}}>
                          <TableCell sx={{ color:`${rowColor}.main` }}>{item.m.adSoyad}</TableCell>
                          <TableCell><Chip label={`${formatNumber(item.kalan)} ₺`} color={rowColor} size="small"/></TableCell>
                          <TableCell>{item.m.odemeTaahhutTarihi}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          )}

          {overdue.length>0 && (
            <Grid key="overdue-table" item xs={12} md={6} lg={5} sx={{ minWidth: 400 }}>
              <Paper sx={{ p:2, width:'100%', textAlign:'center', border:'2px solid', borderColor:'warning.main' }}>
                <Typography variant="h6" gutterBottom color="warning">Ödemesi Geçen Müşteriler</Typography>
                <TableContainer sx={{ maxHeight:360 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ad Soyad</TableCell>
                        <TableCell>Kalan Ödeme</TableCell>
                        <TableCell>Ödeme Taahhüt Tarihi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overdue.map(m=>{
                        const kalan = hesaplaKalanOdeme(m.sozlesmeTutari,m.odemeler || []);
                        return (
                          <TableRow key={`over-${m.id}`} hover sx={{ cursor:'pointer', '&:nth-of-type(odd)': { backgroundColor:'rgba(255,193,7,0.04)' } }} onClick={()=>{setJobInfoData(m); setJobInfoOpen(true);}}>
                            <TableCell>{m.adSoyad}</TableCell>
                            <TableCell><Chip label={`${formatNumber(kalan)} ₺`} color="warning" size="small"/></TableCell>
                            <TableCell>{m.odemeTaahhutTarihi}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Yapılan İş Detay Dialogu */}
      <Dialog 
        open={jobInfoOpen} 
        onClose={()=>setJobInfoOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { m: { xs: 1, sm: 2, md: 4 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>İş Detayları</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {jobInfoData && (
            <Box sx={{ p:1 }}>
              <Typography variant="subtitle1" sx={{ mb:1 }}><strong>İş Bilgileri</strong></Typography>
              <Typography variant="body2"><strong>Yapılan İş:</strong> {jobInfoData.yapilanIs || '-'}</Typography>
              {jobInfoData.boruTipi && (
                <Typography variant="body2"><strong>Boru Tipi:</strong> {jobInfoData.boruTipi}</Typography>) }
              <Typography variant="body2"><strong>Satılan Cihaz:</strong> {jobInfoData.satilanCihaz || '-'}</Typography>
              {jobInfoData.yapilanIs?.includes('kombi') && (
                <Typography variant="body2"><strong>Termostat:</strong> {jobInfoData.termostat || '-'}</Typography>) }

              <Divider sx={{ my:2 }} />
              <Typography variant="subtitle1" sx={{ mb:1 }}><strong>İletişim Bilgileri</strong></Typography>
              <Typography variant="body2"><strong>Telefon:</strong> {jobInfoData.telefon || '-'}</Typography>
              <Typography variant="body2"><strong>Adres:</strong> {jobInfoData.adres || '-'}</Typography>
              <Typography variant="body2"><strong>TC Kimlik:</strong> {jobInfoData.tcKimlik || '-'}</Typography>

              <Divider sx={{ my:2 }} />
              <Typography variant="subtitle1" sx={{ mb:1 }}><strong>Sözleşme Dosyası</strong></Typography>
              {jobInfoData.sozlesmeDosyaAdi ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${jobInfoData.sozlesmeDosyaAdi} (${formatFileSize(jobInfoData.sozlesmeDosyaBoyutu)})`} 
                    color="primary" 
                    variant="outlined"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Dosya mevcut
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Dosya Yok</Typography>
              )}
              {/* Önizleme */}
              {jobInfoData.sozlesmeDosyaAdi && jobInfoData.sozlesmeDosyaTipi === 'application/pdf' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Sözleşme Önizlemesi (PDF):
                  </Typography>
                  <Box 
                    component="iframe"
                    src={`${API_BASE_URL}/customers/${jobInfoData.id}/download-sozlesme?inline=true`}
                    sx={{ width: '100%', height: 500, border: '1px solid #ddd', borderRadius: 1, boxShadow: 1 }}
                  />
                </Box>
              )}
              {jobInfoData.sozlesmeDosyaAdi && jobInfoData.sozlesmeDosyaTipi?.startsWith('image/') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Sözleşme Önizlemesi:
                  </Typography>
                  <Box 
                    component="img"
                    src={`${API_BASE_URL}/customers/${jobInfoData.id}/download-sozlesme?inline=true`}
                    alt="Sözleşme Önizlemesi"
                    loading="lazy"
                    decoding="async"
                    onClick={() => {
                      setImagePreviewSrc(`${API_BASE_URL}/customers/${jobInfoData.id}/download-sozlesme?inline=true`);
                      setImagePreviewOpen(true);
                    }}
                    sx={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 1, boxShadow: 1, cursor: 'zoom-in' }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobInfoOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Görsel Büyütme Dialogu */}
      <Dialog 
        open={imagePreviewOpen} 
        onClose={() => setImagePreviewOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { m: { xs: 1, sm: 2, md: 4 } } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box 
            component="img"
            src={imagePreviewSrc}
            alt="Önizleme"
            loading="lazy"
            decoding="async"
            sx={{ width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain' }}
            onClick={() => setImagePreviewOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
} 