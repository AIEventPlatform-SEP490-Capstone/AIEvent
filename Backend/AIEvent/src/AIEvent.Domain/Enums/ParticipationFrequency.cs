using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum ParticipationFrequency
    {
        [Display(Name = "Hàng tuần")]
        Weekly = 1,

        [Display(Name = "Hàng tháng")]
        Monthly = 2,

        [Display(Name = "Thỉnh thoảng")]
        Occasionally = 3,

        [Display(Name = "Hàng ngày")]
        Daily = 4
    }
}
