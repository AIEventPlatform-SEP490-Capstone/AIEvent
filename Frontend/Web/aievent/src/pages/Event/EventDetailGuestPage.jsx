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
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { useEvents } from "../../hooks/useEvents";
import { useFavoriteEvents } from '../../hooks/useFavoriteEvents';
import { PATH } from "../../routes/path";
import MapDirection from "../../components/Event/MapDirection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import RatingSection from "../../components/Rating/RatingSection";

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
  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();

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
          const isEventFavorited = favorites.some(favEvent => favEvent.eventId === event.eventId);
          setIsLiked(isEventFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
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
  const weekday = date.toLocaleDateString('vi-VN', { weekday: 'long' });
  const datePart = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
    if (event.minTicketPrice !== undefined && event.maxTicketPrice !== undefined) {
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
    return event.ticketType === 1 || event.ticketType === "free" ? 'Miễn phí' : 'Có phí';
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
      navigate(`${PATH.BOOKING.replace(':id', id)}`);
    } else {
      navigate(`${PATH.LOGIN}?returnUrl=${PATH.BOOKING.replace(':id', id)}`);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate(`${PATH.LOGIN}?returnUrl=${PATH.EVENT.replace(':id', id)}`);
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
      console.error('Error toggling favorite:', error);
      toast.error('Không thể cập nhật trạng thái yêu thích');
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
    const message = `Hãy cùng tham gia sự kiện "${event.title}" nhé! ${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: message,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(message);
      toast.success("Đã sao chép lời mời!");
    }
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
          <p className="text-gray-600 font-medium">Đang tải thông tin sự kiện...</p>
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
            <h3 className="text-xl font-bold text-gray-800">Không tìm thấy sự kiện</h3>
            <p className="text-gray-500">Sự kiện có thể đã bị xóa hoặc không tồn tại.</p>
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
      {/* Header - Enhanced */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100 transition-colors rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image - Enhanced with overlay gradient */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl group">
              {event.imgListEvent && event.imgListEvent.length > 0 ? (
                <>
                  <img
                    src={event.imgListEvent[0]}
                    alt={event.title}
                    className="w-full h-64 md:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                </>
              ) : (
                <div className="w-full h-64 md:h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 font-medium">Không có hình ảnh</span>
                </div>
              )}
              
              {/* Favorite Button - Enhanced */}
              <button 
                onClick={handleToggleFavorite}
                className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-xl"
              >
                <Heart 
                  className={`w-6 h-6 transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : "text-gray-700"}`} 
                />
              </button>
              
              {/* Badges - Enhanced */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <Badge className="bg-white/95 backdrop-blur-sm text-gray-800 border-0 shadow-lg px-4 py-2 font-semibold">
                  {formatPrice(event)}
                </Badge>
                {event.eventCategoryName && (
                  <Badge className="bg-blue-500/95 backdrop-blur-sm text-white border-0 shadow-lg px-4 py-2 font-medium">
                    <Tag className="w-3 h-3 mr-1" />
                    {event.eventCategoryName}
                  </Badge>
                )}
              </div>
            </div>

            {/* Event Info - Enhanced */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">{event.title}</h1>
                <p className="text-lg text-gray-600 leading-relaxed">{event.description}</p>
              </div>

              {/* Info Grid - Enhanced with gradient backgrounds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-blue-500 rounded-xl flex-shrink-0 shadow-md">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-blue-900 mb-1">Ngày diễn ra sự kiện</p>
                    <p className="font-bold text-lg text-gray-900">{formatDate(event.startTime)}</p>
                    <p className="text-sm text-gray-600 mt-1"> Bắt đầu vào lúc: {formatTime(event.startTime)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-200/50 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-orange-500 rounded-xl flex-shrink-0 shadow-md">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-orange-900 mb-1">Thời gian diễn ra</p>
                    <p className="font-bold text-lg text-gray-900">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                    {(() => {
                      const start = new Date(event.startTime);
                      const end = new Date(event.endTime);
                      const diffMs = end - start;
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return (
                        <p className="text-sm text-gray-600 mt-1">
                          Thời lượng diễn ra: {hours} giờ {minutes > 0 ? `${minutes} phút` : ''}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-5 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-green-500 rounded-xl flex-shrink-0 shadow-md">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-green-900 mb-1">Địa điểm tổ chức</p>
                    <p className="font-bold text-lg text-gray-900">
                      {event.isOnlineEvent ? 'Sự kiện trực tuyến' : (event.locationName || 'Chưa xác định')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.isOnlineEvent ? 'Trực tuyến' : (event.address || 'Chưa xác định')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200/50 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-purple-500 rounded-xl flex-shrink-0 shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-purple-900 mb-1">Số lượng người tham gia</p>
                    <p className="font-bold text-lg text-gray-900">{event.soldQuantity || 0}/{event.totalTickets || 'N/A'} người</p>
                    <p className="text-sm text-gray-600 mt-1">Còn trống {totalAvailableTickets} chỗ</p>
                  </div>
                </div>

                
              </div>

              {/* Ticket Information - Enhanced */}
              {event.ticketDetails && event.ticketDetails.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                  <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                      <Ticket className="w-5 h-5 text-white" />
                    </div>
                    Loại vé có sẵn
                  </h3>
                  <div className="space-y-3">
                    {event.ticketDetails.map((ticket, index) => {
                      const availableTickets =
                        ticket.ticketQuantity - (ticket.soldQuantity || 0);
                      const isAvailable = availableTickets > 0;
                      const soldPercentage = ((ticket.soldQuantity || 0) / ticket.ticketQuantity) * 100;

                      return (
                        <div
                          key={index}
                          className={`border-2 rounded-xl p-5 transition-all hover:shadow-md ${
                            isAvailable 
                              ? "border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-blue-300" 
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg text-gray-900">{ticket.ticketName}</h4>
                                {!isAvailable && (
                                  <Badge variant="destructive" className="text-xs font-semibold">
                                    Hết vé
                                  </Badge>
                                )}
                              </div>
                              {ticket.ticketDescription && (
                                <p className="text-sm text-gray-600 mb-3">{ticket.ticketDescription}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {ticket.ticketPrice === 0 ? "Miễn phí" : formatTicketPrice(ticket)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>Đã bán: {ticket.soldQuantity || 0}/{ticket.ticketQuantity}</span>
                              <span className="font-medium">Còn lại: {availableTickets} vé</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
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

            <Separator className="my-8" />

            {/* About Event - Enhanced */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Về sự kiện</h2>
              <div className="prose prose-gray max-w-none space-y-6">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {event.title} là một sự kiện đặc biệt. 
                  {event.description || 'Hãy tham gia để trải nghiệm những điều thú vị.'}
                </p>

                {/* Schedule - Enhanced */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
                  <h3 className="text-lg font-bold mb-4 flex items-center text-gray-900">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Chương trình chi tiết
                  </h3>
                  <div className="space-y-4">
                    {[
                      { time: formatTime(event.startTime), title: 'Bắt đầu sự kiện', desc: 'Khởi đầu chương trình' },
                      { time: new Date(new Date(event.startTime).getTime() + 60 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), title: 'Phiên chính', desc: 'Nội dung chính của sự kiện' },
                      { time: new Date(new Date(event.endTime).getTime() - 30 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), title: 'Kết thúc', desc: 'Tổng kết và networking' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-4 group">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg px-3 py-2 text-sm font-bold min-w-fit shadow-md group-hover:shadow-lg transition-shadow">
                          {item.time}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits - Enhanced */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                  <h4 className="font-bold text-green-900 mb-3 text-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Bạn sẽ nhận được:
                  </h4>
                  <ul className="text-green-800 space-y-2">
                    {[
                      'Kiến thức và trải nghiệm quý báu',
                      'Cơ hội kết nối với những người cùng chí hướng',
                      'Tài liệu sự kiện (nếu có)',
                      'Networking và chia sẻ kinh nghiệm'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-1 text-green-600 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Organizer - Enhanced */}
            {event.organizerEvent && (
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Nhà tổ chức</h2>
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  {event.organizerEvent.imgCompany ? (
                    <img 
                      src={event.organizerEvent.imgCompany} 
                      alt={event.organizerEvent.companyName || "Organizer"} 
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{event.organizerEvent.companyName || "Nhà tổ chức"}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.organizerEvent.companyDescription || "Tổ chức sự kiện chuyên nghiệp"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <RatingSection eventId={event.eventId || id} />
          </div>

          {/* Sidebar - Enhanced */}
          <div className="space-y-6">
            {/* Registration Card - Enhanced */}
            <Card className="shadow-xl border-2 border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6">
                <h3 className="text-xl font-bold text-white mb-2">Đăng ký tham gia</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{getDisplayTicketPrice(event)}</div>
                  <p className="text-sm text-blue-100">
                    {event.ticketDetails && event.ticketDetails.length > 0 
                      ? "Giá từ các loại vé khác nhau" 
                      : "Bao gồm coffee break & lunch"}
                  </p>
                </div>
              </div>

              <CardContent className="space-y-3 p-6">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                  size="lg" 
                  onClick={handleRegister}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Đăng ký ngay
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-2 hover:bg-gray-50 font-medium transition-all duration-300" 
                  onClick={handleInviteFriends}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Mời bạn bè tham gia
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-2 hover:bg-gray-50 font-medium transition-all duration-300" 
                  onClick={handleShareEvent}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Chia sẻ
                </Button>
              </CardContent>
            </Card>

            {/* Location Card - Enhanced */}
            {(!event.isOnlineEvent || event.isOnlineEvent === false) && (event.locationName || event.address) && (
              <Card className="shadow-lg border-2 border-gray-200">
                <CardHeader className="pb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    Địa điểm
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                    <p className="font-bold text-lg text-gray-900 mb-1">{event.locationName}</p>
                    <p className="text-sm text-gray-600">{event.address}</p>
                  </div>
                  
                  {/* Map Preview - Enhanced */}
                  {(event.latitude && event.longitude) ? (
                    <div className="relative h-48 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md group">
                      <iframe
                        src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                        className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                        frameBorder="0"
                        allowFullScreen
                        title="Event Location Map Preview"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="relative h-48 rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-500 font-medium">Bản đồ không khả dụng</span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-2 hover:bg-gray-50 font-medium transition-all duration-300" 
                    onClick={() => setIsMapModalOpen(true)}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Xem đường đi
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Related Events - Enhanced */}
            <Card className="shadow-lg border-2 border-gray-200">
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Sự kiện tương tự
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedEvents.length > 0 ? (
                  relatedEvents.map((relatedEvent) => (
                    <div
                      key={relatedEvent.eventId}
                      className="flex space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl p-3 -m-2 transition-all duration-300 border-2 border-transparent hover:border-blue-200 hover:shadow-md group"
                      onClick={() => handleViewDetail(relatedEvent.eventId)}
                    >
                      {relatedEvent.imgListEvent?.[0] ? (
                        <img
                          src={relatedEvent.imgListEvent[0]}
                          alt={relatedEvent.title}
                          className="w-20 h-20 rounded-lg object-cover shadow-md group-hover:shadow-lg transition-shadow"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md">
                          <span className="text-xs text-gray-500 font-medium">No image</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{relatedEvent.title}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(relatedEvent.startTime).toLocaleDateString("vi-VN")}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">
                          {relatedEvent.minTicketPrice !== undefined && relatedEvent.maxTicketPrice !== undefined ? (
                            relatedEvent.minTicketPrice === 0 && relatedEvent.maxTicketPrice === 0 ? (
                              "Miễn phí"
                            ) : relatedEvent.minTicketPrice === relatedEvent.maxTicketPrice ? (
                              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(relatedEvent.minTicketPrice)
                            ) : (
                              `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(relatedEvent.minTicketPrice)} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(relatedEvent.maxTicketPrice)}`
                            )
                          ) : (
                            relatedEvent.ticketType === 1 || relatedEvent.ticketType === "free" ? "Miễn phí" : "Có phí"
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Không có sự kiện tương tự</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Map Modal - Enhanced */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-blue-600" />
              Bản đồ & Chỉ đường
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <MapDirection
              destinationAddress={event.address || event.locationName}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailGuestPage;
