using AIEvent.Application.Helpers;
using MimeKit;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEmailService
    {
        Task<Result> SendOtpAsync(string email, MimeMessage message);
    }
}
