namespace AIEvent.Application.DTOs.Friend
{
    public class CommonEvent
    {
        public required string EventName { get; set; }
        public string? Address { get; set; }
        public DateTime Date { get; set; }
        public string? EventImage { get; set; }
    }
}
