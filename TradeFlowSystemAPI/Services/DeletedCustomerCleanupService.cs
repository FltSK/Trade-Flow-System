using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Data;

namespace TradeFlowSystemAPI.Services
{
    public class DeletedCustomerCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DeletedCustomerCleanupService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(24); // Her 24 saatte bir kontrol et
        private readonly TimeSpan _cleanupThreshold = TimeSpan.FromDays(30); // 30 gün sonra sil

        public DeletedCustomerCleanupService(
            IServiceProvider serviceProvider,
            ILogger<DeletedCustomerCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupOldDeletedCustomers();
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    // Uygulama kapanırken iptal beklenen bir durum; loglama yapma
                    break;
                }
                catch (TaskCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    // Uygulama kapanırken iptal beklenen bir durum; loglama yapma
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "DeletedCustomerCleanupService'de hata oluştu");
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken); // Hata durumunda 1 saat bekle
                }
            }
        }

        private async Task CleanupOldDeletedCustomers()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var cutoffDate = DateTime.UtcNow.Subtract(_cleanupThreshold);
            var oldDeletedCustomers = await context.DeletedCustomers
                .Where(dc => dc.DeletedAt < cutoffDate && !dc.IsRestored)
                .ToListAsync();

            if (oldDeletedCustomers.Any())
            {
                context.DeletedCustomers.RemoveRange(oldDeletedCustomers);
                await context.SaveChangesAsync();
                _logger.LogInformation($"{oldDeletedCustomers.Count} adet eski silinen müşteri temizlendi");
            }
        }
    }
} 