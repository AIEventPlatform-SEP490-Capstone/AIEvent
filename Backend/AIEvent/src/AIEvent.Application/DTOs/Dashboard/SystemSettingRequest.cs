using System.ComponentModel.DataAnnotations.Schema;

namespace AIEvent.Application.DTOs.Dashboard
{
    public class SystemSettingRequest
    {
        public required decimal FlatformFee { get; set; }
        public required decimal FixFee { get; set; }
        public required int DatePayout { get; set; }
        public required int EventReminderHours { get; set; }
        public required DateTimeOffset DateApply { get; set; }
    }
}
