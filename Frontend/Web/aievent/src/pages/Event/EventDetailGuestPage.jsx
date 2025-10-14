import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Share2,
  Bookmark,
  LogIn,
  Ticket,
  Globe,
  Tag,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Activity,
  Star
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useEvents } from '../../hooks/useEvents';
import { PATH } from '../../routes/path';

const EventDetailGuestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { getEventById, getRelatedEvents, loading: eventLoading } = useEvents();

  useEffect(() => {
    if (id) {
      loadEventDetail();
      loadRelatedEvents();
    }
  }, [id]);

  const loadEventDetail = async () => {
    try {
      setIsLoading(true);
      const eventData = await getEventById(id);
      
      if (eventData) {
        setEvent(eventData);
      } else {
        toast.error('Không tìm thấy sự kiện');
        navigate(PATH.HOME);
      }
    } catch (error) {
      console.error('Error loading event detail:', error);
      toast.error('Không thể tải thông tin sự kiện');
      navigate(PATH.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedEvents = async () => {
    try {
      // Only load related events if we have a valid event ID
      if (id) {
        const relatedData = await getRelatedEvents(id);
        
        if (relatedData) {
          // Limit to 3 related events
          setRelatedEvents(relatedData.slice(0, 3));
        } else {
          setRelatedEvents([]);
        }
      }
    } catch (error) {
      console.error('Error loading related events:', error);
      setRelatedEvents([]);
      // Don't show error toast for related events as it's secondary content
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (event) => {
    // Check if event has ticket details with prices
    if (event.minTicketPrice !== undefined && event.maxTicketPrice !== undefined) {
      if (event.minTicketPrice === 0 && event.maxTicketPrice === 0) {
        return 'Miễn phí';
      } else if (event.minTicketPrice === event.maxTicketPrice) {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(event.minTicketPrice);
      } else {
        return `${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(event.minTicketPrice)} - ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(event.maxTicketPrice)}`;
      }
    }
    // Fallback to ticketType if no price info
    return event.ticketType === 1 ? 'Miễn phí' : 'Có phí';
  };

  const handleRegister = () => {
    if (isAuthenticated) {
      // Redirect to booking page directly if user is authenticated
      navigate(`${PATH.BOOKING.replace(':id', id)}`);
    } else {
      // Redirect to login page with return URL to booking page
      navigate(`${PATH.LOGIN}?returnUrl=${PATH.BOOKING.replace(':id', id)}`);
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

  const handleViewDetail = (eventId) => {
    // Navigate to the guest event detail page for the related event
    navigate(`/event/${eventId}`);
    // Note: We don't need to reload the page, React Router will handle the update
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Đang tải thông tin sự kiện...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy sự kiện</h3>
            <p className="text-gray-500 mb-6">Sự kiện có thể đã bị xóa hoặc không tồn tại.</p>
            <Button onClick={() => navigate(PATH.HOME)}>
              Quay lại trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getEventStatus(event);
  const statusConfig = getStatusBadge(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge variant="outline">
                {event.ticketType === 1 ? 'Miễn phí' : 'Có phí'}
              </Badge>
              {event.isOnlineEvent && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Globe className="h-3 w-3 mr-1" />
                  Trực tuyến
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleShareEvent}>
              <Share2 className="h-4 w-4 mr-1" />
              Chia sẻ
            </Button>
            <Button variant="outline">
              <Bookmark className="h-4 w-4 mr-1" />
              Lưu
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.imgListEvent && event.imgListEvent.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <img
                    src={event.imgListEvent[0]}
                    alt={event.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Card>
              <CardHeader>
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  {[
                    { id: 'overview', label: 'Tổng quan' },
                    { id: 'description', label: 'Mô tả chi tiết' },
                    { id: 'reviews', label: 'Đánh giá' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Thông tin cơ bản</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                            <p className="font-medium">{formatDate(event.startTime)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Thời gian</p>
                            <p className="font-medium">
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Địa điểm</p>
                            <p className="font-medium">
                              {event.isOnlineEvent ? 'Sự kiện trực tuyến' : event.locationName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Số lượng vé</p>
                            <p className="font-medium">{event.totalTickets} vé</p>
                          </div>
                        </div>
                        {event.eventCategoryName && (
                          <div className="flex items-center gap-3">
                            <Tag className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Danh mục</p>
                              <p className="font-medium">{event.eventCategoryName}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'description' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Mô tả sự kiện</h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {event.description || 'Chưa có mô tả chi tiết cho sự kiện này.'}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Đánh giá sự kiện</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-gray-500">Chưa có đánh giá nào cho sự kiện này.</p>
                      <p className="text-sm text-gray-400 mt-2">Hãy đăng nhập để đánh giá sự kiện sau khi tham gia.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-blue-600" />
                  Đăng ký tham gia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Loại vé</span>
                    <Badge className={event.ticketType === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {event.ticketType === 1 ? 'Miễn phí' : 'Có phí'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tổng số vé</span>
                    <span className="font-medium">{event.totalTickets}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                  onClick={handleRegister}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {isAuthenticated ? 'Đăng ký ngay' : 'Đăng nhập để đăng ký'}
                </Button>
                
                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 text-center">
                    Bạn cần đăng nhập để đăng ký tham gia sự kiện này
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Event Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin sự kiện</CardTitle>
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

            {/* Location Map - Show for physical events with location info */}
            {(!event.isOnlineEvent || event.isOnlineEvent === false) && (event.locationName || event.address) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Vị trí sự kiện
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        {event.locationName && event.address && event.locationName === event.address ? (
                          <p className="font-medium text-sm">{event.locationName}</p>
                        ) : (
                          // If they are different or one is missing, show what we have
                          <>
                            {event.locationName && <p className="font-medium text-sm">{event.locationName}</p>}
                            {event.address && event.locationName !== event.address && <p className="text-xs text-gray-500 mt-1">{event.address}</p>}
                          </>
                        )}
                        {/* Fallback if both are missing (shouldn't happen due to the condition above) */}
                        {!event.locationName && !event.address && (
                          <p className="font-medium text-sm">Không có thông tin địa điểm</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Map Preview - Show embedded map if we have coordinates, otherwise show static link */}
                    {(event.latitude && event.longitude) ? (
                      <div className="relative h-48 rounded-lg overflow-hidden border border-gray-200">
                        <iframe
                          src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=15&output=embed`}
                          className="w-full h-full"
                          frameBorder="0"
                          allowFullScreen
                          title="Event Location Map"
                        ></iframe>
                      </div>
                    ) : (event.address || event.locationName) ? (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        {/* <p className="text-sm text-gray-600 mb-2">
                          {event.address || event.locationName}
                        </p> */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const query = encodeURIComponent(event.address || event.locationName);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                          }}
                        >
                          Xem trên Google Maps
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Events */}
            <Card>
              <CardHeader>
                <CardTitle>Sự kiện liên quan</CardTitle>
              </CardHeader>
              <CardContent>
                {relatedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {relatedEvents.map((relatedEvent) => (
                      <Card 
                        key={relatedEvent.eventId} 
                        className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                        onClick={() => handleViewDetail(relatedEvent.eventId)}
                      >
                        <CardContent className="p-0">
                          <div className="flex">
                            <div className="flex-shrink-0 w-24 h-24">
                              <img
                                src={relatedEvent.imgListEvent?.[0] || '/placeholder.svg'}
                                alt={relatedEvent.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 p-3">
                              <h4 className="font-bold text-sm line-clamp-2 mb-1">{relatedEvent.title}</h4>
                              <div className="flex items-center text-xs text-gray-500 mb-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{new Date(relatedEvent.startTime).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500 mb-2">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate">Online</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {formatPrice(relatedEvent)}
                                </Badge>
                                <Button variant="outline" size="sm" className="h-6 text-xs">
                                  Xem chi tiết
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>Không có sự kiện liên quan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailGuestPage;