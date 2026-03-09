using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Hubs;
using TradeFlowSystemAPI.Services;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IJwtService _jwtService;
        private readonly IActivityLogService _activityLogService;
        private readonly OrderService _orderService;
        private readonly IEmailService _emailService;
        private readonly FileUploadService _fileUploadService;

        public CustomersController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext, IJwtService jwtService, IActivityLogService activityLogService, IEmailService emailService, FileUploadService fileUploadService, OrderService orderService)
        {
            _context = context;
            _hubContext = hubContext;
            _jwtService = jwtService;
            _activityLogService = activityLogService;
            _emailService = emailService;
            _fileUploadService = fileUploadService;
            _orderService = orderService;
        }

        // Gelen satır veya DTO boş değer içeriyorsa mevcut değeri korur
        private static string Keep(string? incoming, string? fallback, string? current)
        {
            if (!string.IsNullOrWhiteSpace(incoming)) return incoming!;
            if (!string.IsNullOrWhiteSpace(fallback)) return fallback!;
            return current ?? "";
        }

        // GET: api/customers/{id}/ustalar
        [HttpGet("{id}/ustalar")]
        public async Task<IActionResult> GetUstaAssignments(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound("Müşteri bulunamadı");

            var list = await _context.CustomerUstaAssignments
                .Where(a => a.CustomerId == id)
                .Select(a => new
                {
                    ustaId = a.UstaId,
                    ustaAdSoyad = _context.Ustalar.Where(u => u.Id == a.UstaId).Select(u => u.AdSoyad).FirstOrDefault(),
                    note = a.Note
                })
                .ToListAsync();

            return Ok(new { success = true, data = list });
        }
        // PUT: api/customers/{id}/ustalar
        [HttpPut("{id}/ustalar")]
        public async Task<IActionResult> UpsertUstaAssignments(int id, [FromBody] List<UstaAssignmentDto> assignments)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound("Müşteri bulunamadı");

            // Mevcut atamaları al
            var existing = await _context.CustomerUstaAssignments.Where(a => a.CustomerId == id).ToListAsync();

            // Silinmesi gerekenler
            var incomingPairs = assignments.Select(a => (a.UstaId, (a.Note ?? string.Empty).Trim())).ToList();
            var toDelete = existing.Where(e => !incomingPairs.Any(p => p.UstaId == e.UstaId && p.Item2 == (e.Note ?? string.Empty).Trim())).ToList();
            if (toDelete.Count > 0)
            {
                _context.CustomerUstaAssignments.RemoveRange(toDelete);
            }

            // Eklenecek/güncellenecekler
            foreach (var dto in assignments)
            {
                var note = (dto.Note ?? string.Empty).Trim();
                var match = existing.FirstOrDefault(e => e.UstaId == dto.UstaId && (e.Note ?? string.Empty).Trim() == note);
                if (match == null)
                {
                    _context.CustomerUstaAssignments.Add(new CustomerUstaAssignment
                    {
                        CustomerId = id,
                        UstaId = dto.UstaId,
                        Note = note,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    match.Note = note;
                    match.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            // Atama sonrası ustalara iş bilgisi maili gönder
            try
            {
                var ustaIds = assignments.Select(a => a.UstaId).Distinct().ToList();
                var ustalar = await _context.Ustalar.Where(u => ustaIds.Contains(u.Id) && u.IsActive && !string.IsNullOrEmpty(u.Email)).ToListAsync();
                foreach (var usta in ustalar)
                {
                    var note = assignments.FirstOrDefault(a => a.UstaId == usta.Id)?.Note;
                    await _emailService.SendUstaJobInfoEmailAsync(
                        usta.Email!,
                        usta.AdSoyad,
                        customer.AdSoyad,
                        customer.RandevuTarihi?.ToString("dd.MM.yyyy"),
                        customer.Adres,
                        customer.Telefon,
                        note,
                        customer.YapilanIs
                    );
                }
            }
            catch { }

            return Ok(new { success = true });
        }
        // GET: api/customers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCustomers()
        {
            // Müşterileri ve ödemeleri ayrı al (Include içi OrderBy karmaşasını önle)
            var customers = await _context.Customers
                .Include(c => c.Payments)
                .AsNoTracking()
                .ToListAsync();

            // Sold devices tümünü alıp müşteriId'ye göre grupla (left join eşleniği)
            var soldDict = await _context.CustomerSoldDevices
                .AsNoTracking()
                .GroupBy(s => s.CustomerId)
                .ToDictionaryAsync(g => g.Key, g => g.ToList());

            return customers.Select(c => 
            {
                var soldDevices = soldDict.ContainsKey(c.Id) ? soldDict[c.Id] : new List<CustomerSoldDevice>();
                var firstDevice = soldDevices.FirstOrDefault();
                
                return new
                {
                    c.Id,
                    c.AdSoyad,
                    c.TcKimlik,
                    c.Telefon,
                    c.Adres,
                    c.SozlesmeTutari,
                    SozlesmeTarihi = c.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                    OdemeTaahhutTarihi = c.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                    RandevuTarihi = c.RandevuTarihi?.ToString("yyyy-MM-dd"),
                    // İlk satılan cihazdan türet; yoksa müşteri kayıt alanlarına düş
                    YapilanIs = !string.IsNullOrEmpty(firstDevice?.YapilanIs) ? firstDevice!.YapilanIs : (c.YapilanIs ?? ""),
                    SatilanCihaz = !string.IsNullOrEmpty(firstDevice?.SatilanCihaz) ? firstDevice!.SatilanCihaz : (c.SatilanCihaz ?? ""),
                    BoruTipi = !string.IsNullOrEmpty(firstDevice?.BoruTipi) ? firstDevice!.BoruTipi : (c.BoruTipi ?? ""),
                    Termostat = !string.IsNullOrEmpty(firstDevice?.Termostat) ? firstDevice!.Termostat : (c.Termostat ?? ""),
                    hesapYapildi = c.HesapYapildi,
                    debugHesapYapildi = c.HesapYapildi,
                    c.CreatedAt,
                    c.UpdatedAt,
                    c.CreatedByUsername,
                    sozlesmeDosyaAdi = c.SozlesmeDosyaAdi,
                    sozlesmeDosyaBoyutu = c.SozlesmeDosyaBoyutu,
                    sozlesmeDosyaTipi = c.SozlesmeDosyaTipi,
                    Payments = c.Payments
                        .OrderByDescending(p => p.Tarih)
                        .Select(p => new
                    {
                        p.Id,
                        p.Tutar,
                        p.Tarih,
                        p.Tur,
                        p.Toptanci,
                        p.CreatedByUsername
                    }),
                    SoldDevices = soldDevices.Select(sd => new {
                        sd.Id,
                        sd.StokId,
                        sd.Quantity,
                        sd.YapilanIs,
                        sd.SatilanCihaz,
                        sd.BoruTipi,
                        sd.Termostat,
                        sd.DaireBilgisi,
                        sd.CreatedAt,
                        sd.UpdatedAt
                    })
                };
            }).ToList();
        }

        // GET: api/customers/date-range
        [HttpGet("date-range")]
        public async Task<ActionResult<object>> GetCustomersByDateRange([FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            var query = _context.Customers
                .Include(c => c.Payments.OrderByDescending(p => p.Tarih))
                .AsNoTracking();

            // Tarih filtresi uygula
            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
            {
                query = query.Where(c => c.OdemeTaahhutTarihi >= start);
            }

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
            {
                query = query.Where(c => c.OdemeTaahhutTarihi <= end);
            }

            var customers = await query
                .Join(_context.CustomerSoldDevices,
                    c => c.Id,
                    csd => csd.CustomerId,
                    (c, csd) => new { c, csd })
                .GroupBy(x => x.c)
                .Select(g => new {
                    Customer = g.Key,
                    SoldDevices = g.Select(x => x.csd).ToList()
                })
                .ToListAsync();

            // Toplam hesaplamaları
            var totals = new
            {
                ToplamSozlesmeTutari = customers.Sum(x => x.Customer.SozlesmeTutari),
                ToplamOdenenTutar = customers.Sum(x => x.Customer.Payments.Sum(p => p.Tutar)),
                ToplamKalanOdeme = customers.Sum(x => x.Customer.SozlesmeTutari - x.Customer.Payments.Sum(p => p.Tutar)),
                MusteriSayisi = customers.Count
            };

            var customerData = customers.Select(x => 
            {
                var firstDevice = x.SoldDevices.FirstOrDefault();
                
                return new
                {
                    x.Customer.Id,
                    x.Customer.AdSoyad,
                    x.Customer.TcKimlik,
                    x.Customer.Telefon,
                    x.Customer.Adres,
                    x.Customer.SozlesmeTutari,
                    SozlesmeTarihi = x.Customer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                    OdemeTaahhutTarihi = x.Customer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                    RandevuTarihi = x.Customer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                    // İlk satılan cihazdan türet
                    YapilanIs = firstDevice?.YapilanIs ?? "",
                    SatilanCihaz = firstDevice?.SatilanCihaz ?? "",
                    BoruTipi = firstDevice?.BoruTipi ?? "",
                    Termostat = firstDevice?.Termostat ?? "",
                    hesapYapildi = x.Customer.HesapYapildi,
                    x.Customer.CreatedAt,
                    x.Customer.UpdatedAt,
                    x.Customer.CreatedByUsername,
                    sozlesmeDosyaAdi = x.Customer.SozlesmeDosyaAdi,
                    sozlesmeDosyaBoyutu = x.Customer.SozlesmeDosyaBoyutu,
                    sozlesmeDosyaTipi = x.Customer.SozlesmeDosyaTipi,
                    Payments = x.Customer.Payments.Select(p => new
                    {
                        p.Id,
                        p.Tutar,
                        p.Tarih,
                        p.Tur,
                        p.Toptanci,
                        p.CreatedByUsername
                    }),
                    SoldDevices = x.SoldDevices.Select(sd => new {
                        sd.Id,
                        sd.StokId,
                        sd.Quantity,
                        sd.YapilanIs,
                        sd.SatilanCihaz,
                        sd.BoruTipi,
                        sd.Termostat,
                        sd.DaireBilgisi,
                        sd.CreatedAt,
                        sd.UpdatedAt
                    })
                };
            }).ToList();

            return new
            {
                Customers = customerData,
                Totals = totals
            };
        }

        // GET: api/customers/filters
        [HttpGet("filters")]
        public async Task<ActionResult<object>> GetCustomerFilters()
        {
            // Ekleyen kullanıcıları al
            var ekleyenler = await _context.Customers
                .Where(c => !string.IsNullOrEmpty(c.CreatedByUsername))
                .Select(c => c.CreatedByUsername)
                .Distinct()
                .OrderBy(username => username)
                .ToListAsync();

            // Ustaları CustomerUstaAssignments üzerinden al
            var ustaIds = await _context.CustomerUstaAssignments
                .Select(a => a.UstaId)
                .Distinct()
                .ToListAsync();

            var ustalar = await _context.Ustalar
                .Where(u => ustaIds.Contains(u.Id))
                .Select(u => u.AdSoyad)
                .Distinct()
                .OrderBy(name => name)
                .ToListAsync();

            return Ok(new { ekleyenler, ustalar });
        }

        // GET: api/customers/filtered
        [HttpGet("filtered")]
        public async Task<ActionResult<object>> GetFilteredCustomers(
            [FromQuery] string? ekleyen,
            [FromQuery] string? usta)
        {
            var query = _context.Customers
                .Include(c => c.Payments.OrderByDescending(p => p.Tarih))
                .AsNoTracking();

            // Ekleyen filtresi
            if (!string.IsNullOrEmpty(ekleyen))
            {
                query = query.Where(c => c.CreatedByUsername == ekleyen);
            }

            // Usta filtresi
            if (!string.IsNullOrEmpty(usta))
            {
                query = query.Where(c => c.UstaIsmi == usta);
            }

            var customers = await query
                .GroupJoin(_context.CustomerSoldDevices,
                    c => c.Id,
                    csd => csd.CustomerId,
                    (c, csds) => new { Customer = c, SoldDevices = csds })
                .ToListAsync();

            var customerData = customers.Select(x => new
            {
                x.Customer.Id,
                x.Customer.AdSoyad,
                x.Customer.TcKimlik,
                x.Customer.Telefon,
                x.Customer.Adres,
                x.Customer.SozlesmeTutari,
                SozlesmeTarihi = x.Customer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                OdemeTaahhutTarihi = x.Customer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                RandevuTarihi = x.Customer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                x.Customer.YapilanIs,
                x.Customer.BoruTipi,
                x.Customer.SatilanCihaz,
                x.Customer.Termostat,
                // Not mapped anymore
                hesapYapildi = x.Customer.HesapYapildi,
                x.Customer.CreatedAt,
                x.Customer.UpdatedAt,
                x.Customer.CreatedByUsername,
                sozlesmeDosyaAdi = x.Customer.SozlesmeDosyaAdi,
                sozlesmeDosyaBoyutu = x.Customer.SozlesmeDosyaBoyutu,
                sozlesmeDosyaTipi = x.Customer.SozlesmeDosyaTipi,
                Payments = x.Customer.Payments.Select(p => new
                {
                    p.Id,
                    p.Tutar,
                    p.Tarih,
                    p.Tur,
                    p.Toptanci,
                    p.CreatedByUsername
                }),
                SoldDevices = x.SoldDevices.Select(sd => new {
                    sd.Id,
                    sd.StokId,
                    sd.Quantity,
                    sd.YapilanIs,
                    sd.SatilanCihaz,
                    sd.BoruTipi,
                    sd.Termostat,
                    sd.DaireBilgisi,
                    sd.CreatedAt,
                    sd.UpdatedAt
                })
            }).ToList();

            return Ok(new { customers = customerData });
        }

        // GET: api/customers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCustomer(int id)
        {
            var customer = await _context.Customers
                .Include(c => c.Payments.OrderByDescending(p => p.Tarih))
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound();
            }

            return new
            {
                customer.Id,
                customer.AdSoyad,
                customer.TcKimlik,
                customer.Telefon,
                customer.Adres,
                customer.SozlesmeTutari,
                SozlesmeTarihi = customer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                OdemeTaahhutTarihi = customer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                RandevuTarihi = customer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                customer.YapilanIs,
                customer.BoruTipi,
                customer.SatilanCihaz,
                customer.Termostat,
                // Not mapped anymore
                hesapYapildi = customer.HesapYapildi,
                customer.CreatedAt,
                customer.UpdatedAt,
                customer.CreatedByUsername,
                sozlesmeDosyaAdi = customer.SozlesmeDosyaAdi,
                sozlesmeDosyaBoyutu = customer.SozlesmeDosyaBoyutu,
                sozlesmeDosyaTipi = customer.SozlesmeDosyaTipi,
                Payments = customer.Payments.Select(p => new
                {
                    p.Id,
                    p.Tutar,
                    p.Tarih,
                    p.Tur,
                    p.Toptanci,
                    p.CreatedByUsername
                })
            };
        }

        // POST: api/customers
        [HttpPost]
        public async Task<ActionResult<Customer>> CreateCustomer([FromBody] CreateCustomerDto dto)
        {
            // En az bir iş zorunlu: ya YapilanIs dolu ya da SoldDevices satırı gönderilmiş olmalı
            if (string.IsNullOrWhiteSpace(dto.YapilanIs))
            {
                if (dto.SoldDevices == null || dto.SoldDevices.Count == 0)
                {
                    return BadRequest("En az bir iş eklenmelidir (YapilanIs veya SoldDevices)");
                }
            }
            // JWT token'dan kullanıcı bilgisini al
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader)) return Unauthorized("Authorization header bulunamadı");
            var token = authHeader.Split(" ").LastOrDefault();
            if (string.IsNullOrEmpty(token)) return Unauthorized("Geçersiz token formatı");
            var currentUser = _jwtService.GetUserFromToken(token);
            if (currentUser == null) return Unauthorized("Geçersiz token");

            var customer = new Customer
            {
                AdSoyad = (dto.AdSoyad ?? string.Empty).Trim(),
                TcKimlik = dto.TcKimlik,
                Telefon = dto.Telefon,
                Adres = dto.Adres,
                SozlesmeTutari = dto.SozlesmeTutari,
                // Tarih alanları için timezone kaymasını önlemek adına UTC'ye çevirmiyoruz; date-only olarak saklıyoruz
                SozlesmeTarihi = dto.SozlesmeTarihi?.Date,
                OdemeTaahhutTarihi = dto.OdemeTaahhutTarihi.Date,
                RandevuTarihi = dto.RandevuTarihi.HasValue ? DateOnly.FromDateTime(dto.RandevuTarihi.Value.Date) : null,
                YapilanIs = dto.YapilanIs,
                BoruTipi = dto.BoruTipi,
                SatilanCihaz = dto.SatilanCihaz,
                Termostat = dto.Termostat,
                UstaIsmi = dto.UstaIsmi,
                ToptanciIsmi = dto.ToptanciIsmi,
                HesapYapildi = dto.HesapYapildi ?? false,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                CreatedByUserId = currentUser.Id,
                CreatedByUsername = currentUser.Username
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Eğer müşteri ilk oluşturulurken HesapYapildi işaretlendiyse adminlere bilgilendirme maili gönder
            if (dto.HesapYapildi.HasValue && dto.HesapYapildi.Value)
            {
                try
                {
                    var adminUsersOnCreate = await _context.Users
                        .Where(u => u.Role == "admin")
                        .ToListAsync();

                    foreach (var admin in adminUsersOnCreate)
                    {
                        await _emailService.SendHesapYapildiEmailAsync(
                            customer.AdSoyad,
                            true,
                            admin.Email,
                            currentUser.Username,
                            customer.YapilanIs,
                            customer.Adres
                        );
                    }
                }
                catch { }
            }

            // Stok kontrolü ve azaltma (müşteri kaydı sonrası, CustomerId ile hareket yazalım)
            if (!string.IsNullOrEmpty(customer.YapilanIs) && !string.IsNullOrEmpty(customer.SatilanCihaz))
            {
                var stokUrunu = await GetStokUrunu(customer.YapilanIs, customer.SatilanCihaz);
                if (stokUrunu != null)
                {
                    // Stok miktarını azalt
                    stokUrunu.Miktar -= 1;
                    stokUrunu.GuncellemeTarihi = DateTime.UtcNow;
                    stokUrunu.GuncelleyenKullanici = currentUser.Username;

                    // Stok hareketi kaydet (CustomerId dahil)
                    var hareket = new StokHareketi
                    {
                        StokId = stokUrunu.Id,
                        CustomerId = customer.Id,
                        Miktar = -1, // Çıkış
                        HareketTipi = "Çıkış",
                        Aciklama = $"Müşteri ekleme: {customer.AdSoyad} - {customer.SatilanCihaz}",
                        Tarih = DateTime.UtcNow,
                        KullaniciAdi = currentUser.Username
                    };

                    _context.StokHareketleri.Add(hareket);
                    await _context.SaveChangesAsync();

                    // Stok güncellemesini real-time yayınla
                    if (_hubContext != null)
                    {
                        var stokDto = new
                        {
                            Id = stokUrunu.Id,
                            UrunTuru = stokUrunu.UrunTuru,
                            Marka = stokUrunu.Marka,
                            Model = stokUrunu.Model,
                            Miktar = stokUrunu.Miktar,
                            MinimumStok = stokUrunu.MinimumStok,
                            BirimFiyat = stokUrunu.BirimFiyat,
                            OlusturmaTarihi = stokUrunu.OlusturmaTarihi,
                            GuncellemeTarihi = stokUrunu.GuncellemeTarihi,
                            OlusturanKullanici = stokUrunu.OlusturanKullanici,
                            GuncelleyenKullanici = stokUrunu.GuncelleyenKullanici,
                            IsDeleted = stokUrunu.IsDeleted
                        };
                        await _hubContext.Clients.All.SendAsync("ReceiveStokUpdated", stokDto);
                    }

                    // Stok 0 veya altına düştüyse müşteriye bekleyen sipariş oluştur
                    if (stokUrunu.Miktar <= 0)
                    {
                        await _orderService.CreateOrderAsync(new CreateOrderDto
                        {
                            CustomerId = customer.Id,
                            StokId = stokUrunu.Id,
                            Miktar = 1,
                            Notlar = $"Stok yetersiz – müşteri oluşturma: {customer.AdSoyad}",
                            OlusturanKullanici = currentUser.Username
                        });
                    }
                }
            }

            // Satılan cihazlar (normal satış sistemi)
            if (dto.SoldDevices != null && dto.SoldDevices.Count > 0)
            {
                foreach (var row in dto.SoldDevices)
                {
                    if (row.Quantity <= 0) continue;
                    var jobName = (row.YapilanIs ?? "").Trim().ToLower();
                    var isKolon = jobName == "kolon"
                        || jobName == "dönüşüm" || jobName == "donusum"
                        || jobName == "dönüşüm kolon" || jobName == "donusum kolon"
                        || jobName == "dönüşüm-kolon" || jobName == "donusum-kolon"
                        || jobName == "full"
                        || jobName == "z-diğer" || jobName == "z-diger"
                        || jobName == "gaz tesisatı" || jobName == "gaz-tesisatı" || jobName == "gaz tesisati" || jobName == "gaz-tesisati"
                        || jobName == "kolon-gaz" || jobName == "kolon gaz";
                    var stok = await _context.Stoklar.FindAsync(row.StokId);
                    if (stok == null && isKolon)
                    {
                        // Kolon / gaz tesisatı gibi stok bağımsız işler için placeholder stok oluştur
                        stok = await EnsurePlaceholderStokAsync(jobName);
                    }
                    if (stok == null && !isKolon) continue; // Kolon/gaz işi için stok yoksa da devam et
                    int shortage = 0;
                    if (stok != null) // Stok varsa stok hareketlerini yap
                    {
                        var availableBefore = stok.Miktar;
                        
                        // Stok yetersizliğini doğru hesapla
                        // Eğer stokta yeterli varsa shortage = 0
                        // Eğer stokta yetersiz varsa, sadece eksik kısmı sipariş et
                        if (availableBefore >= row.Quantity)
                        {
                            // Stok yeterli, sipariş gerekmez
                            shortage = 0;
                        }
                        else if (availableBefore > 0)
                        {
                            // Kısmi stok var, sadece eksik kısmı sipariş et
                            shortage = row.Quantity - availableBefore;
                        }
                        else
                        {
                            // Stok hiç yok, talep edilen miktarın tamamını sipariş et
                            shortage = row.Quantity;
                        }
                        
                        // Stok miktarını güncelle (negatife düşebilir)
                        stok.Miktar = availableBefore - row.Quantity;
                        stok.GuncellemeTarihi = DateTime.UtcNow;
                        stok.GuncelleyenKullanici = currentUser.Username;

                        _context.StokHareketleri.Add(new StokHareketi
                        {
                            StokId = stok.Id,
                            CustomerId = customer.Id,
                            Miktar = -row.Quantity,
                            HareketTipi = "Çıkış",
                            Aciklama = $"Müşteri oluşturma: {customer.AdSoyad} - {stok.Marka} {stok.Model} ({row.Quantity} adet)",
                            Tarih = DateTime.UtcNow,
                            KullaniciAdi = currentUser.Username
                        });

                        // Stok yetersizse bekleyen sipariş oluştur
                        if (shortage > 0)
                        {
                            await _orderService.CreateOrderAsync(new CreateOrderDto
                            {
                                CustomerId = customer.Id,
                                StokId = stok.Id,
                                Miktar = shortage,
                                Notlar = $"Stok yetersiz – müşteri oluşturma: {customer.AdSoyad} ({shortage} adet eksik)",
                                OlusturanKullanici = currentUser.Username
                            });
                        }
                    }

                    _context.CustomerSoldDevices.Add(new CustomerSoldDevice
                    {
                        CustomerId = customer.Id,
                        StokId = stok.Id,
                        Quantity = row.Quantity,
                        YapilanIs = row.YapilanIs,
                        SatilanCihaz = row.SatilanCihaz,
                        BoruTipi = row.BoruTipi,
                        Termostat = row.Termostat,
                        DaireBilgisi = row.DaireBilgisi,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Satılan cihazlar sistemi (normal satış işlemleri)

            // Activity log ekle
            await _activityLogService.LogActivityAsync(
                "CREATE", 
                "CUSTOMER", 
                customer.Id, 
                customer.AdSoyad, 
                $"Müşteri eklendi: {customer.AdSoyad}", 
                currentUser.Id, 
                currentUser.Username
            );

            // Ustaya iş bilgisi maili gönder (varsa)
            try
            {
                var assignments = await _context.CustomerUstaAssignments.Where(a => a.CustomerId == customer.Id).ToListAsync();
                if (assignments.Count > 0)
                {
                    var ustaIds = assignments.Select(a => a.UstaId).Distinct().ToList();
                    var ustalar = await _context.Ustalar.Where(u => ustaIds.Contains(u.Id) && u.IsActive && !string.IsNullOrEmpty(u.Email)).ToListAsync();
                    foreach (var usta in ustalar)
                    {
                        var note = assignments.FirstOrDefault(a => a.UstaId == usta.Id)?.Note;
                        await _emailService.SendUstaJobInfoEmailAsync(
                            usta.Email!,
                            usta.AdSoyad,
                            customer.AdSoyad,
                            customer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                            customer.Adres,
                            customer.Telefon,
                            note,
                            customer.YapilanIs
                        );
                    }
                }
            }
            catch { }

            // Real-time bildirim gönder
            var customerData = new
            {
                customer.Id, customer.AdSoyad, customer.TcKimlik, customer.Telefon, customer.Adres,
                customer.SozlesmeTutari,
                SozlesmeTarihi = customer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                OdemeTaahhutTarihi = customer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                RandevuTarihi = customer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                customer.YapilanIs, customer.BoruTipi, customer.SatilanCihaz, customer.Termostat,
                customer.ToptanciIsmi, customer.CreatedAt, customer.UpdatedAt,
                CreatedBy = currentUser.Username // Include who created it
            };
            await _hubContext.Clients.All.SendAsync("CustomerCreated", customerData);

            // Oluşturulan müşteriyi soldDevices ile birlikte döndür
            var soldDevices = await _context.CustomerSoldDevices
                .Where(sd => sd.CustomerId == customer.Id)
                .ToListAsync();
                
            var responseData = new
            {
                customer.Id,
                customer.AdSoyad,
                customer.TcKimlik,
                customer.Telefon,
                customer.Adres,
                customer.SozlesmeTutari,
                SozlesmeTarihi = customer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                OdemeTaahhutTarihi = customer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                RandevuTarihi = customer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                // İlk cihazdan türet; yoksa müşteri alanlarına düş
                YapilanIs = !string.IsNullOrEmpty(soldDevices.FirstOrDefault()?.YapilanIs) ? soldDevices.FirstOrDefault()!.YapilanIs : (customer.YapilanIs ?? ""),
                SatilanCihaz = !string.IsNullOrEmpty(soldDevices.FirstOrDefault()?.SatilanCihaz) ? soldDevices.FirstOrDefault()!.SatilanCihaz : (customer.SatilanCihaz ?? ""),
                BoruTipi = !string.IsNullOrEmpty(soldDevices.FirstOrDefault()?.BoruTipi) ? soldDevices.FirstOrDefault()!.BoruTipi : (customer.BoruTipi ?? ""),
                Termostat = !string.IsNullOrEmpty(soldDevices.FirstOrDefault()?.Termostat) ? soldDevices.FirstOrDefault()!.Termostat : (customer.Termostat ?? ""),
                hesapYapildi = customer.HesapYapildi,
                customer.CreatedAt,
                customer.UpdatedAt,
                customer.CreatedByUsername,
                sozlesmeDosyaAdi = customer.SozlesmeDosyaAdi,
                sozlesmeDosyaBoyutu = customer.SozlesmeDosyaBoyutu,
                sozlesmeDosyaTipi = customer.SozlesmeDosyaTipi,
                Payments = Enumerable.Empty<object>(), // Boş payments
                SoldDevices = soldDevices.Select(sd => new {
                    sd.Id,
                    sd.StokId,
                    sd.Quantity,
                    sd.YapilanIs,
                    sd.SatilanCihaz,
                    sd.BoruTipi,
                    sd.Termostat,
                    sd.DaireBilgisi,
                    sd.CreatedAt,
                    sd.UpdatedAt
                })
            };
            
            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, responseData);
        }

        // PUT: api/customers/5
        [HttpPut("{id}")]
        public async Task<ActionResult<Customer>> UpdateCustomer(int id, UpdateCustomerDto dto)
        {
            // En az bir iş zorunlu: ya YapilanIs dolu ya da SoldDevices satırı gönderilmiş olmalı
            if (string.IsNullOrWhiteSpace(dto.YapilanIs))
            {
                if (dto.SoldDevices == null || dto.SoldDevices.Count == 0)
                {
                    return BadRequest("En az bir iş eklenmelidir (YapilanIs veya SoldDevices)");
                }
            }
            var existingCustomer = await _context.Customers.FindAsync(id);
            if (existingCustomer == null)
            {
                return NotFound();
            }

            // Mevcut değerleri sakla (stok farkı için)
            var oldYapilanIs = existingCustomer.YapilanIs;
            var oldSatilanCihaz = existingCustomer.SatilanCihaz;

            // Update properties
            bool stateChangedForHesapYapildi = false;
            bool? previousHesapYapildi = existingCustomer.HesapYapildi;
            existingCustomer.AdSoyad = (dto.AdSoyad ?? string.Empty).Trim();
            existingCustomer.TcKimlik = dto.TcKimlik;
            existingCustomer.Telefon = dto.Telefon;
            existingCustomer.Adres = dto.Adres;
            existingCustomer.SozlesmeTutari = dto.SozlesmeTutari;
            // Tarih alanları için timezone kaymasını önlemek adına UTC'ye çevirmeyelim; date-only olarak saklayalım
            existingCustomer.SozlesmeTarihi = dto.SozlesmeTarihi?.Date;
            existingCustomer.OdemeTaahhutTarihi = dto.OdemeTaahhutTarihi.Date;
            existingCustomer.YapilanIs = dto.YapilanIs;
            existingCustomer.BoruTipi = dto.BoruTipi;
            existingCustomer.SatilanCihaz = dto.SatilanCihaz;
            existingCustomer.Termostat = dto.Termostat;
            existingCustomer.UstaIsmi = dto.UstaIsmi;
            existingCustomer.ToptanciIsmi = dto.ToptanciIsmi;
            if (dto.HesapYapildi.HasValue)
            {
                // Sadece durum değiştiyse email tetiklenecek
                stateChangedForHesapYapildi = !previousHesapYapildi.HasValue || previousHesapYapildi.Value != dto.HesapYapildi.Value;
                existingCustomer.HesapYapildi = dto.HesapYapildi.Value;
            }
            existingCustomer.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            // Satılan cihaz/yapılan iş değiştiyse stokları güncelle (negatif stoğa izin ver)
            var yeniYapilanIs = existingCustomer.YapilanIs;
            var yeniSatilanCihaz = existingCustomer.SatilanCihaz;
            var yeniSatilanStokId = dto.SatilanStokId;
            bool cihazDegisti = (oldYapilanIs ?? string.Empty) != (yeniYapilanIs ?? string.Empty) ||
                                 (oldSatilanCihaz ?? string.Empty) != (yeniSatilanCihaz ?? string.Empty);

            // Değişen stokları bildirmek için liste
            var stoklarToNotify = new List<Stok>();

            if (cihazDegisti)
            {
                // İşlemi yapan kullanıcı adı (stok hareketi için)
                string stokKullanici = "Sistem";
                var authHeaderForStok = Request.Headers["Authorization"].FirstOrDefault();
                if (!string.IsNullOrEmpty(authHeaderForStok))
                {
                    var tokenForStok = authHeaderForStok.Split(" ").LastOrDefault();
                    if (!string.IsNullOrEmpty(tokenForStok))
                    {
                        var currentUserForStok = _jwtService.GetUserFromToken(tokenForStok);
                        if (currentUserForStok != null)
                        {
                            stokKullanici = currentUserForStok.Username;
                        }
                    }
                }

                // Eski ürünü iade et (varsa) -> Giriş +1
                if (!string.IsNullOrEmpty(oldYapilanIs) && !string.IsNullOrEmpty(oldSatilanCihaz))
                {
                    Stok? eskiStok = null;
                    if (dto.OldSatilanStokId.HasValue)
                    {
                        eskiStok = await _context.Stoklar.FindAsync(dto.OldSatilanStokId.Value);
                    }
                    if (eskiStok == null)
                    {
                        eskiStok = await GetStokUrunu(oldYapilanIs, oldSatilanCihaz);
                    }
                    if (eskiStok != null)
                    {
                        eskiStok.Miktar += 1;
                        eskiStok.GuncellemeTarihi = DateTime.UtcNow;
                        eskiStok.GuncelleyenKullanici = stokKullanici;

                        _context.StokHareketleri.Add(new StokHareketi
                        {
                            StokId = eskiStok.Id,
                            CustomerId = existingCustomer.Id,
                            Miktar = 1,
                            HareketTipi = "Giriş",
                            Aciklama = $"Müşteri güncelleme (iade): {existingCustomer.AdSoyad} - {oldSatilanCihaz}",
                            Tarih = DateTime.UtcNow,
                            KullaniciAdi = stokKullanici
                        });

                        stoklarToNotify.Add(eskiStok);

                        // Yeni giren 1 adet, bekleyen sipariş varsa tahsis et
                        await _orderService.AllocatePendingOrdersAsync(eskiStok.Id, 1);
                    }
                }

                // Yeni üründen düş -> Çıkış -1 (negatif olabilir)
                if (!string.IsNullOrEmpty(yeniYapilanIs) && !string.IsNullOrEmpty(yeniSatilanCihaz))
                {
                    Stok? yeniStok = null;
                    if (yeniSatilanStokId.HasValue)
                    {
                        yeniStok = await _context.Stoklar.FindAsync(yeniSatilanStokId.Value);
                    }
                    if (yeniStok == null)
                    {
                        yeniStok = await GetStokUrunu(yeniYapilanIs, yeniSatilanCihaz);
                    }
                    if (yeniStok == null)
                    {
                        // Eşleşen stok kaydı yoksa sipariş oluştur (stok bulunamadı ama istek var)
                        // Önce eski siparişleri temizle
                        var eskiSiparisler = await _context.Orders.Where(o => o.CustomerId == existingCustomer.Id).ToListAsync();
                        if (eskiSiparisler.Count > 0)
                        {
                            _context.Orders.RemoveRange(eskiSiparisler);
                            await _context.SaveChangesAsync();
                        }
                        // Stok eşleşmediği için sipariş atlanıyor
                    }
                    else
                    {
                        yeniStok.Miktar -= 1; // eksiye düşebilir
                        yeniStok.GuncellemeTarihi = DateTime.UtcNow;
                        yeniStok.GuncelleyenKullanici = stokKullanici;

                        _context.StokHareketleri.Add(new StokHareketi
                        {
                            StokId = yeniStok.Id,
                            CustomerId = existingCustomer.Id,
                            Miktar = -1,
                            HareketTipi = "Çıkış",
                            Aciklama = $"Müşteri güncelleme (cihaz değişikliği): {existingCustomer.AdSoyad} - {yeniSatilanCihaz}",
                            Tarih = DateTime.UtcNow,
                            KullaniciAdi = stokKullanici
                        });

                        stoklarToNotify.Add(yeniStok);

                        // Eski siparişleri temizle ve stok yetersizse yeni bekleyen siparişi oluştur
                        var eskiSiparisler2 = await _context.Orders.Where(o => o.CustomerId == existingCustomer.Id).ToListAsync();
                        if (eskiSiparisler2.Count > 0)
                        {
                            _context.Orders.RemoveRange(eskiSiparisler2);
                            await _context.SaveChangesAsync();
                        }
                        if (yeniStok.Miktar <= 0)
                        {
                            // Negatif ise bekleyen sipariş aç
                            await _orderService.CreateOrderAsync(new CreateOrderDto
                            {
                                CustomerId = existingCustomer.Id,
                                StokId = yeniStok.Id,
                                Miktar = 1,
                                Notlar = $"Cihaz değişimi sonrası stok yetersiz - {existingCustomer.AdSoyad}",
                                OlusturanKullanici = stokKullanici
                            });
                        }
                    }
                }
            }

            // Çoklu satılan cihazlar: gelen listeyi uygula (stok düş/geri al ve satırları senkronla)
            if (dto.SoldDevices != null)
            {
                // Mevcut satırları yükle
                var existingRows = await _context.CustomerSoldDevices.Where(x => x.CustomerId == id).ToListAsync();

                // Gönderilen stoklara göre eşleştir
                foreach (var row in dto.SoldDevices)
                {
                    if (row.Quantity <= 0) continue;
                    var jobName2 = (row.YapilanIs ?? "").Trim().ToLower();
                    var isKolon = jobName2 == "kolon"
                        || jobName2 == "dönüşüm" || jobName2 == "donusum"
                        || jobName2 == "dönüşüm kolon" || jobName2 == "donusum kolon"
                        || jobName2 == "dönüşüm-kolon" || jobName2 == "donusum-kolon"
                        || jobName2 == "full"
                        || jobName2 == "z-diğer" || jobName2 == "z-diger"
                        || jobName2 == "gaz tesisatı" || jobName2 == "gaz-tesisatı" || jobName2 == "gaz tesisati" || jobName2 == "gaz-tesisati"
                        || jobName2 == "kolon-gaz" || jobName2 == "kolon gaz";
                    var stok = await _context.Stoklar.FindAsync(row.StokId);
                    if (stok == null && isKolon)
                    {
                        stok = await EnsurePlaceholderStokAsync(jobName2);
                    }
                    if (stok == null && !isKolon) continue; // Kolon/gaz işi için stok yoksa da devam et

                    var existingRow = existingRows.FirstOrDefault(r => r.StokId == row.StokId);
                    if (existingRow == null)
                    {
                        // Yeni satır: stok mevcutsa düş, yetersizse eksik kısmı siparişe yaz
                        if (stok != null) // Stok varsa stok hareketlerini yap
                        {
                            var availableBefore = stok.Miktar;
                            var shortage = row.Quantity > availableBefore ? (row.Quantity - availableBefore) : 0;
                            stok.Miktar = availableBefore - row.Quantity;
                            stok.GuncellemeTarihi = DateTime.UtcNow;
                            stok.GuncelleyenKullanici = existingCustomer.CreatedByUsername ?? "Sistem";

                            _context.StokHareketleri.Add(new StokHareketi
                            {
                                StokId = stok.Id,
                                CustomerId = existingCustomer.Id,
                                Miktar = -row.Quantity,
                                HareketTipi = "Çıkış",
                                Aciklama = $"Müşteri güncelleme (çoklu cihaz): {existingCustomer.AdSoyad} - {stok.Marka} {stok.Model}",
                                Tarih = DateTime.UtcNow,
                                KullaniciAdi = existingCustomer.CreatedByUsername ?? "Sistem"
                            });

                            if (shortage > 0)
                            {
                                await _orderService.CreateOrderAsync(new CreateOrderDto
                                {
                                    CustomerId = existingCustomer.Id,
                                    StokId = stok.Id,
                                    Miktar = shortage,
                                    Notlar = $"Stok yetersiz – müşteri güncelleme (çoklu): {existingCustomer.AdSoyad}",
                                    OlusturanKullanici = existingCustomer.CreatedByUsername ?? "Sistem"
                                });
                            }
                        }

                        _context.CustomerSoldDevices.Add(new CustomerSoldDevice
                        {
                            CustomerId = existingCustomer.Id,
                            StokId = stok.Id,
                            Quantity = row.Quantity,
                            YapilanIs = row.YapilanIs,
                            SatilanCihaz = row.SatilanCihaz,
                            BoruTipi = row.BoruTipi,
                            Termostat = row.Termostat,
                            DaireBilgisi = row.DaireBilgisi,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                    else
                    {
                        // Adet farkını uygula
                        int delta = row.Quantity - existingRow.Quantity;
                        if (delta != 0)
                        {
                            var availableBefore = stok.Miktar;
                            if (delta > 0)
                            {
                                // Stok yetersizliğini doğru hesapla (güncelleme için)
                                int shortage = 0;
                                if (availableBefore >= delta)
                                {
                                    // Stok yeterli, sipariş gerekmez
                                    shortage = 0;
                                }
                                else if (availableBefore > 0)
                                {
                                    // Kısmi stok var, sadece eksik kısmı sipariş et
                                    shortage = delta - availableBefore;
                                }
                                else
                                {
                                    // Stok hiç yok, talep edilen artış miktarının tamamını sipariş et
                                    shortage = delta;
                                }
                                
                                stok.Miktar = availableBefore - delta;
                                if (shortage > 0)
                                {
                                    await _orderService.CreateOrderAsync(new CreateOrderDto
                                    {
                                        CustomerId = existingCustomer.Id,
                                        StokId = stok.Id,
                                        Miktar = shortage,
                                        Notlar = $"Stok yetersiz – müşteri güncelleme: {existingCustomer.AdSoyad} ({shortage} adet eksik)",
                                        OlusturanKullanici = existingCustomer.CreatedByUsername ?? "Sistem"
                                    });
                                }
                            }
                            else
                            {
                                // delta negatif: iade
                                stok.Miktar = availableBefore - delta; // delta negatif olduğu için ekler
                            }
                            stok.GuncellemeTarihi = DateTime.UtcNow;
                            stok.GuncelleyenKullanici = existingCustomer.CreatedByUsername ?? "Sistem";

                            _context.StokHareketleri.Add(new StokHareketi
                            {
                                StokId = stok.Id,
                                CustomerId = existingCustomer.Id,
                                Miktar = -delta,
                                HareketTipi = delta > 0 ? "Çıkış" : "Giriş",
                                Aciklama = $"Müşteri güncelleme (çoklu cihaz adet): {existingCustomer.AdSoyad} - {stok.Marka} {stok.Model}",
                                Tarih = DateTime.UtcNow,
                                KullaniciAdi = existingCustomer.CreatedByUsername ?? "Sistem"
                            });

                            existingRow.Quantity = row.Quantity;
                            existingRow.YapilanIs    = Keep(row.YapilanIs,    dto.YapilanIs,    existingRow.YapilanIs);
                            existingRow.SatilanCihaz = Keep(row.SatilanCihaz, dto.SatilanCihaz, existingRow.SatilanCihaz);
                            existingRow.BoruTipi     = Keep(row.BoruTipi,     dto.BoruTipi,     existingRow.BoruTipi);
                            existingRow.Termostat    = Keep(row.Termostat,    dto.Termostat,    existingRow.Termostat);
                            existingRow.DaireBilgisi = Keep(row.DaireBilgisi, dto.DaireBilgisi, existingRow.DaireBilgisi);
                            existingRow.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }

                // Silinen satırları iade et
                var incomingIds = dto.SoldDevices.Select(d => d.StokId).ToHashSet();
                foreach (var ex in existingRows)
                {
                    if (!incomingIds.Contains(ex.StokId))
                    {
                        var stok = await _context.Stoklar.FindAsync(ex.StokId);
                        if (stok != null)
                        {
                            stok.Miktar += ex.Quantity;
                            stok.GuncellemeTarihi = DateTime.UtcNow;
                            stok.GuncelleyenKullanici = existingCustomer.CreatedByUsername ?? "Sistem";

                            _context.StokHareketleri.Add(new StokHareketi
                            {
                                StokId = stok.Id,
                                CustomerId = existingCustomer.Id,
                                Miktar = ex.Quantity,
                                HareketTipi = "Giriş",
                                Aciklama = $"Müşteri güncelleme (çoklu cihaz silindi): {existingCustomer.AdSoyad} - {stok.Marka} {stok.Model}",
                                Tarih = DateTime.UtcNow,
                                KullaniciAdi = existingCustomer.CreatedByUsername ?? "Sistem"
                            });
                        }

                        _context.CustomerSoldDevices.Remove(ex);
                    }
                }
            }

            _context.Entry(existingCustomer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

                // Stok güncellemelerini real-time yayınla
                if (_hubContext != null && stoklarToNotify.Count > 0)
                {
                    foreach (var s in stoklarToNotify.GroupBy(x => x.Id).Select(g => g.First()))
                    {
                        var stokDto = new
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
                            IsDeleted = s.IsDeleted
                        };
                        await _hubContext.Clients.All.SendAsync("ReceiveStokUpdated", stokDto);
                    }
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            // Activity log ekle - işlemi yapan gerçek kullanıcıyı kaydet
            var authHeader2 = Request.Headers["Authorization"].FirstOrDefault();
            int performedByUserId = existingCustomer.CreatedByUserId;
            string performedByUsername = existingCustomer.CreatedByUsername;
            if (!string.IsNullOrEmpty(authHeader2))
            {
                var token2 = authHeader2.Split(" ").LastOrDefault();
                if (!string.IsNullOrEmpty(token2))
                {
                    var currentUser2 = _jwtService.GetUserFromToken(token2);
                    if (currentUser2 != null)
                    {
                        performedByUserId = currentUser2.Id;
                        performedByUsername = currentUser2.Username;
                    }
                }
            }

            await _activityLogService.LogActivityAsync(
                "UPDATE", 
                "CUSTOMER", 
                existingCustomer.Id, 
                existingCustomer.AdSoyad, 
                $"Müşteri güncellendi: {existingCustomer.AdSoyad}", 
                performedByUserId, 
                performedByUsername
            );

                                      // HesapYapildi değiştiyse email gönder
                          if (dto.HesapYapildi.HasValue && stateChangedForHesapYapildi)
                          {
                              // JWT token'dan kullanıcı bilgisini al
                              var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                              string performedByUsernameEmail = "Bilinmeyen Kullanıcı";
                              
                              if (!string.IsNullOrEmpty(authHeader))
                              {
                                  var token = authHeader.Split(" ").LastOrDefault();
                                  if (!string.IsNullOrEmpty(token))
                                  {
                                       var currentUser = _jwtService.GetUserFromToken(token);
                                       if (currentUser != null)
                                      {
                                          performedByUsernameEmail = currentUser.Username;
                                      }
                                  }
                              }

                              // Sadece admin kullanıcılarını bul (superadmin hariç)
                              var adminUsers = await _context.Users
                                  .Where(u => u.Role == "admin")
                                  .ToListAsync();

                              foreach (var admin in adminUsers)
                              {
                                  await _emailService.SendHesapYapildiEmailAsync(
                                      existingCustomer.AdSoyad,
                                      dto.HesapYapildi.Value,
                                      admin.Email,
                                      performedByUsernameEmail,
                                      existingCustomer.YapilanIs,
                                      existingCustomer.Adres
                                  );
                              }
                          }

            // Güncellenmiş müşteriyi soldDevices ile birlikte döndür
            var updatedSoldDevices = await _context.CustomerSoldDevices
                .Where(sd => sd.CustomerId == existingCustomer.Id)
                .ToListAsync();
                
            var updatedResponseData = new
            {
                existingCustomer.Id,
                existingCustomer.AdSoyad,
                existingCustomer.TcKimlik,
                existingCustomer.Telefon,
                existingCustomer.Adres,
                existingCustomer.SozlesmeTutari,
                SozlesmeTarihi = existingCustomer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                OdemeTaahhutTarihi = existingCustomer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                RandevuTarihi = existingCustomer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                // İlk cihazdan türet; yoksa müşteri alanlarına düş
                YapilanIs = !string.IsNullOrEmpty(updatedSoldDevices.FirstOrDefault()?.YapilanIs) ? updatedSoldDevices.FirstOrDefault()!.YapilanIs : (existingCustomer.YapilanIs ?? ""),
                SatilanCihaz = !string.IsNullOrEmpty(updatedSoldDevices.FirstOrDefault()?.SatilanCihaz) ? updatedSoldDevices.FirstOrDefault()!.SatilanCihaz : (existingCustomer.SatilanCihaz ?? ""),
                BoruTipi = !string.IsNullOrEmpty(updatedSoldDevices.FirstOrDefault()?.BoruTipi) ? updatedSoldDevices.FirstOrDefault()!.BoruTipi : (existingCustomer.BoruTipi ?? ""),
                Termostat = !string.IsNullOrEmpty(updatedSoldDevices.FirstOrDefault()?.Termostat) ? updatedSoldDevices.FirstOrDefault()!.Termostat : (existingCustomer.Termostat ?? ""),
                hesapYapildi = existingCustomer.HesapYapildi,
                existingCustomer.CreatedAt,
                existingCustomer.UpdatedAt,
                existingCustomer.CreatedByUsername,
                sozlesmeDosyaAdi = existingCustomer.SozlesmeDosyaAdi,
                sozlesmeDosyaBoyutu = existingCustomer.SozlesmeDosyaBoyutu,
                sozlesmeDosyaTipi = existingCustomer.SozlesmeDosyaTipi,
                Payments = existingCustomer.Payments?.Select(p => new
                {
                    p.Id,
                    p.Tutar,
                    p.Tarih,
                    p.Tur,
                    p.Toptanci,
                    p.CreatedByUsername
                }) ?? Enumerable.Empty<object>(),
                SoldDevices = updatedSoldDevices.Select(sd => new {
                    sd.Id,
                    sd.StokId,
                    sd.Quantity,
                    sd.YapilanIs,
                    sd.SatilanCihaz,
                    sd.BoruTipi,
                    sd.Termostat,
                    sd.DaireBilgisi,
                    sd.CreatedAt,
                    sd.UpdatedAt
                })
            };
            
            return Ok(updatedResponseData);
        }

        // PUT: api/customers/5/randevu-tarihi
        [HttpPut("{id}/randevu-tarihi")]
        public async Task<IActionResult> UpdateRandevuTarihi(int id, [FromBody] UpdateRandevuTarihiDto dto)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound();
            }

            try
            {
                customer.RandevuTarihi = !string.IsNullOrEmpty(dto.RandevuTarihi) ? DateOnly.Parse(dto.RandevuTarihi) : null;
            }
            catch (FormatException ex)
            {
                return BadRequest($"Geçersiz tarih formatı: {dto.RandevuTarihi}. Hata: {ex.Message}");
            }

            // Sadece RandevuTarihi alanını güncelle, UpdatedAt'i manuel olarak ayarla
            _context.Entry(customer).Property(c => c.RandevuTarihi).IsModified = true;
            customer.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            _context.Entry(customer).Property(c => c.UpdatedAt).IsModified = true;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            // Güncellenmiş müşteri verisini döndür
            return Ok(new
            {
                customer.Id,
                customer.AdSoyad,
                customer.TcKimlik,
                customer.Telefon,
                customer.Adres,
                customer.SozlesmeTutari,
                SozlesmeTarihi = customer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                OdemeTaahhutTarihi = customer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                RandevuTarihi = customer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                customer.YapilanIs,
                customer.BoruTipi,
                customer.SatilanCihaz,
                customer.Termostat,
                customer.ToptanciIsmi,
                customer.CreatedAt,
                customer.UpdatedAt
            });
        }

        // DELETE: api/customers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            // JWT token'dan kullanıcı bilgisini al
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Authorization header bulunamadı");
            }
            
            var token = authHeader.Split(" ").LastOrDefault();
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized("Geçersiz token formatı");
            }
            
            var currentUser = _jwtService.GetUserFromToken(token);
            if (currentUser == null)
            {
                return Unauthorized("Geçersiz token");
            }

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound();
            }



            // Silinen müşteriyi DeletedCustomers tablosuna ekle
            var deletedCustomer = new DeletedCustomer
            {
                AdSoyad = customer.AdSoyad,
                TcKimlik = customer.TcKimlik,
                Telefon = customer.Telefon,
                Adres = customer.Adres,
                SozlesmeTutari = customer.SozlesmeTutari,
                SozlesmeTarihi = customer.SozlesmeTarihi,
                OdemeTaahhutTarihi = customer.OdemeTaahhutTarihi,
                RandevuTarihi = customer.RandevuTarihi,
                YapilanIs = customer.YapilanIs,
                BoruTipi = customer.BoruTipi,
                SatilanCihaz = customer.SatilanCihaz,
                Termostat = customer.Termostat,
                ToptanciIsmi = customer.ToptanciIsmi,
                UstaIsmi = customer.UstaIsmi,
                CreatedAt = customer.CreatedAt.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(customer.CreatedAt, DateTimeKind.Utc) : customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(customer.UpdatedAt, DateTimeKind.Utc) : customer.UpdatedAt,
                CreatedByUserId = customer.CreatedByUserId,
                CreatedByUsername = customer.CreatedByUsername,
                DeletedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                DeletedByUserId = currentUser.Id,
                DeletedByUsername = currentUser.Username,
                IsRestored = false
            };

            _context.DeletedCustomers.Add(deletedCustomer);
            _context.Customers.Remove(customer);
            
            await _context.SaveChangesAsync();

            // Activity log ekle
            await _activityLogService.LogActivityAsync(
                "DELETE", 
                "CUSTOMER", 
                customer.Id, 
                customer.AdSoyad, 
                $"Müşteri silindi: {customer.AdSoyad}", 
                currentUser.Id, 
                currentUser.Username
            );

            // Real-time bildirim gönder
            var customerData = new
            {
                customer.Id,
                customer.AdSoyad,
                customer.TcKimlik,
                customer.Telefon,
                customer.Adres,
                customer.SozlesmeTutari,
                SozlesmeTarihi = customer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                OdemeTaahhutTarihi = customer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                RandevuTarihi = customer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                customer.YapilanIs,
                customer.BoruTipi,
                customer.SatilanCihaz,
                customer.Termostat,
                customer.ToptanciIsmi,
                customer.CreatedAt,
                customer.UpdatedAt,
                DeletedBy = currentUser.Username
            };

            await _hubContext.Clients.All.SendAsync("CustomerDeleted", customerData);

            return NoContent();
        }

        // GET: api/customers/deleted
        [HttpGet("deleted")]
        public async Task<ActionResult<IEnumerable<object>>> GetDeletedCustomers()
        {
            try
            {
                var deletedCustomers = await _context.DeletedCustomers
                    .Where(dc => !dc.IsRestored)
                    .OrderByDescending(dc => dc.DeletedAt)
                    .AsNoTracking()
                    .ToListAsync();

                return deletedCustomers.Select(dc => new
                {
                    dc.Id,
                    dc.AdSoyad,
                    dc.TcKimlik,
                    dc.Telefon,
                    dc.Adres,
                    dc.SozlesmeTutari,
                    SozlesmeTarihi = dc.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                    OdemeTaahhutTarihi = dc.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                    RandevuTarihi = dc.RandevuTarihi?.ToString("yyyy-MM-dd"),
                    dc.YapilanIs,
                    dc.BoruTipi,
                    dc.SatilanCihaz,
                    dc.Termostat,
                    dc.ToptanciIsmi,
                    dc.UstaIsmi,
                    CreatedAt = dc.CreatedAt,
                    UpdatedAt = dc.UpdatedAt,
                    DeletedAt = dc.DeletedAt,
                    dc.CreatedByUsername,
                    dc.DeletedByUsername,
                    dc.IsRestored
                }).ToList();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // POST: api/customers/deleted/{id}/restore
        [HttpPost("deleted/{id}/restore")]
        public async Task<IActionResult> RestoreCustomer(int id)
        {
            // Kullanıcı bilgisini al
            var currentUser = await _jwtService.GetCurrentUserAsync();
            if (currentUser == null)
            {
                return Unauthorized("Geçersiz token");
            }

            var deletedCustomer = await _context.DeletedCustomers.FindAsync(id);
            if (deletedCustomer == null)
            {
                return NotFound("Silinen müşteri bulunamadı");
            }

            if (deletedCustomer.IsRestored)
            {
                return BadRequest("Bu müşteri zaten geri alınmış");
            }

            // Yeni müşteri oluştur
            var restoredCustomer = new Customer
            {
                AdSoyad = deletedCustomer.AdSoyad,
                TcKimlik = deletedCustomer.TcKimlik,
                Telefon = deletedCustomer.Telefon,
                Adres = deletedCustomer.Adres,
                SozlesmeTutari = deletedCustomer.SozlesmeTutari,
                SozlesmeTarihi = deletedCustomer.SozlesmeTarihi,
                OdemeTaahhutTarihi = deletedCustomer.OdemeTaahhutTarihi,
                RandevuTarihi = deletedCustomer.RandevuTarihi,
                YapilanIs = deletedCustomer.YapilanIs,
                BoruTipi = deletedCustomer.BoruTipi,
                SatilanCihaz = deletedCustomer.SatilanCihaz,
                Termostat = deletedCustomer.Termostat,
                ToptanciIsmi = deletedCustomer.ToptanciIsmi,
                UstaIsmi = deletedCustomer.UstaIsmi,
                CreatedAt = deletedCustomer.CreatedAt.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(deletedCustomer.CreatedAt, DateTimeKind.Utc) : deletedCustomer.CreatedAt,
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                CreatedByUserId = deletedCustomer.CreatedByUserId,
                CreatedByUsername = deletedCustomer.CreatedByUsername
            };

            _context.Customers.Add(restoredCustomer);
            
            // DeletedCustomer'ı güncelle
            deletedCustomer.IsRestored = true;
            deletedCustomer.RestoredAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            deletedCustomer.RestoredByUserId = currentUser.Id;
            deletedCustomer.RestoredByUsername = currentUser.Username;

            await _context.SaveChangesAsync();

            // Activity log ekle
            await _activityLogService.LogActivityAsync(
                "RESTORE", 
                "CUSTOMER", 
                restoredCustomer.Id, 
                restoredCustomer.AdSoyad, 
                $"Müşteri geri alındı: {restoredCustomer.AdSoyad}", 
                currentUser.Id, 
                currentUser.Username
            );

            // Real-time bildirim gönder
            var customerData = new
            {
                restoredCustomer.Id,
                restoredCustomer.AdSoyad,
                restoredCustomer.TcKimlik,
                restoredCustomer.Telefon,
                restoredCustomer.Adres,
                restoredCustomer.SozlesmeTutari,
                SozlesmeTarihi = restoredCustomer.SozlesmeTarihi?.ToString("yyyy-MM-dd"),
                OdemeTaahhutTarihi = restoredCustomer.OdemeTaahhutTarihi.ToString("yyyy-MM-dd"),
                RandevuTarihi = restoredCustomer.RandevuTarihi?.ToString("yyyy-MM-dd"),
                restoredCustomer.YapilanIs,
                restoredCustomer.BoruTipi,
                restoredCustomer.SatilanCihaz,
                restoredCustomer.Termostat,
                restoredCustomer.ToptanciIsmi,
                restoredCustomer.CreatedAt,
                restoredCustomer.UpdatedAt,
                CreatedBy = restoredCustomer.CreatedByUsername
            };

            await _hubContext.Clients.All.SendAsync("CustomerCreated", customerData);

            return Ok(new { message = "Müşteri başarıyla geri alındı", customerId = restoredCustomer.Id });
        }

        // DELETE: api/customers/deleted/{id}/permanent
        [HttpDelete("deleted/{id}/permanent")]
        public async Task<IActionResult> PermanentlyDeleteCustomer(int id)
        {
            var deletedCustomer = await _context.DeletedCustomers.FindAsync(id);
            if (deletedCustomer == null) 
            {
                return NotFound("Silinen müşteri bulunamadı");
            }

            _context.DeletedCustomers.Remove(deletedCustomer);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Müşteri kalıcı olarak silindi" });
        }

        // Tek bir silinen müşteriyi temizle
        [HttpDelete("deleted/{id}/cleanup")]
        public async Task<IActionResult> CleanupDeletedCustomer(int id)
        {
            var deletedCustomer = await _context.DeletedCustomers.FindAsync(id);
            if (deletedCustomer == null) return NotFound("Silinen müşteri bulunamadı");

            _context.DeletedCustomers.Remove(deletedCustomer);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Silinen müşteri temizlendi" });
        }

        // Debug: Silinen müşterilerin ID'lerini listele
        [HttpGet("deleted/debug")]
        public async Task<IActionResult> DebugDeletedCustomers()
        {
            var deletedCustomers = await _context.DeletedCustomers
                .Select(dc => new { dc.Id, dc.AdSoyad, dc.IsRestored })
                .ToListAsync();

            return Ok(new { 
                message = "Debug bilgisi", 
                count = deletedCustomers.Count,
                customers = deletedCustomers 
            });
        }

        // Tüm silinen müşterileri temizle
        [HttpDelete("deleted/cleanup-all")]
        public async Task<IActionResult> CleanupAllDeletedCustomers()
        {
            var deletedCustomers = await _context.DeletedCustomers
                .Where(dc => !dc.IsRestored)
                .ToListAsync();

            if (!deletedCustomers.Any())
            {
                return Ok(new { message = "Temizlenecek silinen müşteri bulunamadı" });
            }

            _context.DeletedCustomers.RemoveRange(deletedCustomers);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"{deletedCustomers.Count} adet silinen müşteri temizlendi" });
        }

        private bool CustomerExists(int id)
        {
            return _context.Customers.Any(e => e.Id == id);
        }

        private async Task<Stok?> GetStokUrunu(string yapilanIs, string satilanCihaz)
        {
            string jobName = (yapilanIs ?? string.Empty).Trim();
            string sc = (satilanCihaz ?? string.Empty).Trim();
            string scLower = sc.ToLower();

            // İşi DB'den bul ve bağlı ürün türlerini al
            var job = await _context.Jobs
                .Include(j => j.JobProductTypes)
                .ThenInclude(jpt => jpt.ProductType)
                .FirstOrDefaultAsync(j => j.Ad.ToLower() == jobName.ToLower());

            HashSet<string>? productTypeNames = null;
            if (job != null)
            {
                productTypeNames = job.JobProductTypes
                    .Select(jpt => (jpt.ProductType.Ad ?? string.Empty).Trim().ToLower())
                    .Where(n => !string.IsNullOrEmpty(n))
                    .ToHashSet();
            }

            // Aday stokları getir: varsa ürün türü eşleşmesine göre filtrele
            IQueryable<Stok> query = _context.Stoklar.Where(s => !s.IsDeleted && s.IsActive);
            if (productTypeNames != null && productTypeNames.Count > 0)
            {
                query = query.Where(s => productTypeNames.Contains(s.UrunTuru.ToLower()));
            }

            var candidates = await query.ToListAsync();
            // Önce birebir marka+model eşleşmesini dene
            var exact = candidates.FirstOrDefault(s => ($"{s.Marka} {s.Model}").Trim().Equals(sc, StringComparison.OrdinalIgnoreCase));
            if (exact != null) return exact;
            if (candidates.Count == 0)
            {
                candidates = await _context.Stoklar.ToListAsync();
            }

            // Token bazlı skorlayıcı
            static IEnumerable<string> Tokenize(string? text)
            {
                if (string.IsNullOrWhiteSpace(text)) yield break;
                var t = text.ToLower();
                var current = new List<char>();
                foreach (var ch in t)
                {
                    if (char.IsLetterOrDigit(ch)) current.Add(ch); else { if (current.Count > 0) { var tok = new string(current.ToArray()); if (tok.Length >= 2) yield return tok; current.Clear(); } }
                }
                if (current.Count > 0)
                {
                    var tok = new string(current.ToArray());
                    if (tok.Length >= 2) yield return tok;
                }
            }

            var scTokens = Tokenize(sc).ToHashSet();
            if (scTokens.Count == 0)
            {
                // Basit contains fallback
                return candidates.FirstOrDefault(s => s.Marka.ToLower().Contains(scLower) || s.Model.ToLower().Contains(scLower))
                    ?? (await _context.Stoklar.FirstOrDefaultAsync(s => s.Marka.ToLower().Contains(scLower) || s.Model.ToLower().Contains(scLower)));
            }

            // Bazı bilinen marka anahtarları
            var knownBrands = new[] { "daikin", "viessmann", "baymak", "demirdokum", "bosch", "arcelik", "samsung", "lg", "ariston", "baykan" };
            var scHasBrand = scTokens.Intersect(knownBrands).ToHashSet();

            int Score(Stok s)
            {
                var markaTokens = Tokenize(s.Marka).ToHashSet();
                var modelTokens = Tokenize(s.Model).ToHashSet();
                int brandOverlap = scTokens.Intersect(markaTokens).Count();
                int modelOverlap = scTokens.Intersect(modelTokens).Count();
                int knownBrandHit = scHasBrand.Count > 0 && markaTokens.Intersect(scHasBrand).Any() ? 10 : 0;
                int typeBoost = (productTypeNames != null && productTypeNames.Contains(s.UrunTuru.ToLower())) ? 3 : 0;
                return knownBrandHit + (brandOverlap * 3) + (modelOverlap * 2) + typeBoost;
            }

            var best = candidates
                .Select(s => new { s, score = Score(s) })
                .OrderByDescending(x => x.score)
                .ThenBy(x => x.s.Id)
                .FirstOrDefault(x => x.score > 0)?.s;

            if (best != null) return best;

            // Son çare basit ters-contains
            return candidates.FirstOrDefault(s => scLower.Contains(s.Marka.ToLower()) || scLower.Contains(s.Model.ToLower()))
                   ?? await _context.Stoklar.FirstOrDefaultAsync(s => scLower.Contains(s.Marka.ToLower()) || scLower.Contains(s.Model.ToLower()))
                   ?? candidates.FirstOrDefault();
        }

        // Placeholder stok oluşturucu: stok bağımsız işler için tek seferlik dummy kayıt
        private async Task<Stok> EnsurePlaceholderStokAsync(string jobName)
        {
            var normalized = (jobName ?? string.Empty).Trim().ToLower();
            var marka = normalized switch
            {
                "kolon" => "Kolon",
                "dönüşüm" => "Donusum",
                "donusum" => "Donusum",
                "dönüşüm kolon" => "Donusum-Kolon",
                "donusum kolon" => "Donusum-Kolon",
                "dönüşüm-kolon" => "Donusum-Kolon",
                "donusum-kolon" => "Donusum-Kolon",
                "full" => "Full",
                "z-diğer" => "Z-Diger",
                "z-diger" => "Z-Diger",
                "gaz tesisatı" => "Gaz Tesisati",
                "gaz-tesisatı" => "Gaz Tesisati",
                "gaz tesisati" => "Gaz Tesisati",
                "gaz-tesisati" => "Gaz Tesisati",
                "kolon-gaz" => "Kolon-Gaz",
                "kolon gaz" => "Kolon-Gaz",
                _ => "Is Kalemi"
            };
            var model = "Metin Kaydi";
            var existing = await _context.Stoklar.FirstOrDefaultAsync(s => s.Marka == marka && s.Model == model);
            if (existing != null) return existing;
            var stok = new Stok
            {
                UrunTuru = "IsKalemi",
                Marka = marka,
                Model = model,
                Miktar = int.MaxValue / 2, // Hiçbir zaman tüketilmeyecek placeholder
                MinimumStok = 0,
                BirimFiyat = 0,
                OlusturanKullanici = "Sistem",
                GuncelleyenKullanici = "Sistem",
                IsDeleted = false,
                IsActive = true
            };
            _context.Stoklar.Add(stok);
            await _context.SaveChangesAsync();
            return stok;
        }

        // Debug endpoint for testing hesapYapildi
        [HttpGet("debug/hesap")]
        public async Task<IActionResult> DebugHesapYapildi()
        {
            var customers = await _context.Customers
                .Select(c => new { c.Id, c.AdSoyad, c.HesapYapildi })
                .ToListAsync();
            
            return Ok(customers);
        }

        // POST: api/customers/{id}/upload-sozlesme
        [HttpPost("{id}/upload-sozlesme")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadSozlesme(int id, [FromForm] UploadSozlesmeRequest request)
        {
            try
            {
                var customer = await _context.Customers.FindAsync(id);
                if (customer == null)
                {
                    return NotFound("Müşteri bulunamadı");
                }

                if (request.File == null || request.File.Length == 0)
                {
                    return BadRequest("Dosya seçilmedi");
                }

                var uploadResult = await _fileUploadService.UploadSozlesmeAsync(request.File, id);
                if (!uploadResult.Success)
                {
                    return BadRequest(uploadResult.Message);
                }

                // Eski dosyayı sil
                if (!string.IsNullOrEmpty(customer.SozlesmeDosyaAdi))
                {
                    _fileUploadService.DeleteSozlesme(customer.SozlesmeDosyaAdi);
                }

                // Müşteri bilgilerini güncelle
                customer.SozlesmeDosyaAdi = uploadResult.FileName;
                customer.SozlesmeDosyaYolu = uploadResult.FilePath;
                customer.SozlesmeDosyaBoyutu = uploadResult.FileSize;
                customer.SozlesmeDosyaTipi = uploadResult.FileType;
                customer.UpdateTimestamp();

                await _context.SaveChangesAsync();

                // Activity log - loglama hataları yüklemeyi bozmasın
                try
                {
                    await _activityLogService.LogActivityAsync(
                        "UPDATE",
                        "CUSTOMER",
                        customer.Id,
                        customer.AdSoyad,
                        $"Sözleşme dosyası yüklendi: {uploadResult.FileName}",
                        0, // userId - sistem işlemi
                        "Sistem"
                    );
                }
                catch { /* ignore logging errors */ }

                // SignalR bildirimi gönder - bildirim hataları işlemi bozmasın
                try
                {
                    if (_hubContext != null)
                    {
                        await _hubContext.Clients.All.SendAsync("ReceiveSozlesmeUploaded", customer.Id, new
                        {
                            customerId = customer.Id,
                            fileName = uploadResult.FileName,
                            fileSize = uploadResult.FileSize,
                            fileType = uploadResult.FileType
                        });
                    }
                }
                catch { /* ignore hub errors */ }

                return Ok(new
                {
                    success = true,
                    message = "Sözleşme dosyası başarıyla yüklendi",
                    fileName = uploadResult.FileName,
                    fileSize = uploadResult.FileSize,
                    fileType = uploadResult.FileType
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Dosya yükleme hatası: {ex.Message}" });
            }
        }

        // GET: api/customers/{id}/download-sozlesme
        [HttpGet("{id}/download-sozlesme")]
        public async Task<IActionResult> DownloadSozlesme(int id, [FromQuery] bool inline = false)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound("Müşteri bulunamadı");
            }

            if (string.IsNullOrEmpty(customer.SozlesmeDosyaAdi))
            {
                return NotFound("Sözleşme dosyası bulunamadı");
            }

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "sozlesmeler", customer.SozlesmeDosyaAdi);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Dosya bulunamadı");
            }

            var memory = new MemoryStream();
            using (var stream = new FileStream(filePath, FileMode.Open))
            {
                await stream.CopyToAsync(memory);
            }
            memory.Position = 0;

            // Inline önizleme için dosya adını belirtmeyelim ki Content-Disposition: attachment tetiklenmesin
            if (inline)
            {
                return File(memory, customer.SozlesmeDosyaTipi ?? "application/octet-stream");
            }

            return File(memory, customer.SozlesmeDosyaTipi ?? "application/octet-stream", customer.SozlesmeDosyaAdi);
        }

        // DELETE: api/customers/{id}/delete-sozlesme
        [HttpDelete("{id}/delete-sozlesme")]
        public async Task<IActionResult> DeleteSozlesme(int id)
        {
            try
            {
                var customer = await _context.Customers.FindAsync(id);
                if (customer == null)
                {
                    return NotFound("Müşteri bulunamadı");
                }

                if (string.IsNullOrEmpty(customer.SozlesmeDosyaAdi))
                {
                    return NotFound("Sözleşme dosyası bulunamadı");
                }

                try
                {
                    var deleted = _fileUploadService.DeleteSozlesme(customer.SozlesmeDosyaAdi);
                    if (!deleted)
                    {
                        // Fiziksel dosya yoksa bile devam edelim, DB alanlarını temizleyeceğiz
                        // return BadRequest("Dosya silinemedi");
                    }
                }
                catch
                {
                    // Dosya silme sırasında hata olsa bile DB alanlarını temizleyelim
                }

                // Müşteri bilgilerini temizle
                customer.SozlesmeDosyaAdi = null;
                customer.SozlesmeDosyaYolu = null;
                customer.SozlesmeDosyaBoyutu = null;
                customer.SozlesmeDosyaTipi = null;
                customer.UpdateTimestamp();

                await _context.SaveChangesAsync();

                // Activity log - hataları yut
                try
                {
                    await _activityLogService.LogActivityAsync(
                        "UPDATE",
                        "CUSTOMER",
                        customer.Id,
                        customer.AdSoyad,
                        "Sözleşme dosyası silindi",
                        0, // userId - sistem işlemi
                        "Sistem"
                    );
                }
                catch { }

                // SignalR bildirimi gönder - hataları yut
                try
                {
                    if (_hubContext != null)
                    {
                        await _hubContext.Clients.All.SendAsync("ReceiveSozlesmeDeleted", customer.Id);
                    }
                }
                catch { }

                return Ok(new { success = true, message = "Sözleşme dosyası başarıyla silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Dosya silme hatası: {ex.Message}" });
            }
        }

        // GET: api/customers/stock-tracking
        // Stok takip sayfası için: hangi müşteriye hangi ürün satıldı
        [HttpGet("stock-tracking")]
        [AllowAnonymous] // Tüm kullanıcılar erişebilsin
        public async Task<ActionResult> GetStockTracking()
        {
            try
            {
                var stockTracking = await _context.CustomerSoldDevices
                    .Include(csd => csd.Customer)
                    .Include(csd => csd.Stok)
                    .Where(csd => csd.Customer != null) // Sadece Customer varsa
                    .OrderByDescending(csd => csd.CreatedAt)
                    .Select(csd => new
                    {
                        Id = csd.Id,
                        CustomerId = csd.CustomerId,
                        CustomerName = csd.Customer.AdSoyad,
                        TcKimlik = csd.Customer.TcKimlik,
                        StokMarka = csd.Stok != null ? csd.Stok.Marka : "N/A",
                        StokModel = csd.Stok != null ? csd.Stok.Model : "N/A",
                        SatilanCihaz = csd.SatilanCihaz,
                        Quantity = csd.Quantity,
                        HesapYapildi = csd.Customer.HesapYapildi,
                        Adres = csd.Customer.Adres,
                        SozlesmeTarihi = csd.Customer.SozlesmeTarihi,
                        CreatedAt = csd.CreatedAt
                    })
                    .ToListAsync();

                var response = stockTracking.Select(item =>
                {
                    var (il, ilce) = ParseAddress(item.Adres);
                    return new
                    {
                        item.Id,
                        item.CustomerId,
                        item.CustomerName,
                        item.TcKimlik,
                        item.StokMarka,
                        item.StokModel,
                        item.SatilanCihaz,
                        item.Quantity,
                        item.HesapYapildi,
                        item.Adres,
                        Il = il,
                        Ilce = ilce,
                        item.SozlesmeTarihi,
                        item.CreatedAt
                    };
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Stok takip verileri yüklenirken hata: {ex.Message}" });
            }
        }

        private static (string? Il, string? Ilce) ParseAddress(string? adres)
        {
            if (string.IsNullOrWhiteSpace(adres))
            {
                return (null, null);
            }

            var normalized = adres.Replace(" / ", "/");
            var parts = normalized
                .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            string? il = parts.Length > 0 ? parts[0] : null;
            string? ilce = parts.Length > 1 ? parts[1] : null;

            return (il, ilce);
        }
    }
} 