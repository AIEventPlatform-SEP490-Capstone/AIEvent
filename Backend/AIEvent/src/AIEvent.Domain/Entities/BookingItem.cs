using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Domain.Entities
{
    public partial class BookingItem : BaseEntity
    {
        [Required]
        public Guid BookingId { get; set; }

        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; } = default!;

        [Required]
        public Guid TicketTypeId { get; set; }

        [ForeignKey("TicketTypeId")]
        public virtual TicketDetail TicketType { get; set; } = default!;
        public int Quantity { get; set; }
        [Precision(18, 2)]
        public decimal UnitPrice { get; set; }
        [Precision(18, 2)]
        public decimal TotalPrice { get; set; }
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
