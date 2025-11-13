using AIEvent.Application.DTOs.Tag;

namespace AIEvent.Application.DTOs.Event
{
    public class ListEventResponse
    {
        public required Guid EventId { get; set; }
        public required string Title { get; set; }
        public string? Description { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
        public string? LocationName { get; set; }
        public int TotalTickets { get; set; }
        public int SoldQuantity { get; set; }
        public List<TagResponse>? Tags { get; set; }
        public required string EventCategoryName { get; set; }
        public List<string>? ImgListEvent { get; set; }
    }
}
