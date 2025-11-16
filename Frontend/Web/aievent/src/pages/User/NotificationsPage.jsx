import React, { useEffect, useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Calendar as CalendarIcon,
  User,
  Ticket,
  CreditCard,
  AlertCircle,
  Info,
  Plus
} from "lucide-react";
import { showError, showSuccess } from "../../lib/toastUtils";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import fetcher from "../../api/fetcher";

const NotificationIcon = ({ type }) => {
  const iconMap = {
    OrganizerRegistrationPending: User,
    OrganizerApproved: CheckCircle,
    OrganizerRejected: AlertCircle,
    EventCreated: CalendarIcon,
    EventApproved: CheckCircle,
    EventRejected: AlertCircle,
    EventCancelled: AlertCircle,
    BookingConfirmed: Ticket,
    EventInvitation: User,
    EventInvitationAccepted: CheckCircle,
    EventInvitationRejected: AlertCircle,
    PaymentSuccess: CreditCard,
    Refund: CreditCard,
    PayoutCompleted: CreditCard,
    PayoutFailed: AlertCircle,
    EventReminder: Clock,
    System: Info
  };

  const IconComponent = iconMap[type] || Bell;
  return <IconComponent className="h-5 w-5" />;
};

const NotificationTypeBadge = ({ type }) => {
  const typeLabels = {
    OrganizerRegistrationPending: "Đăng ký Organizer",
    OrganizerApproved: "Duyệt Organizer",
    OrganizerRejected: "Từ chối Organizer",
    EventCreated: "Tạo sự kiện",
    EventApproved: "Duyệt sự kiện",
    EventRejected: "Từ chối sự kiện",
    EventCancelled: "Hủy sự kiện",
    BookingConfirmed: "Xác nhận đặt vé",
    EventInvitation: "Lời mời sự kiện",
    EventInvitationAccepted: "Chấp nhận lời mời",
    EventInvitationRejected: "Từ chối lời mời",
    PaymentSuccess: "Thanh toán",
    Refund: "Hoàn tiền",
    PayoutCompleted: "Thanh toán hoàn tất",
    PayoutFailed: "Thanh toán thất bại",
    EventReminder: "Nhắc nhở sự kiện",
    System: "Hệ thống"
  };

  const typeColors = {
    OrganizerRegistrationPending: "bg-blue-100 text-blue-800",
    OrganizerApproved: "bg-green-100 text-green-800",
    OrganizerRejected: "bg-red-100 text-red-800",
    EventCreated: "bg-purple-100 text-purple-800",
    EventApproved: "bg-green-100 text-green-800",
    EventRejected: "bg-red-100 text-red-800",
    EventCancelled: "bg-red-100 text-red-800",
    BookingConfirmed: "bg-green-100 text-green-800",
    EventInvitation: "bg-blue-100 text-blue-800",
    EventInvitationAccepted: "bg-green-100 text-green-800",
    EventInvitationRejected: "bg-red-100 text-red-800",
    PaymentSuccess: "bg-green-100 text-green-800",
    Refund: "bg-yellow-100 text-yellow-800",
    PayoutCompleted: "bg-green-100 text-green-800",
    PayoutFailed: "bg-red-100 text-red-800",
    EventReminder: "bg-orange-100 text-orange-800",
    System: "bg-gray-100 text-gray-800"
  };

  return (
    <Badge className={typeColors[type] || "bg-gray-100 text-gray-800"}>
      {typeLabels[type] || type}
    </Badge>
  );
};

