namespace AIEvent.Domain.Enums
{
    public enum TransactionType
    {
        Topup,          // Nạp tiền vào ví user
        Payment,        // User thanh toán (booking)
        Hold,           // Giữ tiền tạm thời trong system wallet
        Release,        // Nhả tiền từ HOLD -> trả cho organizer
        Refund,         // Hoàn tiền cho user
        PlatformFee,    // Thu phí nền tảng
        Transfer,       // Chuyển tiền giữa các ví (internal)
        Withdraw,       // Rút tiền ra ngoài (bank)
        Adjustment      // Điều chỉnh thủ công bởi admin (nếu cần)
    }
}
