using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Services
{
    public interface ISessionService
    {
        Task<UserSession> CreateSessionAsync(int userId, string token, string deviceInfo, string ipAddress);
        Task<UserSession?> GetSessionAsync(string token);
        Task<bool> ValidateSessionAsync(string token);
        Task UpdateSessionActivityAsync(string token);
        Task DeactivateSessionAsync(string token);
        Task DeactivateAllUserSessionsAsync(int userId);
        Task<List<UserSession>> GetUserSessionsAsync(int userId);
        Task CleanupExpiredSessionsAsync();
    }
} 