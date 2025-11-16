namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventStatisticsResponse
    {
        public int TotalEvents { get; set; }
        public List<EventCountByStatusResponse> EventsByStatus { get; set; } = new();
        public List<EventCountByTagResponse> EventsByTag { get; set; } = new();
        public List<EventCountByCategoryResponse> EventsByCategory { get; set; } = new();
        public List<EventCountByDateResponse> EventsByDate { get; set; } = new();
    }
}
