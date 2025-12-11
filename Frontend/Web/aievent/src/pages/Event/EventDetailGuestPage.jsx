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
  ChevronLeft,
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
  Flag,
  Target  // Add Target icon
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
import { useSidebar } from "../../components/ui/sidebar";
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
import Tiktok from "../../assets/Tiktok.png";
import Instagram from "../../assets/Instagram.png";
import { EventTimeline } from "../../components/Event/EventTimeline";

// Import enhanced components
import { SidebarCard } from "../../components/Event/SidebarCard";
import { ActionButton } from "../../components/Event/ActionButton";
import { StatCard } from "../../components/Event/StatCard";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const EventDetailGuestPage = ({ previewData }) => {
  const { state } = useSidebar();
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
  const [aiRecommendedFriends, setAiRecommendedFriends] = useState([]); // New state for AI recommended friends
  const [showAiRecommendations, setShowAiRecommendations] = useState(false); // Toggle for showing AI recommendations
  const [isLoadingAiFriends, setIsLoadingAiFriends] = useState(false); // Loading state for AI friends
  const sidebarState = state === "collapsed" ? "lg:pl-20" : "lg:pl-0.2";
  
  // New state for ticket sale countdown
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [saleStarted, setSaleStarted] = useState(false);

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

  // Load AI recommended friends
  const loadAiRecommendedFriends = async () => {
    setIsLoadingAiFriends(true);
    try {
      const res = await eventAPI.getAIRecommendedFriendsByEvent(id, 1, 10);
      setAiRecommendedFriends(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error("Error loading AI recommended friends:", err);
      toast.error("Không thể tải danh sách bạn bè được đề xuất");
      setAiRecommendedFriends([]);
    } finally {
      setIsLoadingAiFriends(false);
      setShowAiRecommendations(!showAiRecommendations);
    }
  };
  // Handle click on friend card - navigate to friend detail page
  const handleFriendCardClick = (friendId) => {
    // Navigate to friend detail page
    navigate(`/friend/${friendId}`);
  };

  // Add friend function
  const handleAddFriend = async (userId) => {
    try {
      await friendAPI.addFriend(userId);
      toast.success("Đã gửi lời mời kết bạn!");
      // Update the UI to show that friend request was sent
      setAiRecommendedFriends(prev => 
        prev.map(friend => 
          friend.id === userId 
            ? { ...friend, friendRequestSent: true } 
            : friend
        )
      );
    } catch (err) {
      console.error("Error adding friend:", err);
      toast.error("Không thể gửi lời mời kết bạn");
    }
  };
  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } =
    useFavoriteEvents();

  // Countdown timer effect for ticket sale
  useEffect(() => {
    if (!event?.saleStartTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const saleStartTime = new Date(event.saleStartTime);
      
      if (now >= saleStartTime) {
        setSaleStarted(true);
        setTimeRemaining(null);
        return;
      }
      
      const diff = saleStartTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
      setSaleStarted(false);
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timer);
  }, [event?.saleStartTime]);

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

    const prices = event.ticketDetails.map((t) => t.ticketPrice || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === 0 && max === 0) return "0đ";
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
        return "0đ";
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
  };

  const formatTicketPrice = (ticket) => {
    if (ticket.ticketPrice === 0) {
      return "0đ";
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
    // Check if sale has started before allowing registration
    if (event?.saleStartTime) {
      const now = new Date();
      const saleStartTime = new Date(event.saleStartTime);
      
      if (now < saleStartTime) {
        toast.error("Vé sự kiện chưa mở bán. Vui lòng quay lại sau thời gian mở bán vé.");
        return;
      }
    }
    
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
            <LoadingSpinner className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 animate-pulse" />
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
  const occupancyPercent = event.soldQuantity ? (event.soldQuantity / event.totalTickets) * 100 : 0;

  // Modify the ticket purchase button
  const getTicketButtonText = () => {
    if (!event?.saleStartTime) return "Mua vé ngay";
    
    const now = new Date();
    const saleStartTime = new Date(event.saleStartTime);
    
    if (now < saleStartTime) {
      return "Chưa mở bán";
    }
    
    return "Mua vé ngay";
  };

  return (
    <div className={`min-h-screen bg-background transition-all duration-300 ${sidebarState}`}>
      {/* Header - Simplified */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground flex-1 ml-4 truncate">{event.title}</h1>
          <div className="flex gap-2">
              <button 
                onClick={handleToggleFavorite}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
              </button>
            </div>
        </div>
      </div>

      <div className="relative h-96 w-full overflow-hidden bg-gray-100">
        {event.imgListEvent && event.imgListEvent.length > 0 ? (
          <>
            <img 
              src={event.imgListEvent[selectedImageIndex]} 
              alt={event.title} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              {/* Display category badge */}
              <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg px-3 py-1.5 font-semibold">
                <Tag className="w-3 h-3 mr-1" />
                {event.eventCategory?.eventCategoryName || "Chưa phân loại"}
              </Badge>
              {/* Display event tags */}
              {event.eventTags && event.eventTags.map((tag, index) => (
                <Badge key={index} className="bg-indigo-100 text-indigo-800 border-0 shadow-lg px-3 py-1.5 font-semibold">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.tagName}
                </Badge>
              ))}
            </div>
            
            {event.imgListEvent.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {event.imgListEvent.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      selectedImageIndex === index ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 font-medium">
              Không có hình ảnh
            </span>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Grid layout with main content and sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground leading-tight">{event.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{event.description}</p>
            </div>

            {/* Event Timeline */}
            <EventTimeline 
              stages={[
                {
                  label: "Mở bán vé",
                  time: event.saleStartTime 
                    ? `${new Date(event.saleStartTime).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} ${new Date(event.saleStartTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}`
                    : "Chưa xác định",
                  icon: <Ticket className="w-5 h-5" />,
                  color: "bg-blue-500",
                  // Add countdown display
                  countdown: timeRemaining && !saleStarted && (
                    <div className="mt-2 text-center">
                      <div className="flex justify-center gap-1">
                        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
                          {timeRemaining.days}d
                        </div>
                        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
                          {timeRemaining.hours}h
                        </div>
                        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
                          {timeRemaining.minutes}m
                        </div>
                        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
                          {timeRemaining.seconds}s
                        </div>
                      </div>
                    </div>
                  ),
                  // Show "Currently ongoing" when sale has started
                  ongoing: saleStarted && (
                    <div className="mt-2 text-center">
                      <div className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Đang diễn ra
                      </div>
                    </div>
                  )
                },
                {
                  label: "Đóng bán vé",
                  time: event.saleEndTime 
                    ? `${new Date(event.saleEndTime).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} ${new Date(event.saleEndTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}`
                    : "Chưa xác định",
                  icon: <Clock className="w-5 h-5" />,
                  color: "bg-red-500"
                },
                {
                  label: "Sự kiện bắt đầu",
                  time: `${new Date(event.startTime).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} ${new Date(event.startTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}`,
                  icon: <Calendar className="w-5 h-5" />,
                  color: "bg-green-500"
                },
                {
                  label: "Sự kiện kết thúc",
                  time: `${new Date(event.endTime).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} ${new Date(event.endTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}`,
                  icon: <Flag className="w-5 h-5" />,
                  color: "bg-purple-500"
                }
              ]}
              rawTimes={[
                event.saleStartTime,
                event.saleEndTime,
                event.startTime,
                event.endTime
              ]}
              currentStage={(() => {
                const now = new Date();
                // Stage 0: Mở bán vé (Ticket sale start)
                if (event.saleStartTime && now < new Date(event.saleStartTime)) return -1; // Not yet started
                // Stage 1: Đóng bán vé (Ticket sale end)
                if (event.saleEndTime && now < new Date(event.saleEndTime)) return 0; // Sale is ongoing
                // Stage 2: Sự kiện bắt đầu (Event start)
                if (now < new Date(event.startTime)) return 1;
                // Stage 3: Sự kiện kết thúc (Event end)
                if (now < new Date(event.endTime)) return 2;
                return 3; // Event has ended - show final stage
              })()}
            />

            {/* Ticket Information */}
            {event.ticketDetails && event.ticketDetails.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    Tình trạng vé
                  </h3>
                  <span className="text-sm font-medium text-primary">{occupancyPercent.toFixed(0)}% Đã bán</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">{totalAvailableTickets} chỗ còn lại</p>
              </div>
            )}

            {/* Ticket Options */}
            {event.ticketDetails && event.ticketDetails.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">Loại vé có sẵn</h3>
                {event.ticketDetails.map((ticket, index) => {
                  const availableTickets = ticket.ticketQuantity - (ticket.soldQuantity || 0);
                  const isAvailable = availableTickets > 0;
                  const soldPercentage = ticket.soldQuantity ? (ticket.soldQuantity / ticket.ticketQuantity) * 100 : 0;

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{ticket.ticketName}</h4>
                          <p className="text-sm text-muted-foreground">{ticket.ticketDescription}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {ticket.ticketPrice === 0 ? "" : formatTicketPrice(ticket)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{ticket.soldQuantity || 0} / {ticket.ticketQuantity} đã bán</span>
                        <span className="font-medium">{availableTickets} còn lại</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* About Event */}
            <div className="bg-white rounded-xl p-8 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold text-foreground mb-6">Về sự kiện</h2>
              {event.detailedDescription || event.description ? (
                <div 
                  className="prose max-w-none text-muted-foreground leading-relaxed mb-6 ql-editor"
                  dangerouslySetInnerHTML={{ __html: event.detailedDescription || event.description }} 
                />
              ) : (
                <p className="text-muted-foreground italic">
                  Thông tin chi tiết về sự kiện chưa được cập nhật.
                </p>
              )}
              
            </div>

            {/* Organizer */}
            {event.organizerEvent && (
              <div
                onClick={() => {
                  const orgId = event.organizerEvent.organizerId || event.organizerEvent.id || event.organizerId;
                  if (!isAuthenticated) {
                    toast.error("Vui lòng đăng nhập để xem thông tin nhà tổ chức");
                    navigate("/auth/login");
                    return;
                  }
                  if (orgId) navigate(`/organizer/${orgId}/events`);
                }}
                className="bg-white rounded-xl p-8 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    const orgId = event.organizerEvent.organizerId || event.organizerEvent.id || event.organizerId;
                    if (orgId) navigate(`/organizer/${orgId}/events`);
                  }
                }}
              >
                <h2 className="text-xl font-bold text-foreground mb-6">Nhà tổ chức</h2>
                <div className="flex items-start gap-4">
                  {event.organizerEvent.imgCompany ? (
                    <img
                      src={event.organizerEvent.imgCompany}
                      alt={event.organizerEvent.companyName || "Organizer"}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{event.organizerEvent.companyName || "Nhà tổ chức"}</h3>
                    <p className="text-muted-foreground mt-1">{event.organizerEvent.companyDescription || "Thông tin về nhà tổ chức chưa được cập nhật."}</p>
                    <p className="text-xs text-primary mt-2 font-medium">Xem tất cả sự kiện của nhà tổ chức</p>
                  </div>
                </div>
              </div>
            )}

            <RatingSection eventId={event.eventId || id} eventEndTime={event.endTime} />
          </div>

          {/* Sidebar - Enhanced */}
          <div className="lg:col-span-1 space-y-6">
            {/* Registration Card - Enhanced */}
            <SidebarCard title="Mua vé tham gia" gradient>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {getDisplayTicketPrice(event)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.ticketDetails && event.ticketDetails.length > 0
                      ? "Giá từ các loại vé khác nhau"
                      : "Bao gồm coffee break & lunch"}
                  </p>
                </div>
                
                <ActionButton
                  icon={CreditCard}
                  label={getTicketButtonText()}
                  onClick={handleRegister}
                  variant={(!saleStarted && event?.saleStartTime && new Date() < new Date(event.saleStartTime)) ? "secondary" : "primary"}
                  className={`${
                    !saleStarted && event?.saleStartTime && new Date() < new Date(event.saleStartTime)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                />
                
                <ActionButton
                  icon={UserPlus}
                  label="Mời bạn bè"
                  onClick={handleInviteFriends}
                  variant="secondary"
                />
                
                <ActionButton
                  icon={Share2}
                  label="Chia sẻ sự kiện"
                  onClick={() => setIsShareOpen(true)}
                  variant="secondary"
                />
              </div>
            </SidebarCard>

            {/* AI Friend Recommendations - Only show when user is authenticated */}
            {isAuthenticated && (
              <SidebarCard title="Bạn bè thông minh" icon={<Sparkles className="w-4 h-4" />}>              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={loadAiRecommendedFriends}
                  disabled={isLoadingAiFriends}
                  className="w-full border border-blue-300 hover:bg-blue-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAiFriends ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                      {showAiRecommendations ? "Ẩn đề xuất bạn bè" : "Xem đề xuất bạn bè thông minh"}
                    </>
                  )}
                </Button>

                {showAiRecommendations && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                      Bạn bè được đề xuất bởi AI
                    </h3>

                    {isLoadingAiFriends ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        <p className="mt-2">Đang tải danh sách bạn bè được đề xuất...</p>
                        <p className="text-sm mt-1">Hệ thống AI đang phân tích và tìm kiếm bạn bè phù hợp</p>
                      </div>
                    ) : aiRecommendedFriends.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">
                          Không tìm thấy bạn bè được đề xuất.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto pr-1">
                        {aiRecommendedFriends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleFriendCardClick(friend.id)}
                          >                            <div className="relative flex-shrink-0">
                              <img
                                src={friend.image || userAvt || "/default-avatar.png"}
                                alt={friend.friendName || friend.name}
                                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate text-gray-900">
                                {friend.friendName || friend.name || "Người dùng"}
                              </p>

                              {friend.reason && (
                                <div className="mt-1 bg-blue-50 rounded-md p-2 border border-blue-100">
                                  <p className="text-xs text-blue-700 flex items-start gap-1">
                                    <Target className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                                    <span>
                                      <span className="font-medium">Lý do đề xuất:</span> {friend.reason}
                                    </span>
                                  </p>
                                </div>
                              )}

                              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {friend.district || "Chưa cập nhật khu vực"}
                              </p>

                              {/* Stop propagation so clicking the button doesn't trigger card click */}
                              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                {!friend.friendRequestSent ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddFriend(friend.id)}
                                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                  >
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Kết bạn
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled
                                    className="h-7 text-xs bg-gray-300 cursor-not-allowed"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Đã gửi
                                  </Button>
                                )}
                              </div>                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SidebarCard>
            )}

            {/* Location Card - Enhanced */}
            {(!event.isOnlineEvent || event.isOnlineEvent === false) &&
              (event.locationName || event.address) && (
                <SidebarCard title="Địa điểm" icon={<MapPin className="w-4 h-4" />}>
                  <div className="space-y-4">
                    {/* Location Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-sm mb-1">
                            {event.locationName}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {event.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Map Preview */}
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-gray-100 group hover:border-primary/30 transition-all">
                      {event.latitude && event.longitude ? (
                        <>
                          <iframe
                            src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                            title="Event Location Map Preview"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <span className="text-xs text-gray-400 font-medium">
                              Bản đồ không khả dụng
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Directions Button */}
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold rounded-xl py-5 transition-all group"
                      onClick={() => setIsMapModalOpen(true)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Xem đường đi
                    </Button>
                  </div>
                </SidebarCard>
              )}

            {/* Related Events - Enhanced */}
            <SidebarCard title="Sự kiện cùng danh mục" icon={<Sparkles className="w-4 h-4" />}>
              <div className="space-y-3">
                {relatedEvents.length > 0 ? (
                  relatedEvents.map((relatedEvent) => (
                    <div 
                      key={relatedEvent.eventId} 
                      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition border border-transparent hover:border-gray-200"
                      onClick={() => handleViewDetail(relatedEvent.eventId)}
                    >
                      {relatedEvent.imgListEvent?.[0] ? (
                        <img
                          src={relatedEvent.imgListEvent[0]}
                          alt={relatedEvent.title}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <span className="text-xs text-gray-500">
                            No image
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground line-clamp-2">{relatedEvent.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(relatedEvent.startTime).toLocaleDateString("vi-VN")}
                        </p>
                        <p className="text-xs font-semibold text-primary mt-1">
                          {relatedEvent.minTicketPrice !== undefined &&
                          relatedEvent.maxTicketPrice !== undefined
                            ? relatedEvent.minTicketPrice === 0 &&
                              relatedEvent.maxTicketPrice === 0
                              ? "0đ"
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
                            ? "0đ"
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
              </div>
            </SidebarCard>
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