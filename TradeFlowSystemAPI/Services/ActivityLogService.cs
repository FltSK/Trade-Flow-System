using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Services
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(string action, string entityType, int? entityId, string? entityName, string? description, int userId, string username);
        Task<IEnumerable<ActivityLog>> GetActivityLogsAsync(int? userId = null, string? entityType = null, string? action = null, DateTime? startDate = null, DateTime? endDate = null);
    }

    public class ActivityLogService : IActivityLogService
    {
        private readonly ApplicationDbContext _context;

        public ActivityLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogActivityAsync(string action, string entityType, int? entityId, string? entityName, string? description, int userId, string username)
        {
            // Nullability uyumu: parametre null gelebilir
            if (username == null) username = "Sistem";
            if (string.IsNullOrWhiteSpace(username)) username = "Sistem";
            var activityLog = new ActivityLog
            {
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                EntityName = entityName,
                Description = description,
                UserId = userId,
                Username = username,
                CreatedAt = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(activityLog);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<ActivityLog>> GetActivityLogsAsync(int? userId = null, string? entityType = null, string? action = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.ActivityLogs.AsQueryable();

            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(a => a.EntityType == entityType);

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);

            if (startDate.HasValue)
            {
                var utcStartDate = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);
                query = query.Where(a => a.CreatedAt >= utcStartDate);
            }

            if (endDate.HasValue)
            {
                var utcEndDate = DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc);
                query = query.Where(a => a.CreatedAt <= utcEndDate);
            }

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }
    }
} 