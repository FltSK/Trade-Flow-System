using Microsoft.AspNetCore.Http;
using System.IO;
using System.Diagnostics;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using System.Linq;
using QuestPDF.Helpers;

namespace TradeFlowSystemAPI.Services
{
    public class FileUploadService
    {
        private readonly string _uploadPath;
        private readonly string[] _allowedExtensions = { ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png" };
        private const long MaxFileSize = 10 * 1024 * 1024; // 10MB (0 KB - 10 MB arası)

        public FileUploadService()
        {
            _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "sozlesmeler");
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }
        }

                public async Task<FileUploadResult> UploadSozlesmeAsync(IFormFile file, int customerId)
        {
            try
            {
                // Dosya boyutu kontrolü (0 KB - 10MB)
                if (file.Length == 0)
                {
                    return new FileUploadResult
                    {
                        Success = false,
                        Message = "❌ Boş dosya yüklenemez. Lütfen geçerli bir dosya seçin."
                    };
                }
                
                if (file.Length > MaxFileSize)
                {
                    var fileSizeMB = Math.Round((double)file.Length / (1024 * 1024), 2);
                    var maxSizeMB = MaxFileSize / (1024 * 1024);
                    return new FileUploadResult
                    {
                        Success = false,
                        Message = $"❌ Dosya boyutu çok büyük! Seçilen dosya: {fileSizeMB} MB. Maksimum dosya boyutu: {maxSizeMB} MB."
                    };
                }

                // Dosya uzantısı kontrolü
                var extension = Path.GetExtension(file.FileName ?? "").ToLowerInvariant();
                if (!_allowedExtensions.Contains(extension))
                {
                    var fileExtension = string.IsNullOrEmpty(extension) ? "Bilinmeyen" : extension.ToUpperInvariant();
                    var allowedFormats = string.Join(", ", _allowedExtensions.Select(ext => ext.ToUpperInvariant()));
                    return new FileUploadResult
                    {
                        Success = false,
                        Message = $"❌ Desteklenmeyen dosya formatı: {fileExtension}. Desteklenen formatlar: {allowedFormats}"
                    };
                }

                // Klasör kontrolü ve oluşturma
                if (!Directory.Exists(_uploadPath))
                {
                    Directory.CreateDirectory(_uploadPath);
                }

                // Benzersiz dosya adı oluştur
                var fileName = $"{customerId}_{DateTime.UtcNow:yyyyMMdd_HHmmss}{extension}";
                var filePath = Path.Combine(_uploadPath, fileName);

                // Dosyayı kaydet
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // PDF'e dönüştürmeyi dene (resim/doc/docx)
                var convertedPdfPath = TryConvertToPdf(filePath, file.ContentType);
                if (!string.IsNullOrEmpty(convertedPdfPath) && System.IO.File.Exists(convertedPdfPath))
                {
                    // Orijinal dosyayı sil (pdf'e dönüştürüldüyse)
                    try { if (System.IO.Path.GetExtension(filePath).ToLowerInvariant() != ".pdf") System.IO.File.Delete(filePath); } catch {}

                    var pdfFileInfo = new FileInfo(convertedPdfPath);
                    return new FileUploadResult
                    {
                        Success = true,
                        FileName = Path.GetFileName(convertedPdfPath),
                        FilePath = convertedPdfPath,
                        FileSize = pdfFileInfo.Length,
                        FileType = "application/pdf",
                        Message = "✅ Dosya başarıyla yüklendi ve PDF'e dönüştürüldü"
                    };
                }

                // Dönüşüm yapılamadıysa orijinali döndür
                return new FileUploadResult
                {
                    Success = true,
                    FileName = fileName,
                    FilePath = filePath,
                    FileSize = file.Length,
                    FileType = file.ContentType,
                    Message = "✅ Dosya başarıyla yüklendi"
                };
            }
            catch (Exception ex)
            {
                return new FileUploadResult
                {
                    Success = false,
                    Message = $"Dosya yüklenirken hata oluştu: {ex.Message}"
                };
            }
        }

        private string? TryConvertToPdf(string sourcePath, string? contentType)
        {
            try
            {
                var ext = Path.GetExtension(sourcePath).ToLowerInvariant();
                if (ext == ".pdf")
                    return null; // Zaten PDF

                var outputPdfPath = Path.ChangeExtension(sourcePath, ".pdf");

                // Resim dosyaları -> QuestPDF ile PDF'e göm
                if (ext == ".jpg" || ext == ".jpeg" || ext == ".png")
                {
                    Document.Create(container =>
                    {
                        container.Page(page =>
                        {
                            page.Size(PageSizes.A4);
                            page.Margin(0);
                            page.DefaultTextStyle(x => x.FontSize(12));
                            page.Content().Image(sourcePath);
                        });
                    }).GeneratePdf(outputPdfPath);

                    return outputPdfPath;
                }

                // DOC/DOCX -> LibreOffice (soffice) ile dönüştürmeyi dene
                if (ext == ".doc" || ext == ".docx")
                {
                    var outDir = Path.GetDirectoryName(sourcePath)!;
                    // Önce varsa var olan pdf'i sil
                    try { if (System.IO.File.Exists(outputPdfPath)) System.IO.File.Delete(outputPdfPath); } catch {}

                    var soffice = "soffice"; // PATH'te varsayalım
                    var psi = new ProcessStartInfo
                    {
                        FileName = soffice,
                        Arguments = $"--headless --convert-to pdf --outdir \"{outDir}\" \"{sourcePath}\"",
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        RedirectStandardError = true,
                        RedirectStandardOutput = true
                    };

                    using var proc = Process.Start(psi);
                    if (proc != null)
                    {
                        if (!proc.WaitForExit(30000)) // 30 sn bekle
                        {
                            try { proc.Kill(); } catch { }
                        }
                    }

                    // LibreOffice çıktısı dosya adını farklı üretebilir; .pdf uzantılı aynı ad bekliyoruz
                    if (System.IO.File.Exists(outputPdfPath))
                        return outputPdfPath;
                }
            }
            catch
            {
                // Yoksay: dönüşüm başarısızsa orijinal dosyayı kullanacağız
            }

            return null;
        }

        public bool DeleteSozlesme(string fileName)
        {
            try
            {
                var filePath = Path.Combine(_uploadPath, fileName);
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        public string GetSozlesmeUrl(string fileName)
        {
            return $"/uploads/sozlesmeler/{fileName}";
        }
    }

    public class FileUploadResult
    {
        public bool Success { get; set; }
        public string? FileName { get; set; }
        public string? FilePath { get; set; }
        public long? FileSize { get; set; }
        public string? FileType { get; set; }
        public string Message { get; set; } = string.Empty;
    }
} 