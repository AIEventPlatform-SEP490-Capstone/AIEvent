using System.ComponentModel.DataAnnotations;
namespace AIEvent.Domain.Enums
{
    public enum EventFrequency
    {
        [Display(Name = "Hàng tuần")]
        Weekly = 1,

        [Display(Name = "Hàng tháng")]
        Monthly = 2,

        [Display(Name = "Hàng quý")]
        Quarterly = 3,

        [Display(Name = "Hàng năm")]
        Yearly = 4,

        [Display(Name = "Thỉnh thoảng")]
        Occasionally = 5,
    }
}
