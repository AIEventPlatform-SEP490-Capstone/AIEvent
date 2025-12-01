using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;

namespace AIEvent.Domain.Entities
{
    public class SystemSetting : BaseEntity
    {
        [Column(TypeName = "decimal(18,2)")]
        public decimal FlatformFee { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal FixFee { get; set;}
        public int DatePayout { get; set;}
        public int EventReminderHours { get; set; } = 3;
    }
}