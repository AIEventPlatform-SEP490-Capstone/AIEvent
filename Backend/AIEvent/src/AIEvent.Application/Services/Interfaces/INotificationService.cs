using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface INotificationService
    {
        Task<Result> CreateNotificationToAllAsync(CreateNotificationToAllRequest request);
        Task<Result> CreateNotificationAsync(CreateNotificationRequest request);
        Task<Result<BasePaginated<NotificationResponse>>> GetNotificationsByUserIdAsync(Guid userId, bool? isRead = false, int pageNumber = 1, int pageSize = 5);
        Task<Result> MarkAsReadAsync(Guid notificationId);
        Task<Result> MarkAllAsReadAsync(Guid userId);
        Task<Result> DeleteIsReadNotificationsAsync(Guid userId);
        Task<Result> SendEventBookingReminderAsync();
        Task<Result> SendFavoriteEventTicketSaleNotificationAsync();
    }
}
