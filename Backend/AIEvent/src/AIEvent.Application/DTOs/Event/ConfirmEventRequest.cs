using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class ConfirmEventRequest
    {
        public ConfirmStatus Status { get; set; }
        public string? Reason { get; set; }
    }
}
