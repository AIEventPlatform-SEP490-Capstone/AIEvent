// Event-related constants

export const EventStatus = {
  PendingApproval: 'PendingApproval',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
  WaitingForPayout: 'WaitingForPayout',
  PaidOut: 'PaidOut',
  ErrorPayment: 'ErrorPayment'
};

export const EventStatusDisplay = {
  [EventStatus.PendingApproval]: 'Chờ phê duyệt',
  [EventStatus.Approved]: 'Đã phê duyệt',
  [EventStatus.Rejected]: 'Bị từ chối',
  [EventStatus.Cancelled]: 'Đã hủy',
  [EventStatus.WaitingForPayout]: 'Chờ thanh toán',
  [EventStatus.PaidOut]: 'Đã thanh toán',
  [EventStatus.ErrorPayment]: 'Lỗi thanh toán'
};

export const TicketType = {
  Free: 1,
  Paid: 2
};

export const TicketTypeDisplay = {
  [TicketType.Free]: 'Miễn phí',
  [TicketType.Paid]: 'Có phí'
};