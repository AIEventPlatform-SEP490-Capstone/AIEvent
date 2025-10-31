using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Organizer
{
    public class ConfirmRequest
    {
        public ConfirmStatus Status { get; set; }
        public string? Reason { get; set; }
    }
}
