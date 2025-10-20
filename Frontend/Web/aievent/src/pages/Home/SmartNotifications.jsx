import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Bell,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  X,
  Settings,
} from "lucide-react";

export function SmartNotifications({ userId, className = "" }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({}); // Mock user state for pure React

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock notifications data
        const mockNotifications = [
          {
            id: "1",
            title: "Sự kiện AI mới được gợi ý",
            message:
              "Dựa trên sở thích của bạn, chúng tôi gợi ý Hội thảo AI 2025 tại Hà Nội.",
            type: "event_suggestion",
            priority: "high",
            isRead: false,
            createdAt: new Date(Date.now() - 3600000), // 1 hour ago
            eventId: "event-1",
          },
          {
            id: "2",
            title: "Xu hướng: Blockchain đang hot",
            message:
              "Các sự kiện về Blockchain tăng 200% lượt đăng ký trong tuần này.",
            type: "trending",
            priority: "medium",
            isRead: true,
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
            eventId: null,
          },
          {
            id: "3",
            title: "Bạn bè tham gia sự kiện",
            message:
              "Bạn của bạn đã đăng ký Workshop UX/UI. Tham gia cùng nhé!",
            type: "friend_activity",
            priority: "low",
            isRead: false,
            createdAt: new Date(Date.now() - 7200000), // 2 hours ago
            eventId: "event-2",
          },
          {
            id: "4",
            title: "Giá vé giảm 50%",
            message: "Giá vé Tech Meetup giảm từ 400k xuống 200k. Đặt ngay!",
            type: "price_drop",
            priority: "high",
            isRead: false,
            createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
            eventId: "event-3",
          },
        ];

        setNotifications(mockNotifications);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [userId, user]);

  const handleNotificationClick = (notification) => {
    if (notification.eventId) {
      window.location.href = `/event/${notification.eventId}`;
    }
    markAsRead(notification.id);
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const dismissNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "event_suggestion":
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case "trending":
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case "friend_activity":
        return <Users className="w-4 h-4 text-green-600" />;
      case "price_drop":
        return <Calendar className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
      case "medium":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20";
      case "low":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20";
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 animate-pulse" />
            Thông báo thông minh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle className="text-lg">Thông báo thông minh</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Không có thông báo mới</p>
            <p className="text-sm">
              AI sẽ gửi thông báo khi có sự kiện phù hợp
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 ${getPriorityColor(
                  notification.priority
                )} ${!notification.isRead ? "ring-1 ring-blue-200" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`text-sm font-medium ${
                            !notification.isRead ? "font-semibold" : ""
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {notification.createdAt.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {notification.type === "event_suggestion" &&
                            "AI Gợi ý"}
                          {notification.type === "trending" && "Xu hướng"}
                          {notification.type === "friend_activity" && "Bạn bè"}
                          {notification.type === "price_drop" && "Giảm giá"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
