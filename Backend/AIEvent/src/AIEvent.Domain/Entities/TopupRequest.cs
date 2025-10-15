using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using AIEvent.Domain.Enums;


namespace AIEvent.Domain.Entities
{
    public class TopupRequest : BaseEntity
    {
        [Required]
        public Guid WalletId { get; set; }

        [ForeignKey("WalletId")]
        public virtual Wallet Wallet { get; set; } = default!;

        [Precision(18, 2)]
        public decimal Amount { get; set; }
        public required string SepayTransId { get; set; }
        public TransactionStatus Status { get; set; }
        public DateTime CompletedAt { get; set; }
    }
}
