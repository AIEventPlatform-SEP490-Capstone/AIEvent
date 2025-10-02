using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum TimeLine
    {
        [Display(Name = "Hôm nay")]
        Today = 0,

        [Display(Name = "Ngày mai")]
        Tomorrow = 1,

        [Display(Name = "Tuần này")]
        ThisWeek = 2,

        [Display(Name = "Tháng này")]
        ThisMonth = 3
    }
}
