using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IOneSignalService
    {
        Task<Result<bool>> SendNotificationAsync(PushNotificationRequest dto);
    }
}
