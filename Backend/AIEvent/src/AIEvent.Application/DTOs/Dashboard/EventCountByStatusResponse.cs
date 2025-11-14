namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventCountByStatusResponse
    {
        public int Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public int Count { get; set; }
    }
    
}
