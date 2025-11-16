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
        EventCancelled,
        BookingConfirmed,
        EventInvitation,
        EventInvitationAccepted,
        EventInvitationRejected,
        PaymentSuccess,
        Refund,
        PayoutCompleted,
        PayoutFailed,
        EventReminder,
        System = 99
    }
}
