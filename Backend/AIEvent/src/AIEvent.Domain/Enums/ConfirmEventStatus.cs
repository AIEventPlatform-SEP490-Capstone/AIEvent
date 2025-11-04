namespace AIEvent.Domain.Enums
{
    public enum ConfirmEventStatus
    {
        Approve, // Đã được admin duyệt, có thể hiển thị public
        Reject, // Bị từ chối (publish)
        NeedConfirm, // Đợi admin duyệt publish
        NeedMoreEvidence, // Bị từ chối, yêu cầu bổ sung bằng chứng
        WaitingForPayout, // Duyệt thành công, chờ hệ thống trả tiền
        PendingApproval, // Gửi yêu cầu kết thúc event
        Ended, // kết thúc vòng đời của 1 event
        Completed, // Hoàn thành chuyển tiền payout nhà tổ chức
    }
}
