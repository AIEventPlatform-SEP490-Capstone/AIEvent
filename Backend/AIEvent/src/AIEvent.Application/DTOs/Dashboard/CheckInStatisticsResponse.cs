namespace AIEvent.Application.DTOs.Dashboard
{
    public class CheckInStatisticsResponse
    {
        public int TotalCheckedIn { get; set; }
        public List<EventCheckInResponse> CheckInsByEvent { get; set; } = new();
    }
}
