using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Services
{
    public interface IJwtService
    {
        JwtResponseDto GenerateToken(User user);
        bool ValidateToken(string token);
        User? GetUserFromToken(string token);
        Task<User?> GetCurrentUserAsync();
    }
}