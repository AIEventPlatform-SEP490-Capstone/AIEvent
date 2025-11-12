using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;

namespace AIEvent.Domain.Entities
{
    public class RevenueReport : BaseEntity
    {
        public Guid OrganizerProfileId { get; set; }
        public Guid EventId { get; set; }
        public required string EventName { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal GrossRevenue { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetRevenue { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal PlatformFee { get; set; }
        public int ReportMonth {  get; set; }
        public int ReportYear {  get; set; }
        public DateTime? PayoutDate { get; set; }
        public virtual OrganizerProfile OrganizerProfile { get; set; } = default!;
        public virtual Event Event { get; set; } = default!;
    }
}
