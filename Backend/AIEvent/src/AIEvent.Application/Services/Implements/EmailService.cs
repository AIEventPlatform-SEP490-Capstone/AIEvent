using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using MailKit.Security;
using MailKit.Net.Smtp;
using MimeKit;

namespace AIEvent.Application.Services.Implements
{
    public class EmailService : IEmailService
    {
        public async Task<Result> SendOtpAsync(string email, MimeMessage message)
        {
            if (string.IsNullOrWhiteSpace(email))
                return ErrorResponse.FailureResult("Email cannot be blank", ErrorCodes.InvalidInput);

            if (message == null)
                return ErrorResponse.FailureResult("Email content cannot be blank", ErrorCodes.InvalidInput);

            if (!MailboxAddress.TryParse(email, out _))
                return ErrorResponse.FailureResult("Email invalid", ErrorCodes.InvalidInput);

            message.From.Add(new MailboxAddress("AIEvent", "kietnase170077@fpt.edu.vn"));
            message.To.Add(MailboxAddress.Parse(email));

            try
            {
                using var client = new SmtpClient();
                await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync("thoaidtse170076@fpt.edu.vn", "gnmjhwhbyoovvigw");
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return Result.Success();
            }
            catch
            {
                return ErrorResponse.FailureResult("Can not send email. Please try again.");
            }
        }
    }
}
