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
  Shield
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

// Import ConfirmStatus constants
import { ConfirmStatus, ConfirmStatusDisplay } from '../../constants/eventConstants';

const ManagerEventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { getEventById, deleteEvent: deleteEventAPI, loading: eventLoading } = useEvents();

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
              <Button variant="outline" size="sm" onClick={handleApproveEvent}>
                <Shield className="w-4 h-4 mr-2" />
                Phê duyệt
              </Button>
              <Button variant="outline" size="sm" onClick={handleRejectEvent}>
                <Shield className="w-4 h-4 mr-2" />
                Từ chối
              </Button>
              <Button variant="outline" size="sm" onClick={handleEditEvent}>
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
              <Button variant="outline" size="sm" onClick={handleViewPublicPage}>
                <Eye className="w-4 h-4 mr-2" />
                Xem công khai
              </Button>
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
                  {event.ticketType === 1 ? 'Miễn phí' : 'Có phí'}
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
                      event.requireApproval === ConfirmStatus.Approve ? 'bg-green-100 text-green-800 border-green-200' :
                      event.requireApproval === ConfirmStatus.Reject ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }
                  >
                    {ConfirmStatusDisplay[event.requireApproval] || event.requireApproval}
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

            {/* Event Image Gallery */}
            {event.imgListEvent && event.imgListEvent.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Hình ảnh sự kiện</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.imgListEvent.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${event.title} - ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Image Gallery */}
            {event.imgEventEvidences && event.imgEventEvidences.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Hình ảnh bằng chứng tổ chức</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.imgEventEvidences.map((img, index) => (
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Hành động nhanh</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={handleEditEvent}>
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa sự kiện
                </Button>
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
                    {event.ticketType === 1 ? 'Miễn phí' : 'Có phí'}
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
    </div>
  );
};

export default ManagerEventDetailPage;