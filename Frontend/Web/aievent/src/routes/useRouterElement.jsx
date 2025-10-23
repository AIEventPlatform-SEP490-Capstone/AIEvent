import { useRoutes, Navigate } from "react-router-dom";
import { PATH } from "./path";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/Home/HomePage";
import LoginPage from "../pages/Auth/LoginPage/LoginPage";
import CreateEventPage from "../pages/Organizer/CreateEventPage";
import MyEventsPage from "../pages/Organizer/MyEventsPage";
import EventDetailPage from "../pages/Organizer/EventDetailPage";
import EditEventPage from "../pages/Organizer/EditEventPage";
import OrganizerDashboard from "../pages/Organizer/OrganizerDashboard";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import RegisterPage from "../pages/Auth/RegisterPage/RegisterPage";
import EventDetailGuestPage from "../pages/Event/EventDetailGuestPage";

// Manager Pages
import ManagerDashboard from "../pages/Manager/ManagerDashboard";
import ManagerEventsPage from "../pages/Manager/ManagerEventsPage";
import ManagerEventsNeedApprovalPage from "../pages/Manager/ManagerEventsNeedApprovalPage";
import ManagerEventDetailPage from "../pages/Manager/ManagerEventDetailPage";
import ManagerEditEventPage from "../pages/Manager/ManagerEditEventPage";
import RefundRulesPage from "../pages/RefundRule/RefundRulesPage";
import AdminProfile from "../pages/Admin/AdminProfile";
import UserManagement from "../pages/Admin/UserManagement";
import EventCategory from "../pages/Event Category/EventCategory";
import VerifyOtpPage from "../pages/Auth/RegisterPage/VerifyOtpPage";
import BecomeOrganizerPage from "../pages/User/BecomeOrganizerPage";
import ApplicationStatusPage from "../pages/User/ApplicationStatusPage";
import UserProfilePage from "../pages/User/UserProfilePage";
import TagManagementPage from "../pages/Shared/TagManagementPage";

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
        {
          path: "favorites",
          element: (
            <ProtectedRoute>
              <div>Favorites Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "wallet",
          element: (
            <ProtectedRoute>
              <div>Wallet Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "my-tickets",
          element: (
            <ProtectedRoute>
              <div>My Tickets Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "notifications",
          element: (
            <ProtectedRoute>
              <div>Notifications Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "settings",
          element: (
            <ProtectedRoute>
              <div>Settings Page</div>
            </ProtectedRoute>
          ),
        },
        { path: "help", element: <div>Help Page</div> },
        { path: "about", element: <div>About Page</div> },
        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile/:userId",
          element: (
            <ProtectedRoute>
              <div>User Profile Page</div>
            </ProtectedRoute>
          ),
        },
        { path: "event/:id", element: <EventDetailGuestPage /> },
        {
          path: "booking/:id",
          element: (
            <ProtectedRoute>
              <div>Booking Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "payment/:ticketId",
          element: (
            <ProtectedRoute>
              <div>Payment Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "qr-viewer/:ticketId",
          element: (
            <ProtectedRoute>
              <div>QR Viewer Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "event-invitations",
          element: (
            <ProtectedRoute>
              <div>Event Invitations Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "application-status",
          element: (
            <ProtectedRoute>
              <ApplicationStatusPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "social-sharing",
          element: (
            <ProtectedRoute>
              <div>Social Sharing Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "become-organizer",
          element: (
            <ProtectedRoute>
              <BecomeOrganizerPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: PATH.AUTH,
      children: [
        { path: "login", element: <LoginPage /> },
        { path: "register", element: <RegisterPage /> },
        { path: "verify-otp", element: <VerifyOtpPage /> },
      ],
    },
    {
      path: PATH.ORGANIZER,
      element: (
        <ProtectedRoute allowedRoles={["Organizer"]}>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <OrganizerDashboard /> },
        {
          path: "create",
          element: (
            <ProtectedRoute allowedRoles={["Organizer"]}>
              <CreateEventPage />
            </ProtectedRoute>
          ),
        },
        { path: "events", element: <div>Organizer Events Page</div> },
        { path: "my-events", element: <MyEventsPage /> },
        { path: "event/:eventId", element: <EventDetailPage /> },
        { path: "event/:eventId/edit", element: <EditEventPage /> },
        { path: "profile", element: <div>Organizer Profile Page</div> },
        { path: "settings", element: <div>Organizer Settings Page</div> },
        { path: "support", element: <div>Organizer Support Page</div> },
        { path: "analytics/:id", element: <div>Organizer Analytics Page</div> },
        { path: "checkin/:id", element: <div>Organizer Check-in Page</div> },
        { path: "tags", element: <TagManagementPage userRole="organizer" /> },
        { path: "refund-rules", element: <RefundRulesPage userRole="organizer" /> },
      ],
    },
    {
      path: PATH.MANAGER,
      element: (
        <ProtectedRoute allowedRoles={["Manager"]}>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <ManagerDashboard /> },
        { path: "events", element: <ManagerEventsPage /> },
        {
          path: "events/need-approval",
          element: <ManagerEventsNeedApprovalPage />,
        },
        { path: "event/:eventId", element: <ManagerEventDetailPage /> },
        { path: "event/:eventId/edit", element: <ManagerEditEventPage /> },
        { path: "events/category", element: <EventCategory /> },
        { path: "tags", element: <TagManagementPage userRole="manager" /> },
        { path: "refund-rules", element: <RefundRulesPage userRole="manager" /> },
        { path: "profile", element: <div>Manager Profile Page</div> },
        { path: "settings", element: <div>Manager Settings Page</div> },
        { path: "support", element: <div>Manager Support Page</div> },
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
        { index: true, element: <AdminDashboard /> },
        { path: "events", element: <div>Admin Events Page</div> },
        { path: "users", element: <UserManagement /> },
        { path: "refund-rules", element: <RefundRulesPage userRole="admin" /> },
        { path: "organizers", element: <div>Admin Organizers Page</div> },
        { path: "profile", element: <AdminProfile /> },
        { path: "settings", element: <div>Admin Settings Page</div> },
        {
          path: "system-settings",
          element: <div>Admin System Settings Page</div>,
        },
        { path: "documentation", element: <div>Admin Documentation Page</div> },
        { path: "help", element: <div>Admin Help Page</div> },
        { path: "quick-actions", element: <div>Admin Quick Actions Page</div> },
      ],
    },
    { path: "*", element: <Navigate to={PATH.HOME} /> },
  ]);
  return element;
}
