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
  Copy,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useEvents } from '../../hooks/useEvents';
import { PATH } from '../../routes/path';

// Import the EventDetailGuestPage for preview
import EventDetailGuestPage from '../Event/EventDetailGuestPage';

// Import EventStatus constants
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { getEventById, deleteEvent: deleteEventAPI, loading: eventLoading } = useEvents();
  
  // Add state for image lightbox
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Add state for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        navigate(PATH.ORGANIZER_EVENTS || '/events');
      }
    } catch (error) {
      console.error('Error loading event detail:', error);
      toast.error('Không thể tải thông tin sự kiện');
      navigate(PATH.ORGANIZER_EVENTS || '/events');
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

  // Format ticket quantity as sold/total
  const formatTicketQuantity = (ticket) => {
    return `${ticket.soldQuantity || 0}/${ticket.ticketQuantity}`;
  };

  const handleEditEvent = () => {
    navigate(`/organizer/event/${eventId}/edit`);
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
          navigate(PATH.ORGANIZER_EVENTS || '/events');
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
          navigate(PATH.ORGANIZER_EVENTS || '/events');
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
    navigate(PATH.ORGANIZER_CREATE);
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
            <Button onClick={() => navigate(PATH.ORGANIZER_EVENTS || '/events')} className="mt-4">
              Quay lại trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate available tickets
  const totalAvailableTickets = event.totalTickets - (event.soldQuantity || 0);
  const status = getEventStatus(event);
  const statusConfig = getStatusBadge(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quay lại
          </Button>
          <h1 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{event.title}</h1>
          <Button 
            size="sm"
            onClick={handleShareEvent}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 text-sm"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Chia sẻ
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image with Carousel */}
            <div className="relative h-[400px] rounded-xl overflow-hidden group">
              {event.imgListEvent && event.imgListEvent.length > 0 ? (
                <>
                  <img 
                    src={event.imgListEvent[currentImageIndex]} 
                    alt={`${event.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                
                  {/* Category Badge */}
                  {event.eventCategoryName && (
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-0 shadow-lg px-3 py-1.5 text-sm font-medium">
                        <Tag className="w-3 h-3 mr-1" />
                        {event.eventCategoryName}
                      </Badge>
                    </div>
                  )}
                
                  {/* Carousel Controls */}
                  {event.imgListEvent.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    
                      {/* Image Indicators */}
                      <div className="absolute bottom-4 right-4 flex gap-1.5">
                        {event.imgListEvent.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              currentImageIndex === index 
                                ? "bg-white w-6" 
                                : "bg-white/50 hover:bg-white/75"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm font-medium">Không có hình ảnh</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                {event.title}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {event.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ngày diễn ra</p>
                    <p className="text-lg font-bold text-gray-900">{formatDate(event.startTime)}</p>
                    <p className="text-gray-600 text-sm mt-1">Bắt đầu lúc {formatTime(event.startTime)}</p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Thời lượng</p>
                    <p className="text-lg font-bold text-gray-900">{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                    {(() => {
                      const start = new Date(event.startTime);
                      const end = new Date(event.endTime);
                      const diffMs = end - start;
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return (
                        <p className="text-gray-600 text-sm mt-1">
                          {hours} giờ {minutes > 0 ? `${minutes} phút` : ''}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Địa điểm</p>
                    <p className="text-lg font-bold text-gray-900">
                      {event.isOnlineEvent ? 'Sự kiện trực tuyến' : (event.locationName || 'Chưa xác định')}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {event.isOnlineEvent ? 'Trực tuyến' : (event.address || 'Chưa xác định')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Người tham gia</p>
                    <p className="text-lg font-bold text-gray-900">{event.soldQuantity || 0} / {event.totalTickets || 'N/A'}</p>
                    <p className="text-gray-600 text-sm mt-1">Còn trống {totalAvailableTickets} chỗ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Information */}
            {event.ticketDetails && event.ticketDetails.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Loại vé có sẵn</h2>
                </div>

                <div className="space-y-5">
                  {event.ticketDetails.map((ticket, index) => {
                    const availableTickets = ticket.ticketQuantity - (ticket.soldQuantity || 0);
                    const isAvailable = availableTickets > 0;
                    const soldPercentage = ((ticket.soldQuantity || 0) / ticket.ticketQuantity) * 100;

                    return (
                      <div 
                        key={index}
                        className={`border rounded-xl p-5 transition-all hover:shadow-md ${
                          isAvailable 
                            ? 'border-gray-200 hover:border-blue-300' 
                            : 'border-gray-100 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-5">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-gray-900">{ticket.ticketName}</h3>
                              {!isAvailable && (
                                <Badge variant="destructive" className="text-xs font-semibold">
                                  Hết vé
                                </Badge>
                              )}
                            </div>
                            {ticket.ticketDescription && (
                              <p className="text-gray-600 text-sm mt-1">{ticket.ticketDescription}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {ticket.ticketPrice === 0 ? "Miễn phí" : formatTicketPrice(ticket)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Đã bán: {ticket.soldQuantity || 0} / {ticket.ticketQuantity}</span>
                            <span>{availableTickets} còn lại</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500 rounded-full"
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

            {/* About Event */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Về sự kiện</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {event.title} là một sự kiện đặc biệt. 
                  {event.description || 'Hãy tham gia để trải nghiệm những điều thú vị.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="text-lg font-bold text-gray-900">Hành động nhanh</h3>
              </div>
              
              <div className="p-5 space-y-3">
                <Button 
                  onClick={handleEditEvent}
                  variant="outline"
                  className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl py-5 justify-start shadow-sm hover:shadow-md transition-all text-sm"
                  size="lg"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa sự kiện
                </Button>

                <Button 
                  onClick={handleViewPublicPage}
                  variant="outline"
                  className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl py-5 justify-start shadow-sm hover:shadow-md transition-all text-sm"
                  size="lg"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Xem trang công khai
                </Button>

                <Button 
                  onClick={handleCloneEvent}
                  variant="outline"
                  className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl py-5 justify-start shadow-sm hover:shadow-md transition-all text-sm"
                  size="lg"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Sao chép sự kiện
                </Button>

                <div className="border-t border-gray-200 my-2"></div>

                <Button 
                  onClick={handleDeleteEvent}
                  variant="outline"
                  className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold rounded-xl py-5 justify-start shadow-sm hover:shadow-md transition-all text-sm"
                  size="lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa sự kiện
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="text-lg font-bold text-gray-900">Thống kê đăng ký</h3>
              </div>
              
              <div className="p-6 text-center space-y-5">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {event.soldQuantity || 0}
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Người đã đăng ký</p>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all rounded-full"
                    style={{ width: `${(event.soldQuantity || 0) / (event.totalTickets || 1) * 100}%` }}
                  ></div>
                </div>

                <Button 
                  variant="outline"
                  className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl py-5 shadow-sm hover:shadow-md transition-all text-sm"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Xem danh sách người tham gia
                </Button>

                <Button 
                  variant="outline"
                  className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl py-5 hover:border-blue-600 transition-all text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Gửi thông báo
                </Button>
              </div>
            </div>

            {/* Evidence Image Gallery - Moved to sidebar */}
            {event.imgListEvidences && event.imgListEvidences.length > 0 && event.imgListEvidences.some(img => 
              img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
            ) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                  <h3 className="text-lg font-bold text-gray-900">Hình ảnh bằng chứng tổ chức</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {event.imgListEvidences
                      .filter(img => 
                        img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
                      )
                      .map((img, index) => (
                        <div 
                          key={index} 
                          className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedImage(img);
                            setIsImageModalOpen(true);
                          }}
                        >
                          <img
                            src={img}
                            alt={`${event.title} - Evidence ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Organizer - Moved to sidebar */}
            {event.organizerEvent && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                  <h3 className="text-lg font-bold text-gray-900">Nhà tổ chức</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {event.organizerEvent.imgCompany ? (
                      <img 
                        src={event.organizerEvent.imgCompany} 
                        alt={event.organizerEvent.companyName || "Nhà tổ chức"} 
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{event.organizerEvent.companyName || "Nhà tổ chức"}</h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {event.organizerEvent.companyDescription || "Tổ chức sự kiện chuyên nghiệp"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="bg-gray-100 border-2 border-dashed rounded-xl h-80 flex items-center justify-center">
              <p>Bản đồ chỉ đường sẽ hiển thị ở đây</p>
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

export default EventDetailPage;