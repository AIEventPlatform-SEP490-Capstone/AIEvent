using AIEvent.Application.Helpers;
using MimeKit;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEmailService
    {
        Task<Result> SendOtpAsync(string email, MimeMessage message);
        Task SendTicketsEmailAsync(string toEmail, string subject, string htmlBody, byte[] pdfBytes, string pdfFileName, string eventName);
    }
}
