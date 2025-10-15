using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class Wallet : BaseEntity
    {
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = default!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; }
        public WalletStatus Status { get; set; }
        public ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
        public ICollection<TopupRequest> TopupRequests { get; set; } = new List<TopupRequest>();
    }
}
