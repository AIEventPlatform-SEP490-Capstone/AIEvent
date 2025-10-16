using AIEvent.Application.Services.Interfaces;
using MailKit.Security;
using MailKit.Net.Smtp;
using MimeKit;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.Helpers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;

namespace AIEvent.Application.Services.Implements
{
    public class EmailService : IEmailService
    {
        public async Task<Result<UserOtpResponse>> SendOtpAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return ErrorResponse.FailureResult("Email không đc để trống", ErrorCodes.InvalidInput);

            if (!MailboxAddress.TryParse(email, out _))
                return ErrorResponse.FailureResult("Email không hợp lệ", ErrorCodes.InvalidInput);
            
            var otp = new Random().Next(100000, 999999).ToString();

            var message = new MimeMessage
            {
                Subject = "Mã OTP của bạn",
                Body = new TextPart("plain")
                {
                    Text = $"Mã xác thực của bạn là: {otp}. Mã này sẽ hết hạn sau 5 phút."
                }
            };
            message.From.Add(new MailboxAddress("AIEvent", "kietnase170077@fpt.edu.vn"));
            message.To.Add(MailboxAddress.Parse(email));

            try
            {
                using var client = new SmtpClient();
                await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync("thoaidtse170076@fpt.edu.vn", "gnmjhwhbyoovvigw");
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return Result<UserOtpResponse>.Success(new UserOtpResponse
                {
                    Code = otp,
                    ExpiredAt = DateTime.UtcNow.AddMinutes(5)
                });
            }
            catch
            {
                return ErrorResponse.FailureResult("Không thể gửi email. Vui lòng thử lại sau.");
            }
        }

    }
}
