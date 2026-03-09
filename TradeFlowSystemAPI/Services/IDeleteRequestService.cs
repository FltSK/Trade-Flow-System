using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Services
{
    public interface IDeleteRequestService
    {
        Task<DeleteRequest> CreateDeleteRequestAsync(int customerId, int? paymentId, int requestedByUserId, string reason);
        Task<DeleteRequest?> GetDeleteRequestAsync(int id);
        Task<List<DeleteRequest>> GetPendingRequestsAsync();
        Task<List<DeleteRequest>> GetUserRequestsAsync(int userId);
        Task<bool> ApproveRequestAsync(int requestId, int approvedByUserId);
        Task<bool> RejectRequestAsync(int requestId, int rejectedByUserId, string rejectionReason);
        Task<bool> DeleteRequestAsync(int id);
    }
} 