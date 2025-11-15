namespace AIEvent.Application.DTOs.Dashboard
{
    public class RevenueByCategoryTagResponse
    {
        public List<RevenueByCategoryResponse> RevenueByCategory { get; set; } = new();
        public List<RevenueByTagResponse> RevenueByTag { get; set; } = new();
    }
}
