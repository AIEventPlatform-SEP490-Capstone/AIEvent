using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Application.DTOs.RevenueReport;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IHangfireJobService
    {
        Task EnqueueSendTicketEmailJobAsync(string userEmail, string userFullName, string eventTitle, List<TicketForPdf> tickets);
        Task EnqueueCancelEventJobAsync(Guid eventId, string reasonCancel);
        Task EnqueueOrganizerPayoutJobAsync(RevenueReportRequest request);
        Task EnqueueInviteEmail(InviteFriendEmail request);
        Task EnqueueConfirmEmail(ConfirmInvitationEmail request);
        Task EnqueueUserEmbeddingJobAsync(Guid userId);
    }
}
