using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum OrganizerType
    {
        [Display(Name = "Cá nhân")]
        Individual = 1,  
        [Display(Name = "Doanh nghiệp")]
        Business = 2     
    }
}
