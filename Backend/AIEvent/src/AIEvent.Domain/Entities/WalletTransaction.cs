using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using AIEvent.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Domain.Entities
{
    public class WalletTransaction : BaseEntity
    {
        [Required]
        public Guid WalletId { get; set; }

        [ForeignKey("WalletId")]
        public virtual Wallet Wallet { get; set; } = default!;
        public TransactionType Type { get; set; }
        [Precision(18, 2)]
        public decimal Amount { get; set; }
        [Precision(18, 2)]
        public decimal BalanceBefore { get; set; }
        [Precision(18, 2)]
        public decimal BalanceAfter { get; set; }
        public TransactionStatus Status { get; set; }
        public string? Description { get; set; }
        public Guid? ReferenceId { get; set; }
    }
}
