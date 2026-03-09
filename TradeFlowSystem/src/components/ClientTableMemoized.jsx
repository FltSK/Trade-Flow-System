import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { formatNumber, hesaplaTotalOdenen, hesaplaKalanOdeme } from '../utils/helpers';

/**
 * TAMAMEN İZOLE EDİLMİŞ TABLO COMPONENT
 * Dialog açılması bu component'i ETKİLEMEZ
 */
const ClientTableMemoized = React.memo(({
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
  getPendingDeleteCount,
  openTaahhutDialog,
  openRandevuDialog,
  orders,
  stokHareketleri
}) => {
  // Bu component SADECE tablo render eder
  // Dialog state'i ile HİÇBİR bağlantısı yok
  
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
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Durum</TableCell>
            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Sözleşme Dosyası</TableCell>
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
                      onClick={()=>{
                        const info = buildJobInfo(musteri);  
                        setJobInfoData(info); 
                        setJobInfoOpen(true);
                        // PDF useEffect'te JobInfoDialog içinde yüklenecek
                      }}
                    >
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {musteri.tcKimlik}
                </TableCell>
                <TableCell className="numeric" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {musteri.telefon}
                </TableCell>
                <TableCell className="numeric">
                  <Chip label={`${formatNumber(musteri.sozlesmeTutari)} ₺`} color="info" size="small"/>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {musteri.sozlesmeTarihi}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                    {kalanOdeme !== 0 ? musteri.odemeTaahhutTarihi : '-'}
                    {kalanOdeme !== 0 && ['admin','employee'].includes(user.role) && (
                      <IconButton size="small" onClick={()=>openTaahhutDialog(musteri)}>
                        <DateRangeIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                    {musteri.randevuTarihi || '-'}
                    {['admin','employee'].includes(user.role) && (
                      <IconButton size="small" onClick={()=>openRandevuDialog(musteri)}>
                        <DateRangeIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
                <TableCell className="numeric">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={`${formatNumber(toplamOdenen)} ₺`} 
                      color={toplamOdenen === musteri.sozlesmeTutari ? "primary" : "default"} 
                      size="small" 
                    />
                    <Badge 
                      badgeContent={user.role === 'admin' ? getPendingDeleteCount(musteri.id) : 0} 
                      color="error"
                      invisible={user.role !== 'admin' || getPendingDeleteCount(musteri.id) === 0}
                    >
                      <IconButton size="small" onClick={() => handleOdemeDetayOpen(musteri)} color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Badge>
                    <IconButton size="small" onClick={() => handleOdemeEkleOpen(musteri)} color="success">
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell className="numeric">
                  {musteri.hesapYapildi ? (
                    <Chip label="Tamamlandı" color="info" size="small" />
                  ) : kalanOdeme === 0 ? (
                    <Chip label="Ödendi" color="success" size="small" />
                  ) : (
                    <Chip label={`${formatNumber(kalanOdeme)} ₺`} color="error" size="small" />
                  )}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  <Chip 
                    label={musteri.createdByUsername || (musteri.createdAt ? 'Eski Kayıt' : 'Bilinmiyor')} 
                    color="secondary" 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {(() => {
                    const customerOrders = orders ? orders.filter(order => order.customerId === musteri.id) : [];
                    const customerStokHareketleri = stokHareketleri ? 
                      stokHareketleri.filter(hareket => 
                        hareket.customerId === musteri.id && 
                        hareket.hareketTipi === 'Çıkış'
                      ) : [];
                    
                    if (customerOrders.length > 0) {
                      const latestOrder = customerOrders.sort((a, b) => 
                        new Date(b.siparisTarihi) - new Date(a.siparisTarihi)
                      )[0];
                      
                      switch (latestOrder.status) {
                        case 'Bekliyor':
                          return <Chip label="Bekliyor" color="warning" size="small" variant="outlined" />;
                        case 'TahsisEdildi':
                          return <Chip label="Tahsis Edildi" color="info" size="small" variant="outlined" />;
                        default:
                          return <Chip label="Bekliyor" color="warning" size="small" variant="outlined" />;
                      }
                    }
                    
                    if (customerStokHareketleri.length > 0) {
                      return <Chip label="Tahsis Edildi" color="info" size="small" variant="outlined" />;
                    }
                    
                    return <Chip label="Tahsis Edilmedi" color="default" size="small" variant="outlined" />;
                  })()}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {musteri.sozlesmeDosyaAdi ? (
                    <Chip label="Var" color="success" size="small" />
                  ) : (
                    <Chip label="Yok" color="default" size="small" />
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
  // ÇOK KATKAT KARŞILAŞTIRMA
  // SADECE bu değerler değişirse render yap, yoksa yapma!
  return (
    prevProps.sortedMusteriler === nextProps.sortedMusteriler &&
    prevProps.sortField === nextProps.sortField &&
    prevProps.sortOrder === nextProps.sortOrder &&
    prevProps.user?.role === nextProps.user?.role &&
    prevProps.orders === nextProps.orders &&
    prevProps.stokHareketleri === nextProps.stokHareketleri
  );
});

ClientTableMemoized.displayName = 'ClientTableMemoized';

export default ClientTableMemoized;

