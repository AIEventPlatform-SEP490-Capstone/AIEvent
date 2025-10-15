using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public partial class Ticket : BaseEntity
    {
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = default!;

        [Required]
        public Guid BookingItemId { get; set; }

        [ForeignKey("BookingItemId")]
        public virtual BookingItem BookingItem { get; set; } = default!;

        [Required]
        public Guid TicketTypeId { get; set; }

        [ForeignKey("TicketTypeId")]
        public virtual TicketDetail TicketType { get; set; } = default!;

        public required string EventName { get; set; }
        public string? Address { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public required string TicketCode { get; set; }
        public required string QrCodeUrl { get; set; }
        public TicketStatus Status { get; set; }
        public DateTime? UseAt { get; set; }
    }
}
