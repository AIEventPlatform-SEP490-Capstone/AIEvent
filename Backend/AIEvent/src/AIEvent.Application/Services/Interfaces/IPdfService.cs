using AIEvent.Application.DTOs.Common; 

namespace AIEvent.Application.Services.Interfaces
{
    public interface IPdfService
    {
        Task<byte[]> GenerateTicketsPdfAsync(List<TicketForPdf> tickets, string eventName, string buyer, string email);
    }
}
