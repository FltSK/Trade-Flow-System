using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.Hubs;

namespace TradeFlowSystemAPI.Services
{
    public class StokService
    {
        private readonly ApplicationDbContext _context;
        private readonly OrderService _orderService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public StokService(ApplicationDbContext context, OrderService orderService, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _orderService = orderService;
            _hubContext = hubContext;
        }

        public async Task<ApiResponse<List<StokDto>>> GetAllStoklarAsync(bool? onlyActive = null)
        {
            try
            {
                IQueryable<Stok> query = _context.Stoklar
                    .Where(s => !s.IsDeleted); // Sadece silinmemiş stokları getir

                if (onlyActive.HasValue && onlyActive.Value)
                {
                    query = query.Where(s => s.IsActive);
                }

                var stoklar = await query
                    .OrderBy(s => s.UrunTuru)
                    .ThenBy(s => s.Marka)
                    .ThenBy(s => s.Model)
                    .Select(s => new StokDto
                    {
                        Id = s.Id,
                        UrunTuru = s.UrunTuru,
                        Marka = s.Marka,
                        Model = s.Model,
                        Miktar = s.Miktar,
                        MinimumStok = s.MinimumStok,
                        BirimFiyat = s.BirimFiyat,
                        OlusturmaTarihi = s.OlusturmaTarihi,
                        GuncellemeTarihi = s.GuncellemeTarihi,
                        OlusturanKullanici = s.OlusturanKullanici,
                        GuncelleyenKullanici = s.GuncelleyenKullanici,
                        IsDeleted = s.IsDeleted,
                        IsActive = s.IsActive
                    })
                    .ToListAsync();

                return new ApiResponse<List<StokDto>>
                {
                    Success = true,
                    Data = stoklar,
                    Message = "Stoklar başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<StokDto>>
                {
                    Success = false,
                    Message = $"Stoklar getirilirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<StokDto>> GetStokByIdAsync(int id)
        {
            try
            {
                var stok = await _context.Stoklar.FindAsync(id);
                if (stok == null || stok.IsDeleted)
                {
                    return new ApiResponse<StokDto>
                    {
                        Success = false,
                        Message = "Stok bulunamadı"
                    };
                }

                var stokDto = new StokDto
                {
                    Id = stok.Id,
                    UrunTuru = stok.UrunTuru,
                    Marka = stok.Marka,
                    Model = stok.Model,
                    Miktar = stok.Miktar,
                    MinimumStok = stok.MinimumStok,
                    BirimFiyat = stok.BirimFiyat,
                    OlusturmaTarihi = stok.OlusturmaTarihi,
                    GuncellemeTarihi = stok.GuncellemeTarihi,
                    OlusturanKullanici = stok.OlusturanKullanici,
                    GuncelleyenKullanici = stok.GuncelleyenKullanici,
                    IsDeleted = stok.IsDeleted,
                    IsActive = stok.IsActive
                };

                return new ApiResponse<StokDto>
                {
                    Success = true,
                    Data = stokDto,
                    Message = "Stok başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<StokDto>
                {
                    Success = false,
                    Message = $"Stok getirilirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<StokDto>> CreateStokAsync(CreateStokDto createStokDto)
        {
            try
            {
                var stok = new Stok
                {
                    UrunTuru = createStokDto.UrunTuru,
                    Marka = createStokDto.Marka,
                    Model = createStokDto.Model,
                    Miktar = createStokDto.Miktar,
                    MinimumStok = createStokDto.MinimumStok,
                    BirimFiyat = createStokDto.BirimFiyat,
                    OlusturanKullanici = createStokDto.OlusturanKullanici,
                    OlusturmaTarihi = DateTime.UtcNow,
                    GuncellemeTarihi = DateTime.UtcNow
                };

                _context.Stoklar.Add(stok);
                await _context.SaveChangesAsync();

                var stokDto = new StokDto
                {
                    Id = stok.Id,
                    UrunTuru = stok.UrunTuru,
                    Marka = stok.Marka,
                    Model = stok.Model,
                    Miktar = stok.Miktar,
                    MinimumStok = stok.MinimumStok,
                    BirimFiyat = stok.BirimFiyat,
                    OlusturmaTarihi = stok.OlusturmaTarihi,
                    GuncellemeTarihi = stok.GuncellemeTarihi,
                    OlusturanKullanici = stok.OlusturanKullanici,
                    GuncelleyenKullanici = stok.GuncelleyenKullanici,
                    IsActive = stok.IsActive,
                    IsDeleted = stok.IsDeleted
                };

                // SignalR ile tüm kullanıcılara stok güncellemesi gönder
                await _hubContext.Clients.All.SendAsync("ReceiveStokUpdated", stokDto);

                return new ApiResponse<StokDto>
                {
                    Success = true,
                    Data = stokDto,
                    Message = "Stok başarıyla oluşturuldu"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<StokDto>
                {
                    Success = false,
                    Message = $"Stok oluşturulurken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<StokDto>> UpdateStokAsync(int id, UpdateStokDto updateStokDto)
        {
            try
            {
                var stok = await _context.Stoklar.FindAsync(id);
                if (stok == null)
                {
                    return new ApiResponse<StokDto>
                    {
                        Success = false,
                        Message = "Stok bulunamadı"
                    };
                }

                var eskiMiktar = stok.Miktar;
                
                stok.UrunTuru = updateStokDto.UrunTuru;
                stok.Marka = updateStokDto.Marka;
                stok.Model = updateStokDto.Model;
                stok.Miktar = updateStokDto.Miktar;
                stok.MinimumStok = updateStokDto.MinimumStok;
                stok.BirimFiyat = updateStokDto.BirimFiyat;
                stok.GuncelleyenKullanici = updateStokDto.GuncelleyenKullanici;
                stok.GuncellemeTarihi = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Stoğa kaç adet eklendi?
                int eklenen = updateStokDto.Miktar - eskiMiktar;
                if (eklenen > 0)
                {
                    await _orderService.AllocatePendingOrdersAsync(id, eklenen);
                }

                var stokDto = new StokDto
                {
                    Id = stok.Id,
                    UrunTuru = stok.UrunTuru,
                    Marka = stok.Marka,
                    Model = stok.Model,
                    Miktar = stok.Miktar,
                    MinimumStok = stok.MinimumStok,
                    BirimFiyat = stok.BirimFiyat,
                    OlusturmaTarihi = stok.OlusturmaTarihi,
                    GuncellemeTarihi = stok.GuncellemeTarihi,
                    OlusturanKullanici = stok.OlusturanKullanici,
                    GuncelleyenKullanici = stok.GuncelleyenKullanici,
                    IsActive = stok.IsActive,
                    IsDeleted = stok.IsDeleted
                };

                // SignalR ile tüm kullanıcılara stok güncellemesi gönder
                await _hubContext.Clients.All.SendAsync("ReceiveStokUpdated", stokDto);

                return new ApiResponse<StokDto>
                {
                    Success = true,
                    Data = stokDto,
                    Message = "Stok başarıyla güncellendi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<StokDto>
                {
                    Success = false,
                    Message = $"Stok güncellenirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteStokAsync(int id)
        {
            try
            {
                var stok = await _context.Stoklar.FindAsync(id);
                if (stok == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Stok bulunamadı"
                    };
                }

                // Ürünü tamamen silmek yerine IsDeleted alanını true yap
                stok.IsDeleted = true;
                stok.GuncellemeTarihi = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // SignalR ile tüm kullanıcılara stok silme bildirimi gönder
                await _hubContext.Clients.All.SendAsync("ReceiveStokDeleted", stok.Id, stok);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Stok başarıyla silindi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Stok silinirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> RestoreStokAsync(int id)
        {
            try
            {
                var stok = await _context.Stoklar.FindAsync(id);
                if (stok == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Stok bulunamadı"
                    };
                }

                if (!stok.IsDeleted)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Bu stok zaten aktif durumda"
                    };
                }

                // IsDeleted alanını false yaparak stoku geri yükle
                stok.IsDeleted = false;
                stok.GuncellemeTarihi = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // SignalR ile tüm kullanıcılara stok geri alma bildirimi gönder
                await _hubContext.Clients.All.SendAsync("ReceiveStokRestored", stok.Id, stok);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Stok başarıyla geri yüklendi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Stok geri yüklenirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<StokHareketiDto>> CreateStokHareketiAsync(CreateStokHareketiDto createStokHareketiDto)
        {
            try
            {
                var stok = await _context.Stoklar.FindAsync(createStokHareketiDto.StokId);
                if (stok == null)
                {
                    return new ApiResponse<StokHareketiDto>
                    {
                        Success = false,
                        Message = "Stok bulunamadı"
                    };
                }

                // Stok miktarını güncelle
                if (createStokHareketiDto.HareketTipi == "Giriş")
                {
                    stok.Miktar += createStokHareketiDto.Miktar;
                }
                else if (createStokHareketiDto.HareketTipi == "Çıkış")
                {
                    // Negatif stoğa izin ver: yetersiz stok olsa da çıkış yap
                    stok.Miktar -= createStokHareketiDto.Miktar;
                }

                stok.GuncellemeTarihi = DateTime.UtcNow;
                stok.GuncelleyenKullanici = createStokHareketiDto.KullaniciAdi;

                var stokHareketi = new StokHareketi
                {
                    StokId = createStokHareketiDto.StokId,
                    CustomerId = createStokHareketiDto.CustomerId, // Müşteri ID'sini ekle
                    Miktar = createStokHareketiDto.Miktar,
                    HareketTipi = createStokHareketiDto.HareketTipi,
                    Aciklama = createStokHareketiDto.Aciklama,
                    Tarih = DateTime.UtcNow,
                    KullaniciAdi = createStokHareketiDto.KullaniciAdi
                };

                _context.StokHareketleri.Add(stokHareketi);
                await _context.SaveChangesAsync();

                if (createStokHareketiDto.HareketTipi == "Giriş" && createStokHareketiDto.Miktar > 0)
                {
                    await _orderService.AllocatePendingOrdersAsync(createStokHareketiDto.StokId, createStokHareketiDto.Miktar);
                }

                var stokHareketiDto = new StokHareketiDto
                {
                    Id = stokHareketi.Id,
                    StokId = stokHareketi.StokId,
                    CustomerId = stokHareketi.CustomerId, // Müşteri ID'sini ekle
                    Miktar = stokHareketi.Miktar,
                    HareketTipi = stokHareketi.HareketTipi,
                    Aciklama = stokHareketi.Aciklama,
                    Tarih = stokHareketi.Tarih,
                    KullaniciAdi = stokHareketi.KullaniciAdi
                };

                // SignalR ile tüm kullanıcılara stok hareketi bildirimi gönder
                await _hubContext.Clients.All.SendAsync("ReceiveStokHareketiAdded", stokHareketiDto);

                return new ApiResponse<StokHareketiDto>
                {
                    Success = true,
                    Data = stokHareketiDto,
                    Message = "Stok hareketi başarıyla oluşturuldu"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<StokHareketiDto>
                {
                    Success = false,
                    Message = $"Stok hareketi oluşturulurken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<StokHareketiDto>>> GetAllStokHareketleriAsync()
        {
            try
            {
                var hareketler = await _context.StokHareketleri
                    .OrderByDescending(h => h.Tarih)
                    .Select(h => new StokHareketiDto
                    {
                        Id = h.Id,
                        StokId = h.StokId,
                        CustomerId = h.CustomerId, // Müşteri ID'sini ekle
                        Miktar = h.Miktar,
                        HareketTipi = h.HareketTipi,
                        Aciklama = h.Aciklama,
                        Tarih = h.Tarih,
                        KullaniciAdi = h.KullaniciAdi
                    })
                    .ToListAsync();

                return new ApiResponse<List<StokHareketiDto>>
                {
                    Success = true,
                    Data = hareketler,
                    Message = "Tüm stok hareketleri başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<StokHareketiDto>>
                {
                    Success = false,
                    Message = $"Stok hareketleri getirilirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<StokHareketiDto>>> GetStokHareketleriAsync(int stokId)
        {
            try
            {
                var hareketler = await _context.StokHareketleri
                    .Where(h => h.StokId == stokId)
                    .OrderByDescending(h => h.Tarih)
                    .Select(h => new StokHareketiDto
                    {
                        Id = h.Id,
                        StokId = h.StokId,
                        CustomerId = h.CustomerId, // Müşteri ID'sini ekle
                        Miktar = h.Miktar,
                        HareketTipi = h.HareketTipi,
                        Aciklama = h.Aciklama,
                        Tarih = h.Tarih,
                        KullaniciAdi = h.KullaniciAdi
                    })
                    .ToListAsync();

                return new ApiResponse<List<StokHareketiDto>>
                {
                    Success = true,
                    Data = hareketler,
                    Message = "Stok hareketleri başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<StokHareketiDto>>
                {
                    Success = false,
                    Message = $"Stok hareketleri getirilirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> SetActiveAsync(int id, bool isActive)
        {
            try
            {
                var stok = await _context.Stoklar.FindAsync(id);
                if (stok == null || stok.IsDeleted)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Stok bulunamadı"
                    };
                }

                stok.IsActive = isActive;
                stok.GuncellemeTarihi = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var stokDto = new StokDto
                {
                    Id = stok.Id,
                    UrunTuru = stok.UrunTuru,
                    Marka = stok.Marka,
                    Model = stok.Model,
                    Miktar = stok.Miktar,
                    MinimumStok = stok.MinimumStok,
                    BirimFiyat = stok.BirimFiyat,
                    OlusturmaTarihi = stok.OlusturmaTarihi,
                    GuncellemeTarihi = stok.GuncellemeTarihi,
                    OlusturanKullanici = stok.OlusturanKullanici,
                    GuncelleyenKullanici = stok.GuncelleyenKullanici,
                    IsActive = stok.IsActive,
                    IsDeleted = stok.IsDeleted
                };

                await _hubContext.Clients.All.SendAsync("ReceiveStokUpdated", stokDto);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = isActive ? "Stok aktife alındı" : "Stok pasife alındı"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Stok durumu güncellenirken hata oluştu: {ex.Message}"
                };
            }
        }
    }
} 