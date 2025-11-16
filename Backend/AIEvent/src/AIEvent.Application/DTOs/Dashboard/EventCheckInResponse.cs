namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventCheckInResponse
    {
        public Guid EventId { get; set; }
        public string? EventName { get; set; }
        public int CheckedInCount { get; set; }
    }
}
