using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class PaymentTransaction : BaseEntity
    {
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = default!;
        [Required]
        public Guid BookingId { get; set; }

        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; } = default!;
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string? Description {  get; set; }
        public TransactionType TransactionType { get; set; }
        public TransactionStatus Status { get; set; } 
        public DateTime CompletedAt { get; set; }
    }
}
