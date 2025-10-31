namespace AIEvent.Domain.Enums
{
    public enum TransactionType
    {
        Topup,          // Nạp tiền vào ví user
        Payment,        // User thanh toán (booking)
        Refund,         // Hoàn tiền cho user
        PlatformFee,    // Thu phí nền tảng
        Withdraw,       // Rút tiền ra ngoài (bank)
    }
}
