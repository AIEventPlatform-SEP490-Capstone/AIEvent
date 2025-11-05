namespace AIEvent.Domain.Enums
{
    public enum EventStatus
    {
        PendingApproval,
        Approved,
        Rejected,
        Cancelled,
        PendingApprovalEnd,
        RejectEnded,
        WaitingForPayout,
        Ended,
    }
}
