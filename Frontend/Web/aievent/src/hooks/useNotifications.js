import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";
import { 
  fetchNotifications as fetchNotificationsAction, 
  fetchUnreadCount as fetchUnreadCountAction,
  markAsRead, 
  markAllAsRead, 
  deleteReadNotifications, 
  addNotification,
  updateUnreadCount
} from "../store/slices/notificationsSlice";
import { showError } from "../lib/toastUtils";

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { 
    items: notifications, 
    loading, 
    error, 
    unreadCount,
    hasMore,
    page,
    totalPages,
    totalItems
  } = useSelector(state => state.notifications);

  // Fetch notifications
  const fetchNotifications = (pageNumber = 1, pageSize = 10) => {
    return dispatch(fetchNotificationsAction({ pageNumber, pageSize }));
  };

  // Mark a notification as read
  const handleMarkAsRead = (notificationId) => {
    return dispatch(markAsRead(notificationId));
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    return dispatch(markAllAsRead());
  };

  // Delete read notifications
  const handleDeleteReadNotifications = () => {
    return dispatch(deleteReadNotifications());
  };

  // Initialize SignalR connection for real-time notifications
  useEffect(() => {
    console.log('Initializing SignalR connection');
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/notification", {
        accessTokenFactory: () => {
          const token = localStorage.getItem("accessToken") || 
                       document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1");
          console.log('Using access token:', token ? 'Token present' : 'No token');
          return token;
        }
      })
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        console.log("Connected to Notification Hub");
        // Register for notifications after connection is established
        newConnection.on("ReceiveNotification", (notification) => {
          console.log('Received notification via SignalR:', notification);
          dispatch(addNotification(notification));
          // Update unread count immediately
          console.log('Updating unread count after receiving notification');
          // Use a simple increment approach
          const currentUnreadCount = unreadCount;
          console.log('Current unread count:', currentUnreadCount);
          dispatch(updateUnreadCount(currentUnreadCount + 1));
        });
      })
      .catch(err => {
        // Only show errors that aren't transient negotiation issues
        if (!(err instanceof Error && err.message.includes("connection was stopped during negotiation"))) {
          console.error("SignalR Connection Error: ", err);
          showError("Failed to connect to notification service");
        }
      });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up SignalR connection');
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [dispatch]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    hasMore,
    page,
    totalPages,
    totalItems,
    fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteReadNotifications: handleDeleteReadNotifications
  };
}
