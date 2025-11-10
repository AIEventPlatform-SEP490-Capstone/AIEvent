namespace AIEvent.Domain.Enums
{
    public enum NotificationType
    {
        OrganizerRegistrationPending = 0,
        OrganizerApproved = 1,
        OrganizerRejected = 2,
        EventCreated = 10,
        EventApproved = 11,
        EventRejected = 12,
        EventCancelled = 13,
        BookingConfirmed = 20,
        EventInvitation = 21,
        EventInvitationAccepted = 22,
        EventInvitationRejected = 23,
        PaymentSuccess = 30,
        Refund = 31,
        System = 99
    }
}
