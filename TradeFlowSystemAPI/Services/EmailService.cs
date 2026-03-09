using System.Net.Mail;
using System.Net;
using Microsoft.Extensions.Configuration;

namespace TradeFlowSystemAPI.Services
{
    public interface IEmailService
    {
        Task SendHesapYapildiEmailAsync(string customerName, bool hesapYapildi, string adminEmail, string performedByUsername, string? yapilanIs, string? adres);
        Task SendUstaJobInfoEmailAsync(string ustaEmail, string ustaAdSoyad, string musteriAdSoyad, string? randevuTarihi, string? adres, string? telefon, string? daireBilgisi, string? yapilacakIs);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendHesapYapildiEmailAsync(string customerName, bool hesapYapildi, string adminEmail, string performedByUsername, string? yapilanIs, string? adres)
        {
            try
            {
                // Console'a log yazdır (debug için)
                // Console loglarını kaldırdık

                // SMTP ayarlarını al
                var smtpSettings = _configuration.GetSection("SmtpSettings");
                var smtpServer = smtpSettings["Server"];
                var smtpPortStr = smtpSettings["Port"];
                if (!int.TryParse(smtpPortStr, out var smtpPort)) return; // Geçersiz port -> sessiz çık
                var smtpUsername = smtpSettings["Username"] ?? string.Empty;
                var smtpPassword = smtpSettings["Password"] ?? string.Empty;
                var fromEmail = smtpSettings["FromEmail"] ?? string.Empty;
                var fromName = smtpSettings["FromName"] ?? string.Empty;
                if (string.IsNullOrWhiteSpace(fromEmail)) return; // Zorunlu alanlar yoksa sessiz çık

                // Email gönder
                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);
                    client.EnableSsl = true;

                    var mail = new MailMessage
                    {
                        From = new MailAddress(fromEmail, string.IsNullOrWhiteSpace(fromName) ? fromEmail : fromName),
                        Subject = $"Müşteri Hesap Durumu Değişikliği - {customerName}",
                        Body = GenerateHesapYapildiEmailBody(customerName, hesapYapildi, performedByUsername, yapilanIs, adres),
                        IsBodyHtml = true
                    };

                    mail.To.Add(adminEmail);

                    await client.SendMailAsync(mail);
                    
                    // Sessiz başarı
                }
            }
            catch (Exception ex)
            {
                // Sessiz hata: ana akışı bozma, konsola yazma
                _ = ex; // no-op
            }
        }

        public async Task SendUstaJobInfoEmailAsync(string ustaEmail, string ustaAdSoyad, string musteriAdSoyad, string? randevuTarihi, string? adres, string? telefon, string? daireBilgisi, string? yapilacakIs)
        {
            try
            {
                var smtpSettings = _configuration.GetSection("SmtpSettings");
                var smtpServer = smtpSettings["Server"];
                var smtpPortStr = smtpSettings["Port"];
                if (!int.TryParse(smtpPortStr, out var smtpPort)) return;
                var smtpUsername = smtpSettings["Username"] ?? string.Empty;
                var smtpPassword = smtpSettings["Password"] ?? string.Empty;
                var fromEmail = smtpSettings["FromEmail"] ?? string.Empty;
                var fromName = smtpSettings["FromName"] ?? string.Empty;
                if (string.IsNullOrWhiteSpace(fromEmail) || string.IsNullOrWhiteSpace(ustaEmail)) return;

                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);
                    client.EnableSsl = true;

                    var mail = new MailMessage
                    {
                        From = new MailAddress(fromEmail, string.IsNullOrWhiteSpace(fromName) ? fromEmail : fromName),
                        Subject = $"Yeni İş Ataması - {musteriAdSoyad}",
                        Body = GenerateUstaJobInfoBody(ustaAdSoyad, musteriAdSoyad, randevuTarihi, adres, telefon, daireBilgisi, yapilacakIs),
                        IsBodyHtml = true
                    };
                    mail.To.Add(ustaEmail);
                    await client.SendMailAsync(mail);
                }
            }
            catch (Exception ex)
            {
                _ = ex;
            }
        }

        private string GenerateUstaJobInfoBody(string ustaAdSoyad, string musteriAdSoyad, string? randevuTarihi, string? adres, string? telefon, string? daireBilgisi, string? yapilacakIs)
        {
            return $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #333;'>Yeni İş Bilgisi</h2>
                    <p>Sayın {ustaAdSoyad}, size yeni bir iş atanmıştır.</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                        <p><strong>Müşteri:</strong> {musteriAdSoyad}</p>
                        <p><strong>Randevu Tarihi:</strong> {(string.IsNullOrWhiteSpace(randevuTarihi) ? '-' : randevuTarihi)}</p>
                        <p><strong>Adres:</strong> {(string.IsNullOrWhiteSpace(adres) ? '-' : adres)}</p>
                        <p><strong>Telefon:</strong> {(string.IsNullOrWhiteSpace(telefon) ? '-' : telefon)}</p>
                        <p><strong>Daire Bilgisi:</strong> {(string.IsNullOrWhiteSpace(daireBilgisi) ? '-' : daireBilgisi)}</p>
                        <p><strong>Yapılacak İş:</strong> {(string.IsNullOrWhiteSpace(yapilacakIs) ? '-' : yapilacakIs)}</p>
                    </div>
                    <p style='color: #666; font-size: 12px;'>Bu email sistem tarafından otomatik gönderilmiştir.</p>
                </div>
            </body>
            </html>";
        }
        private string GenerateHesapYapildiEmailBody(string customerName, bool hesapYapildi, string performedByUsername, string? yapilanIs, string? adres)
        {
            var status = hesapYapildi ? "GÖRÜLDÜ" : "GÖRÜLMEDİ";
            var color = hesapYapildi ? "#28a745" : "#dc3545";

            return $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #333;'>Müşteri Hesap Durumu Değişikliği</h2>

                        <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <h3 style='color: #333; margin-top: 0;'>Müşteri Bilgileri:</h3>
                            <p><strong>Müşteri Adı:</strong> {customerName}</p>
                            <p><strong>Yapılan İş:</strong> {(string.IsNullOrWhiteSpace(yapilanIs) ? "-" : yapilanIs)}</p>
                            <p><strong>Adres:</strong> {(string.IsNullOrWhiteSpace(adres) ? "-" : adres)}</p>
                        </div>

                        <div style='background-color: {color}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <h3 style='margin-top: 0;'>Hesap Durumu: {status}</h3>
                            <p>Bu müşterinin hesabı <strong>{status.ToLower()}</strong> olarak işaretlendi.</p>
                        </div>

                        <div style='background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <h3 style='color: #333; margin-top: 0;'>İşlem Bilgileri:</h3>
                            <p><strong>İşlemi Yapan:</strong> {performedByUsername}</p>
                            <p><strong>İşlem Tarihi:</strong> {DateTime.Now:dd.MM.yyyy HH:mm}</p>
                        </div>

                        <div style='background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <p style='margin: 0; color: #666;'>
                                Bu email, müşteri hesap durumu değiştirildiğinde otomatik olarak gönderilmiştir.
                            </p>
                        </div>

                        <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>
                        <p style='color: #666; font-size: 12px;'>
                            Gönderim Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}
                        </p>
                    </div>
                </body>
                </html>";
        }
    }
} 