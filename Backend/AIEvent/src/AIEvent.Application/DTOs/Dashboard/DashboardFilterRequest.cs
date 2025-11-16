namespace AIEvent.Application.DTOs.Dashboard
{
    public class DashboardFilterRequest
    {
        public Guid? CategoryId { get; set; }
        public List<Guid>? TagIds { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? Year { get; set; }
        public int? Month { get; set; }
        public int? Day { get; set; }
    }
}

