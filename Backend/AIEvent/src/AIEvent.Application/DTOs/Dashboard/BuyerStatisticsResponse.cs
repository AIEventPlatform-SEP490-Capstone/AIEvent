namespace AIEvent.Application.DTOs.Dashboard
{
    public class BuyerStatisticsResponse
    {
        public int TotalBuyers { get; set; }
        public List<EventBuyerResponse> BuyersByEvent { get; set; } = new();
    }
}
