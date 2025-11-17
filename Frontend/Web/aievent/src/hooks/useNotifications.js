import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";
import { 
  fetchNotifications as fetchNotificationsAction, 
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
  
  // Use ref to persist connection instance
  const connectionRef = useRef(null);

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
    // Only connect if user is authenticated
    const accessToken = localStorage.getItem("accessToken") || 
                       document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1");
    
    if (!accessToken) {
      return;
    }

    // Create connection only if it doesn't exist
    if (!connectionRef.current) {
      connectionRef.current = new signalR.HubConnectionBuilder()
        .withUrl("/hubs/notification", {
          accessTokenFactory: () => {
            return accessToken;
          },
          // Add transport options to handle negotiation issues
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
          skipNegotiation: false
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            // Exponential backoff with max delay of 30 seconds
            if (retryContext.elapsedMilliseconds > 120000) {
              // Stop reconnecting after 2 minutes
              return null;
            }
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .build();
      
      // Register for notifications
      connectionRef.current.on("ReceiveNotification", (notification) => {
        dispatch(addNotification(notification));
        // Update unread count in real-time
        dispatch(updateUnreadCount(unreadCount + 1));
      });
    }

    const startConnection = async () => {
      try {
        if (connectionRef.current.state === signalR.HubConnectionState.Disconnected) {
          await connectionRef.current.start();
          console.log("SignalR Connected");
        }
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
        // Don't show error for transient negotiation issues
        if (!err.message.includes("connection was stopped during negotiation") && 
            !err.message.includes("Failed to start the HttpConnection before stop")) {
          showError("Failed to connect to notification service. You may not receive real-time notifications.");
        }
      }
    };

    startConnection();

    // Cleanup on unmount
    return () => {
      const stopConnection = async () => {
        if (connectionRef.current) {
          try {
            // Remove event listeners
            connectionRef.current.off("ReceiveNotification");
            
            // Stop connection if it's not already disconnected
            if (connectionRef.current.state !== signalR.HubConnectionState.Disconnected) {
              await connectionRef.current.stop();
              console.log("SignalR Disconnected");
            }
          } catch (err) {
            console.error("Error stopping SignalR connection:", err);
          } finally {
            connectionRef.current = null;
          }
        }
      };
      stopConnection();
    };
  }, [dispatch, unreadCount]);

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
};