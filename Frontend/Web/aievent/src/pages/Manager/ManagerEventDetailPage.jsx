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
  Sparkles
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

  const { getEventById, deleteEvent: deleteEventAPI, confirmEvent: confirmEventAPI, loading: eventLoading } = useEvents();
  
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
  const status = getEventStatus(event);
  const statusConfig = getStatusBadge(status);
  const StatusIcon = statusConfig.icon;

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
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShareEvent}
                className="border-2 hover:bg-gray-50 font-medium transition-all duration-300"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Chia sẻ
              </Button>
            </div>
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
              
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge className="bg-white/95 backdrop-blur-sm text-gray-800 border-0 shadow-lg px-4 py-2 font-semibold">
                  {event.ticketType === 1 || event.ticketType === "free" ? 'Miễn phí' : 'Có phí'}
                </Badge>
                {event.eventCategoryName && (
                  <Badge className="bg-blue-500/95 backdrop-blur-sm text-white border-0 shadow-lg px-4 py-2 font-medium">
                    <Tag className="w-3 h-3 mr-1" />
                    {event.eventCategoryName}
                  </Badge>
                )}
                {/* Display approval status */}
                {event.requireApproval && (
                  <Badge 
                    variant="outline" 
                    className={
                      event.requireApproval === EventStatus.Approved ? 'bg-green-100 text-green-800 border-green-200' :
                      event.requireApproval === EventStatus.Rejected ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }
                  >
                    {EventStatusDisplay[event.requireApproval] || event.requireApproval}
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
                      const availableTickets = ticket.ticketQuantity - (ticket.soldQuantity || 0);
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

            {/* Evidence Image Gallery */}
            {event.imgListEvidences && event.imgListEvidences.length > 0 && event.imgListEvidences.some(img => 
              img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
            ) && (
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Hình ảnh bằng chứng tổ chức</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.imgListEvidences
                    .filter(img => 
                      img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
                    ) // Filter out null/undefined/empty string/non-string/malformed images
                    .map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${event.title} - Evidence ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg shadow-md"
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Enhanced */}
          <div className="space-y-6">
            {/* Approval Actions */}
            {event && event.status === EventStatus.PendingApproval && (
              <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl transform hover:scale-[1.02] transition-all duration-300">
                <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  <Shield className="w-12 h-12 text-white/90 mx-auto mb-3" />
                  <h3 className="text-2xl font-black text-white text-center tracking-tight">Phê duyệt sự kiện</h3>
                </div>
                <CardContent className="space-y-3 p-6 bg-gradient-to-b from-white to-gray-50">
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl py-6 text-base" 
                    size="lg" 
                    onClick={handleApproveEvent}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Phê duyệt ngay
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full border-2 border-red-300 hover:bg-red-50 font-semibold transition-all duration-300 text-red-600 hover:text-red-700 hover:border-red-400 rounded-2xl py-6 text-base hover:shadow-lg"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Từ chối
                      </Button>
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
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl group hover:shadow-blue-200/50 transition-all duration-300">
              <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500"></div>
                <Sparkles className="w-10 h-10 text-white/90 mx-auto mb-2" />
                <h3 className="text-xl font-black text-white text-center tracking-tight">Hành động nhanh</h3>
              </div>
              <CardContent className="space-y-2.5 p-6 bg-white">
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-indigo-200 hover:bg-indigo-50 font-semibold transition-all duration-300 rounded-xl py-5 hover:border-indigo-400 hover:shadow-md group" 
                  onClick={handleViewPublicPage}
                >
                  <Eye className="h-5 w-5 mr-2 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 group-hover:text-indigo-700">Xem trang công khai</span>
                </Button>
                <Button variant="outline" className="w-full border-2 border-blue-200 hover:bg-blue-50 font-semibold transition-all duration-300 rounded-xl py-5 hover:border-blue-400 hover:shadow-md group">
                  <Download className="h-5 w-5 mr-2 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 group-hover:text-blue-700">Xuất báo cáo</span>
                </Button>
                <div className="my-4 border-t-2 border-dashed border-gray-200"></div>
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-red-200 hover:bg-red-50 font-semibold transition-all duration-300 rounded-xl py-5 hover:border-red-400 hover:shadow-md group" 
                  onClick={handleDeleteEvent}
                >
                  <Trash2 className="h-5 w-5 mr-2 text-red-600 group-hover:scale-110 transition-transform" />
                  <span className="text-red-600 group-hover:text-red-700">Xóa sự kiện</span>
                </Button>
              </CardContent>
            </Card>

            {/* Registration Card */}
            <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl transform hover:scale-[1.02] transition-all duration-300">
              <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-pulse delay-75"></div>
                <Users className="w-12 h-12 text-white/90 mx-auto mb-3" />
                <h3 className="text-xl font-black text-white text-center mb-4">Thông tin đăng ký</h3>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl py-6 px-4 border-2 border-white/30">
                  <div className="text-5xl font-black text-white mb-2 drop-shadow-lg">{event.soldQuantity || 0}</div>
                  <p className="text-sm font-bold text-white/90 uppercase tracking-wider">
                    Người đã đăng ký
                  </p>
                </div>
              </div>
              <CardContent className="space-y-3 p-6 bg-gradient-to-b from-white to-blue-50">
                <Button className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl py-6 text-base" size="lg">
                  <Users className="w-5 h-5 mr-2" />
                  Xem danh sách
                </Button>
                <Button variant="outline" className="w-full border-2 border-purple-200 hover:bg-purple-50 font-semibold transition-all duration-300 rounded-2xl py-6 text-base hover:border-purple-400 hover:shadow-lg group">
                  <MessageCircle className="w-5 h-5 mr-2 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 group-hover:text-purple-700">Gửi thông báo</span>
                </Button>
              </CardContent>
            </Card>

            {/* Location Card - Enhanced */}
            {(!event.isOnlineEvent || event.isOnlineEvent === false) && (event.locationName || event.address) && (
              <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl">
                <CardHeader className="pb-4 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-6">
                  <h3 className="text-xl font-black text-white flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-3 shadow-lg border-2 border-white/30">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    Địa điểm
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4 p-6 bg-white">
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-5 border-2 border-emerald-200">
                    <p className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
                      {event.locationName}
                    </p>
                    <p className="text-sm text-gray-600 pl-7">{event.address}</p>
                  </div>
                  
                  {/* Map Preview - Enhanced */}
                  {(event.latitude && event.longitude) ? (
                    <div className="relative h-52 rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-lg group">
                      <iframe
                        src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                        frameBorder="0"
                        allowFullScreen
                        title="Event Location Map Preview"
                      ></iframe>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                    </div>
                  ) : (
                    <div className="relative h-52 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <span className="text-sm text-gray-400 font-semibold">Bản đồ không khả dụng</span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-emerald-200 hover:bg-emerald-50 font-semibold transition-all duration-300 rounded-2xl py-5 hover:border-emerald-400 hover:shadow-lg group" 
                    onClick={() => setIsMapModalOpen(true)}
                  >
                    <ExternalLink className="w-5 h-5 mr-2 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-700 group-hover:text-emerald-700">Xem đường đi</span>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Event Stats */}
            <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl">
              <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <Activity className="w-10 h-10 text-white/90 mx-auto mb-2" />
                <h3 className="text-xl font-black text-white text-center tracking-tight">Thống kê sự kiện</h3>
              </div>
              <CardContent className="space-y-3 p-6 bg-white">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <span className="text-gray-700 font-semibold">Trạng thái</span>
                  <Badge className={`${statusConfig.color} px-3 py-1.5 font-bold`}>
                    <StatusIcon className="h-4 w-4 mr-1.5" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <span className="text-gray-700 font-semibold">Loại vé</span>
                  <span className="font-bold text-gray-900">
                    {event.ticketType === 1 || event.ticketType === "free" ? '🎟️ Miễn phí' : '💳 Có phí'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <span className="text-gray-700 font-semibold">Tổng vé</span>
                  <span className="font-bold text-gray-900 text-lg">{event.totalTickets}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <span className="text-gray-700 font-semibold">Hình thức</span>
                  <span className="font-bold text-gray-900">
                    {event.isOnlineEvent ? '🌐 Online' : '📍 Offline'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl">
              <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <Phone className="w-10 h-10 text-white/90 mx-auto mb-2" />
                <h3 className="text-xl font-black text-white text-center tracking-tight">Thông tin liên hệ</h3>
              </div>
              <CardContent className="space-y-3 p-6 bg-white">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-cyan-200 hover:border-cyan-400 transition-all duration-300 group cursor-pointer hover:shadow-md">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-cyan-700">support@aievent.com</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-200 hover:border-green-400 transition-all duration-300 group cursor-pointer hover:shadow-md">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-green-700">+84 123 456 789</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-gray-900">Xem trước trang công khai</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <EventDetailGuestPage previewData={event} />
          </div>
        </DialogContent>
      </Dialog>

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
            {/* You would integrate your MapDirection component here */}
            <div className="bg-gray-100 border-2 border-dashed rounded-xl h-96 flex items-center justify-center">
              <p>Bản đồ chỉ đường sẽ hiển thị ở đây</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-2xl">
          <div className="relative">
            <img 
              src={selectedImage} 
              alt="Enlarged evidence" 
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerEventDetailPage;