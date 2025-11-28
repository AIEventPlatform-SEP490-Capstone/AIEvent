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
  
  // Persist connection across re-renders
  const connectionRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = (isRead = null, pageNumber = 1, pageSize = 10) => {
    return dispatch(fetchNotificationsAction({ isRead, pageNumber, pageSize }));
  };

  const handleMarkAsRead = (notificationId) => {
    return dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    return dispatch(markAllAsRead());
  };

  const handleDeleteReadNotifications = () => {
    return dispatch(deleteReadNotifications());
  };

  // SignalR Setup - Chỉ chạy 1 lần khi component mount
  useEffect(() => {
    // Lấy token
    const accessToken = localStorage.getItem("accessToken") || 
      document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1");

    if (!accessToken) {
      return;
    }

    // Nếu đã có connection rồi thì không tạo lại
    if (connectionRef.current) {
      return;
    }

    // Determine the base URL based on environment
    const isVercel = window.location.hostname.includes('vercel.app');
    const baseUrl = isVercel ? 'https://aievent.duckdns.org' : '';

    // Tạo connection mới
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notification`, {
        accessTokenFactory: () => accessToken,
        // Allow all transports instead of just WebSockets
        // This enables fallback to Server-Sent Events or Long Polling
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds > 120000) return null; // Dừng sau 2 phút
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount + 1), 30000);
        }
      })
      .configureLogging(signalR.LogLevel.Warning) // Giảm log spam
      .build();

    // Lưu vào ref
    connectionRef.current = connection;

    // Đăng ký nhận thông báo realtime
    connection.on("ReceiveNotification", (notification) => {
      dispatch(addNotification(notification));
      dispatch(updateUnreadCount(unreadCount + 1));
    });

    // Bắt đầu kết nối
    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR Connected successfully");
      } catch (err) {
        // Lỗi "stopped during negotiation" là do cleanup cũ → bỏ qua không báo
        if (err?.message?.includes?.("negotiation") || err?.message?.includes?.("stop")) {
          console.warn("SignalR connection interrupted during startup (normal on re-mount)");
          return;
        }
        // Lỗi "Failed to start the connection" cũng là do cleanup → bỏ qua không báo
        if (err?.message?.includes?.("Failed to start the connection")) {
          console.warn("SignalR connection interrupted during startup (normal on re-mount)");
          return;
        }
        console.error("SignalR Connection Failed:", err);
        showError("Không thể kết nối thông báo thời gian thực");
      }
    };

    startConnection();

    // Cleanup khi component unmount (ví dụ: logout, chuyển trang)
    return () => {
      if (connectionRef.current) {
        console.log("SignalR: Cleaning up connection...");
        connectionRef.current.off("ReceiveNotification");
        connectionRef.current.stop().catch(() => {}); // Không cần await
        connectionRef.current = null;
      }
    };
  }, []); 
  // ← Dependency rỗng: Chỉ chạy 1 lần khi mount
  // → Không còn lỗi "stopped during negotiation" nữa!

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