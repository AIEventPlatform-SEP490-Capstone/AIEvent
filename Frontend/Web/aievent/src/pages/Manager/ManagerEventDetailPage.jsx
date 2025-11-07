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
  X
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

// Import EndEventStatus constants and hook
import { EndEventStatus, EndEventStatusDisplay } from '../../constants/eventConstants';
import { useEndEventRequests } from '../../hooks/useEndEventRequests';

const ManagerEventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { getEventById, deleteEvent: deleteEventAPI, loading: eventLoading } = useEvents();
  
  // Add state for end event requests
  const [endEventRequests, setEndEventRequests] = useState([]);
  const [endEventRequestsLoading, setEndEventRequestsLoading] = useState(false);
  const [selectedEndEventRequest, setSelectedEndEventRequest] = useState(null);
  const [isEndEventDetailOpen, setIsEndEventDetailOpen] = useState(false);
  const { getEndEventRequests, getEndEventRequestById, confirmEndEvent } = useEndEventRequests();
  
  // Add state for image lightbox
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

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
        // Load end event requests for this event
        await loadEndEventRequests(eventData.eventId);
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
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
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

  const handleApproveEvent = () => {
    // Implementation for approving event
    toast.success('Sự kiện đã được phê duyệt!');
  };

  const handleRejectEvent = () => {
    const reason = prompt('Vui lòng nhập lý do từ chối sự kiện:');
    if (reason) {
      toast.success('Sự kiện đã bị từ chối!');
    }
  };

  // Add function to load end event requests
  const loadEndEventRequests = async (eventId) => {
    try {
      setEndEventRequestsLoading(true);
      const params = {
        eventId: eventId,
        pageNumber: 1,
        pageSize: 5 // Limit to 5 most recent requests
      };
      
      const response = await getEndEventRequests(params);
      if (response?.items) {
        setEndEventRequests(response.items);
      } else if (Array.isArray(response)) {
        setEndEventRequests(response);
      } else {
        setEndEventRequests([]);
      }
    } catch (error) {
      console.error('Error loading end event requests:', error);
      setEndEventRequests([]);
    } finally {
      setEndEventRequestsLoading(false);
    }
  };

  const getEndEventStatusBadgeClass = (status) => {
    switch (status) {
      case EndEventStatus.PendingApprovalEnd:
        return 'bg-yellow-100 text-yellow-800';
      case EndEventStatus.Approved:
        return 'bg-green-100 text-green-800';
      case EndEventStatus.Rejected:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Đang tải thông tin sự kiện...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy sự kiện</h3>
            <p className="text-gray-500 mb-6">Sự kiện có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
            <Button onClick={() => navigate(PATH.MANAGER_EVENTS || '/manager/events')}>
              Quay lại danh sách sự kiện
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
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleShareEvent}>
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
            {/* Event Image */}
            <div className="relative rounded-lg overflow-hidden">
              {event.imgListEvent && event.imgListEvent.length > 0 ? (
                <img
                  src={event.imgListEvent[0]}
                  alt={event.title}
                  className="w-full h-64 md:h-80 object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-80 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Không có hình ảnh</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                  {event.ticketType === 1 || event.ticketType === "free" ? 'Miễn phí' : 'Có phí'}
                </Badge>
                {event.eventCategoryName && (
                  <Badge variant="outline" className="bg-background/80 backdrop-blur">
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

            {/* Event Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-balance mb-2">{event.title}</h1>
                  <p className="text-muted-foreground text-pretty">{event.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {formatDate(event.startTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatTime(event.startTime)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {event.isOnlineEvent ? 'Sự kiện trực tuyến' : (event.locationName || 'Chưa xác định')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.isOnlineEvent ? 'Trực tuyến' : (event.address || 'Chưa xác định')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{event.soldQuantity || 0} người tham gia</p>
                    <p className="text-sm text-muted-foreground">
                      Còn {totalAvailableTickets} chỗ
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">Thời lượng: {Math.floor((new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60 * 60))} giờ</p>
                  </div>
                </div>
              </div>

              {/* Ticket Information Section */}
              {event.ticketDetails && event.ticketDetails.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Ticket className="w-5 h-5 mr-2 text-primary" />
                    Loại vé có sẵn
                  </h3>
                  <div className="grid gap-3">
                    {event.ticketDetails.map((ticket, index) => {
                      const availableTickets = ticket.ticketQuantity - (ticket.soldQuantity || 0);
                      const isAvailable = availableTickets > 0;

                      return (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${
                            isAvailable ? "border-border" : "border-border bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{ticket.ticketName}</h4>
                                {!isAvailable && (
                                  <Badge variant="destructive" className="text-xs">
                                    Hết vé
                                  </Badge>
                                )}
                              </div>
                              {ticket.ticketDescription && (
                                <p className="text-sm text-muted-foreground mb-2">{ticket.ticketDescription}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  Đã bán: {ticket.soldQuantity || 0}/{ticket.ticketQuantity}
                                </span>
                                <span>Còn lại: {availableTickets} vé</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                {ticket.ticketPrice === 0 ? "Miễn phí" : formatTicketPrice(ticket)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-4">Về sự kiện</h2>
              <div className="prose prose-gray max-w-none text-pretty space-y-4">
                <p>
                  {event.title} là một sự kiện đặc biệt. 
                  {event.description || 'Hãy tham gia để trải nghiệm những điều thú vị.'}
                </p>

                <div className="bg-muted/50 rounded-lg p-4 my-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-primary" />
                    Chương trình chi tiết
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium min-w-fit">
                        {formatTime(event.startTime)}
                      </div>
                      <div>
                        <p className="font-medium">Bắt đầu sự kiện</p>
                        <p className="text-sm text-muted-foreground">Khởi đầu chương trình</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium min-w-fit">
                        {new Date(new Date(event.startTime).getTime() + 60 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <p className="font-medium">Phiên chính</p>
                        <p className="text-sm text-muted-foreground">Nội dung chính của sự kiện</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium min-w-fit">
                        {new Date(new Date(event.endTime).getTime() - 30 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <p className="font-medium">Kết thúc</p>
                        <p className="text-sm text-muted-foreground">Tổng kết và networking</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Bạn sẽ nhận được:</h4>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Kiến thức và trải nghiệm quý báu</li>
                    <li>• Cơ hội kết nối với những người cùng chí hướng</li>
                    <li>• Tài liệu sự kiện (nếu có)</li>
                    <li>• Networking và chia sẻ kinh nghiệm</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Organizer */}
            {event.organizerEvent && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Nhà tổ chức</h2>
                <div className="flex items-center space-x-4">
                  {event.organizerEvent.imgCompany ? (
                    <img 
                      src={event.organizerEvent.imgCompany} 
                      alt={event.organizerEvent.companyName || "Organizer"} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{event.organizerEvent.companyName || "Nhà tổ chức"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.organizerEvent.companyDescription || "Tổ chức sự kiện chuyên nghiệp"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Theo dõi
                  </Button>
                </div>
              </div>
            )}
            {/* Evidence Image Gallery */}
            {event.imgListEvidences && event.imgListEvidences.length > 0 && event.imgListEvidences.some(img => 
              img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
            ) && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Hình ảnh bằng chứng tổ chức</h2>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Approval Actions */}
            {event && event.status === EventStatus.PendingApproval && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Phê duyệt sự kiện</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={handleApproveEvent}>
                    <Shield className="h-4 w-4 mr-2" />
                    Phê duyệt sự kiện
                  </Button>
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700" onClick={handleRejectEvent}>
                    <Shield className="h-4 w-4 mr-2" />
                    Từ chối sự kiện
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Hành động nhanh</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" onClick={handleViewPublicPage}>
                  <Eye className="h-4 w-4 mr-2" />
                  Xem trang công khai
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất báo cáo
                </Button>
                <Separator />
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700" onClick={handleDeleteEvent}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa sự kiện
                </Button>
              </CardContent>
            </Card>

            {/* Registration Card */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Thông tin đăng ký</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{event.soldQuantity || 0}</div>
                  <p className="text-sm text-muted-foreground">
                    Người đã đăng ký
                  </p>
                </div>

                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    <Users className="w-4 h-4 mr-2" />
                    Xem danh sách đăng ký
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Gửi thông báo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Location Card */}
            {(!event.isOnlineEvent || event.isOnlineEvent === false) && (event.locationName || event.address) && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Địa điểm</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{event.locationName}</p>
                      <p className="text-sm text-muted-foreground">{event.address}</p>
                    </div>
                    
                    {/* Mini Map Preview */}
                    {(event.latitude && event.longitude) ? (
                      <div className="relative h-48 rounded-lg overflow-hidden border border-gray-200">
                        <iframe
                          src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                          className="w-full h-full"
                          frameBorder="0"
                          allowFullScreen
                          title="Event Location Map Preview"
                        ></iframe>
                      </div>
                    ) : (
                      <div className="relative h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-gray-400" />
                        <span className="absolute bottom-2 text-xs text-gray-500">Bản đồ không khả dụng</span>
                      </div>
                    )}
                    
                    <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsMapModalOpen(true)}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Xem đường đi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Thống kê sự kiện</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trạng thái</span>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Loại vé</span>
                  <span className="font-medium">
                    {event.ticketType === 1 || event.ticketType === "free" ? 'Miễn phí' : 'Có phí'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tổng vé</span>
                  <span className="font-medium">{event.totalTickets}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Hình thức</span>
                  <span className="font-medium">
                    {event.isOnlineEvent ? 'Online' : 'Offline'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Thông tin liên hệ</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">support@aievent.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">+84 123 456 789</span>
                </div>
              </CardContent>
            </Card>

            {/* End Event Requests */}
            <Card id="end-event-requests-section">
              <CardHeader>
                <h3 className="text-lg font-semibold">Yêu cầu kết thúc sự kiện</h3>
              </CardHeader>
              <CardContent>
                {endEventRequestsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : endEventRequests.length === 0 ? (
                  <p className="text-gray-500 text-sm py-2">Chưa có yêu cầu kết thúc sự kiện.</p>
                ) : (
                  <div className="space-y-3">
                    {endEventRequests.slice(0, 3).map((request) => (
                      <div 
                        key={request.endEventRequestId} 
                        className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        onClick={async () => {
                          // Load full details when clicking on the request
                          const detailedRequest = await getEndEventRequestById(request.endEventRequestId);
                          if (detailedRequest) {
                            setSelectedEndEventRequest(detailedRequest);
                            setIsEndEventDetailOpen(true);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEndEventStatusBadgeClass(request.status)}`}>
                            {EndEventStatusDisplay[request.status]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {request.summary && (
                          <p className="text-sm text-gray-600 mt-1 truncate">{request.summary}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {request.totalAmount?.toLocaleString('vi-VN')} VNĐ
                          </span>
                          {request.status === EndEventStatus.Approved && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                    {endEventRequests.length > 3 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => {
                          // Thay vì chuyển hướng đến trang riêng, chúng ta có thể mở dialog chi tiết ngay trong trang này
                          // Hoặc có thể làm nổi bật section yêu cầu kết thúc sự kiện trong trang
                          const endEventSection = document.getElementById('end-event-requests-section');
                          if (endEventSection) {
                            endEventSection.scrollIntoView({ behavior: 'smooth' });
                            // Có thể thêm hiệu ứng highlight
                            endEventSection.classList.add('bg-yellow-50', 'border', 'border-yellow-200', 'rounded-lg');
                            setTimeout(() => {
                              endEventSection.classList.remove('bg-yellow-50', 'border', 'border-yellow-200', 'rounded-lg');
                            }, 2000);
                          }
                        }}
                      >
                        Xem tất cả ({endEventRequests.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">Xem trước trang công khai</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <EventDetailGuestPage previewData={event} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bản đồ & Chỉ đường</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* You would integrate your MapDirection component here */}
            <div className="bg-gray-100 border-2 border-dashed rounded-xl h-96 flex items-center justify-center">
              <p>Bản đồ chỉ đường sẽ hiển thị ở đây</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Event Request Detail Dialog */}
      <Dialog open={isEndEventDetailOpen} onOpenChange={(open) => {
        setIsEndEventDetailOpen(open);
        // Clear selected request when dialog is closed
        if (!open) {
          setSelectedEndEventRequest(null);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu kết thúc sự kiện</DialogTitle>
          </DialogHeader>
          {selectedEndEventRequest && (
            <div className="py-4 space-y-6">
              {/* Status and Basic Info - Horizontal Rectangles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trạng thái</p>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEndEventStatusBadgeClass(selectedEndEventRequest.status)}`}>
                      {EndEventStatusDisplay[selectedEndEventRequest.status]}
                    </span>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ngày tạo</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedEndEventRequest.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(selectedEndEventRequest.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                {selectedEndEventRequest.reviewedAt && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ngày duyệt</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedEndEventRequest.reviewedAt).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedEndEventRequest.reviewedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tên sự kiện</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 truncate" title={selectedEndEventRequest.eventTitle}>
                      {selectedEndEventRequest.eventTitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Time and Summary - Horizontal Rectangles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Thời gian sự kiện</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedEndEventRequest.startTime).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">đến</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedEndEventRequest.endTime).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                
                {selectedEndEventRequest.summary && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow md:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tóm tắt</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-900">{selectedEndEventRequest.summary}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Information - Horizontal Rectangles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Tổng tiền</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-bold text-blue-800">
                      {selectedEndEventRequest.totalAmount?.toLocaleString('vi-VN')} <span className="text-sm">VNĐ</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Phí nền tảng</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-bold text-orange-800">
                      {selectedEndEventRequest.platformFee?.toLocaleString('vi-VN')} <span className="text-sm">VNĐ</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Số tiền nhận</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-bold text-green-800">
                      {selectedEndEventRequest.payoutAmount?.toLocaleString('vi-VN')} <span className="text-sm">VNĐ</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Organizer Information - Horizontal Rectangle */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Thông tin tổ chức</p>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border-l-4 border-blue-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">Tên tổ chức</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedEndEventRequest.organizerName}</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">Email liên hệ</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedEndEventRequest.contactEmail}</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedEndEventRequest.contactPhone}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information - Horizontal Rectangle */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Thông tin thanh toán</p>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border-l-4 border-indigo-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">Tên ngân hàng</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedEndEventRequest.bankName}</p>
                  </div>
                  <div className="border-l-4 border-teal-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">Chủ tài khoản</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedEndEventRequest.accountHolderName}</p>
                  </div>
                  <div className="border-l-4 border-amber-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">Số tài khoản</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedEndEventRequest.accountNumber}</p>
                  </div>
                </div>
              </div>

              {/* Admin Note - Horizontal Rectangle */}
              {selectedEndEventRequest.adminNote && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ghi chú từ quản trị viên</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEndEventRequest.adminNote}</p>
                  </div>
                </div>
              )}

              {/* Evidence Images - Horizontal Rectangle */}
              {selectedEndEventRequest.evidenceImages && selectedEndEventRequest.evidenceImages.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hình ảnh bằng chứng</p>
                  </div>
                  <div className="mt-3">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {selectedEndEventRequest.evidenceImages.map((image, index) => (
                        <div key={index} className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                          <img
                            src={image}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedImage(image);
                              setIsImageModalOpen(true);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Actions for pending requests */}
              {selectedEndEventRequest.status === EndEventStatus.PendingApprovalEnd && (
                <div className="border-t border-gray-200 pt-6 mt-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Hành động phê duyệt</p>
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      className="px-4 py-2 text-sm font-medium rounded-lg"
                      onClick={async () => {
                        const reason = prompt('Vui lòng nhập lý do từ chối:');
                        if (reason !== null) {
                          try {
                            await confirmEndEvent({
                              endEventRequestId: selectedEndEventRequest.endEventRequestId,
                              status: 'Rejected',
                              adminNote: reason
                            });
                            // Refresh the end event requests list
                            await loadEndEventRequests(event.eventId);
                            // Close the dialog
                            setIsEndEventDetailOpen(false);
                            setSelectedEndEventRequest(null);
                            toast.success('Đã từ chối yêu cầu kết thúc sự kiện');
                          } catch (error) {
                            toast.error('Có lỗi xảy ra khi từ chối yêu cầu');
                          }
                        }
                      }}
                    >
                      Từ chối
                    </Button>
                    <Button
                      variant="default"
                      className="px-4 py-2 text-sm font-medium rounded-lg"
                      onClick={async () => {
                        try {
                          await confirmEndEvent({
                            endEventRequestId: selectedEndEventRequest.endEventRequestId,
                            status: 'Approved',
                            adminNote: 'Đã phê duyệt'
                          });
                          // Refresh the end event requests list
                          await loadEndEventRequests(event.eventId);
                          // Close the dialog
                          setIsEndEventDetailOpen(false);
                          setSelectedEndEventRequest(null);
                          toast.success('Đã phê duyệt yêu cầu kết thúc sự kiện');
                        } catch (error) {
                          toast.error('Có lỗi xảy ra khi phê duyệt yêu cầu');
                        }
                      }}
                    >
                      Phê duyệt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
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