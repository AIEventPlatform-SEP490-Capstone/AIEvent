using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum BudgetOption
    {
        [Display(Name = "Linh hoạt")]
        Flexible = 0,

        [Display(Name = "Dưới 500k VND")]
        Under500k = 1,

        [Display(Name = "500k - 2M VND")]
        From500kTo2M = 2,

        [Display(Name = "Trên 2M VND")]
        Above2M = 3
    }
}
