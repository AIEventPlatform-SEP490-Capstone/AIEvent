using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum TicketPricingType
    {
        [Display(Name = "Miễn phí")]
        Free = 1,
        [Display(Name = "Có phí")]
        Paid = 2
    }
}
