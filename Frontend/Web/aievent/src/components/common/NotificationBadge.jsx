import React from "react";
import { Bell } from "lucide-react";
import { useSelector } from "react-redux";

export const NotificationBadge = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  
  console.log('NotificationBadge - isAuthenticated:', isAuthenticated, 'unreadCount:', unreadCount);

  if (!isAuthenticated || unreadCount <= 0) {
    console.log('NotificationBadge - hiding badge, isAuthenticated:', isAuthenticated, 'unreadCount:', unreadCount);
    return null;
  }

  console.log('NotificationBadge - showing badge with count:', unreadCount);
  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    </div>
  );
};