import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { API_BASE_URL, formatFileSize, apiPreviewSozlesme, apiGetSozlesmeBlobUrl } from '../utils/helpers';

export default function JobInfoDialog({
  open,
  onClose,
  jobInfoData,
  onDownload,
  onDeleteFile,
  onImageClick
}) {
  if (!open || !jobInfoData) return null;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Mobil kontrolü
  const previewUrl = `${API_BASE_URL}/customers/${jobInfoData.id}/download-sozlesme?inline=true`;

  // Blob tabanlı önizleme URL'i (header gerektirmeyen)
  const [blobPreviewUrl, setBlobPreviewUrl] = useState('');
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    let revokedUrl = '';
    const loadBlob = async () => {
      if (!open || !jobInfoData?.id || !jobInfoData?.sozlesmeDosyaAdi) {
        setBlobPreviewUrl('');
        setPdfError('');
        return;
      }
      
      const res = await apiGetSozlesmeBlobUrl(jobInfoData.id);
      
      if (res.success && res.url) {
        setBlobPreviewUrl(res.url);
        setPdfError('');
        revokedUrl = res.url; // cleanup için sakla
      } else {
        setBlobPreviewUrl('');
        setPdfError(res.error || 'Dosya yüklenemedi');
      }
    };
    loadBlob();
    return () => {
      if (revokedUrl) {
        try { window.URL.revokeObjectURL(revokedUrl); } catch {}
      }
    };
    // yalnızca dialog açılıp kapanması veya dosya değiştiğinde tetikleyelim
  }, [open, jobInfoData?.id, jobInfoData?.sozlesmeDosyaAdi]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      disableEnforceFocus
      disableAutoFocus
    >
      <DialogTitle>İş Detayları</DialogTitle>
      <DialogContent>
        <Box sx={{ p:1 }}>
          <Typography variant="subtitle1" sx={{ mb:1 }}><strong>İş Bilgileri</strong></Typography>
          <Typography variant="body2"><strong>Yapılan İş:</strong> {jobInfoData.yapilanIs || '-'}</Typography>
          {jobInfoData.boruTipi && (
            <Typography variant="body2"><strong>Boru Tipi:</strong> {jobInfoData.boruTipi}</Typography>
          )}
          <Typography variant="body2"><strong>Satılan Cihaz:</strong> {jobInfoData.satilanCihaz || '-'}</Typography>
          {jobInfoData.ustaAtamalari && jobInfoData.ustaAtamalari.length>0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2"><strong>Ustalar:</strong></Typography>
              <Box sx={{ display:'flex', flexDirection:'column', gap:0.5 }}>
                {jobInfoData.ustaAtamalari.map((a, i)=> (
                  <Typography key={i} variant="body2">- {a.ustaAdSoyad}{a.note?` (${a.note})`:''}</Typography>
                ))}
              </Box>
            </Box>
          )}
          {jobInfoData.yapilanIs?.includes('kombi') && (
            <Typography variant="body2"><strong>Termostat:</strong> {jobInfoData.termostat || '-'}</Typography>
          )}

          <Divider sx={{ my:2 }} />
          <Typography variant="subtitle1" sx={{ mb:1 }}><strong>İletişim Bilgileri</strong></Typography>
          <Typography variant="body2"><strong>Telefon:</strong> {jobInfoData.telefon || '-'}</Typography>
          <Typography variant="body2"><strong>Adres:</strong> {jobInfoData.adres || '-'}</Typography>
          <Typography variant="body2"><strong>TC Kimlik:</strong> {jobInfoData.tcKimlik || '-'}</Typography>

          <Divider sx={{ my:2 }} />
          <Typography variant="subtitle1" sx={{ mb:1 }}><strong>Sözleşme Dosyası</strong></Typography>
          {jobInfoData.sozlesmeDosyaAdi ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${jobInfoData.sozlesmeDosyaAdi} (${formatFileSize(jobInfoData.sozlesmeDosyaBoyutu)})`} 
                  color="primary" 
                  variant="outlined"
                />
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={() => onDownload(jobInfoData.id, jobInfoData.sozlesmeDosyaAdi)}
                  title="Dosyayı İndir"
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onDeleteFile(jobInfoData.id)}
                  title="Dosyayı Sil"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              {(jobInfoData.sozlesmeDosyaTipi?.startsWith('image/')) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Sözleşme Önizlemesi:
                  </Typography>
                  {pdfError ? (
                    <Box 
                      sx={{ 
                        width: '100%', 
                        p: 3,
                        border: '2px dashed #ff9800',
                        borderRadius: 1,
                        backgroundColor: '#fff3e0',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body1" color="warning.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ⚠️ Dosya Bulunamadı
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pdfError}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Dosya adı: {jobInfoData.sozlesmeDosyaAdi}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        💡 Çözüm: Bu müşteri için sözleşme dosyasını yeniden yükleyin.
                      </Typography>
                    </Box>
                  ) : (
                    <Box 
                      component="img"
                      src={blobPreviewUrl || previewUrl}
                      alt="Sözleşme Önizlemesi"
                      loading="lazy"
                      decoding="async"
                      onClick={async () => { await apiPreviewSozlesme(jobInfoData.id); }}
                      sx={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px', 
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        boxShadow: 1,
                        cursor: 'zoom-in'
                      }}
                    />
                  )}
                </Box>
              )}
              {(jobInfoData.sozlesmeDosyaTipi === 'application/pdf') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Sözleşme Önizlemesi (PDF):
                  </Typography>
                  {pdfError ? (
                    <Box 
                      sx={{ 
                        width: '100%', 
                        p: 3,
                        border: '2px dashed #ff9800',
                        borderRadius: 1,
                        backgroundColor: '#fff3e0',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body1" color="warning.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ⚠️ PDF Dosyası Bulunamadı
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pdfError}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Dosya adı: {jobInfoData.sozlesmeDosyaAdi}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        💡 Çözüm: Bu müşteri için sözleşme dosyasını yeniden yükleyin.
                      </Typography>
                    </Box>
                  ) : isMobile ? (
                    // Mobil: PDF'i yeni sekmede aç butonu
                    <Box 
                      sx={{ 
                        width: '100%', 
                        p: 3,
                        border: '2px dashed #2196f3',
                        borderRadius: 1,
                        backgroundColor: '#e3f2fd',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold', mb: 2 }}>
                        📱 Mobil PDF Görüntüleme
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Mobil cihazlarda daha iyi görüntüleme için PDF'i yeni sekmede açın.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => {
                          if (blobPreviewUrl) {
                            window.open(blobPreviewUrl, '_blank');
                          }
                        }}
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        PDF'i Yeni Sekmede Aç
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        💡 Yeni sekmede kaydırma, zoom ve tüm PDF özellikleri çalışır
                      </Typography>
                    </Box>
                  ) : (
                    // Desktop: Normal iframe
                    <Box 
                      component="iframe"
                      id="pdfPreviewIframe"
                      src={blobPreviewUrl || 'about:blank'}
                      loading="lazy"
                      sx={{ 
                        width: '100%', 
                        height: 500,
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        boxShadow: 1
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">Kayıtlı sözleşme dosyası bulunmuyor.</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
}


