import { useRoutes, Navigate } from "react-router-dom";
import { PATH } from "./path";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/Home/HomePage";

export default function useRouterElement() {
  const element = useRoutes([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "search", element: <div>Search Page</div> },
        { path: "nearby", element: <div>Nearby Events Page</div> },
        { path: "timeline", element: <div>Timeline Page</div> },
        { path: "friends", element: <div>Friends Page</div> },
        { path: "friends/search", element: <div>Friend Search Page</div> },
        { path: "favorites", element: <div>Favorites Page</div> },
        { path: "wallet", element: <div>Wallet Page</div> },
        { path: "my-tickets", element: <div>My Tickets Page</div> },
        { path: "notifications", element: <div>Notifications Page</div> },
        { path: "settings", element: <div>Settings Page</div> },
        { path: "help", element: <div>Help Page</div> },
        { path: "about", element: <div>About Page</div> },
        { path: "profile", element: <div>Profile Page</div> },
        { path: "profile/:userId", element: <div>User Profile Page</div> },
        { path: "event/:id", element: <div>Event Detail Page</div> },
        { path: "booking/:id", element: <div>Booking Page</div> },
        { path: "payment/:ticketId", element: <div>Payment Page</div> },
        { path: "qr-viewer/:ticketId", element: <div>QR Viewer Page</div> },
        { path: "event-invitations", element: <div>Event Invitations Page</div> },
        { path: "application-status", element: <div>Application Status Page</div> },
        { path: "social-sharing", element: <div>Social Sharing Page</div> },
        { path: "become-organizer", element: <div>Become Organizer Page</div> },
      ],
    },
    {
      path: PATH.AUTH,
      children: [
        { path: "login", element: <div>Login Page</div> },
        { path: "register", element: <div>Register Page</div> },
      ],
    },
    {
      path: PATH.ORGANIZER,
      element: <MainLayout />,
      children: [
        { index: true, element: <div>Organizer Dashboard</div> },
        { path: "create", element: <div>Create Event Page</div> },
        { path: "events", element: <div>Organizer Events Page</div> },
        { path: "my-events", element: <div>My Events Page</div> },
        { path: "profile", element: <div>Organizer Profile Page</div> },
        { path: "settings", element: <div>Organizer Settings Page</div> },
        { path: "support", element: <div>Organizer Support Page</div> },
        { path: "analytics/:id", element: <div>Organizer Analytics Page</div> },
        { path: "checkin/:id", element: <div>Organizer Check-in Page</div> },
      ],
    },
    {
      path: PATH.ADMIN,
      element: <MainLayout />,
      children: [
        { index: true, element: <div>Admin Dashboard</div> },
        { path: "events", element: <div>Admin Events Page</div> },
        { path: "users", element: <div>Admin Users Page</div> },
        { path: "organizers", element: <div>Admin Organizers Page</div> },
        { path: "profile", element: <div>Admin Profile Page</div> },
        { path: "settings", element: <div>Admin Settings Page</div> },
        { path: "system-settings", element: <div>Admin System Settings Page</div> },
        { path: "documentation", element: <div>Admin Documentation Page</div> },
        { path: "help", element: <div>Admin Help Page</div> },
        { path: "quick-actions", element: <div>Admin Quick Actions Page</div> },
      ],
    },
    { path: "*", element: <Navigate to={PATH.HOME} /> },
  ]);
  return element;
}
