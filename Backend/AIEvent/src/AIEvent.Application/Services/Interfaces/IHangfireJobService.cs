using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.InviteFriend; 

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
    }
}
