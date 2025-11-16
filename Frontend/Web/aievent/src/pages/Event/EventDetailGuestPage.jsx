import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Share2,
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  CreditCard,
  Tag,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Ticket,
  Globe,
  Activity,
  User,
  Sparkles,
  Loader2,
  Send,
  X,
  Link2,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { useEvents } from "../../hooks/useEvents";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { PATH } from "../../routes/path";
import MapDirection from "../../components/Event/MapDirection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import RatingSection from "../../components/Rating/RatingSection";
import { friendAPI } from "../../api/friendAPI";
import { eventAPI } from "../../api/eventAPI";
import eventAvt from "../../assets/loginpanel.jpg";
import userAvt from "../../assets/user.png";
import Zalo from "../../assets/Zalo.png";
import Facebook from "../../assets/Facebook.png";
import Twitter from "../../assets/Twitter.png";
import LinkedIn from "../../assets/LinkedIn.png";
import Tiktok from "../../assets/TikTok.png";
import Instagram from "../../assets/Instagram.png";

const EventDetailGuestPage = ({ previewData }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { getEventById, getRelatedEvents, loading: eventLoading } = useEvents();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("Tham gia cùng tôi nhé!");
  const [isInviting, setIsInviting] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  //tải danh sách bạn bè khi mở dialog mời
  useEffect(() => {
    const loadFriends = async () => {
      if (isInviteDialogOpen) {
        setIsLoadingFriends(true);
        try {
          const res = await friendAPI.getFriends({
            status: "Accepted",
            pageSize: 20,
          });
          setFriends(res.data?.items || []);
        } catch (err) {
          console.error("Error loading friends:", err);
          toast.error("Không thể tải danh sách bạn bè");
        } finally {
          setIsLoadingFriends(false);
        }
      }
    };
    loadFriends();
  }, [isInviteDialogOpen]);
  //chọn bạn bè để mời
  const toggleSelectFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };
  //gửi lời mời
  const handleSendInvite = async () => {
    if (!isAuthenticated) {
      navigate(`${PATH.LOGIN}?returnUrl=${PATH.EVENT.replace(":id", id)}`);
      return;
    }

    if (selectedFriends.length === 0) {
      toast.error("Vui lòng chọn ít nhất một người bạn để mời");
      return;
    }

    setIsInviting(true);
    try {
      const response = await eventAPI.inviteFriends(event.eventId, {
        // Access inviteFriends from eventAPI
        invitedUserIds: selectedFriends,
        message: inviteMessage,
      });

      if (response) {
        toast.success("Đã gửi lời mời thành công!");
        setSelectedFriends([]);
        setInviteMessage("Tham gia cùng tôi nhé!");
        setIsInviteDialogOpen(false);
      }
    } catch (error) {
      toast.error("Không thể gửi lời mời");
    } finally {
      setIsInviting(false);
    }
  };

  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } =
    useFavoriteEvents();

  useEffect(() => {
    if (previewData) {
      setEvent(previewData);
      setIsLoading(false);
    } else if (id) {
      loadEventDetail();
      loadRelatedEvents();
    }
  }, [id, previewData]);

  useEffect(() => {
    const checkIfFavorited = async () => {
      if (isAuthenticated && event) {
        try {
          const favorites = await getFavoriteEvents();
          const isEventFavorited = favorites.some(
            (favEvent) => favEvent.eventId === event.eventId
          );
          setIsLiked(isEventFavorited);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      }
    };

    checkIfFavorited();
  }, [isAuthenticated, event]);

  const loadEventDetail = async () => {
    try {
      setIsLoading(true);
      const eventData = await getEventById(id);

      if (eventData) {
        setEvent(eventData);
      } else {
        toast.error("Không tìm thấy sự kiện");
        navigate(PATH.HOME);
      }
    } catch (error) {
      console.error("Error loading event detail:", error);
      toast.error("Không thể tải thông tin sự kiện");
      navigate(PATH.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedEvents = async () => {
    try {
      if (id && !previewData) {
        const relatedData = await getRelatedEvents(id);

        if (relatedData) {
          setRelatedEvents(relatedData.slice(0, 3));
        } else {
          setRelatedEvents([]);
        }
      }
    } catch (error) {
      console.error("Error loading related events:", error);
      setRelatedEvents([]);
    }
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (now < startTime) return "upcoming";
    if (now >= startTime && now <= endTime) return "ongoing";
    return "completed";
  };

  const getStatusBadge = (status) => {
    const configs = {
      upcoming: {
        label: "Sắp diễn ra",
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
      },
      ongoing: {
        label: "Đang diễn ra",
        color: "bg-green-100 text-green-800",
        icon: Activity,
      },
      completed: {
        label: "Đã kết thúc",
        color: "bg-gray-100 text-gray-800",
        icon: CheckCircle,
      },
    };
    return configs[status] || configs.upcoming;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const weekday = date.toLocaleDateString("vi-VN", { weekday: "long" });
    const datePart = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${weekday} • ${datePart}`;
  };

  // 👉 "Chủ Nhật • 23/11/2025"

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDisplayTicketPrice = (event) => {
    if (!event?.ticketDetails || event.ticketDetails.length === 0) {
      return "Miễn phí";
    }
    const prices = event.ticketDetails.map((t) => t.ticketPrice || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === 0 && max === 0) return "Miễn phí";
    const formatVND = (price) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(price);
    if (min === max) return formatVND(min);
    return `${formatVND(min)} - ${formatVND(max)}`;
  };

  const formatPrice = (event) => {
    if (
      event.minTicketPrice !== undefined &&
      event.maxTicketPrice !== undefined
    ) {
      if (event.minTicketPrice === 0 && event.maxTicketPrice === 0) {
        return "Miễn phí";
      } else if (event.minTicketPrice === event.maxTicketPrice) {
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(event.minTicketPrice);
      } else {
        return `${new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(event.minTicketPrice)} - ${new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(event.maxTicketPrice)}`;
      }
    }
    return event.ticketType === 1 || event.ticketType === "free"
      ? "Miễn phí"
      : "Có phí";
  };

  const formatTicketPrice = (ticket) => {
    if (ticket.ticketPrice === 0) {
      return "Miễn phí";
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(ticket.ticketPrice);
  };

  const formatTicketQuantity = (ticket) => {
    return `${ticket.soldQuantity || 0}/${ticket.ticketQuantity}`;
  };

  const handleRegister = () => {
    if (isAuthenticated) {
      navigate(`${PATH.BOOKING.replace(":id", id)}`);
    } else {
      navigate(`${PATH.LOGIN}?returnUrl=${PATH.BOOKING.replace(":id", id)}`);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate(`${PATH.LOGIN}?returnUrl=${PATH.EVENT.replace(":id", id)}`);
      return;
    }

    try {
      if (isLiked) {
        await removeFavoriteEvent(event.eventId);
      } else {
        await addFavoriteEvent(event.eventId);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Không thể cập nhật trạng thái yêu thích");
    }
  };

  const handleShareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép link sự kiện!");
    }
  };

  const handleInviteFriends = () => {
    if (!isAuthenticated) {
      navigate(`${PATH.LOGIN}?returnUrl=${PATH.EVENT.replace(":id", id)}`);
      return;
    }
    setIsInviteDialogOpen(true);
  };

  const handleViewDetail = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">
            Đang tải thông tin sự kiện...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="text-center p-8 max-w-md shadow-lg">
          <CardContent className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Không tìm thấy sự kiện
            </h3>
            <p className="text-gray-500">
              Sự kiện có thể đã bị xóa hoặc không tồn tại.
            </p>
            <Button onClick={() => navigate(PATH.HOME)} className="mt-4">
              Quay lại trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAvailableTickets = event.totalTickets - (event.soldQuantity || 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Simplified */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Grid layout with main content and sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative">
                {event.imgListEvent && event.imgListEvent.length > 0 ? (
                  <>
                    <img
                      src={event.imgListEvent[selectedImageIndex]}
                      alt={event.title}
                      className="w-full h-80 object-cover"
                    />
                    <button
                      onClick={handleToggleFavorite}
                      className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${
                          isLiked
                            ? "fill-red-500 text-red-500"
                            : "text-gray-700"
                        }`}
                      />
                    </button>
                    
                    {/* Badges - Simplified */}
                    <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                      <Badge className="bg-white text-gray-800 border-0 shadow px-3 py-1 font-semibold">
                        {formatPrice(event)}
                      </Badge>
                      {event.eventCategoryName && (
                        <Badge className="bg-blue-500 text-white border-0 shadow px-3 py-1 font-medium">
                          <Tag className="w-3 h-3 mr-1" />
                          {event.eventCategoryName}
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 font-medium">
                      Không có hình ảnh
                    </span>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {event.imgListEvent && event.imgListEvent.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {event.imgListEvent.map((img, index) => (
                      <div 
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 ${
                          selectedImageIndex === index 
                            ? "border-blue-500" 
                            : "border-gray-200"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${event.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Event Info - Simplified */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {event.title}
                </h1>
                <p className="text-gray-600">
                  {event.description}
                </p>
              </div>

              {/* Info Grid - Simplified */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-500 mb-1">
                      Ngày diễn ra sự kiện
                    </p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(event.startTime)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Bắt đầu vào lúc: {formatTime(event.startTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-500 mb-1">
                      Thời gian diễn ra
                    </p>
                    <p className="font-semibold text-gray-900">
                      {formatTime(event.startTime)} -{" "}
                      {formatTime(event.endTime)}
                    </p>
                    {(() => {
                      const start = new Date(event.startTime);
                      const end = new Date(event.endTime);
                      const diffMs = end - start;
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor(
                        (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                      );
                      return (
                        <p className="text-sm text-gray-500 mt-1">
                          Thời lượng: {hours} giờ{" "}
                          {minutes > 0 ? `${minutes} phút` : ""}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-500 mb-1">
                      Địa điểm tổ chức
                    </p>
                    <p className="font-semibold text-gray-900">
                      {event.isOnlineEvent
                        ? "Sự kiện trực tuyến"
                        : event.locationName || "Chưa xác định"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {event.isOnlineEvent
                        ? "Trực tuyến"
                        : event.address || "Chưa xác định"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-500 mb-1">
                      Số lượng người tham gia
                    </p>
                    <p className="font-semibold text-gray-900">
                      {event.soldQuantity || 0}/{event.totalTickets || "N/A"}{" "}
                      người
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Còn trống {totalAvailableTickets} chỗ
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket Information - Simplified */}
              {event.ticketDetails && event.ticketDetails.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                    <Ticket className="w-5 h-5 mr-2 text-blue-600" />
                    Loại vé có sẵn
                  </h3>
                  <div className="space-y-3">
                    {event.ticketDetails.map((ticket, index) => {
                      const availableTickets =
                        ticket.ticketQuantity - (ticket.soldQuantity || 0);
                      const isAvailable = availableTickets > 0;
                      const soldPercentage =
                        ((ticket.soldQuantity || 0) / ticket.ticketQuantity) *
                        100;

                      return (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${
                            isAvailable
                              ? "border-gray-200"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  {ticket.ticketName}
                                </h4>
                                {!isAvailable && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs font-semibold"
                                  >
                                    Hết vé
                                  </Badge>
                                )}
                              </div>
                              {ticket.ticketDescription && (
                                <p className="text-sm text-gray-500 mb-2">
                                  {ticket.ticketDescription}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-lg text-gray-900">
                                {ticket.ticketPrice === 0
                                  ? "Miễn phí"
                                  : formatTicketPrice(ticket)}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                Đã bán: {ticket.soldQuantity || 0}/
                                {ticket.ticketQuantity}
                              </span>
                              <span className="font-medium">
                                Còn lại: {availableTickets} vé
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${soldPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* About Event - Simplified */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                Về sự kiện
              </h2>
              <div className="space-y-5">
                <p className="text-gray-700">
                  {event.title} là một sự kiện đặc biệt.
                  {event.description ||
                    "Hãy tham gia để trải nghiệm những điều thú vị."}
                </p>

                {/* Schedule - Simplified */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    Chương trình chi tiết
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        time: formatTime(event.startTime),
                        title: "Bắt đầu sự kiện",
                        desc: "Khởi đầu chương trình",
                      },
                      {
                        time: new Date(
                          new Date(event.startTime).getTime() + 60 * 60 * 1000
                        ).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                        title: "Phiên chính",
                        desc: "Nội dung chính của sự kiện",
                      },
                      {
                        time: new Date(
                          new Date(event.endTime).getTime() - 30 * 60 * 1000
                        ).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                        title: "Kết thúc",
                        desc: "Tổng kết và networking",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3"
                      >
                        <div className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-sm font-semibold min-w-fit">
                          {item.time}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits - Simplified */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Bạn sẽ nhận được:
                  </h4>
                  <ul className="text-gray-700 space-y-1">
                    {[
                      "Kiến thức và trải nghiệm quý báu",
                      "Cơ hội kết nối với những người cùng chí hướng",
                      "Tài liệu sự kiện (nếu có)",
                      "Networking và chia sẻ kinh nghiệm",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Organizer - Simplified */}
            {event.organizerEvent && (
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  Nhà tổ chức
                </h2>
                <div className="flex items-center space-x-4">
                  {event.organizerEvent.imgCompany ? (
                    <img
                      src={event.organizerEvent.imgCompany}
                      alt={event.organizerEvent.companyName || "Organizer"}
                      className="w-14 h-14 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {event.organizerEvent.companyName || "Nhà tổ chức"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {event.organizerEvent.companyDescription ||
                        "Tổ chức sự kiện chuyên nghiệp"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <RatingSection eventId={event.eventId || id} />
          </div>

          {/* Sidebar - Simplified */}
          <div className="space-y-6">
            {/* Registration Card - Simplified */}
            <Card className="border border-gray-200">
              <div className="bg-gray-50 p-5 rounded-t-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Đăng ký tham gia
                </h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {getDisplayTicketPrice(event)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {event.ticketDetails && event.ticketDetails.length > 0
                      ? "Giá từ các loại vé khác nhau"
                      : "Bao gồm coffee break & lunch"}
                  </p>
                </div>
              </div>

              <CardContent className="space-y-3 p-5">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  size="lg"
                  onClick={handleRegister}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Đăng ký ngay
                </Button>
                <Button
                  variant="outline"
                  className="w-full border border-gray-300 hover:bg-gray-50 font-medium"
                  onClick={handleInviteFriends}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Mời bạn bè tham gia
                </Button>
                <Button
                  variant="outline"
                  className="w-full border border-gray-300 hover:bg-gray-50 font-medium"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Chia sẻ
                </Button>
              </CardContent>
            </Card>

            {/* Location Card - Simplified */}
            {(!event.isOnlineEvent || event.isOnlineEvent === false) &&
              (event.locationName || event.address) && (
                <Card className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-green-600" />
                      Địa điểm
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-1">
                        {event.locationName}
                      </p>
                      <p className="text-sm text-gray-500">{event.address}</p>
                    </div>

                    {/* Map Preview - Simplified */}
                    {event.latitude && event.longitude ? (
                      <div className="relative h-40 rounded-lg overflow-hidden border border-gray-200">
                        <iframe
                          src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                          className="w-full h-full"
                          frameBorder="0"
                          allowFullScreen
                          title="Event Location Map Preview"
                        ></iframe>
                      </div>
                    ) : (
                      <div className="relative h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                          <span className="text-sm text-gray-500">
                            Bản đồ không khả dụng
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full border border-gray-300 hover:bg-gray-50 font-medium"
                      onClick={() => setIsMapModalOpen(true)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Xem đường đi
                    </Button>
                  </CardContent>
                </Card>
              )}

            {/* Related Events - Simplified */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-orange-600" />
                  Sự kiện tương tự
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedEvents.length > 0 ? (
                  relatedEvents.map((relatedEvent) => (
                    <div
                      key={relatedEvent.eventId}
                      className="flex space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-3 border border-transparent hover:border-gray-200"
                      onClick={() => handleViewDetail(relatedEvent.eventId)}
                    >
                      {relatedEvent.imgListEvent?.[0] ? (
                        <img
                          src={relatedEvent.imgListEvent[0]}
                          alt={relatedEvent.title}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <span className="text-xs text-gray-500">
                            No image
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                          {relatedEvent.title}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(relatedEvent.startTime).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">
                          {relatedEvent.minTicketPrice !== undefined &&
                          relatedEvent.maxTicketPrice !== undefined
                            ? relatedEvent.minTicketPrice === 0 &&
                              relatedEvent.maxTicketPrice === 0
                              ? "Miễn phí"
                              : relatedEvent.minTicketPrice ===
                                relatedEvent.maxTicketPrice
                              ? new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(relatedEvent.minTicketPrice)
                              : `${new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(
                                  relatedEvent.minTicketPrice
                                )} - ${new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(relatedEvent.maxTicketPrice)}`
                            : relatedEvent.ticketType === 1 ||
                              relatedEvent.ticketType === "free"
                            ? "Miễn phí"
                            : "Có phí"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Không có sự kiện tương tự
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Map Modal - Simplified */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="max-w-4xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-600" />
              Bản đồ & Chỉ đường
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <MapDirection
              destinationAddress={event.address || event.locationName}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Friends Dialog - Simplified */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-2xl rounded-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
              Mời bạn bè tham gia sự kiện
            </DialogTitle>
            <DialogDescription>
              Chọn bạn bè và gửi lời mời tham gia sự kiện này.
            </DialogDescription>
          </DialogHeader>

          {/* Event Info */}
          <div className="flex gap-4 bg-gray-50 rounded-lg p-4 mb-4">
            <img
              src={event.imgListEvent?.[0] || eventAvt || "/placeholder.jpg"}
              alt={event.title}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-gray-200"
            />

            <div className="flex flex-col justify-center flex-1">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {event.title}
              </h3>

              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                {event.startTime
                  ? new Date(event.startTime).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Chưa có ngày tổ chức"}
                <span className="mx-2">•</span>
                <Ticket className="w-4 h-4 mr-1 text-green-500" />
                {getDisplayTicketPrice(event)}
              </div>

              <div className="flex items-start text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1 text-red-500 mt-[2px]" />
                <span className="line-clamp-2">
                  {event.address || "Chưa cập nhật địa chỉ"}
                </span>
              </div>
            </div>
          </div>

          {/* Friends List */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Danh sách bạn bè
            </h3>

            {isLoadingFriends ? (
              <div className="flex justify-center items-center py-8 text-gray-500">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tải danh sách bạn bè...
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <UserPlus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  Bạn chưa có bạn bè nào được chấp nhận.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {friends.map((f) => {
                  const isSelected = selectedFriends.includes(f.id);

                  // Parse interestsJson nếu là chuỗi
                  let interests = [];
                  try {
                    if (
                      typeof f.interestsJson === "string" &&
                      f.interestsJson
                    ) {
                      interests = JSON.parse(f.interestsJson);
                    } else if (Array.isArray(f.interestsJson)) {
                      interests = f.interestsJson;
                    }
                  } catch {
                    interests = [];
                  }

                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleSelectFriend(f.id)}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={f.image || userAvt || "/default-avatar.png"}
                          alt={f.friendName}
                          className={`w-14 h-14 rounded-lg object-cover ${
                            isSelected ? "border-2 border-blue-500" : "border border-gray-200"
                          }`}
                        />
                        {isSelected && (
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold truncate ${
                            isSelected ? "text-blue-700" : "text-gray-900"
                          }`}
                        >
                          {f.friendName || "Người dùng"}
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {f.district || "Chưa cập nhật khu vực"}
                        </p>

                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-gray-400" />
                          {f.eventNumber > 0
                            ? `${f.eventNumber} sự kiện đã tham gia`
                            : "Chưa tham gia sự kiện nào"}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-1">
                          {interests.length > 0 ? (
                            interests.map((i, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full font-medium"
                              >
                                #{i.InterestName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">
                              Không có sở thích
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message box */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">
              Lời nhắn
            </label>
            <Textarea
              rows={3}
              placeholder="Hãy cùng tham gia sự kiện này nhé!"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
              className="border border-gray-300 hover:bg-gray-50"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={isInviting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Gửi lời mời
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog - Simplified */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="rounded-xl max-w-md w-full">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Chia sẻ với bạn bè
                </h3>
                <p className="text-gray-500 text-sm">
                  Chọn nơi bạn muốn chia sẻ
                </p>
              </div>
              <button
                onClick={() => setIsShareOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Social Options Grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                {
                  name: "Facebook",
                  icon: <img src={Facebook} alt="Facebook" className="w-6 h-6" />,
                  url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href
                  )}`,
                },
                {
                  name: "Twitter",
                  icon: <img src={Twitter} alt="Twitter" className="w-6 h-6" />,
                  url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    window.location.href
                  )}&text=${encodeURIComponent("Check this out!")}`,
                },
                {
                  name: "Zalo",
                  icon: <img src={Zalo} alt="Zalo" className="w-6 h-6" />,
                  url: `https://zalo.me/share?url=${encodeURIComponent(
                    window.location.href
                  )}`,
                },
                {
                  name: "Instagram",
                  icon: <img src={Instagram} alt="Instagram" className="w-6 h-6" />,
                  url: `https://www.instagram.com/?url=${encodeURIComponent(
                    window.location.href
                  )}`,
                },
                {
                  name: "TikTok",
                  icon: <img src={Tiktok} alt="TikTok" className="w-6 h-6" />,
                  url: `https://www.tiktok.com/share?url=${encodeURIComponent(
                    window.location.href
                  )}`,
                },
                {
                  name: "LinkedIn",
                  icon: <img src={LinkedIn} alt="LinkedIn" className="w-6 h-6" />,
                  url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    window.location.href
                  )}`,
                },
              ].map((option, index) => (
                <button
                  key={index}
                  onClick={() => window.open(option.url, "_blank")}
                  className="group flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    {option.icon}
                  </div>
                  <span className="text-gray-700 text-xs font-medium">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Copy Link Section */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white rounded-lg px-3 py-2 flex items-center gap-2 border border-gray-200">
                  <Link2 className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="bg-transparent text-gray-700 text-sm outline-none flex-1 truncate"
                  />
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Đã sao chép liên kết!");
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sao chép
                </button>
              </div>
            </div>

            {/* Native Share Button */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: event?.title,
                    text: "Cùng tham gia sự kiện này nhé!",
                    url: window.location.href,
                  });
                } else {
                  toast.error("Thiết bị không hỗ trợ chia sẻ trực tiếp");
                }
              }}
              className="w-full py-2.5 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-900"
            >
              <div className="flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ khác</span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailGuestPage;