namespace AIEvent.Application.DTOs.Wallet
{
    public class WalletResponse
    {
        public Guid WalletId { get; set; }
        public decimal Balance { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }
}
