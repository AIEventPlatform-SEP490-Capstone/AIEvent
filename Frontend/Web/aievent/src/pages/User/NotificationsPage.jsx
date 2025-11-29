import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Calendar,
  User,
  Ticket,
  CreditCard,
  AlertCircle,
  Info,
  Plus,
  Check,
  Trash2,
  Filter,
  Search,
  X
} from "lucide-react";
import { showError, showSuccess } from "../../lib/toastUtils";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import fetcher from "../../api/fetcher";
import { PATH } from "../../routes/path";

const NotificationIcon = ({ type }) => {
  const iconMap = {
    OrganizerRegistrationPending: User,
    OrganizerApproved: CheckCircle,
    OrganizerRejected: AlertCircle,
    EventCreated: Calendar,
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
    OrganizerRegistrationPending: "bg-blue-500/10 text-blue-700 border-blue-200",
    OrganizerApproved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    OrganizerRejected: "bg-rose-500/10 text-rose-700 border-rose-200",
    EventCreated: "bg-purple-500/10 text-purple-700 border-purple-200",
    EventApproved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    EventRejected: "bg-rose-500/10 text-rose-700 border-rose-200",
    EventCancelled: "bg-rose-500/10 text-rose-700 border-rose-200",
    BookingConfirmed: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    EventInvitation: "bg-blue-500/10 text-blue-700 border-blue-200",
    EventInvitationAccepted: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    EventInvitationRejected: "bg-rose-500/10 text-rose-700 border-rose-200",
    PaymentSuccess: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    Refund: "bg-amber-500/10 text-amber-700 border-amber-200",
    PayoutCompleted: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    PayoutFailed: "bg-rose-500/10 text-rose-700 border-rose-200",
    EventReminder: "bg-orange-500/10 text-orange-700 border-orange-200",
    System: "bg-slate-500/10 text-slate-700 border-slate-200"
  };

  return (
    <Badge variant="outline" className={`${typeColors[type] || "bg-slate-500/10 text-slate-700 border-slate-200"} border font-medium`}>
      {typeLabels[type] || type}
    </Badge>
  );
};

