using AIEvent.Application.DTOs.Common;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IHangfireJobService
    {
        Task EnqueueSendTicketEmailJobAsync(string userEmail, string userFullName, string eventTitle, List<TicketForPdf> tickets);
    }
}
