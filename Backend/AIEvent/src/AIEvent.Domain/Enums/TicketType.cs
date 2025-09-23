using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum TicketType
    {
        [Display(Name = "Miễn phí")]
        Free = 1,
        [Display(Name = "Có phí")]
        Paid = 2,
        [Display(Name = "Quyên góp")]
        Donate = 3
    }
}
