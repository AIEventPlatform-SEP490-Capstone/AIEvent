namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventCountByCategoryResponse
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int Count { get; set; }
    }

}
