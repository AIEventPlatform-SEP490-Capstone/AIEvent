import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Download,
  Mail,
  Phone,
  Image as ImageIcon,
  Shield,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  Target
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { useEvents } from '../../hooks/useEvents';
import { PATH } from '../../routes/path';

// Import the EventDetailGuestPage for preview
import EventDetailGuestPage from '../Event/EventDetailGuestPage';

// Import EventStatus constants
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';

// Import EventTimeline component
import { EventTimeline } from '../../components/Event/EventTimeline';

// Import enhanced components
import { SidebarCard } from '../../components/Event/SidebarCard';
import { ActionButton } from '../../components/Event/ActionButton';
import { StatCard } from '../../components/Event/StatCard';

const ManagerEventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Add state for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Add state for ticket sale countdown
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [saleStarted, setSaleStarted] = useState(false);

  const { getEventById, deleteEvent: deleteEventAPI, confirmEvent: confirmEventAPI, loading: eventLoading } = useEvents();
  
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

  // Function to go to next image
  const nextImage = () => {
    if (event.imgListEvent && event.imgListEvent.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === event.imgListEvent.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // Function to go to previous image
  const prevImage = () => {
    if (event.imgListEvent && event.imgListEvent.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? event.imgListEvent.length - 1 : prevIndex - 1
      );
    }
  };

  // Reset image index when event changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [event?.eventId]);

  useEffect(() => {
    if (eventId) {
      loadEventDetail();
    }
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setIsLoading(true);
      const eventData = await getEventById(eventId);
      
      if (eventData) {
        setEvent(eventData);
      } else {
        toast.error('Không tìm thấy sự kiện');
        navigate(PATH.MANAGER_EVENTS || '/manager/events');
      }
    } catch (error) {
      console.error('Error loading event detail:', error);
      toast.error('Không thể tải thông tin sự kiện');
      navigate(PATH.MANAGER_EVENTS || '/manager/events');
    } finally {
      setIsLoading(false);
    }
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'ongoing';
    return 'completed';
  };

  const getStatusBadge = (status) => {
    const configs = {
      upcoming: { label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800', icon: Clock },
      ongoing: { label: 'Đang diễn ra', color: 'bg-green-100 text-green-800', icon: Activity },
      completed: { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
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
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format ticket price for individual tickets
  const formatTicketPrice = (ticket) => {
    if (ticket.ticketPrice === 0) {
      return 'Miễn phí';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(ticket.ticketPrice);
  };

  const handleEditEvent = () => {
    navigate(`/manager/event/${eventId}/edit`);
  };

  const handleDeleteEvent = async () => {
    // Check if event has bookings that require a reason
    const hasBookings = event?.soldQuantity > 0;
    
    if (hasBookings) {
      // For events with bookings, show prompt for reason
      const reason = prompt(`Bạn có chắc chắn muốn xóa sự kiện "${event.title}"?

⚠️ Sự kiện này đã có ${event.soldQuantity} người đăng ký.

Vui lòng nhập lý do hủy bỏ sự kiện:`);
      
      if (reason === null) {
        // User cancelled
        return;
      }
      
      if (!reason.trim()) {
        toast.error('Vui lòng nhập lý do hủy bỏ sự kiện');
        return;
      }

      try {
        const loadingToast = toast.loading('Đang xóa sự kiện...');
        
        const response = await deleteEventAPI(eventId, reason.trim());
        
        toast.dismiss(loadingToast);
        
        if (response !== null) {
          toast.success('✅ Xóa sự kiện thành công!', {
            duration: 3000,
          });
          navigate(PATH.MANAGER_EVENTS || '/manager/events');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        if (error.response?.status === 403) {
          toast.error('❌ Bạn không có quyền xóa sự kiện này');
        } else if (error.response?.status === 404) {
          toast.error('❌ Sự kiện không tồn tại hoặc đã bị xóa');
        } else if (error.response?.status === 400) {
          toast.error('❌ Không thể xóa sự kiện đã có người đăng ký');
        } else {
          toast.error('❌ Có lỗi xảy ra khi xóa sự kiện');
        }
      }
    } else {
      // For events without bookings, use the existing confirmation
      const confirmMessage = `Bạn có chắc chắn muốn xóa sự kiện "${event.title}"?

Hành động này không thể hoàn tác và sẽ xóa:
• Toàn bộ thông tin sự kiện
• Danh sách đăng ký
• Lịch sử giao dịch liên quan

Nhấn OK để xác nhận xóa.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      try {
        const loadingToast = toast.loading('Đang xóa sự kiện...');
        
        const response = await deleteEventAPI(eventId);
        
        toast.dismiss(loadingToast);
        
        if (response !== null) {
          toast.success('✅ Xóa sự kiện thành công!', {
            duration: 3000,
          });
          navigate(PATH.MANAGER_EVENTS || '/manager/events');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        if (error.response?.status === 403) {
          toast.error('❌ Bạn không có quyền xóa sự kiện này');
        } else if (error.response?.status === 404) {
          toast.error('❌ Sự kiện không tồn tại hoặc đã bị xóa');
        } else if (error.response?.status === 400) {
          toast.error('❌ Không thể xóa sự kiện đã có người đăng ký');
        } else {
          toast.error('❌ Có lỗi xảy ra khi xóa sự kiện');
        }
      }
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
      toast.success('Đã sao chép link sự kiện!');
    }
  };

  const handleViewPublicPage = () => {
    setIsPreviewOpen(true);
  };

  const handleCloneEvent = () => {
    // Create clone data
    const cloneData = {
      ...event,
      // Reset fields that shouldn't be copied
      eventId: undefined,
      createDate: undefined,
      updateDate: undefined,
      status: undefined,
      publish: false, // Start as draft
      viewCount: 0,
      soldQuantity: 0,
      revenue: 0,
      refundCount: 0,
      rating: 0,
      totalPersonJoin: 0
    };
    
    // Store in localStorage
    localStorage.setItem('cloneEventData', JSON.stringify(cloneData));
    
    // Navigate to create event page
    navigate(PATH.MANAGER_CREATE || '/manager/events/create');
  };

  const handleApproveEvent = async () => {
    try {
      const response = await confirmEventAPI(eventId, {
        status: EventStatus.Approved
      });
      
      if (response) {
        toast.success('Sự kiện đã được phê duyệt thành công!');
        // Reload the event details to reflect the new status
        loadEventDetail();
      }
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Có lỗi xảy ra khi phê duyệt sự kiện');
    }
  };

  const handleRejectEvent = async (reason) => {
    if (!reason || !reason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    try {
      const response = await confirmEventAPI(eventId, {
        status: EventStatus.Rejected,
        reason: reason
      });
      
      if (response) {
        toast.success('Sự kiện đã bị từ chối!');
        setRejectionReason('');
        // Reload the event details to reflect the new status
        loadEventDetail();
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Có lỗi xảy ra khi từ chối sự kiện');
    }
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
            <Button onClick={() => navigate(PATH.MANAGER_EVENTS || '/manager/events')} className="mt-4">
              Quay lại trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate available tickets
  const totalAvailableTickets = event.totalTickets - (event.soldQuantity || 0);
  const occupancyPercent = event.soldQuantity ? (event.soldQuantity / event.totalTickets) * 100 : 0;
  const status = getEventStatus(event);
  const statusConfig = getStatusBadge(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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
              onClick={handleShareEvent}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-96 w-full overflow-hidden bg-gray-100">
        {event.imgListEvent && event.imgListEvent.length > 0 ? (
          <>
            <img 
              src={event.imgListEvent[currentImageIndex]} 
              alt={event.title} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              {/* Display price badge first */}
              <Badge className="bg-primary text-primary-foreground border-0 shadow-lg px-3 py-1.5 font-semibold">
                {event.minTicketPrice !== undefined && event.maxTicketPrice !== undefined
                  ? event.minTicketPrice === 0 && event.maxTicketPrice === 0
                    ? "Miễn phí"
                    : event.minTicketPrice === event.maxTicketPrice
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(event.minTicketPrice)
                    : `${new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(event.minTicketPrice)} - ${new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(event.maxTicketPrice)}`
                  : event.ticketType === 1 || event.ticketType === "free"
                  ? "Miễn phí"
                  : "Có phí"}
              </Badge>
              {/* Display category badge */}
              <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg px-3 py-1.5 font-semibold">
                <Tag className="w-3 h-3 mr-1" />
                {event.eventCategory?.eventCategoryName || event.eventCategoryName || "Chưa phân loại"}
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
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentImageIndex === index ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"
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
                    ? `${new Date(event.saleStartTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${new Date(event.saleStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`
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
                    <div className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Đang diễn ra
                    </div>
                  )
                },
                {
                  label: "Đóng bán vé",
                  time: event.saleEndTime
                    ? `${new Date(event.saleEndTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(event.saleEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                    : "Chưa xác định",
                  icon: <Clock className="w-5 h-5" />,
                  color: "bg-red-500"
                },
                {
                  label: "Sự kiện bắt đầu",
                  time: `${new Date(event.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                  icon: <Calendar className="w-5 h-5" />,
                  color: "bg-green-500"
                },
                {
                  label: "Sự kiện kết thúc",
                  time: `${new Date(event.endTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(event.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
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

                if (event.saleStartTime && now < new Date(event.saleStartTime)) return -1;
                if (event.saleEndTime && now < new Date(event.saleEndTime)) return 0;
                if (now < new Date(event.startTime)) return 1;
                if (now < new Date(event.endTime)) return 2;
                return 3;
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
                            {ticket.ticketPrice === 0 ? "Miễn phí" : formatTicketPrice(ticket)}
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
              <p className="text-muted-foreground leading-relaxed mb-6">
                {event.detailedDescription || event.description || "Thông tin chi tiết về sự kiện chưa được cập nhật."}
              </p>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Bạn sẽ nhận được:
                </h3>
                <ul className="space-y-2">
                  {[
                    "Kiến thức và trải nghiệm quý báu",
                    "Cơ hội kết nối với những người cùng chí hướng",
                    "Tài liệu sự kiện (nếu có)",
                    "Networking và chia sẻ kinh nghiệm",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Organizer */}
            {event.organizerEvent && (
              <div className="bg-white rounded-xl p-8 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300">
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
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Approval Actions - Only difference from EventDetailPage.jsx */}
            {event && event.status === EventStatus.PendingApproval && (
              <SidebarCard title="Phê duyệt sự kiện" icon={<Shield className="w-5 h-5 text-amber-600" />} gradient>
                <div className="space-y-3">
                  <ActionButton
                    icon={CheckCircle}
                    label="Phê duyệt sự kiện"
                    onClick={handleApproveEvent}
                    variant="primary"
                  />
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <ActionButton
                        icon={X}
                        label="Từ chối sự kiện"
                        variant="danger"
                      />
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Từ chối sự kiện: {event.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reason">Lý do từ chối</Label>
                          <Textarea
                            id="reason"
                            placeholder="Nhập lý do từ chối sự kiện..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => setRejectionReason('')}
                          >
                            Hủy
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleRejectEvent(rejectionReason)}
                            disabled={!rejectionReason.trim()}
                          >
                            Xác nhận từ chối
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </SidebarCard>
            )}

            {/* Quick Actions - Enhanced */}
            <SidebarCard title="Hành động nhanh" gradient>
              <div className="space-y-3">
                <ActionButton
                  icon={Edit}
                  label="Chỉnh sửa sự kiện"
                  onClick={handleEditEvent}
                  variant="secondary"
                />
                
                <ActionButton
                  icon={Eye}
                  label="Xem trang công khai"
                  onClick={handleViewPublicPage}
                  variant="secondary"
                />
                
                <ActionButton
                  icon={Copy}
                  label="Sao chép sự kiện"
                  onClick={handleCloneEvent}
                  variant="secondary"
                />
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <ActionButton
                  icon={Trash2}
                  label="Xóa sự kiện"
                  onClick={handleDeleteEvent}
                  variant="danger"
                />
              </div>
            </SidebarCard>

            {/* Registration Statistics - Enhanced */}
            <SidebarCard title="Thống kê đăng ký" gradient>
              <div className="space-y-4">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatCard
                    icon={Users}
                    label="Đã đăng ký"
                    value={event.soldQuantity || 0}
                    color="blue"
                  />
                  <StatCard
                    icon={Target}
                    label="Còn lại"
                    value={totalAvailableTickets}
                    color="green"
                  />
                  <StatCard
                    icon={Heart}
                    label="Yêu thích"
                    value={event.favoriteCount || 0}
                    color="red"
                  />
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Tiến độ</span>
                    <span className="font-bold text-primary">{occupancyPercent.toFixed(0)}%</span>
                  </div>
                  <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {event.soldQuantity || 0} / {event.totalTickets} vé
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Button 
                    variant="outline"
                    className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold rounded-xl py-5 transition-all group"
                  >
                    <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Xem danh sách tham gia</span>
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold rounded-xl py-5 transition-all group"
                  >
                    <MessageCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Gửi thông báo</span>
                  </Button>
                </div>
              </div>
            </SidebarCard>

            {/* Location Card - Enhanced */}
            {(!event.isOnlineEvent || event.isOnlineEvent === false) &&
              (event.locationName || event.address || event.district) && (
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
                            {event.district && `, ${event.district}`}
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

            {/* Evidence Image Gallery - Enhanced */}
            {event.imgListEvidences && event.imgListEvidences.length > 0 && event.imgListEvidences.some(img => 
              img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
            ) && (
              <SidebarCard title="Hình ảnh bằng chứng" icon={<Calendar className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-3">
                  {event.imgListEvidences
                    .filter(img => 
                      img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
                    )
                    .map((img, index) => (
                      <div 
                        key={index} 
                        className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer aspect-square"
                        onClick={() => {
                          setSelectedImage(img);
                          setIsImageModalOpen(true);
                        }}
                      >
                        <img
                          src={img}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                            <p className="text-xs font-semibold text-gray-800">Xem ảnh</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </SidebarCard>
            )}

            {/* Organizer - Enhanced */}
            {event.organizerEvent && (
              <SidebarCard title="Nhà tổ chức" icon={<User className="w-4 h-4" />}>
                <div className="space-y-4">
                  {/* Organizer Header */}
                  <div className="flex items-start gap-3">
                    {event.organizerEvent.imgCompany ? (
                      <div className="relative">
                        <img 
                          src={event.organizerEvent.imgCompany} 
                          alt={event.organizerEvent.companyName || "Nhà tổ chức"} 
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2 border-white shadow-md ring-2 ring-primary/10"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-sm" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md flex-shrink-0">
                        <User className="h-7 w-7 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm mb-1 truncate">
                        {event.organizerEvent.companyName || "Nhà tổ chức"}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {event.organizerEvent.companyDescription || "Tổ chức sự kiện chuyên nghiệp"}
                      </p>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {event.organizerEvent.totalEvents || "15+"}
                      </div>
                      <div className="text-xs font-medium text-blue-700 mt-0.5">Sự kiện</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {event.organizerEvent.rating || "4.8"}
                        <span className="text-sm">★</span>
                      </div>
                      <div className="text-xs font-medium text-purple-700 mt-0.5">Đánh giá</div>
                    </div>
                  </div>

                  {/* Contact Button */}
                  <Button 
                    variant="outline"
                    className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold rounded-xl py-5 transition-all group"
                  >
                    <MessageCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Liên hệ nhà tổ chức
                  </Button>
                </div>
              </SidebarCard>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0 rounded-xl">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-xl font-bold text-gray-900">Xem trước trang công khai</DialogTitle>
          </DialogHeader>
          <div className="p-5">
            <EventDetailGuestPage previewData={event} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Bản đồ & Chỉ đường
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <div className="w-full h-96 rounded-xl overflow-hidden">
              {event.latitude && event.longitude ? (
                <iframe
                  src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="Event Location Map"
                ></iframe>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Không có thông tin bản đồ cho sự kiện này</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Địa điểm sự kiện</h4>
              <p className="text-gray-700">{event.locationName || "Chưa cập nhật tên địa điểm"}</p>
              <p className="text-gray-600 text-sm mt-1">{event.address || "Chưa cập nhật địa chỉ"}{event.district ? `, ${event.district}` : ''}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-xl">
          <div className="relative">
            <img 
              src={selectedImage} 
              alt="Enlarged evidence" 
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerEventDetailPage;