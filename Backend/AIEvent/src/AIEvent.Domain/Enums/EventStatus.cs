namespace AIEvent.Domain.Enums
{
    public enum EventStatus
    {
        PendingApproval,
        Approved,
        Rejected,
        Cancelled, 
        WaitingForPayout,
        ErrorPayment,
        PaidOut,
    }
}
