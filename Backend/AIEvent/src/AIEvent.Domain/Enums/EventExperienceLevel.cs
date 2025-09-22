using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum EventExperienceLevel
    {
        [Display(Name = "Mới bắt đầu (0-1 năm)")]
        Beginner = 1,

        [Display(Name = "Có kinh nghiệm (1-3 năm)")]
        Intermediate = 2,

        [Display(Name = "Giàu kinh nghiệm (3-5 năm)")]
        Experienced = 3,

        [Display(Name = "Chuyên gia (5+ năm)")]
        Expert = 4
    }
}
