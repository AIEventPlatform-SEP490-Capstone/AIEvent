using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Application.DTOs.RevenueReport;
using AIEvent.Domain.Entities;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IHangfireJobService
    {
        Task EnqueueSendTicketEmailJobAsync(SendEmailJobRequest request);
        Task EnqueueCancelEventJobAsync(Guid eventId, string reasonCancel);
        Task EnqueueOrganizerPayoutJobAsync(RevenueReportRequest request);
        Task EnqueueInviteEmail(InviteFriendEmail request);
        Task EnqueueConfirmEmail(ConfirmInvitationEmail request);
        Task EnqueueUserEmbeddingJobAsync(Guid userId);
        Task EnqueueEmbedNewEventJobAsync(Guid entityId);
    }
}
