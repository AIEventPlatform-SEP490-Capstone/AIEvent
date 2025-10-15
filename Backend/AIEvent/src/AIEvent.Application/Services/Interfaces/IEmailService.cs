using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEmailService
    {
        Task<Result<UserOtpResponse>> SendOtpAsync(string email);
    }
}
