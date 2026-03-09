using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Services
{
    public class DukkanCarisiService
    {
        private readonly ApplicationDbContext _context;

        public DukkanCarisiService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<List<DukkanCarisiDto>>> GetAllDukkanCarisiAsync()
        {
            try
            {
                var dukkanCarisi = await _context.DukkanCarisi
                    .Where(d => !d.IsDeleted)
                    .OrderByDescending(d => d.IslemTarihi)
                    .ToListAsync();

                var dukkanCarisiDto = dukkanCarisi.Select(d => new DukkanCarisiDto
                {
                    Id = d.Id,
                    Aciklama = d.Aciklama,
                    Tutar = d.Tutar,
                    YapanKullanici = d.YapanKullanici,
                    YapilanIslem = d.YapilanIslem,
                    IslemTarihi = d.IslemTarihi,
                    OlusturmaTarihi = d.OlusturmaTarihi,
                    GuncellemeTarihi = d.GuncellemeTarihi,
                    GuncelleyenKullanici = d.GuncelleyenKullanici,
                    IsDeleted = d.IsDeleted
                }).ToList();

                return new ApiResponse<List<DukkanCarisiDto>>
                {
                    Success = true,
                    Data = dukkanCarisiDto,
                    Message = "Dükkan carisi başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<DukkanCarisiDto>>
                {
                    Success = false,
                    Message = $"Dükkan carisi getirilirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<DukkanCarisiDto>> GetDukkanCarisiByIdAsync(int id)
        {
            try
            {
                var dukkanCarisi = await _context.DukkanCarisi.FindAsync(id);
                if (dukkanCarisi == null || dukkanCarisi.IsDeleted)
                {
                    return new ApiResponse<DukkanCarisiDto>
                    {
                        Success = false,
                        Message = "Dükkan carisi bulunamadı"
                    };
                }

                var dukkanCarisiDto = new DukkanCarisiDto
                {
                    Id = dukkanCarisi.Id,
                    Aciklama = dukkanCarisi.Aciklama,
                    Tutar = dukkanCarisi.Tutar,
                    YapanKullanici = dukkanCarisi.YapanKullanici,
                    YapilanIslem = dukkanCarisi.YapilanIslem,
                    IslemTarihi = dukkanCarisi.IslemTarihi,
                    OlusturmaTarihi = dukkanCarisi.OlusturmaTarihi,
                    GuncellemeTarihi = dukkanCarisi.GuncellemeTarihi,
                    GuncelleyenKullanici = dukkanCarisi.GuncelleyenKullanici,
                    IsDeleted = dukkanCarisi.IsDeleted
                };

                return new ApiResponse<DukkanCarisiDto>
                {
                    Success = true,
                    Data = dukkanCarisiDto,
                    Message = "Dükkan carisi başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<DukkanCarisiDto>
                {
                    Success = false,
                    Message = $"Dükkan carisi getirilirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<DukkanCarisiDto>> CreateDukkanCarisiAsync(CreateDukkanCarisiDto createDukkanCarisiDto)
        {
            try
            {
                var dukkanCarisi = new DukkanCarisi
                {
                    Aciklama = createDukkanCarisiDto.Aciklama,
                    Tutar = createDukkanCarisiDto.Tutar,
                    YapanKullanici = createDukkanCarisiDto.YapanKullanici,
                    YapilanIslem = createDukkanCarisiDto.YapilanIslem,
                    IslemTarihi = createDukkanCarisiDto.IslemTarihi,
                    OlusturmaTarihi = DateTime.UtcNow
                };

                _context.DukkanCarisi.Add(dukkanCarisi);
                await _context.SaveChangesAsync();

                var dukkanCarisiDto = new DukkanCarisiDto
                {
                    Id = dukkanCarisi.Id,
                    Aciklama = dukkanCarisi.Aciklama,
                    Tutar = dukkanCarisi.Tutar,
                    YapanKullanici = dukkanCarisi.YapanKullanici,
                    YapilanIslem = dukkanCarisi.YapilanIslem,
                    IslemTarihi = dukkanCarisi.IslemTarihi,
                    OlusturmaTarihi = dukkanCarisi.OlusturmaTarihi,
                    GuncellemeTarihi = dukkanCarisi.GuncellemeTarihi,
                    GuncelleyenKullanici = dukkanCarisi.GuncelleyenKullanici,
                    IsDeleted = dukkanCarisi.IsDeleted
                };

                return new ApiResponse<DukkanCarisiDto>
                {
                    Success = true,
                    Data = dukkanCarisiDto,
                    Message = "Dükkan carisi başarıyla oluşturuldu"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<DukkanCarisiDto>
                {
                    Success = false,
                    Message = $"Dükkan carisi oluşturulurken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<DukkanCarisiDto>> UpdateDukkanCarisiAsync(int id, UpdateDukkanCarisiDto updateDukkanCarisiDto)
        {
            try
            {
                var dukkanCarisi = await _context.DukkanCarisi.FindAsync(id);
                if (dukkanCarisi == null || dukkanCarisi.IsDeleted)
                {
                    return new ApiResponse<DukkanCarisiDto>
                    {
                        Success = false,
                        Message = "Dükkan carisi bulunamadı"
                    };
                }

                dukkanCarisi.Aciklama = updateDukkanCarisiDto.Aciklama;
                dukkanCarisi.Tutar = updateDukkanCarisiDto.Tutar;
                dukkanCarisi.YapilanIslem = updateDukkanCarisiDto.YapilanIslem;
                dukkanCarisi.IslemTarihi = updateDukkanCarisiDto.IslemTarihi;
                dukkanCarisi.GuncelleyenKullanici = updateDukkanCarisiDto.GuncelleyenKullanici;
                dukkanCarisi.GuncellemeTarihi = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var dukkanCarisiDto = new DukkanCarisiDto
                {
                    Id = dukkanCarisi.Id,
                    Aciklama = dukkanCarisi.Aciklama,
                    Tutar = dukkanCarisi.Tutar,
                    YapanKullanici = dukkanCarisi.YapanKullanici,
                    YapilanIslem = dukkanCarisi.YapilanIslem,
                    IslemTarihi = dukkanCarisi.IslemTarihi,
                    OlusturmaTarihi = dukkanCarisi.OlusturmaTarihi,
                    GuncellemeTarihi = dukkanCarisi.GuncellemeTarihi,
                    GuncelleyenKullanici = dukkanCarisi.GuncelleyenKullanici,
                    IsDeleted = dukkanCarisi.IsDeleted
                };

                return new ApiResponse<DukkanCarisiDto>
                {
                    Success = true,
                    Data = dukkanCarisiDto,
                    Message = "Dükkan carisi başarıyla güncellendi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<DukkanCarisiDto>
                {
                    Success = false,
                    Message = $"Dükkan carisi güncellenirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteDukkanCarisiAsync(int id)
        {
            try
            {
                var dukkanCarisi = await _context.DukkanCarisi.FindAsync(id);
                if (dukkanCarisi == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Dükkan carisi bulunamadı"
                    };
                }

                dukkanCarisi.IsDeleted = true;
                dukkanCarisi.GuncellemeTarihi = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Dükkan carisi başarıyla silindi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Dükkan carisi silinirken hata oluştu: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<DukkanCarisiDto>>> SearchDukkanCarisiAsync(string searchTerm, string islemFilter, DateTime? baslangicTarihi = null, DateTime? bitisTarihi = null)
        {
            try
            {
                var query = _context.DukkanCarisi.Where(d => !d.IsDeleted);

                // Açıklama araması (case-insensitive)
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(d => d.Aciklama.ToLower().Contains(searchTerm.ToLower()));
                }

                // İşlem filtresi
                if (!string.IsNullOrEmpty(islemFilter))
                {
                    query = query.Where(d => d.YapilanIslem == islemFilter);
                }

                // Tarih aralığı filtresi (sadece tarih bazlı kıyasla, saat farklarını ve timezone'u yut)
                if (baslangicTarihi.HasValue)
                {
                    var startDate = baslangicTarihi.Value.Date;
                    query = query.Where(d => d.IslemTarihi.Date >= startDate);
                }

                if (bitisTarihi.HasValue)
                {
                    var endDate = bitisTarihi.Value.Date;
                    query = query.Where(d => d.IslemTarihi.Date <= endDate);
                }

                var dukkanCarisi = await query
                    .OrderByDescending(d => d.IslemTarihi)
                    .ToListAsync();

                var dukkanCarisiDto = dukkanCarisi.Select(d => new DukkanCarisiDto
                {
                    Id = d.Id,
                    Aciklama = d.Aciklama,
                    Tutar = d.Tutar,
                    YapanKullanici = d.YapanKullanici,
                    YapilanIslem = d.YapilanIslem,
                    IslemTarihi = d.IslemTarihi,
                    OlusturmaTarihi = d.OlusturmaTarihi,
                    GuncellemeTarihi = d.GuncellemeTarihi,
                    GuncelleyenKullanici = d.GuncelleyenKullanici,
                    IsDeleted = d.IsDeleted
                }).ToList();

                return new ApiResponse<List<DukkanCarisiDto>>
                {
                    Success = true,
                    Data = dukkanCarisiDto,
                    Message = "Arama sonuçları başarıyla getirildi"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<DukkanCarisiDto>>
                {
                    Success = false,
                    Message = $"Arama yapılırken hata oluştu: {ex.Message}"
                };
            }
        }
    }
} 