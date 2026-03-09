import React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import TableSortLabel from '@mui/material/TableSortLabel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import { hesaplaTotalOdenen, hesaplaKalanOdeme, formatNumber, apiGetSozlesmeBlobUrl } from '../utils/helpers';

/**
 * Optimized ClientTable component wrapped with React.memo
 * Prevents unnecessary re-renders when parent state changes
 */
const ClientTable = React.memo(({
  sortedMusteriler,
  user,
  sortField,
  sortOrder,
  handleSort,
  handleOpen,
  handleOdemeDetayOpen,
  handleOdemeEkleOpen,
  handleDeleteClick,
  buildJobInfo,
  setJobInfoData,
  setJobInfoOpen,
  setBlobPreviewUrl,
  handleFileDownload,
  handleDeleteSozlesme
}) => {
  return (
    <TableContainer component={Paper} sx={{ 
      overflowX: 'auto', 
      boxShadow: 3, 
      borderRadius: 2, 
      maxHeight: 600,
      '& .MuiTable-root': {
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
      },
      '& .MuiTableCell-root': {
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        padding: { xs: '8px 4px', sm: '12px 8px' }
      },
      '& .numeric': {
        whiteSpace: 'nowrap',
        writingMode: 'horizontal-tb',
        direction: 'ltr'
      }
    }}>
      <Table size="small" sx={{ tableLayout: 'auto' }}>
        <TableHead sx={{ bgcolor:'primary.main', '& .MuiTableCell-root': { color:'#fff', fontWeight:'bold', py: 1 } }}>
          <TableRow>
            <TableCell>Ad Soyad</TableCell>
            <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>TC Kimlik No</TableCell>
            <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Telefon</TableCell>
            <TableCell className="numeric">
              <TableSortLabel
                active={sortField==='sozlesmeTutari'}
                direction={sortField==='sozlesmeTutari'?sortOrder:'asc'}
                onClick={()=>handleSort('sozlesmeTutari')}
              >
                Sözleşme Tutarı
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              <TableSortLabel
                active={sortField==='sozlesmeTarihi'}
                direction={sortField==='sozlesmeTarihi'?sortOrder:'asc'}
                onClick={()=>handleSort('sozlesmeTarihi')}
              >
                Sözleşme Tarihi
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
              <TableSortLabel
                active={sortField==='odemeTaahhutTarihi'}
                direction={sortField==='odemeTaahhutTarihi'?sortOrder:'asc'}
                onClick={()=>handleSort('odemeTaahhutTarihi')}
              >
                Ödeme Taahhüt Tarihi
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
              <TableSortLabel
                active={sortField==='randevuTarihi'}
                direction={sortField==='randevuTarihi'?sortOrder:'asc'}
                onClick={()=>handleSort('randevuTarihi')}
              >
                Randevu Tarihi
              </TableSortLabel>
            </TableCell>
            <TableCell className="numeric">Ödenen Tutar</TableCell>
            <TableCell className="numeric">
              <TableSortLabel
                active={sortField==='kalanOdeme'}
                direction={sortField==='kalanOdeme'?sortOrder:'asc'}
                onClick={()=>handleSort('kalanOdeme')}
              >
                Kalan Ödeme
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
              <TableSortLabel
                active={sortField==='createdByUsername'}
                direction={sortField==='createdByUsername'?sortOrder:'asc'}
                onClick={()=>handleSort('createdByUsername')}
              >
                Ekleyen
              </TableSortLabel>
            </TableCell>
            
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              Durum
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
              Sözleşme Dosyası
            </TableCell>
            {['admin', 'employee'].includes(user.role) && <TableCell>İşlemler</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedMusteriler.map(musteri => {
            const toplamOdenen = hesaplaTotalOdenen(musteri.odemeler || []);
            const kalanOdeme = hesaplaKalanOdeme(musteri.sozlesmeTutari, musteri.odemeler || []);
            
            return (
              <TableRow 
                key={musteri.id} 
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'grey.50' }, 
                  '& .MuiTableCell-root': { py: 1 }
                }}
              >
                <TableCell>
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                    {musteri.adSoyad}
                    <IconButton 
                      size="small" 
                      color="info" 
                      onClick={async ()=>{
                        const info=buildJobInfo(musteri);  
                        setJobInfoData(info); 
                        setJobInfoOpen(true); 
                        if(info?.id && info?.sozlesmeDosyaAdi){ 
                          const res = await apiGetSozlesmeBlobUrl(info.id); 
                          setBlobPreviewUrl(res.success?res.url:''); 
                        } else { 
                          setBlobPreviewUrl(''); 
                        }
                      }}
                    >
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{musteri.tcKimlik}</TableCell>
                <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{musteri.telefon}</TableCell>
                <TableCell className="numeric">{formatNumber(musteri.sozlesmeTutari)} ₺</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {musteri.sozlesmeTarihi ? musteri.sozlesmeTarihi.split('T')[0] : '-'}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {musteri.odemeTaahhutTarihi ? musteri.odemeTaahhutTarihi.split('T')[0] : '-'}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {musteri.randevuTarihi ? musteri.randevuTarihi.split('T')[0] : '-'}
                </TableCell>
                <TableCell className="numeric">{formatNumber(toplamOdenen)} ₺</TableCell>
                <TableCell className="numeric" sx={{ 
                  fontWeight: kalanOdeme > 0 ? 'bold' : 'normal',
                  color: kalanOdeme > 0 ? 'error.main' : 'success.main'
                }}>
                  {formatNumber(kalanOdeme)} ₺
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {musteri.createdByUsername || '-'}
                </TableCell>
                
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {musteri.hesapYapildi ? (
                    <Chip
                      icon={<CheckIcon />}
                      label="Hesap Görüldü"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ) : (
                    kalanOdeme === 0 ? (
                      <Chip
                        label="Ödendi"
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Devam Ediyor"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )
                  )}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {musteri.sozlesmeDosyaAdi ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={`${musteri.sozlesmeDosyaAdi.substring(0, 15)}...`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleFileDownload(musteri.id, musteri.sozlesmeDosyaAdi)}
                        title="İndir"
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      {user.role === 'admin' && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteSozlesme(musteri.id)}
                          title="Sil"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ) : (
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpen(musteri)}
                      title="Dosya Yükle"
                    >
                      <UploadIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
                {['admin', 'employee'].includes(user.role) && (
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleOpen(musteri)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {user.role === 'admin' && (
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(musteri)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Badge 
                        badgeContent={(musteri.odemeler || []).length} 
                        color="info"
                        max={99}
                      >
                        <IconButton size="small" color="primary" onClick={()=>handleOdemeDetayOpen(musteri)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Badge>
                      <IconButton size="small" color="success" onClick={()=>handleOdemeEkleOpen(musteri)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  // Only re-render if these props actually change
  return (
    prevProps.sortedMusteriler === nextProps.sortedMusteriler &&
    prevProps.sortField === nextProps.sortField &&
    prevProps.sortOrder === nextProps.sortOrder &&
    prevProps.user.role === nextProps.user.role
  );
});

ClientTable.displayName = 'ClientTable';

export default ClientTable;

