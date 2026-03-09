using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Services
{
    public class SessionService : ISessionService
    {
        private readonly ApplicationDbContext _context;

        public SessionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserSession> CreateSessionAsync(int userId, string token, string deviceInfo, string ipAddress)
        {
            var session = new UserSession
            {
                UserId = userId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(2), // 2 saat
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                IsActive = true
            };

            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();

            return session;
        }

        public async Task<UserSession?> GetSessionAsync(string token)
        {
            return await _context.UserSessions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Token == token && s.IsActive);
        }

        public async Task<bool> ValidateSessionAsync(string token)
        {
            var session = await GetSessionAsync(token);
            if (session == null) return false;

            if (session.ExpiresAt < DateTime.UtcNow)
            {
                session.IsActive = false;
                await _context.SaveChangesAsync();
                return false;
            }

            return true;
        }

        public async Task UpdateSessionActivityAsync(string token)
        {
            var session = await GetSessionAsync(token);
            if (session != null)
            {
                session.LastActivity = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeactivateSessionAsync(string token)
        {
            var session = await GetSessionAsync(token);
            if (session != null)
            {
                session.IsActive = false;
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeactivateAllUserSessionsAsync(int userId)
        {
            var sessions = await _context.UserSessions
                .Where(s => s.UserId == userId && s.IsActive)
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.IsActive = false;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<UserSession>> GetUserSessionsAsync(int userId)
        {
            return await _context.UserSessions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task CleanupExpiredSessionsAsync()
        {
            var expiredSessions = await _context.UserSessions
                .Where(s => s.ExpiresAt < DateTime.UtcNow && s.IsActive)
                .ToListAsync();

            foreach (var session in expiredSessions)
            {
                session.IsActive = false;
            }

            await _context.SaveChangesAsync();
        }
    }
} 