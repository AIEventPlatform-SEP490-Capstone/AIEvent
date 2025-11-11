using AIEvent.Application.Helpers;
using MimeKit;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEmailService
    {
        Task<Result> SendEmailAsync(string email, MimeMessage message);
        Task SendTicketsEmailAsync(string toEmail, string subject, string htmlBody, byte[] pdfBytes, string pdfFileName, string eventName, string userFullName, string? organizerName = null, string? organizerPhone = null, string? organizerEmail = null, DateTime? eventStartTime = null, DateTime? eventEndTime = null);
    }
}
