using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace AIEvent.Domain.Entities
{
    public class EndEventRequest : BaseEntity
    {
        public Guid OrganizerProfileId { get; set; }
        public Guid EventId { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalRevenue { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal PlatformFee { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetRevenue { get; set; }
        public string? Note { get; set; }
        public ConfirmStatus Status { get; set; }
        public DateTime ReviewedAt { get; set; }
        public virtual OrganizerProfile OrganizerProfile { get; set; } = default!;
        public virtual Event Event { get; set; } = default!;
    }
}
