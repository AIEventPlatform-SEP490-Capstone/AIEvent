export const PATH = {
  // AUTH
  AUTH: "/auth",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_OTP: "/auth/verify-otp",
  GOOGLE_CALLBACK: "/auth/google-callback",
  FORGOT_PASSWORD: "/auth/forgot-password",

  // HOME
  HOME: "/",
  SEARCH: "/search",
  NEARBY: "/nearby",
  TIMELINE: "/timeline",
  FRIENDS: "/friends",
  FRIENDS_SEARCH: "/friends/search",
  FRIEND_DETAIL: "/friend/:friendId",
  FAVORITES: "/favorites",
  WALLET: "/wallet",
  MY_TICKETS: "/my-tickets",
  CHAT: "/chat",
  NOTIFICATIONS: "/notifications",
  HELP: "/help",
  ABOUT: "/about",
  PROFILE: "/profile",
  PROFILE_USER: "/profile/:userId",
  BECOME_ORGANIZER: "/become-organizer",
  APPLICATION_STATUS: "/application-status",

  // EVENT
  EVENT_DETAIL: "/event/:id",
  BOOKING: "/booking/:id",
  PAYMENT: "/payment/:ticketId",
  QR_VIEWER: "/qr-viewer/:ticketId",
  EVENT_INVITATIONS: "/event-invitations",
  SOCIAL_SHARING: "/social-sharing",

  // ORGANIZER
  ORGANIZER: "/organizer",
  ORGANIZER_CREATE: "/organizer/create",
  ORGANIZER_EVENTS: "/organizer/events",
  ORGANIZER_MY_EVENTS: "/organizer/my-events",
  ORGANIZER_EVENT_DETAIL: "/organizer/event/:eventId",
  ORGANIZER_EVENT_EDIT: "/organizer/event/:eventId/edit",
  ORGANIZER_PROFILE: "/organizer/profile",
  ORGANIZER_SETTINGS: "/organizer/settings",
  ORGANIZER_SUPPORT: "/organizer/support",
  ORGANIZER_ANALYTICS: "/organizer/analytics/:id",
  ORGANIZER_CHECKIN: "/organizer/checkin/:id",
  ORGANIZER_TAGS: "/organizer/tags",
  ORGANIZER_STAFF: "/organizer/staff",

  // MANAGER
  MANAGER: "/manager",
  MANAGER_EVENTS: "/manager/events",
  MANAGER_EVENTS_CATEGORY: "/manager/events/category",
  MANAGER_EVENT_DETAIL: "/manager/event/:eventId",
  MANAGER_EVENT_EDIT: "/manager/event/:eventId/edit",
  MANAGER_TAGS: "/manager/tags",
  MANAGER_PROFILE: "/manager/profile",
  MANAGER_SETTINGS: "/manager/settings",
  MANAGER_SUPPORT: "/manager/support",
  MANAGER_ORGANIZERS: "/manager/organizers",
  MANAGER_ORGANIZERS_DETAILS: "/manager/organizers/:id",
  // MANAGER_END_EVENT_REQUESTS: "/manager/end-event-requests", // Đã tích hợp vào ManagerEventDetailPage

  // ADMIN
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_USERS: "/admin/users",
  ADMIN_PROFILE: "/admin/profile",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_SYSTEM_SETTINGS: "/admin/system-settings",
  ADMIN_PLATFORM_LOG_ACTIVITY: "/admin/platform-log-activity",
  ADMIN_DOCUMENTATION: "/admin/documentation",
  ADMIN_HELP: "/admin/help",
  ADMIN_QUICK_ACTIONS: "/admin/quick-actions",

  // SHARED

  // ERROR
  ERROR: "*",
};