 namespace AIEvent.Application.DTOs.Dashboard
{
    public class MonthlyStatisticsResponse
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int BookingsCount { get; set; }
        public int TicketsSoldCount { get; set; }
        public decimal Revenue { get; set; }
    }
}