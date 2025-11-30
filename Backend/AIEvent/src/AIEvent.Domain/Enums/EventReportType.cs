using System.ComponentModel;

namespace AIEvent.Domain.Enums
{
    public enum EventReportType
    {
        [Description("Lừa đảo")]
        Scam,

        [Description("Thông tin sai sự thật")]
        FakeInfo,

        [Description("Phản động")]
        Reactionary,

        [Description("Quấy rối tình dục")]
        SexualHarassment,

        [Description("Bạo lực")]
        Violence,

        [Description("Không phù hợp")]
        Inappropriate,

        [Description("Khác")]
        Other
    }

    public static class EventReportTypeExtensions
    {
        public static string GetDescription(this EventReportType value)
        {
            var field = value.GetType().GetField(value.ToString());
            var attribute = Attribute.GetCustomAttribute(field!, typeof(DescriptionAttribute)) as DescriptionAttribute;
            return attribute?.Description ?? value.ToString();
        }
    }
}
