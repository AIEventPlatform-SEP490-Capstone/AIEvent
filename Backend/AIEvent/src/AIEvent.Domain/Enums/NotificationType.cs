namespace AIEvent.Domain.Enums
{
    public enum NotificationType
    {
        OrganizerRegistrationPending,
        OrganizerApproved,
        OrganizerRejected,
        EventCreated,
        EventApproved,
        EventRejected,
        EventInvitation,
        EventInvitationAccepted,
        EventInvitationRejected,
        Refund,
        PayoutCompleted,
        PayoutFailed,
        EventReminder,
        TicketSaleReminder,
        ReportEvent,
        EventCancelled,
        System = 99
    }
}