export default function NotificationsPage() {
  const navigate = useNavigate();
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
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "System"
  });

  const pageSize = 10;

  useEffect(() => {
    fetchNotifications(null, 1, pageSize);
  }, []);

  const loadMore = () => {
    fetchNotifications(null, page + 1, pageSize);
  };

  const goToPage = (pageNumber) => {
    fetchNotifications(null, pageNumber, pageSize);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showSuccess("Đã đánh dấu tất cả là đã đọc");
    } catch (err) {
      showError("Không thể đánh dấu tất cả thông báo");
    }
  };

  const handleClearRead = async () => {
    try {
      await deleteReadNotifications();
      showSuccess("Đã xóa thông báo đã đọc");
    } catch (err) {
      showError("Không thể xóa thông báo đã đọc");
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      showError("Không thể đánh dấu thông báo");
    }
  };

  const getNotificationPath = (notification) => {
    const userRole = user?.role?.toLowerCase() || "user";
    const type = notification.type || notification.Type;
    const eventId = notification.eventId || notification.EventId;
    const organizerProfileId = notification.organizerProfileId || notification.OrganizerProfileId;
  
    if (["OrganizerRegistrationPending", "OrganizerApproved", "OrganizerRejected"].includes(type)) {
      if (userRole === "manager" || userRole === "admin") {
        return organizerProfileId
          ? PATH.MANAGER_ORGANIZERS_DETAILS.replace(":id", organizerProfileId)
          : PATH.MANAGER_ORGANIZERS;
      }
      return PATH.APPLICATION_STATUS;
    }
  
    if (type === "EventCreated") {
      if (userRole === "manager") {
        return PATH.MANAGER_EVENTS;
      }
      if (userRole === "organizer" && eventId) {
        return PATH.ORGANIZER_MY_EVENTS;
      }
      if (eventId) {
        return PATH.EVENT_DETAIL.replace(":id", eventId);
      }
    }
  
    if (type === "EventApproved" || type === "EventRejected") {
      if (userRole === "organizer") {
        return PATH.ORGANIZER_MY_EVENTS;
      }
      if (userRole === "manager" && eventId) {
        return PATH.MANAGER_EVENT_DETAIL.replace(":eventId", eventId);
      }
      if (eventId) {
        return PATH.EVENT_DETAIL.replace(":id", eventId);
      }
    }
  
    if (type === "EventCancelled" || type === "EventReminder") {
      if (userRole === "user") {
        return PATH.MY_TICKETS;
      }
      if (userRole === "organizer" && eventId) {
        return PATH.ORGANIZER_MY_EVENTS;
      }
      if (userRole === "manager" && eventId) {
        return PATH.MANAGER_EVENT_DETAIL.replace(":eventId", eventId);
      }
      if (eventId) {
        return PATH.EVENT_DETAIL.replace(":id", eventId);
      }
    }
  
    if (type === "BookingConfirmed" || type === "PaymentSuccess") {
      return userRole === "user" ? PATH.MY_TICKETS : PATH.ORGANIZER_MY_EVENTS;
    }
  
    if (type === "Refund") {
      return PATH.MY_TICKETS;
    }
  
    if (type === "PayoutCompleted" || type === "PayoutFailed") {
      if (userRole === "organizer") {
        return PATH.ORGANIZER_MY_EVENTS;
      }
      return PATH.WALLET;
    }
  
    if (["EventInvitation", "EventInvitationAccepted", "EventInvitationRejected"].includes(type)) {
      return PATH.EVENT_INVITATIONS;
    }
  
    if (type === "System") return null;
  
    if (eventId) {
      if (userRole === "organizer") return PATH.ORGANIZER_MY_EVENTS;
      if (userRole === "manager") return PATH.MANAGER_EVENTS;
      return PATH.EVENT_DETAIL.replace(":id", eventId);
    }
  
    return null;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead && !notification.IsRead) {
      try {
        await markAsRead(notification.notificationId || notification.NotificationId);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    const path = getNotificationPath(notification);
    if (path) {
      navigate(path);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      showError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        imageUrl: null,
        eventId: null
      };

      await fetcher.post("/notifications/admin/create", payload);
      showSuccess("Đã tạo thông báo thành công");
      setIsCreateModalOpen(false);
      setNewNotification({ title: "", message: "", type: "System" });
      fetchNotifications(null, 1, pageSize);
    } catch (err) {
      console.error("Failed to create notification:", err);
      if (err.response && err.response.data && err.response.data.message) {
        showError(err.response.data.message);
      } else {
        showError("Không thể tạo thông báo");
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

  const isAdmin = user && user.role === "Admin";

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filterType === "all" || 
      (filterType === "unread" && !(notification.isRead || notification.IsRead)) ||
      (filterType === "read" && (notification.isRead || notification.IsRead));
    
    const matchesSearch = searchQuery === "" || 
      (notification.title || notification.Title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (notification.message || notification.Message || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead && !n.IsRead).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Lỗi tải thông báo</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button 
            onClick={() => fetchNotifications(null, 1, 10)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Bell className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Thông báo</h1>
              <p className="text-slate-600">
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Không có thông báo mới"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Tìm kiếm thông báo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter & Actions */}
            <div className="flex gap-2 flex-wrap">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] border-slate-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="unread">Chưa đọc</SelectItem>
                  <SelectItem value="read">Đã đọc</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleMarkAllAsRead}
                variant="outline"
                disabled={unreadCount === 0}
                className="border-slate-200 hover:bg-slate-50"
              >
                <Check className="h-4 w-4 mr-2" />
                Đánh dấu tất cả
              </Button>

              <Button 
                onClick={handleClearRead}
                variant="outline"
                disabled={!notifications.some(n => n.isRead)}
                className="border-slate-200 hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa đã đọc
              </Button>

              {isAdmin && (
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo thông báo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Tạo thông báo mới</DialogTitle>
                      <DialogDescription>
                        Gửi thông báo đến tất cả người dùng
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                      <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium text-slate-700">
                          Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="title"
                          value={newNotification.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          placeholder="Nhập tiêu đề thông báo"
                          className="border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium text-slate-700">
                          Nội dung <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          id="message"
                          value={newNotification.message}
                          onChange={(e) => handleInputChange("message", e.target.value)}
                          placeholder="Nhập nội dung thông báo"
                          rows={4}
                          className="border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="type" className="text-sm font-medium text-slate-700">
                          Loại thông báo
                        </label>
                        <Select
                          value={newNotification.type}
                          onValueChange={(value) => handleInputChange("type", value)}
                        >
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Chọn loại" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="System">Hệ thống</SelectItem>
                            <SelectItem value="EventReminder">Nhắc nhở sự kiện</SelectItem>
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
                        Hủy
                      </Button>
                      <Button
                        onClick={handleCreateNotification}
                        disabled={isCreating}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {isCreating ? "Đang tạo..." : "Tạo thông báo"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Không có thông báo</h3>
            <p className="text-slate-600">
              {searchQuery ? "Không tìm thấy thông báo phù hợp" : "Bạn chưa có thông báo nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const hasNavigation = getNotificationPath(notification) !== null;
              const isRead = notification.isRead || notification.IsRead;
              
              return (
                <div
                  key={notification.notificationId || notification.NotificationId}
                  onClick={() => hasNavigation && handleNotificationClick(notification)}
                  className={`group bg-white rounded-2xl border transition-all duration-300 ${
                    hasNavigation ? "cursor-pointer hover:shadow-lg hover:scale-[1.01]" : ""
                  } ${
                    isRead
                      ? "border-slate-200 shadow-sm"
                      : "border-blue-200 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                        hasNavigation ? "group-hover:scale-110" : ""
                      } ${
                        isRead 
                          ? "bg-slate-100 text-slate-600" 
                          : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md"
                      }`}>
                        <NotificationIcon type={notification.type || notification.Type} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold text-base ${
                              isRead ? "text-slate-900" : "text-blue-900"
                            }`}>
                              {(notification.title || notification.Title) || 'Thông báo'}
                            </h3>
                            <NotificationTypeBadge type={notification.type || notification.Type} />
                          </div>
                          
                          {!isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.notificationId || notification.NotificationId);
                              }}
                              className="flex-shrink-0 h-8 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Đánh dấu đã đọc
                            </Button>
                          )}
                        </div>
                        
                        <p 
                          className="text-sm text-slate-600 leading-relaxed mb-3"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml((notification.message || notification.Message) || '') }}
                        />
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(notification.createdTime || notification.CreatedTime) ? formatDate(notification.createdTime || notification.CreatedTime) : ''}
                          </span>
                          {(notification.readAt || notification.ReadAt) && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Đã đọc lúc {formatDate(notification.readAt || notification.ReadAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  Hiển thị <span className="font-medium text-slate-900">{(page - 1) * pageSize + 1}</span> đến{" "}
                  <span className="font-medium text-slate-900">{Math.min(page * pageSize, totalItems)}</span> trong tổng số{" "}
                  <span className="font-medium text-slate-900">{totalItems}</span> thông báo
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => goToPage(page - 1)} 
                    variant="outline" 
                    size="sm"
                    disabled={page <= 1}
                    className="border-slate-200"
                  >
                    Trước
                  </Button>
                  <span className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg">
                    {page} / {totalPages}
                  </span>
                  <Button 
                    onClick={() => goToPage(page + 1)} 
                    variant="outline" 
                    size="sm"
                    disabled={page >= totalPages}
                    className="border-slate-200"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}