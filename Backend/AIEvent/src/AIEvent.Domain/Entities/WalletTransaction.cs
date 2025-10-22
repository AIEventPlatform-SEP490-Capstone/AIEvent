using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using AIEvent.Domain.Enums;
namespace AIEvent.Domain.Entities
{
    public class WalletTransaction : BaseEntity
    {
        [Required]
        public Guid WalletId { get; set; }

        [ForeignKey("WalletId")]
        public virtual Wallet Wallet { get; set; } = default!;
        public TransactionType Type { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal BalanceBefore { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal BalanceAfter { get; set; }
        public TransactionDirection Direction { get; set; }
        public TransactionStatus Status { get; set; }
        public string? Description { get; set; }
        public Guid? ReferenceId { get; set; }
        public ReferenceType? ReferenceType { get; set; }
    }
}
