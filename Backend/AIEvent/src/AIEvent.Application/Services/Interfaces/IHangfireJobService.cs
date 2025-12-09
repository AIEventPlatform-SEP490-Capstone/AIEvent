using AIEvent.Application.DTOs.Booking; 
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Domain.Entities;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IHangfireJobService
    {
        Task EnqueueSendTicketEmailJobAsync(SendEmailJobRequest request);
        Task EnqueueCancelEventJobAsync(Guid eventId, string reasonCancel); 
        Task EnqueueInviteEmail(InviteFriendEmail request);
        Task EnqueueConfirmEmail(ConfirmInvitationEmail request);
        Task EnqueueUserEmbeddingJobAsync(Guid userId);
        Task EnqueueEmbedNewEventJobAsync(Guid eventId);
        Task EnqueueCancelEventNotificationJobAsync(CancelEventNotificationRequest request);
        Task EnqueueNotifyPlatformSettingChange(SystemSetting newSetting);
    }
}
