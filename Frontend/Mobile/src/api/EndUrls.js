import { getBaseUrl } from '../config/NetworkConfig';

const BASE_URL = getBaseUrl();

const EndUrls = {
  // Auth
  LOGIN: `${BASE_URL}/auth/login`,
  REFRESH_TOKEN: `${BASE_URL}/auth/refresh-token`,
  REVOKE_TOKEN: `${BASE_URL}/auth/revoke-token`,
  CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
  
  // Events
  EVENTS: `${BASE_URL}/events`,
  EVENT_DETAIL: (id) => `${BASE_URL}/events/${id}`,
  MY_EVENTS: `${BASE_URL}/events/my-events`,
  JOIN_EVENT: (id) => `${BASE_URL}/events/${id}/join`,
  LEAVE_EVENT: (id) => `${BASE_URL}/events/${id}/leave`,
  SHARE_EVENT: (id) => `${BASE_URL}/events/${id}/share`,
  EVENT_ATTENDEES: (id) => `${BASE_URL}/events/${id}/attendees`,
  
  // User
  PROFILE: `${BASE_URL}/user/profile`,
  UPDATE_PROFILE: `${BASE_URL}/user/profile`,
  
  // Wallet
  WALLET_USER: `${BASE_URL}/wallet/user`,
  WALLET_TRANSACTIONS: `${BASE_URL}/wallet/{walletId}/transactions`,
  PAYMENT_TOPUP: `${BASE_URL}/payment/topup`,
  
  // Search
  SEARCH_EVENTS: `${BASE_URL}/events/search`,
  
  // Booking
  BOOKED_EVENTS: `${BASE_URL}/booking/event`,
  EVENT_TICKETS: (eventId) => `${BASE_URL}/booking/event/${eventId}/ticket`,
  TICKET_QR: (ticketId) => `${BASE_URL}/booking/ticket/qr/${ticketId}`,
};

export default EndUrls;
