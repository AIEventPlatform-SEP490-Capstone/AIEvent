namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventCountByTagResponse
    {
        public Guid TagId { get; set; }
        public string TagName { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