export default function NotificationsPage() {
  console.log('Rendering NotificationsPage');
  const { user } = useAuth();
  const {
    notifications,
    loading,
    error,
    hasMore,
    page,
    totalPages,
    totalItems,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteReadNotifications
  } = useNotifications();
  
  // State for create notification modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "System"
  });

  console.log('NotificationsPage - notifications:', notifications, 'loading:', loading, 'error:', error);

  const pageSize = 10;

  useEffect(() => {
    console.log('NotificationsPage - fetching initial notifications');
    fetchNotifications(1, pageSize);
    // Unread count is now handled globally by the App component
  }, []);

  const loadMore = () => {
    fetchNotifications(page + 1, pageSize);
  };

  const goToPage = (pageNumber) => {
    fetchNotifications(pageNumber, pageSize);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showSuccess("All notifications marked as read");
    } catch (err) {
      showError("Failed to mark all notifications as read");
    }
  };

  const handleClearRead = async () => {
    try {
      await deleteReadNotifications();
      showSuccess("Cleared read notifications");
    } catch (err) {
      showError("Failed to clear read notifications");
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      showError("Failed to mark notification as read");
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      showError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      // Create the request payload matching CreateNotificationToAllRequest structure
      const payload = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        channel: "InApp" // Match the NotificationChannel enum
      };

      await fetcher.post("/notifications/admin/create", payload);
      showSuccess("Notification created successfully");
      setIsCreateModalOpen(false);
      setNewNotification({ title: "", message: "", type: "System" });
      
      // Refresh notifications
      fetchNotifications(1, pageSize);
    } catch (err) {
      console.error("Failed to create notification:", err);
      if (err.response && err.response.data && err.response.data.message) {
        showError(err.response.data.message);
      } else {
        showError("Failed to create notification");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewNotification(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
  };

  // Check if user is admin
  const isAdmin = user && user.role === "Admin";

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading notifications</h3>
          <p className="mt-1 text-gray-500">{error}</p>
          <Button 
            onClick={() => fetchNotifications(1, 10)} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Manage your notifications and alerts</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          {isAdmin && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Notification</DialogTitle>
                  <DialogDescription>
                    Send a notification to all users
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="title" className="text-right">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={newNotification.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="col-span-3"
                      placeholder="Notification title"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="message" className="text-right">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      value={newNotification.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      className="col-span-3"
                      placeholder="Notification message"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="type" className="text-right">
                      Type
                    </label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value) => handleInputChange("type", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="System">System</SelectItem>
                        <SelectItem value="OrganizerRegistrationPending">Organizer Registration Pending</SelectItem>
                        <SelectItem value="OrganizerApproved">Organizer Approved</SelectItem>
                        <SelectItem value="OrganizerRejected">Organizer Rejected</SelectItem>
                        <SelectItem value="EventCreated">Event Created</SelectItem>
                        <SelectItem value="EventApproved">Event Approved</SelectItem>
                        <SelectItem value="EventRejected">Event Rejected</SelectItem>
                        <SelectItem value="EventCancelled">Event Cancelled</SelectItem>
                        <SelectItem value="BookingConfirmed">Booking Confirmed</SelectItem>
                        <SelectItem value="EventInvitation">Event Invitation</SelectItem>
                        <SelectItem value="EventInvitationAccepted">Event Invitation Accepted</SelectItem>
                        <SelectItem value="EventInvitationRejected">Event Invitation Rejected</SelectItem>
                        <SelectItem value="PaymentSuccess">Payment Success</SelectItem>
                        <SelectItem value="Refund">Refund</SelectItem>
                        <SelectItem value="PayoutCompleted">Payout Completed</SelectItem>
                        <SelectItem value="PayoutFailed">Payout Failed</SelectItem>
                        <SelectItem value="EventReminder">Event Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateNotification}
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button 
            onClick={handleMarkAllAsRead}
            variant="outline"
            disabled={notifications.length === 0}
          >
            Mark all as read
          </Button>
          <Button 
            onClick={handleClearRead}
            variant="outline"
            disabled={!notifications.some(n => n.isRead)}
          >
            Clear read
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-gray-500">You don't have any notifications yet.</p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[calc(100vh-250px)] overflow-y-auto">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      notification.isRead
                        ? "bg-white border-gray-200"
                        : "bg-blue-50 border-blue-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        notification.isRead 
                          ? "bg-gray-100 text-gray-600" 
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-medium ${
                              notification.isRead ? "text-gray-900" : "text-blue-900"
                            }`}>
                              {notification.title}
                            </h3>
                            <NotificationTypeBadge type={notification.type} />
                          </div>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.notificationId)}
                              className="h-6 px-2 text-xs"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                        <p 
                          className="mt-1 text-sm text-gray-600"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(notification.message) }}
                        />
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(notification.createdAt)}</span>
                          {notification.readAt && (
                            <span>Read at {formatDate(notification.readAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} notifications
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => goToPage(page - 1)} 
                    variant="outline" 
                    size="sm"
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button 
                    onClick={() => goToPage(page + 1)} 
                    variant="outline" 
                    size="sm"
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
              
              {hasMore && (
                <div className="mt-4 text-center">
                  <Button onClick={loadMore} variant="outline">
                    Load more
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}