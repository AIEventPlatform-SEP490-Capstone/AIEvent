using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Organizer
{
    public class ConfirmOrganizerRequest
    {
        public ConfirmOrganizerProfileStatus Status { get; set; }
        public string? Reason { get; set; }
    }
}
