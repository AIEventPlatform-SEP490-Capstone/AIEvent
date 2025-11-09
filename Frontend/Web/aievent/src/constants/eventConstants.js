// Event-related constants

export const EventStatus = {
  PendingApproval: 'PendingApproval',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
  PendingApprovalEnd: 'PendingApprovalEnd',
  RejectEnded: 'RejectEnded',
  WaitingForPayout: 'WaitingForPayout',
  Ended: 'Ended'
};

export const EventStatusDisplay = {
  [EventStatus.PendingApproval]: 'Chờ phê duyệt',
  [EventStatus.Approved]: 'Đã phê duyệt',
  [EventStatus.Rejected]: 'Bị từ chối',
  [EventStatus.Cancelled]: 'Đã hủy',
  [EventStatus.PendingApprovalEnd]: 'Chờ kết thúc',
  [EventStatus.RejectEnded]: 'Từ chối kết thúc',
  [EventStatus.WaitingForPayout]: 'Chờ thanh toán',
  [EventStatus.Ended]: 'Đã kết thúc'
};

export const EndEventStatus = {
  PendingApprovalEnd: 'PendingApprovalEnd',
  Approved: 'Approved',
  Rejected: 'Rejected'
};

export const EndEventStatusDisplay = {
  [EndEventStatus.PendingApprovalEnd]: 'Chờ phê duyệt kết thúc',
  [EndEventStatus.Approved]: 'Đã phê duyệt kết thúc',
  [EndEventStatus.Rejected]: 'Từ chối kết thúc'
};

export const TicketType = {
  Free: 1,
  Paid: 2
};

export const TicketTypeDisplay = {
  [TicketType.Free]: 'Miễn phí',
  [TicketType.Paid]: 'Có phí'
};