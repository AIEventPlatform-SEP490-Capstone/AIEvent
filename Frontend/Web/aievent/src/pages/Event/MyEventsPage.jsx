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
  MoreVertical,
  Grid3X3,
  List,
  TrendingUp,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  Activity,
  CalendarDays
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { eventAPI } from '../../api/eventAPI';
import { PATH } from '../../routes/path';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for client-side filtering
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const pageSize = 12;

  // Load events initially
  useEffect(() => {
    loadEvents();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (allEvents.length > 0) {
      const timeoutId = setTimeout(() => {
        applyFiltersAndSearch();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, filterStatus, sortBy, allEvents]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await eventAPI.getEventsByOrganizer({
        search: '', // Load all events, we'll filter on client side
        pageNumber: 1,
        pageSize: 1000, // Get all events
      });

      console.log('My events response:', response);

      if (response?.data) {
        const eventsData = response.data.items || response.data || [];
        setAllEvents(eventsData);
        // Apply initial filtering after setting allEvents
        setTimeout(() => applyFiltersAndSearch(eventsData), 0);
      } else {
        setAllEvents([]);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Không thể tải danh sách sự kiện');
      setAllEvents([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = (eventsList) => {
    const dataToFilter = eventsList || allEvents;
    if (!dataToFilter || dataToFilter.length === 0) return;

    let filtered = [...dataToFilter];

    console.log('Applying filters:', { searchTerm, filterStatus, sortBy, eventsCount: filtered.length });

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(event => 
        (event.title && event.title.toLowerCase().includes(searchLower)) ||
        (event.description && event.description.toLowerCase().includes(searchLower)) ||
        (event.locationName && event.locationName.toLowerCase().includes(searchLower)) ||
        (event.eventCategoryName && event.eventCategoryName.toLowerCase().includes(searchLower))
      );
      console.log('After search filter:', filtered.length);
    }

    // Apply status filter
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(event => {
        const status = getEventStatus(event);
        return status === filterStatus;
      });
      console.log('After status filter:', filtered.length);
    }

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createDate || b.startTime) - new Date(a.createDate || a.startTime);
          case 'oldest':
            return new Date(a.createDate || a.startTime) - new Date(b.createDate || b.startTime);
          case 'name':
            return (a.title || '').localeCompare(b.title || '');
          case 'startTime':
            return new Date(a.startTime) - new Date(b.startTime);
          default:
            return 0;
        }
      });
    }

    console.log('Final filtered events:', filtered.length);
    setEvents(filtered);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    setCurrentPage(1); // Reset to first page when filtering
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

  const getEventStats = () => {
    if (!allEvents.length) return { total: 0, upcoming: 0, ongoing: 0, completed: 0 };
    
    return allEvents.reduce((acc, event) => {
      const status = getEventStatus(event);
      return {
        total: acc.total + 1,
        upcoming: acc.upcoming + (status === 'upcoming' ? 1 : 0),
        ongoing: acc.ongoing + (status === 'ongoing' ? 1 : 0),
        completed: acc.completed + (status === 'completed' ? 1 : 0)
      };
    }, { total: 0, upcoming: 0, ongoing: 0, completed: 0 });
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    console.log('Search term changed:', value);
    setSearchTerm(value);
  };

  // Handle sort change
  const handleSortChange = (value) => {
    console.log('Sort changed:', value);
    setSortBy(value);
  };

  // Handle status filter change
  const handleStatusFilter = (status) => {
    console.log('Status filter changed:', status);
    setFilterStatus(status);
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    console.log('Clearing all filters');
    setSearchTerm('');
    setFilterStatus('all');
    setSortBy('newest');
  };

  const stats = getEventStats();
  
  // Pagination for current events
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEvents = events.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Sự kiện của tôi
            </h1>
            <p className="text-sm text-gray-500">
              Quản lý sự kiện đã tạo và theo dõi thành tích
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Lần mới
            </Button>
            <Button 
              onClick={() => navigate(PATH.ORGANIZER_CREATE)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Tạo sự kiện mới
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tổng sự kiện</p>
                    <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Đã xuất bản</p>
                    <p className="text-xl font-semibold text-gray-900">{stats.upcoming + stats.ongoing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tổng đăng ký</p>
                    <p className="text-xl font-semibold text-gray-900">39.500</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Doanh thu</p>
                    <p className="text-lg font-semibold text-gray-900">836.5M đ</p>
                    <p className="text-xs text-gray-400">320,000,000 VND</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Hoạt tích</p>
                    <p className="text-xl font-semibold text-gray-900">221</p>
                    <p className="text-xs text-gray-400">06,000,000 VND</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Chờ duyệt</p>
                    <p className="text-xl font-semibold text-gray-900">4</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Tất cả ({allEvents.length}) | Hiển thị ({events.length})
              </span>
              {searchTerm && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  Tìm: "{searchTerm}"
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                  Lọc: {filterStatus}
                </span>
              )}
              {(searchTerm || filterStatus !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo tên, mô tả, địa điểm..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-9 w-80 h-10"
                />
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="h-10 px-2"
                >
                  ✕
                </Button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-10 px-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-sm"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Theo tên A-Z</option>
              <option value="startTime">Theo ngày bắt đầu</option>
            </select>
            <Button 
              variant="outline" 
              className="h-10 px-3"
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Bộ lọc nâng cao
            </Button>
            <select
              value={filterStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="h-10 px-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {showAdvancedFilter && (
          <Card className="mb-6 p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'upcoming', label: 'Sắp diễn ra' },
                    { value: 'ongoing', label: 'Đang diễn ra' },
                    { value: 'completed', label: 'Đã hoàn thành' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={filterStatus === option.value}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại vé</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Miễn phí</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Có phí</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình thức</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Trực tuyến</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Tại địa điểm</span>
                  </label>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Đặt lại bộ lọc
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Results Summary */}
        {!isLoading && events.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Hiển thị {startIndex + 1} - {Math.min(endIndex, events.length)} của {events.length} sự kiện
              {searchTerm && (
                <span className="ml-2 text-blue-600">
                  cho "{searchTerm}"
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Trang {currentPage} / {totalPages}
            </div>
          </div>
        )}

        {/* Events Table */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Đang tải sự kiện...</p>
          </div>
        ) : events.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {allEvents.length === 0 
                  ? 'Chưa có sự kiện nào' 
                  : searchTerm || filterStatus !== 'all'
                    ? 'Không tìm thấy sự kiện phù hợp'
                    : 'Không có sự kiện'
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {allEvents.length === 0 
                  ? 'Bắt đầu tạo sự kiện đầu tiên của bạn ngay bây giờ!'
                  : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm sự kiện bạn cần.'
                }
              </p>
              {allEvents.length === 0 ? (
                <Button
                  onClick={() => navigate(PATH.ORGANIZER_CREATE)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo sự kiện mới
                </Button>
              ) : (
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-0">
              {/* Dynamic Events */}
              {paginatedEvents.map((event) => {
                const status = getEventStatus(event);
                const statusConfig = getStatusBadge(status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={event.eventId} className="border-b border-gray-100 p-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      {event.imgListEvent && event.imgListEvent.length > 0 ? (
                        <img
                          src={event.imgListEvent[0]}
                          alt={event.title}
                          className="w-20 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 cursor-pointer"
                                onClick={() => handleViewEvent(event.eventId)}>
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(event.startTime).split(' ')[0]}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDate(event.startTime).split(' ')[1]} - {formatDate(event.endTime).split(' ')[1]}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.isOnlineEvent ? 'Trực tuyến' : event.locationName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                0/{event.totalTickets}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              <Badge className={getTicketTypeBadgeColor(event.ticketType)}>
                                {getTicketTypeLabel(event.ticketType)}
                              </Badge>
                              {event.isOnlineEvent && (
                                <Badge variant="outline">Trực tuyến</Badge>
                              )}
                              {event.eventCategoryName && (
                                <Badge variant="outline">{event.eventCategoryName}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewEvent(event.eventId)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event.eventId)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-8 mt-4 pt-4 border-t border-gray-100">
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">Lượt xem</p>
                            <p className="text-lg font-semibold">0</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">Đăng ký</p>
                            <p className="text-lg font-semibold">0</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">Doanh thu</p>
                            <p className="text-lg font-semibold">
                              {event.ticketType === 1 ? 'Miễn phí' : '0 đ'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">Hoạt tích</p>
                            <p className="text-lg font-semibold">0</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">Danh giá</p>
                            <p className="text-lg font-semibold">Chưa có</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
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
