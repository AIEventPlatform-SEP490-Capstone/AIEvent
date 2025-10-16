using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using AIEvent.Domain.Enums;


namespace AIEvent.Domain.Entities
{
    public class TopupRequest : BaseEntity
    {
        [Required]
        public Guid WalletId { get; set; }

        [ForeignKey("WalletId")]
        public virtual Wallet Wallet { get; set; } = default!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        public required string SepayTransId { get; set; }
        public string? PaymentInfoJson { get; set; } // lưu VA/QR/url JSON
        public string? Description { get; set; }
        public TransactionStatus Status { get; set; }
        public DateTime CompletedAt { get; set; }
        public string? FailureReason { get; set; }
        public string? ClientRequestId { get; set; }
    }
}
