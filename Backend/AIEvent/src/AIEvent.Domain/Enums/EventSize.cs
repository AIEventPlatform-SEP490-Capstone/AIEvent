using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum EventSize
    {
        [Display(Name = "Nhỏ (10–50 người)")]
        Small = 1,

        [Display(Name = "Trung bình (50–200 người)")]
        Medium = 2,

        [Display(Name = "Lớn (200–500 người)")]
        Large = 3,

        [Display(Name = "Rất lớn (500+ người)")]
        ExtraLarge = 4
    }
}
