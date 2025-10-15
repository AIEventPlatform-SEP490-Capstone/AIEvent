using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class PaymentTransaction : BaseEntity
    {
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual AppUser User { get; set; } = default!;
        [Required]
        public Guid BookingId { get; set; }

        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; } = default!;
        [Precision(18, 2)]
        public decimal Amount { get; set; }
        public required string Currency { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string? Description {  get; set; }
        public DateTime CompletedAt { get; set; }
    }
}
