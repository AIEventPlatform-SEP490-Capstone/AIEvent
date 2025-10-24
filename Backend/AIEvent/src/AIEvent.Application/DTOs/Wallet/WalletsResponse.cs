using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Wallet
{
    public class WalletsResponse
    {
        public Guid WalletId { get; set; }
        public string? Description { get; set; }
        public string? OrderCode { get; set; }
        public TransactionType Type { get; set; }
        public decimal Balance { get; set; }
        public TransactionStatus Status { get; set; }
        public TransactionDirection Direction { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
