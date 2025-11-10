using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AIEvent.Infrastructure.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public async Task SendNotificationToUser(Guid userId, object notification)
        {
            await Clients.User(userId.ToString())
                         .SendAsync("ReceiveNotification", notification);
        }

        public override Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId))
            {
                Context.Abort();
                return Task.CompletedTask;
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            return base.OnDisconnectedAsync(exception);
        }
    }
}
