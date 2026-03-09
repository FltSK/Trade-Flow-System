using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Services
{
    public class OrderService
    {
        private readonly ApplicationDbContext _context;

        public OrderService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<List<OrderDto>>> GetAllOrdersAsync()
        {
            try
            {
                var orders = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Stok)
                    .OrderByDescending(o => o.SiparisTarihi)
                    .Select(o => new OrderDto
                    {
                        Id = o.Id,
                        CustomerId = o.CustomerId,
                        CustomerName = o.Customer.AdSoyad,
                        StokId = o.StokId,
                        StokAdi = $"{o.Stok.Marka} {o.Stok.Model}",
                        Status = o.Status,
                        Miktar = o.Miktar,
                        SiparisTarihi = o.SiparisTarihi,
                        TahsisTarihi = o.TahsisTarihi,
                        TamamlanmaTarihi = o.TamamlanmaTarihi,
                        Notlar = o.Notlar,
                        OlusturanKullanici = o.OlusturanKullanici,
                        OlusturmaTarihi = o.OlusturmaTarihi
                    })
                    .ToListAsync();

                return new ApiResponse<List<OrderDto>>
                {
                    Success = true,
                    Data = orders,
                    Message = "Siparişler başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<OrderDto>>
                {
                    Success = false,
                    Message = $"Siparişler getirilirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<OrderDto>> GetOrderByIdAsync(int id)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Stok)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return new ApiResponse<OrderDto>
                    {
                        Success = false,
                        Message = "Sipariş bulunamadı"
                    };
                }

                var orderDto = new OrderDto
                {
                    Id = order.Id,
                    CustomerId = order.CustomerId,
                    CustomerName = order.Customer.AdSoyad,
                    StokId = order.StokId,
                    StokAdi = $"{order.Stok.Marka} {order.Stok.Model}",
                    Status = order.Status,
                    Miktar = order.Miktar,
                    SiparisTarihi = order.SiparisTarihi,
                    TahsisTarihi = order.TahsisTarihi,
                    TamamlanmaTarihi = order.TamamlanmaTarihi,
                    Notlar = order.Notlar,
                    OlusturanKullanici = order.OlusturanKullanici,
                    OlusturmaTarihi = order.OlusturmaTarihi
                };

                return new ApiResponse<OrderDto>
                {
                    Success = true,
                    Data = orderDto,
                    Message = "Sipariş başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = $"Sipariş getirilirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<OrderDto>> CreateOrderAsync(CreateOrderDto createOrderDto)
        {
            try
            {
                // debug log removed
                
                // Müşteri ve stok kontrolü
                var customer = await _context.Customers.FindAsync(createOrderDto.CustomerId);
                // debug log removed
                
                if (customer == null)
                {
                    return new ApiResponse<OrderDto>
                    {
                        Success = false,
                        Message = "Müşteri bulunamadı"
                    };
                }

                var stok = await _context.Stoklar.FindAsync(createOrderDto.StokId);
                if (stok == null)
                {
                    return new ApiResponse<OrderDto>
                    {
                        Success = false,
                        Message = "Stok bulunamadı"
                    };
                }

                // Stok 0 veya altındaysa da sipariş oluşturulmalı
                var order = new Order
                {
                    CustomerId = createOrderDto.CustomerId,
                    StokId = createOrderDto.StokId,
                    Status = "Bekliyor",
                    Miktar = createOrderDto.Miktar,
                    SiparisTarihi = DateTime.UtcNow,
                    Notlar = createOrderDto.Notlar,
                    OlusturanKullanici = createOrderDto.OlusturanKullanici,
                    OlusturmaTarihi = DateTime.UtcNow,
                    GuncellemeTarihi = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Stok rezervasyonu oluştur
                var rezervasyon = new StokRezervasyon
                {
                    StokId = createOrderDto.StokId,
                    OrderId = order.Id,
                    RezerveEdilenMiktar = createOrderDto.Miktar,
                    RezervasyonTarihi = DateTime.UtcNow,
                    Durum = "Bekliyor",
                    Aciklama = $"Müşteri siparişi: {customer.AdSoyad}",
                    OlusturanKullanici = createOrderDto.OlusturanKullanici,
                    OlusturmaTarihi = DateTime.UtcNow,
                    GuncellemeTarihi = DateTime.UtcNow
                };

                _context.StokRezervasyonlari.Add(rezervasyon);
                await _context.SaveChangesAsync();

                // Tahsis işlemi stok girişiyle yapılır; burada tekrar stok azaltma yok

                var orderDto = new OrderDto
                {
                    Id = order.Id,
                    CustomerId = order.CustomerId,
                    CustomerName = customer.AdSoyad,
                    StokId = order.StokId,
                    StokAdi = $"{stok.Marka} {stok.Model}",
                    Status = order.Status,
                    Miktar = order.Miktar,
                    SiparisTarihi = order.SiparisTarihi,
                    TahsisTarihi = order.TahsisTarihi,
                    TamamlanmaTarihi = order.TamamlanmaTarihi,
                    Notlar = order.Notlar,
                    OlusturanKullanici = order.OlusturanKullanici,
                    OlusturmaTarihi = order.OlusturmaTarihi
                };

                return new ApiResponse<OrderDto>
                {
                    Success = true,
                    Data = orderDto,
                    Message = "Sipariş başarıyla oluşturuldu"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = $"Sipariş oluşturulurken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<OrderDto>> UpdateOrderAsync(int id, UpdateOrderDto updateOrderDto)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                {
                    return new ApiResponse<OrderDto>
                    {
                        Success = false,
                        Message = "Sipariş bulunamadı"
                    };
                }

                order.Status = updateOrderDto.Status;
                order.TahsisTarihi = updateOrderDto.TahsisTarihi;
                order.TamamlanmaTarihi = updateOrderDto.TamamlanmaTarihi;
                order.Notlar = updateOrderDto.Notlar;
                order.GuncelleyenKullanici = updateOrderDto.GuncelleyenKullanici;
                order.GuncellemeTarihi = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Stok rezervasyonunu güncelle
                var rezervasyon = await _context.StokRezervasyonlari
                    .FirstOrDefaultAsync(r => r.OrderId == id);
                
                if (rezervasyon != null)
                {
                    rezervasyon.Durum = updateOrderDto.Status;
                    rezervasyon.TahsisTarihi = updateOrderDto.TahsisTarihi;
                    rezervasyon.GuncellemeTarihi = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                var customer = await _context.Customers.FindAsync(order.CustomerId);
                var stok = await _context.Stoklar.FindAsync(order.StokId);

                var orderDto = new OrderDto
                {
                    Id = order.Id,
                    CustomerId = order.CustomerId,
                    CustomerName = customer?.AdSoyad ?? "",
                    StokId = order.StokId,
                    StokAdi = stok != null ? $"{stok.Marka} {stok.Model}" : "",
                    Status = order.Status,
                    Miktar = order.Miktar,
                    SiparisTarihi = order.SiparisTarihi,
                    TahsisTarihi = order.TahsisTarihi,
                    TamamlanmaTarihi = order.TamamlanmaTarihi,
                    Notlar = order.Notlar,
                    OlusturanKullanici = order.OlusturanKullanici,
                    OlusturmaTarihi = order.OlusturmaTarihi
                };

                return new ApiResponse<OrderDto>
                {
                    Success = true,
                    Data = orderDto,
                    Message = "Sipariş başarıyla güncellendi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = $"Sipariş güncellenirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteOrderAsync(int id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Sipariş bulunamadı"
                    };
                }

                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Sipariş başarıyla silindi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Sipariş silinirken hata oluştu: {ex.Message}"
                };
            }
        }

        // Stok tahsisi için yardımcı metod
        private async Task CheckAndAllocateStockAsync(int stokId, int availableUnits)
        {
            var stok = await _context.Stoklar.FindAsync(stokId);
            if (stok == null) return;

            // Bekleyen rezervasyonları randevu tarihine göre sırala
            var bekleyenRezervasyonlar = await _context.StokRezervasyonlari
                .Include(r => r.Order)
                .ThenInclude(o => o.Customer)
                .Where(r => r.StokId == stokId && r.Durum == "Bekliyor")
                .OrderBy(r => r.Order.Customer.RandevuTarihi ?? DateOnly.MaxValue)
                .ThenBy(r => r.RezervasyonTarihi)
                .ToListAsync();

            int remaining = availableUnits;
            foreach (var rezervasyon in bekleyenRezervasyonlar)
            {
                if (remaining <= 0) break;

                int ihtiyac = rezervasyon.RezerveEdilenMiktar;
                var order = rezervasyon.Order;
                
                if (remaining >= ihtiyac)
                {
                    // Tam karşılama - tüm rezervasyon tahsis edildi
                    remaining -= ihtiyac;
                    
                    rezervasyon.Durum = "TahsisEdildi";
                    rezervasyon.TahsisTarihi = DateTime.UtcNow;
                    rezervasyon.GuncellemeTarihi = DateTime.UtcNow;

                    order.Status = "TahsisEdildi";
                    order.TahsisTarihi = DateTime.UtcNow;
                    order.GuncellemeTarihi = DateTime.UtcNow;
                }
                else
                {
                    // Kısmi karşılama - rezervasyon ve sipariş miktarını düşür
                    int tahsisEdilen = remaining;
                    remaining = 0;
                    
                    // Mevcut rezervasyonu tahsis edilen miktara düşür
                    rezervasyon.RezerveEdilenMiktar -= tahsisEdilen;
                    rezervasyon.GuncellemeTarihi = DateTime.UtcNow;
                    
                    // Order miktarını da düşür
                    order.Miktar -= tahsisEdilen;
                    order.GuncellemeTarihi = DateTime.UtcNow;
                    
                    // Tahsis edilen miktar için yeni bir "TahsisEdildi" rezervasyon oluştur
                    var tahsisRezervasyonu = new StokRezervasyon
                    {
                        StokId = rezervasyon.StokId,
                        OrderId = rezervasyon.OrderId,
                        RezerveEdilenMiktar = tahsisEdilen,
                        RezervasyonTarihi = rezervasyon.RezervasyonTarihi,
                        TahsisTarihi = DateTime.UtcNow,
                        Durum = "TahsisEdildi",
                        Aciklama = $"Kısmi tahsis: {tahsisEdilen} adet (Toplam: {ihtiyac} adet)",
                        OlusturanKullanici = rezervasyon.OlusturanKullanici,
                        OlusturmaTarihi = DateTime.UtcNow,
                        GuncellemeTarihi = DateTime.UtcNow
                    };
                    
                    _context.StokRezervasyonlari.Add(tahsisRezervasyonu);
                    
                    // Orijinal rezervasyonun açıklamasını güncelle
                    rezervasyon.Aciklama = $"Kısmi bekleyen: {rezervasyon.RezerveEdilenMiktar} adet (Orijinal: {ihtiyac} adet)";
                    
                    // Order durumu bekliyor kalsın çünkü henüz tam karşılanmadı
                    // order.Status = "Bekliyor"; // zaten bekliyor
                }
            }

            await _context.SaveChangesAsync();
        }

        // Stok güncellendiğinde çağrılacak metod
        public async Task AllocatePendingOrdersAsync(int stokId, int addedUnits)
        {
            if (addedUnits <= 0) return;
            await CheckAndAllocateStockAsync(stokId, addedUnits);
        }
    }
} 