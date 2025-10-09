import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { eventAPI } from '../../api/eventAPI';
import { PATH } from '../../routes/path';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Load events
  useEffect(() => {
    loadEvents();
  }, [currentPage, searchTerm]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await eventAPI.getEvents({
        search: searchTerm,
        pageNumber: currentPage,
        pageSize: pageSize,
      });

      console.log('My events response:', response);

      if (response?.data) {
        const eventsData = response.data.items || response.data || [];
        setEvents(eventsData);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Không thể tải danh sách sự kiện');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewEvent = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleEditEvent = (eventId) => {
    // TODO: Navigate to edit page
    toast.info('Chức năng chỉnh sửa đang được phát triển');
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      return;
    }

    try {
      const response = await eventAPI.deleteEvent(eventId);
      if (response?.statusCode?.startsWith('AIE201')) {
        toast.success('Xóa sự kiện thành công!');
        loadEvents();
      } else {
        toast.error(response?.message || 'Không thể xóa sự kiện');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Có lỗi xảy ra khi xóa sự kiện');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTicketTypeLabel = (ticketType) => {
    return ticketType === 1 ? 'Miễn phí' : 'Có phí';
  };

  const getTicketTypeBadgeColor = (ticketType) => {
    return ticketType === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Sự kiện của tôi
              </h1>
              <p className="text-gray-600 text-lg">
                Quản lý và theo dõi các sự kiện bạn đã tạo
              </p>
            </div>
            <Button
              onClick={() => navigate(PATH.ORGANIZER_CREATE)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tạo sự kiện mới
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : events.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Calendar className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Chưa có sự kiện nào
              </h3>
              <p className="text-gray-500 mb-6">
                Bắt đầu tạo sự kiện đầu tiên của bạn ngay bây giờ!
              </p>
              <Button
                onClick={() => navigate(PATH.ORGANIZER_CREATE)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Tạo sự kiện mới
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.eventId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Event Image */}
                    <div className="flex-shrink-0">
                      {event.imgEvent && event.imgEvent.length > 0 ? (
                        <img
                          src={event.imgEvent[0]}
                          alt={event.title}
                          className="w-48 h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-48 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-12 w-12 text-blue-400" />
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer"
                              onClick={() => handleViewEvent(event.eventId)}>
                            {event.title}
                          </h3>
                          <div className="flex gap-2 mb-2">
                            <Badge className={getTicketTypeBadgeColor(event.ticketType)}>
                              {getTicketTypeLabel(event.ticketType)}
                            </Badge>
                            {event.isOnlineEvent && (
                              <Badge className="bg-purple-100 text-purple-800">
                                Trực tuyến
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEvent(event.eventId)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEvent(event.eventId)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteEvent(event.eventId)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{formatDate(event.startTime)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-red-500" />
                          <span className="truncate">
                            {event.isOnlineEvent ? 'Sự kiện trực tuyến' : event.locationName}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2 text-green-500" />
                          <span>{event.totalTickets} vé</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                          <span>{event.eventCategory?.categoryName || 'Chưa phân loại'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && events.length > 0 && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-blue-600' : ''}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEventsPage;
