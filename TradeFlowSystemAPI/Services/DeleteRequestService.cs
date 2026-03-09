using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.Hubs;

namespace TradeFlowSystemAPI.Services
{
    public class DeleteRequestService : IDeleteRequestService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public DeleteRequestService(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<DeleteRequest> CreateDeleteRequestAsync(int customerId, int? paymentId, int requestedByUserId, string reason)
        {
            var request = new DeleteRequest
            {
                CustomerId = customerId,
                PaymentId = paymentId,
                RequestedByUserId = requestedByUserId,
                Status = "Pending",
                Reason = reason,
                RequestedAt = DateTime.UtcNow
            };

            _context.DeleteRequests.Add(request);
            await _context.SaveChangesAsync();

            // Real-time bildirim gönder
            var message = new
            {
                requestId = request.Id,
                customerId = request.CustomerId,
                paymentId = request.PaymentId,
                customerName = request.Customer?.AdSoyad,
                paymentAmount = request.Payment?.Tutar,
                paymentDate = request.Payment?.Tarih,
                paymentType = request.Payment?.Tur,
                requestedBy = request.RequestedBy?.Username,
                reason = reason,
                status = "Pending"
            };

            // Tüm kullanıcılara bildirim gönder (adminler ve talep eden kişi görebilsin)
            await _hubContext.Clients.All.SendAsync("ReceiveDeleteRequest", requestedByUserId.ToString(), message);

            return request;
        }

        public async Task<DeleteRequest?> GetDeleteRequestAsync(int id)
        {
            return await _context.DeleteRequests
                .Include(r => r.Customer)
                .Include(r => r.Payment)
                .Include(r => r.RequestedBy)
                .Include(r => r.ApprovedBy)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<DeleteRequest>> GetPendingRequestsAsync()
        {
            return await _context.DeleteRequests
                .Include(r => r.Customer)
                .Include(r => r.Payment)
                .Include(r => r.RequestedBy)
                .Where(r => r.Status == "Pending")
                .OrderByDescending(r => r.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<DeleteRequest>> GetUserRequestsAsync(int userId)
        {
            return await _context.DeleteRequests
                .Include(r => r.Customer)
                .Include(r => r.Payment)
                .Include(r => r.RequestedBy)
                .Include(r => r.ApprovedBy)
                .Where(r => r.RequestedByUserId == userId)
                .OrderByDescending(r => r.RequestedAt)
                .ToListAsync();
        }

        public async Task<bool> ApproveRequestAsync(int requestId, int approvedByUserId)
        {
            var request = await GetDeleteRequestAsync(requestId);
            
            if (request == null)
            {
                return false;
            }
            
            if (request.Status != "Pending")
            {
                return false;
            }

            // Ödeme bilgilerini sakla (silmeden önce)
            var paymentInfo = request.Payment;
            var paymentId = request.PaymentId;
            var paymentAmount = request.Payment?.Tutar;
            var paymentDate = request.Payment?.Tarih;
            var paymentType = request.Payment?.Tur;

            // Ödemeyi sil
            if (request.PaymentId.HasValue)
            {
                var payment = await _context.Payments.FindAsync(request.PaymentId.Value);
                if (payment != null)
                {
                    _context.Payments.Remove(payment);
                }
            }

            // Real-time bildirim gönder (talep silinmeden önce)
            var message = new
            {
                requestId = request.Id,
                customerId = request.CustomerId,
                paymentId = paymentId,
                customerName = request.Customer?.AdSoyad,
                paymentAmount = paymentAmount,
                paymentDate = paymentDate,
                paymentType = paymentType,
                requestedBy = request.RequestedBy?.Username,
                approvedBy = request.ApprovedBy?.Username,
                status = "Approved"
            };

            // debug log removed

            // Talebi veritabanından sil
            _context.DeleteRequests.Remove(request);
            await _context.SaveChangesAsync();

            // Tüm kullanıcılara bildirim gönder
            await _hubContext.Clients.All.SendAsync("ReceiveRequestApproved", message);

            return true;
        }

        public async Task<bool> RejectRequestAsync(int requestId, int rejectedByUserId, string rejectionReason)
        {
            var request = await GetDeleteRequestAsync(requestId);
            if (request == null || request.Status != "Pending") return false;

            // Ödeme bilgilerini sakla (silmeden önce)
            var paymentId = request.PaymentId;
            var paymentAmount = request.Payment?.Tutar;
            var paymentDate = request.Payment?.Tarih;
            var paymentType = request.Payment?.Tur;

            // Real-time bildirim gönder (talep silinmeden önce)
            var message = new
            {
                requestId = request.Id,
                customerId = request.CustomerId,
                paymentId = paymentId,
                customerName = request.Customer?.AdSoyad,
                paymentAmount = paymentAmount,
                paymentDate = paymentDate,
                paymentType = paymentType,
                requestedBy = request.RequestedBy?.Username,
                rejectedBy = request.ApprovedBy?.Username,
                rejectionReason = rejectionReason,
                status = "Rejected"
            };

            // Talebi veritabanından sil
            _context.DeleteRequests.Remove(request);
            await _context.SaveChangesAsync();

            // Tüm kullanıcılara bildirim gönder
            await _hubContext.Clients.All.SendAsync("ReceiveRequestRejected", message);

            return true;
        }

        public async Task<bool> DeleteRequestAsync(int id)
        {
            var request = await GetDeleteRequestAsync(id);
            if (request == null) return false;

            _context.DeleteRequests.Remove(request);
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 