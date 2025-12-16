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
  AlertTriangle,
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
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  Target,
  Loader2
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
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
import { RegistrationStats } from '../../components/Event/RegistrationStats';

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
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Add state for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Add loading states for approval/rejection actions
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isResolvingPayment, setIsResolvingPayment] = useState(false);
  
  // State for resolve payment confirmation dialog
  const [isResolvePaymentDialogOpen, setIsResolvePaymentDialogOpen] = useState(false);
  
  // Add state for ticket sale countdown
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [saleStarted, setSaleStarted] = useState(false);

  const { getEventById, deleteEvent: deleteEventAPI, confirmEvent: confirmEventAPI, cancelEventByManager, loading: eventLoading } = useEvents();
  
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
          toast.success('Xóa sự kiện thành công!', {
            duration: 3000,
          });
          navigate(PATH.MANAGER_EVENTS || '/manager/events');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        if (error.response?.status === 403) {
          toast.error(' Bạn không có quyền xóa sự kiện này');
        } else if (error.response?.status === 404) {
          toast.error(' Sự kiện không tồn tại hoặc đã bị xóa');
        } else if (error.response?.status === 400) {
          toast.error(' Không thể xóa sự kiện đã có người đăng ký');
        } else {
          toast.error(' Có lỗi xảy ra khi xóa sự kiện');
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
          toast.success('Xóa sự kiện thành công!', {
            duration: 3000,
          });
          navigate(PATH.MANAGER_EVENTS || '/manager/events');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        if (error.response?.status === 403) {
          toast.error(' Bạn không có quyền xóa sự kiện này');
        } else if (error.response?.status === 404) {
          toast.error(' Sự kiện không tồn tại hoặc đã bị xóa');
        } else if (error.response?.status === 400) {
          toast.error(' Không thể xóa sự kiện đã có người đăng ký');
        } else {
          toast.error(' Có lỗi xảy ra khi xóa sự kiện');
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
    // Prevent multiple clicks
    if (isApproving) return;
    
    setIsApproving(true);
    try {
      const response = await confirmEventAPI(eventId, {
        status: EventStatus.Approved
      });
      
      if (response) {
        // Reload the event details to reflect the new status
        loadEventDetail();
      }
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Có lỗi xảy ra khi phê duyệt sự kiện');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectEvent = async (reason) => {
    // Prevent multiple clicks
    if (isRejecting) return;
    
    if (!reason || !reason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    setIsRejecting(true);
    try {
      const response = await confirmEventAPI(eventId, {
        status: EventStatus.Rejected,
        reason: reason
      });
      
      if (response) {
        setRejectionReason('');
        // Reload the event details to reflect the new status
        loadEventDetail();
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Có lỗi xảy ra khi từ chối sự kiện');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCancelEventByManager = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await cancelEventByManager(eventId, cancelReason.trim());
      if (response !== null) {
        setIsCancelDialogOpen(false);
        setCancelReason('');
        await loadEventDetail();
      }
    } catch (error) {
      console.error('Error cancelling event by manager:', error);
    } finally {
      setIsCancelling(false);
      }
    };
  const handleResolveErrorPayment = async () => {
    // Prevent multiple clicks
    if (isResolvingPayment) return;

    setIsResolvingPayment(true);
    try {
      const eventAPI = (await import('../../api/eventAPI')).default;
      const response = await eventAPI.resolveErrorPayment(eventId);

      if (response) {
        toast.success('✅ Thanh toán lại thành công! Trạng thái sự kiện đã được cập nhật sang "Đã thanh toán".', {
          duration: 4000,
        });
        setIsResolvePaymentDialogOpen(false);
        // Reload the event details to reflect the new status
        loadEventDetail();
      }
    } catch (error) {
      console.error('Error resolving payment:', error);
      
      // Get error message from response
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.data?.statusCode;
      
      // Handle specific error cases
      if (errorMessage?.includes('Event not found')) {
        toast.error(' Không tìm thấy sự kiện hoặc sự kiện không ở trạng thái lỗi thanh toán');
      } else if (errorMessage?.includes('Payment information not found')) {
        toast.error(' Nhà tổ chức chưa thêm thông tin thanh toán. Vui lòng yêu cầu nhà tổ chức cập nhật thông tin ngân hàng.', {
          duration: 5000,
        });
      } else if (errorMessage?.includes('Organizer profile not found')) {
        toast.error(' Không tìm thấy thông tin nhà tổ chức');
      } else if (errorMessage?.includes('System setting not found')) {
        toast.error(' Lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên.');
      } else if (errorMessage?.includes('Payout amount is negative')) {
        toast.error(' Số tiền thanh toán không hợp lệ (âm). Vui lòng kiểm tra lại doanh thu sự kiện.');
      } else if (errorMessage?.includes('Payout transaction failed')) {
        toast.error(' Giao dịch thanh toán thất bại. Vui lòng thử lại sau hoặc kiểm tra thông tin ngân hàng.', {
          duration: 5000,
        });
      } else if (errorMessage?.includes('Failed to process payout')) {
        toast.error(' Lỗi xử lý thanh toán: ' + errorMessage, {
          duration: 5000,
        });
      } else if (error.response?.status === 403) {
        toast.error(' Bạn không có quyền thực hiện thao tác này');
      } else if (error.response?.status === 400) {
        toast.error(' ' + (errorMessage || 'Không thể thanh toán lại cho sự kiện này'));
      } else {
        toast.error(' Có lỗi xảy ra khi thanh toán lại: ' + (errorMessage || 'Vui lòng thử lại sau'));
      }
    } finally {
      setIsResolvingPayment(false);
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
            {/* Warning Banner for IsFlagWarning */}
            {event.isFlagWarning && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">Cảnh báo vi phạm</h3>
                    <p className="text-amber-800 leading-relaxed">
                      <strong>Lý do hủy sự kiện:</strong> {event.reasonCancel}
                    </p>
                  </div>
                </div>
              </div>
            )}

           

            {/* Rejection Reason Banner */}
            {event.status === EventStatus.Rejected && event.rejectReason && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">Sự kiện bị từ chối</h3>
                    <p className="text-red-800 leading-relaxed">
                      <strong>Lý do:</strong> {event.rejectReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {/* Ticket Options - Ticket-style Design */}
            {event.ticketDetails && event.ticketDetails.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  Loại vé có sẵn
                </h3>
                {event.ticketDetails.map((ticket, index) => {
                  const availableTickets = ticket.ticketQuantity - (ticket.soldQuantity || 0);
                  const isAvailable = availableTickets > 0;
                  const soldPercentage = ticket.soldQuantity ? (ticket.soldQuantity / ticket.ticketQuantity) * 100 : 0;
                  const isSoldOut = availableTickets <= 0;

                  return (
                    <div
                      key={index}
                      className={`relative group ${isSoldOut ? 'opacity-60' : ''}`}
                    >
                      {/* Ticket Container */}
                      <div className="flex bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
                        {/* Left Section - Price */}
                        <div className={`relative w-32 flex-shrink-0 flex flex-col items-center justify-center p-4 ${
                          isSoldOut 
                            ? 'bg-gray-400' 
                            : ticket.ticketPrice === 0 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {/* Decorative circles for ticket perforation effect */}
                          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full"></div>
                          
                          {/* Price Display */}
                          <div className="text-white text-center">
                            {ticket.ticketPrice === 0 ? (
                              <>
                                <span className="text-2xl font-bold">MIỄN</span>
                                <span className="block text-lg font-semibold">PHÍ</span>
                              </>
                            ) : (
                              <>
                                <span className="text-2xl font-bold">
                                  {new Intl.NumberFormat('vi-VN').format(ticket.ticketPrice / 1000)}K
                                </span>
                                <span className="block text-xs opacity-80">VNĐ</span>
                              </>
                            )}
                          </div>
                          
                          {/* Ticket Icon */}
                          <Ticket className="w-5 h-5 text-white/50 mt-2" />
                        </div>

                        {/* Dashed Separator */}
                        <div className="relative flex items-center">
                          <div className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-gray-200"></div>
                        </div>

                        {/* Right Section - Details */}
                        <div className="flex-1 p-4 pl-6">
                          {/* Ticket Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-foreground text-lg">{ticket.ticketName}</h4>
                                {isSoldOut && (
                                  <Badge className="bg-red-100 text-red-700 text-xs">Hết vé</Badge>
                                )}
                                {!isSoldOut && availableTickets <= 10 && (
                                  <Badge className="bg-orange-100 text-orange-700 text-xs animate-pulse">
                                    Sắp hết
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {ticket.ticketDescription || "Vé tham dự sự kiện"}
                              </p>
                            </div>
                          </div>

                          {/* Ticket Stats */}
                          <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  <span className="font-medium">{ticket.soldQuantity || 0}</span>
                                  <span className="text-xs">/ {ticket.ticketQuantity}</span>
                                </span>
                                <span className={`font-semibold ${
                                  isSoldOut ? 'text-red-500' : availableTickets <= 10 ? 'text-orange-500' : 'text-green-600'
                                }`}>
                                  {isSoldOut ? 'Đã bán hết' : `Còn ${availableTickets} vé`}
                                </span>
                              </div>
                              
                              {/* Progress indicator */}
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      soldPercentage >= 90 ? 'bg-red-500' : 
                                      soldPercentage >= 70 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {soldPercentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Barcode Effect */}
                          <div className="mt-3 flex items-center gap-0.5 opacity-30">
                            {[...Array(30)].map((_, i) => (
                              <div 
                                key={i} 
                                className="bg-gray-800 rounded-sm"
                                style={{ 
                                  width: Math.random() > 0.5 ? '2px' : '3px', 
                                  height: `${12 + Math.random() * 8}px` 
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Overlay */}
                      {!isSoldOut && (
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/30 transition-all duration-300 pointer-events-none"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* About Event */}
            <div className="bg-white rounded-xl p-8 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold text-foreground mb-6">Chi tiết sự kiện</h2>
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
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Nhà tổ chức</h2>
                <div className="group relative flex items-center">
                  {/* Avatar overlapping the card */}
                  <div className="relative z-20 flex-shrink-0">
                    <div className="relative">
                      {/* Animated ring on hover */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110" />
                      {/* White border ring */}
                      <div className="relative w-28 h-28 rounded-full bg-white p-1.5 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        {event.organizerEvent.imgCompany ? (
                          <img
                            src={event.organizerEvent.imgCompany}
                            alt={event.organizerEvent.companyName || "Organizer"}
                            className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-all duration-300">
                            <User className="h-12 w-12 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rectangle card - positioned behind avatar */}
                  <div className="relative z-10 -ml-14 flex-1 bg-white rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-500 border border-blue-100 group-hover:border-blue-300 overflow-hidden">
                    <div className="relative flex items-center justify-between pl-20 pr-6 py-6">
                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-xl group-hover:text-blue-700 transition-colors duration-300">
                          {event.organizerEvent.companyName || "Nhà tổ chức"}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-1 group-hover:text-gray-600 transition-colors duration-300">
                          {event.organizerEvent.companyDescription || "Nhà tổ chức sự kiện"}
                        </p>
                      </div>

                      {/* Action button */}
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-180">
                          <div className="space-y-1.5 group-hover:space-y-2 transition-all duration-300">
                            <div className="w-5 h-0.5 bg-blue-400 group-hover:bg-white rounded-full transition-colors duration-300" />
                            <div className="w-5 h-0.5 bg-blue-400 group-hover:bg-white rounded-full transition-colors duration-300" />
                            <div className="w-5 h-0.5 bg-blue-400 group-hover:bg-white rounded-full transition-colors duration-300" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
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
                  <div className="relative">
                    <ActionButton
                      icon={CheckCircle}
                      label={isApproving ? "Đang phê duyệt..." : "Phê duyệt sự kiện"}
                      onClick={handleApproveEvent}
                      variant="primary"
                      disabled={isApproving}
                    />
                    {isApproving && (
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative">
                        <ActionButton
                          icon={X}
                          label={isRejecting ? "Đang từ chối..." : "Từ chối sự kiện"}
                          variant="danger"
                          disabled={isRejecting}
                        />
                        {isRejecting && (
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
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
                            disabled={!rejectionReason.trim() || isRejecting}
                          >
                            {isRejecting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang từ chối...
                              </>
                            ) : (
                              "Xác nhận từ chối"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </SidebarCard>
            )}

            {/* Error Payment Resolution - Only for ErrorPayment status */}
            {event && event.status === EventStatus.ErrorPayment && (
              <SidebarCard title="Thanh toán lỗi" icon={<AlertTriangle className="w-5 h-5 text-orange-600" />} gradient>
                <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-orange-800">
                      Sự kiện này gặp lỗi trong quá trình thanh toán. Nhấn nút bên dưới để thử thanh toán lại.
                    </p>
                  </div>
                  <div className="relative">
                    <ActionButton
                      icon={CheckCircle}
                      label={isResolvingPayment ? "Đang xử lý..." : "Thanh toán lại"}
                      onClick={() => setIsResolvePaymentDialogOpen(true)}
                      variant="primary"
                      disabled={isResolvingPayment}
                    />
                    {isResolvingPayment && (
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </SidebarCard>
            )}

            {/* Quick Actions - Enhanced */}
            <SidebarCard title="Tác Vụ" icon={<Activity className="w-4 h-4" />} gradient>
              <div className="space-y-3">
                <ActionButton
                  icon={Eye}
                  label="Xem trang công khai"
                  onClick={handleViewPublicPage}
                  variant="secondary"
                />

                
                {(event.status === EventStatus.Approved || event.status === EventStatus.WaitingForPayout) && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>

                    <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="relative">
                          <ActionButton
                            icon={Flag}
                            label="Hủy sự kiện vi phạm"
                            variant="danger"
                            onClick={() => setIsCancelDialogOpen(true)}
                          />
                          {isCancelling && (
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Flag className="w-5 h-5" />
                            Hủy sự kiện vi phạm
                          </DialogTitle>
                          <DialogDescription>
                            Gửi thông báo đến organizer và gán cờ cho sự kiện vi phạm. Vui lòng cung cấp lý do hủy.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Event Info Card */}
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Trạng thái:</strong> {EventStatusDisplay[event.status] || event.status}</p>
                              {event.totalPersonJoin > 0 && (
                                <p><strong>Người tham gia:</strong> {event.totalPersonJoin} người</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Warning Message */}
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-800">
                                Hành động này sẽ hủy bỏ sự kiện và thông báo cho người tham gia. Organizer sẽ bị gán cờ vi phạm.
                              </p>
                            </div>
                          </div>

                          {/* Reason Input */}
                          <div>
                            <Label htmlFor="cancel-reason" className="text-sm font-semibold">
                              Lý do hủy <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="cancel-reason"
                              placeholder="Nhập lý do hủy sự kiện vi phạm..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              rows={4}
                              className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Lý do này sẽ được gửi đến organizer và lưu vào hệ thống
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setCancelReason('');
                                setIsCancelDialogOpen(false);
                              }}
                              disabled={isCancelling}
                            >
                              Hủy bỏ
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={handleCancelEventByManager}
                              disabled={isCancelling || !cancelReason.trim()}
                            >
                              {isCancelling ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Đang hủy...
                                </>
                              ) : (
                                <>
                                  <Flag className="w-4 h-4 mr-2" />
                                  Xác nhận hủy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

              </div>
            </SidebarCard>

            {/* Registration Statistics - Enhanced */}
            <SidebarCard title="Thống kê đăng ký" icon={<Users className="w-4 h-4" />} gradient>
              <RegistrationStats event={event} />
            </SidebarCard>

            {/* Location Card - Enhanced */}
            {(!event.isOnlineEvent || event.isOnlineEvent === false) &&
              (event.locationName || event.address || event.district) && (
                <SidebarCard title="Địa điểm" icon={<MapPin className="w-4 h-4" />}>
                  <div className="space-y-4">
                    {/* Location Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
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

      {/* Resolve Payment Confirmation Dialog */}
      <Dialog open={isResolvePaymentDialogOpen} onOpenChange={setIsResolvePaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Xác nhận thanh toán lại
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn thử thanh toán lại cho sự kiện này?
            </DialogDescription>
          </DialogHeader>
          
          {event && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Trạng thái:</strong> Lỗi thanh toán</p>
                  <p><strong>Số tiền thanh toán:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(event.payoutAmount || 0)}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ Hệ thống sẽ thử xử lý lại giao dịch thanh toán cho nhà tổ chức.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsResolvePaymentDialogOpen(false)}
                  disabled={isResolvingPayment}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={handleResolveErrorPayment}
                  disabled={isResolvingPayment}
                >
                  {isResolvingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Xác nhận
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerEventDetailPage;