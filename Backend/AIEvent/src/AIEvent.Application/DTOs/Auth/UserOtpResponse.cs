using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Auth
{
    public class UserOtpResponse
    {
        public string Code { get; set; } = null!;
        public PurposeStatus Purpose { get; set; }
        public DateTime ExpiredAt { get; set; }
    }
}
