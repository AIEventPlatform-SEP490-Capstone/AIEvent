using AIEvent.Domain.Bases;

namespace AIEvent.Application.DTOs.Dashboard
{
    public class AdminDashboardResponse
    { 
        public int TotalUsers { get; set; }
        public decimal MonthlyUserGrowthPercentage { get; set; }
        public int TotalOrganizers { get; set; }
        public int TotalEvents { get; set; }
        public int PendingEventsCount { get; set; }
        public int CancelledEventsCount { get; set; }
        public int PendingOrganizerRequestsCount { get; set; }
         
        public int TotalBookings { get; set; }
        public int BookingsToday { get; set; }
        public int CompletedBookings { get; set; }
        public int PendingBookings { get; set; }
        public int CancelledBookings { get; set; }
         
        public int TotalTicketsSold { get; set; }
        public int TicketsSoldToday { get; set; }
        public int ValidTickets { get; set; }
        public int UsedTickets { get; set; }
         
        public decimal TotalRevenue { get; set; }
        public decimal RevenueToday { get; set; }
        public decimal RevenueThisMonth { get; set; }
    }
}

