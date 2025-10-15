using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Identity;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AIEvent.Domain.Entities
{
    public partial class Booking : BaseEntity
    {
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual AppUser User { get; set; } = default!;

        [Required]
        public Guid EventId { get; set; }

        [ForeignKey("EventId")]
        public virtual Event Event { get; set; } = default!;

        [Precision(18, 2)]
        public decimal TotalAmount { get; set; }
        public required string Currency {  get; set; }
        public BookingStatus Status { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();
        public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
    }
}
