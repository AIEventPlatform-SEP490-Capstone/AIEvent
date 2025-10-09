import { useRoutes, Navigate } from "react-router-dom";
import { PATH } from "./path";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/Home/HomePage";
import LoginPage from "../pages/Auth/LoginPage/LoginPage";
import CreateEventPage from "../pages/Event/CreateEventPage";
import MyEventsPage from "../pages/Event/MyEventsPage";
import OrganizerDashboard from "../pages/Organizer/OrganizerDashboard";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

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
        { path: "favorites", element: <ProtectedRoute><div>Favorites Page</div></ProtectedRoute> },
        { path: "wallet", element: <ProtectedRoute><div>Wallet Page</div></ProtectedRoute> },
        { path: "my-tickets", element: <ProtectedRoute><div>My Tickets Page</div></ProtectedRoute> },
        { path: "notifications", element: <ProtectedRoute><div>Notifications Page</div></ProtectedRoute> },
        { path: "settings", element: <ProtectedRoute><div>Settings Page</div></ProtectedRoute> },
        { path: "help", element: <div>Help Page</div> },
        { path: "about", element: <div>About Page</div> },
        { path: "profile", element: <ProtectedRoute><div>Profile Page</div></ProtectedRoute> },
        { path: "profile/:userId", element: <ProtectedRoute><div>User Profile Page</div></ProtectedRoute> },
        { path: "event/:id", element: <div>Event Detail Page</div> },
        { path: "booking/:id", element: <ProtectedRoute><div>Booking Page</div></ProtectedRoute> },
        { path: "payment/:ticketId", element: <ProtectedRoute><div>Payment Page</div></ProtectedRoute> },
        { path: "qr-viewer/:ticketId", element: <ProtectedRoute><div>QR Viewer Page</div></ProtectedRoute> },
        { path: "event-invitations", element: <ProtectedRoute><div>Event Invitations Page</div></ProtectedRoute> },
        { path: "application-status", element: <ProtectedRoute><div>Application Status Page</div></ProtectedRoute> },
        { path: "social-sharing", element: <ProtectedRoute><div>Social Sharing Page</div></ProtectedRoute> },
        { path: "become-organizer", element: <ProtectedRoute><div>Become Organizer Page</div></ProtectedRoute> },
      ],
    },
    {
      path: PATH.AUTH,
      children: [
        { path: "login", element: < LoginPage /> },
        { path: "register", element: <div>Register Page</div> },
      ],
    },
    {
      path: PATH.ORGANIZER,
      element: (
        <ProtectedRoute allowedRoles={["Organizer", "Admin", "Manager"]}>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <OrganizerDashboard /> },
        { path: "create", element: <CreateEventPage /> },
        { path: "events", element: <div>Organizer Events Page</div> },
        { path: "my-events", element: <MyEventsPage /> },
        { path: "profile", element: <div>Organizer Profile Page</div> },
        { path: "settings", element: <div>Organizer Settings Page</div> },
        { path: "support", element: <div>Organizer Support Page</div> },
        { path: "analytics/:id", element: <div>Organizer Analytics Page</div> },
        { path: "checkin/:id", element: <div>Organizer Check-in Page</div> },
      ],
    },
    {
      path: PATH.ADMIN,
      element: (
        <ProtectedRoute allowedRoles={["Admin"]}>
          <MainLayout />
        </ProtectedRoute>
      ),
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
