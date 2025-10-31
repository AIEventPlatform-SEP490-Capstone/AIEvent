namespace AIEvent.Application.DTOs.Common
{
    public class TicketForPdf
    {
        public string TicketCode { get; set; } = "";
        public string EventName { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public string TicketType { get; set; } = "";
        public decimal Price { get; set; }
        public string QrUrl { get; set; } = "";
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Address { get; set; } = "";
        public byte[]? QrBytes { get; set; }
    }
}
