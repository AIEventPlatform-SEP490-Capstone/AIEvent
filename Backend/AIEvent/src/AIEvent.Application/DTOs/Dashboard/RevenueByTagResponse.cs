namespace AIEvent.Application.DTOs.Dashboard
{
    public class RevenueByTagResponse
    {
        public Guid TagId { get; set; }
        public string TagName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int EventCount { get; set; }
    }
}
