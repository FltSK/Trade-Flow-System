using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace TradeFlowSystemAPI.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public async Task JoinAdminGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
        }

        public async Task SendDeleteRequest(string userId, string message)
        {
            // Admin grubuna bildirim gönder
            await Clients.Group("admins").SendAsync("ReceiveDeleteRequest", userId, message);
        }

        public async Task SendRequestApproved(string userId, string message)
        {
            // Kullanıcıya onay bildirimi gönder
            await Clients.Group($"user_{userId}").SendAsync("ReceiveRequestApproved", message);
        }

        public async Task SendRequestRejected(string userId, string message)
        {
            // Kullanıcıya red bildirimi gönder
            await Clients.Group($"user_{userId}").SendAsync("ReceiveRequestRejected", message);
        }

        public async Task SendNotification(string userId, string message)
        {
            // Belirli kullanıcıya bildirim gönder
            await Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", message);
        }

        public async Task SendGlobalNotification(string message)
        {
            // Tüm kullanıcılara bildirim gönder
            await Clients.All.SendAsync("ReceiveGlobalNotification", message);
        }

        // Stok güncellemeleri için metodlar
        public async Task SendStokUpdated(object stokData)
        {
            // Tüm kullanıcılara stok güncellemesi gönder
            await Clients.All.SendAsync("ReceiveStokUpdated", stokData);
        }

        public async Task SendStokDeleted(int stokId, object deletedStokData)
        {
            // Tüm kullanıcılara stok silme bildirimi gönder
            await Clients.All.SendAsync("ReceiveStokDeleted", stokId, deletedStokData);
        }

        public async Task SendStokRestored(int stokId, object restoredStokData)
        {
            // Tüm kullanıcılara stok geri alma bildirimi gönder
            await Clients.All.SendAsync("ReceiveStokRestored", stokId, restoredStokData);
        }

        public async Task SendStokHareketiAdded(object hareketData)
        {
            // Tüm kullanıcılara stok hareketi ekleme bildirimi gönder
            await Clients.All.SendAsync("ReceiveStokHareketiAdded", hareketData);
        }

        // Sözleşme dosyası işlemleri için metodlar
        public async Task SendSozlesmeUploaded(int customerId, object sozlesmeData)
        {
            // Tüm kullanıcılara sözleşme yükleme bildirimi gönder
            await Clients.All.SendAsync("ReceiveSozlesmeUploaded", customerId, sozlesmeData);
        }

        public async Task SendSozlesmeDeleted(int customerId)
        {
            // Tüm kullanıcılara sözleşme silme bildirimi gönder
            await Clients.All.SendAsync("ReceiveSozlesmeDeleted", customerId);
        }
    }
} 