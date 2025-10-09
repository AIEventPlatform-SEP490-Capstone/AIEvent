export const PATH = {
    // AUTH
    AUTH: "/auth",
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    
    // HOME
    HOME: "/",
    SEARCH: "/search",
    NEARBY: "/nearby",
    TIMELINE: "/timeline",
    FRIENDS: "/friends",
    FRIENDS_SEARCH: "/friends/search",
    FAVORITES: "/favorites",
    WALLET: "/wallet",
    MY_TICKETS: "/my-tickets",
    NOTIFICATIONS: "/notifications",
    SETTINGS: "/settings",
    HELP: "/help",
    ABOUT: "/about",
    PROFILE: "/profile",
    PROFILE_USER: "/profile/:userId",
    
    // EVENT
    EVENT_DETAIL: "/event/:id",
    BOOKING: "/booking/:id",
    PAYMENT: "/payment/:ticketId",
    QR_VIEWER: "/qr-viewer/:ticketId",
    EVENT_INVITATIONS: "/event-invitations",
    APPLICATION_STATUS: "/application-status",
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
    BECOME_ORGANIZER: "/become-organizer",
    
    // ADMIN
    ADMIN: "/admin",
    ADMIN_DASHBOARD: "/admin/dashboard",
    ADMIN_EVENTS: "/admin/events",
    ADMIN_USERS: "/admin/users",
    ADMIN_ORGANIZERS: "/admin/organizers",
    ADMIN_PROFILE: "/admin/profile",
    ADMIN_SETTINGS: "/admin/settings",
    ADMIN_SYSTEM_SETTINGS: "/admin/system-settings",
    ADMIN_DOCUMENTATION: "/admin/documentation",
    ADMIN_HELP: "/admin/help",
    ADMIN_QUICK_ACTIONS: "/admin/quick-actions",
    
    // ERROR
    ERROR: "*",
  };
