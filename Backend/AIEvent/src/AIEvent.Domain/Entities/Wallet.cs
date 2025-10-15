using AIEvent.Domain.Base;
using AIEvent.Domain.Identity;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class Wallet : BaseEntity
    {
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual AppUser User { get; set; } = default!;

        [Precision(18, 2)]
        public decimal Balance { get; set; }
        public WalletStatus Status { get; set; }
        public ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
        public ICollection<TopupRequest> TopupRequests { get; set; } = new List<TopupRequest>();
    }
}
