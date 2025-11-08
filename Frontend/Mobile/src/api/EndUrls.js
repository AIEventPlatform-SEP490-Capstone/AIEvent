import { getBaseUrl } from '../config/NetworkConfig';

const BASE_URL = getBaseUrl();
console.log('Base URL:', BASE_URL);

const EndUrls = {
  // Auth
  LOGIN: `${BASE_URL}/auth/login`,
  REFRESH_TOKEN: `${BASE_URL}/auth/refresh-token`,
  REVOKE_TOKEN: `${BASE_URL}/auth/revoke-token`,
  CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
  
  // Events
  EVENTS: `${BASE_URL}/event`,
  EVENT_DETAIL: (id) => `${BASE_URL}/event/${id}`,
  MY_EVENTS: `${BASE_URL}/event/my-events`,
  JOIN_EVENT: (id) => `${BASE_URL}/event/${id}/join`,
  LEAVE_EVENT: (id) => `${BASE_URL}/event/${id}/leave`,
  SHARE_EVENT: (id) => `${BASE_URL}/event/${id}/share`,
  EVENT_ATTENDEES: (id) => `${BASE_URL}/event/${id}/attendees`,
  
  // Event Categories
  EVENT_CATEGORIES: `${BASE_URL}/event-category`,
  EVENT_CATEGORY_DETAIL: (id) => `${BASE_URL}/event-category/${id}`,
  
  // User
  PROFILE: `${BASE_URL}/user/profile`,
  UPDATE_PROFILE: `${BASE_URL}/user/profile`,
  
  // Wallet
  WALLET_USER: `${BASE_URL}/wallet/user`,
  WALLET_TRANSACTIONS: `${BASE_URL}/wallet/{walletId}/transactions`,
  PAYMENT_TOPUP: `${BASE_URL}/payment/topup`,
  
  // Payment Information
  PAYMENT_INFORMATIONS: `${BASE_URL}/payment/informations`,
  PAYMENT_INFORMATION: `${BASE_URL}/payment/information`,
  PAYMENT_INFORMATION_DELETE: (id) => `${BASE_URL}/payment/information/${id}`,
  PAYMENT_WITHDRAW: `${BASE_URL}/payment/withdraw`,
  
  // Friends
  FRIENDS: `${BASE_URL}/friend`,
  FRIENDS_SEARCH: `${BASE_URL}/friend/search`,
  FRIEND_REQUESTS: `${BASE_URL}/friend/request`,
  FRIEND_REQUEST_RESPOND: (requestId) => `${BASE_URL}/friend/${requestId}`,
  ADD_FRIEND: (userId) => `${BASE_URL}/friend/${userId}`,
  DELETE_FRIEND: (friendId) => `${BASE_URL}/friend/${friendId}`,
  FRIEND_PROFILE: (friendId) => `${BASE_URL}/friend/${friendId}`,
  
  // Booking (used in timeline screen)
  BOOKED_EVENTS: `${BASE_URL}/booking/event`,
  EVENT_TICKETS: (eventId) => `${BASE_URL}/booking/event/${eventId}/ticket`,
  TICKET_QR: (ticketId) => `${BASE_URL}/booking/ticket/qr/${ticketId}`,
};

console.log('EndUrls:', EndUrls);

export default EndUrls;