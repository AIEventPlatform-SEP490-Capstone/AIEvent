// Event-related constants

export const ConfirmStatus = {
  Approve: 'Approve',
  Reject: 'Reject',
  NeedConfirm: 'NeedConfirm'
};

export const ConfirmStatusDisplay = {
  [ConfirmStatus.Approve]: 'Đã phê duyệt',
  [ConfirmStatus.Reject]: 'Bị từ chối',
  [ConfirmStatus.NeedConfirm]: 'Chờ phê duyệt'
};

export const TicketType = {
  Free: 1,
  Paid: 2,
  Donate: 3
};

export const TicketTypeDisplay = {
  [TicketType.Free]: 'Miễn phí',
  [TicketType.Paid]: 'Có phí',
  [TicketType.Donate]: 'Quyên góp'
};