import { getBaseUrl } from '../config/NetworkConfig';

const BASE_URL = getBaseUrl();

const EndUrls = {
  // Auth
  LOGIN: `${BASE_URL}/auth/login`,
  REFRESH_TOKEN: `${BASE_URL}/auth/refresh-token`,
  REVOKE_TOKEN: `${BASE_URL}/auth/revoke-token`,
  
  // // Events
  // EVENTS: `${BASE_URL}/events`,
  // EVENT_DETAIL: (id) => `${BASE_URL}/events/${id}`,
  // MY_EVENTS: `${BASE_URL}/events/my-events`,
  // JOIN_EVENT: (id) => `${BASE_URL}/events/${id}/join`,
  // // Event Detail
  // EVENT_DETAIL: (id) => `${BASE_URL}/events/${id}`,
  // JOIN_EVENT: (id) => `${BASE_URL}/events/${id}/join`,
  // LEAVE_EVENT: (id) => `${BASE_URL}/events/${id}/leave`,
  // SHARE_EVENT: (id) => `${BASE_URL}/events/${id}/share`,
  // EVENT_ATTENDEES: (id) => `${BASE_URL}/events/${id}/attendees`,
  
  // // User
  // PROFILE: `${BASE_URL}/user/profile`,
  // UPDATE_PROFILE: `${BASE_URL}/user/profile`,
  
  // // Search
  // SEARCH_EVENTS: `${BASE_URL}/events/search`,
};

export default EndUrls;
