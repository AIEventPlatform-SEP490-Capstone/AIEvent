namespace AIEvent.Application.DTOs.Dashboard
{
    public class SystemSettingResponse
    {
        public required decimal FlatformFee { get; set; }
        public required decimal FixFee { get; set; }
        public required int DatePayout { get; set; }
        public DateTimeOffset? UpdateAt { get; set; }
    }
}
