namespace AIEvent.Application.DTOs.Dashboard
{
    public class RevenueByCategoryResponse
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int EventCount { get; set; }
    }
}
