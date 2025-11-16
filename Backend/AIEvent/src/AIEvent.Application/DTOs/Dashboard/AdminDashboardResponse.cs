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
        public int PendingOrganizerRequestsCount { get; set; }
  
        public BasePaginated<PendingEventResponse> PendingEvents { get; set; } = null!;
        public BasePaginated<PendingOrganizerRequestResponse> PendingOrganizerRequests { get; set; } = null!;
        public BasePaginated<NewUserResponse> NewUsers { get; set; } = null!;
    }
}

