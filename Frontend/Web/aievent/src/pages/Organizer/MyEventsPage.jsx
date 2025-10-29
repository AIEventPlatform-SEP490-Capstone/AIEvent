import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  MoreHorizontal,
  Download,
  TrendingUp,
  Plus,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { useEvents } from '../../hooks/useEvents';
import { PATH } from '../../routes/path';

// Import ConfirmStatus constants
import { ConfirmStatus, ConfirmStatusDisplay } from '../../constants/eventConstants';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for client-side filtering
  const [isLoading, setIsLoading] = useState(true);
  const { getEventsByStatus, getDraftEvents, deleteEvent: deleteEventAPI, loading: eventLoading } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState('all'); // For switching between event statuses
  const pageSize = 12;

  // Load events initially and when tab changes
  useEffect(() => {
    loadEvents();
  }, [activeTab]);

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
      // Clear existing events immediately when switching tabs
      setEvents([]);
      setAllEvents([]);
      
      let response;
      if (activeTab === 'draft') {
        // Load draft events using the dedicated API endpoint
        response = await getDraftEvents({
          pageNumber: 1,
          pageSize: 1000, // Get all events
        });
      } else {
        // Load events by status for other tabs
        const statusParam = activeTab === 'all' ? null : activeTab;
        response = await getEventsByStatus({
          search: '', // Load all events, we'll filter on client side
          status: statusParam,
          pageNumber: 1,
          pageSize: 1000, // Get all events
        });
      }

      console.log('My events response:', response);

      if (response) {
        const eventsData = response.items || response || [];
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

    console.log('Applying filters:', { searchTerm, filterStatus, sortBy, activeTab, eventsCount: filtered.length });

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

    // Apply status filter - but only for time-based filters, not approval status tabs
    // Approval status tabs (NeedConfirm, Approve, Reject) are handled by the API call
    // Draft tab is also handled by the API call
    const isSpecialTab = ['draft', ConfirmStatus.NeedConfirm, ConfirmStatus.Approve, ConfirmStatus.Reject].includes(activeTab);
    
    if (filterStatus && filterStatus !== 'all' && !isSpecialTab) {
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
    navigate(`/organizer/event/${eventId}`);
  };

  const handleEditEvent = (eventId) => {
    navigate(`/organizer/event/${eventId}/edit`);
  };

  const handleDeleteEvent = async (eventId) => {
    // Find event name for better confirmation
    const event = allEvents.find(e => e.eventId === eventId);
    const eventName = event?.title || 'sự kiện này';
    
    // Check if event has bookings that require a reason
    const hasBookings = event?.totalPersonJoin > 0;
    
    if (hasBookings) {
      // For events with bookings, show prompt for reason
      const reason = prompt(`Bạn có chắc chắn muốn xóa "${eventName}"?

⚠️ Sự kiện này đã có ${event.totalPersonJoin} người đăng ký.

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
          
          // Update local state immediately for better UX
          setAllEvents(prev => prev.filter(event => event.eventId !== eventId));
          setEvents(prev => prev.filter(event => event.eventId !== eventId));
          
          // Reload to sync with server
          loadEvents();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        if (error.response?.status === 403) {
          toast.error('❌ Bạn không có quyền xóa sự kiện này');
        } else if (error.response?.status === 404) {
          toast.error('❌ Sự kiện không tồn tại');
        } else if (error.response?.status === 400) {
          toast.error('❌ Không thể xóa sự kiện đã có người đăng ký');
        } else {
          toast.error('❌ Có lỗi xảy ra khi xóa sự kiện');
        }
      }
    } else {
      // For events without bookings, use simple confirmation
      const confirmMessage = `Bạn có chắc chắn muốn xóa "${eventName}"?\n\n⚠️ Hành động này không thể hoàn tác!`;
      
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
          
          // Update local state immediately for better UX
          setAllEvents(prev => prev.filter(event => event.eventId !== eventId));
          setEvents(prev => prev.filter(event => event.eventId !== eventId));
          
          // Reload to sync with server
          loadEvents();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        if (error.response?.status === 403) {
          toast.error('❌ Bạn không có quyền xóa sự kiện này');
        } else if (error.response?.status === 404) {
          toast.error('❌ Sự kiện không tồn tại');
        } else if (error.response?.status === 400) {
          toast.error('❌ Không thể xóa sự kiện đã có người đăng ký');
        } else {
          toast.error('❌ Có lỗi xảy ra khi xóa sự kiện');
        }
      }
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
    // Handle both string enum names and number values
    if (ticketType === 1 || ticketType === "Free" || ticketType === "free") return 'Miễn phí';
    if (ticketType === 2 || ticketType === "Paid" || ticketType === "paid") return 'Có phí';
    if (ticketType === 3 || ticketType === "Donate" || ticketType === "donate") return 'Quyên góp';
    
    // Default fallback
    return 'Quyên góp';
  };

  const getTabDisplayName = (tab) => {
    switch (tab) {
      case 'all': return 'Tất cả sự kiện';
      case 'draft': return 'Bản nháp';
      case ConfirmStatus.NeedConfirm: return 'Chờ phê duyệt';
      case ConfirmStatus.Approve: return 'Đã phê duyệt';
      case ConfirmStatus.Reject: return 'Bị từ chối';
      default: return tab;
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

  const getEventStats = () => {
    if (!allEvents.length) return { total: 0, upcoming: 0, ongoing: 0, completed: 0, drafts: 0 };
    
    // When on a specific tab, we should count based on that tab
    if (activeTab === 'draft') {
      // When on draft tab, all events are drafts
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: allEvents.length
      };
    }
    
    if (activeTab === ConfirmStatus.NeedConfirm) {
      // Count events needing approval
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === ConfirmStatus.Approve) {
      // Count approved events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === ConfirmStatus.Reject) {
      // Count rejected events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    // For 'all' tab, calculate based on time-based status and draft status
    let drafts = allEvents.filter(event => !('publish' in event) || !event.publish).length;
    
    return allEvents.reduce((acc, event) => {
      const status = getEventStatus(event);
      
      return {
        total: acc.total + 1,
        upcoming: acc.upcoming + (status === 'upcoming' ? 1 : 0),
        ongoing: acc.ongoing + (status === 'ongoing' ? 1 : 0),
        completed: acc.completed + (status === 'completed' ? 1 : 0),
        drafts: drafts
      };
    }, { total: 0, upcoming: 0, ongoing: 0, completed: 0, drafts: drafts });
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

  // Get event image
  const getEventImage = (event) => {
    if (event.imgListEvent && event.imgListEvent.length > 0) {
      return event.imgListEvent[0];
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sự kiện của tôi</h1>
          <p className="text-muted-foreground">Quản lý sự kiện đã tạo và theo dõi thành tích</p>
        </div>
        <Button 
          onClick={() => navigate(PATH.ORGANIZER_CREATE)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo sự kiện mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng sự kiện</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã xuất bản</p>
                <p className="text-2xl font-bold text-green-600">{stats.upcoming + stats.ongoing}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bản nháp</p>
                <p className="text-2xl font-bold text-orange-600">{stats.drafts}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng người tham gia</p>
                <p className="text-2xl font-bold text-purple-600">
                  {allEvents.reduce((sum, event) => sum + (('totalPersonJoin' in event) ? event.totalPersonJoin : 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm kiếm sự kiện..."
            className="pl-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <Select value={filterStatus} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
            <SelectItem value="ongoing">Đang diễn ra</SelectItem>
            <SelectItem value="completed">Đã hoàn thành</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="name">Theo tên A-Z</SelectItem>
            <SelectItem value="startTime">Theo ngày bắt đầu</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tất cả sự kiện
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'draft'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bản nháp ({stats.drafts})
          </button>
          <button
            onClick={() => setActiveTab(ConfirmStatus.NeedConfirm)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === ConfirmStatus.NeedConfirm
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chờ phê duyệt
          </button>
          <button
            onClick={() => setActiveTab(ConfirmStatus.Approve)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === ConfirmStatus.Approve
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đã phê duyệt
          </button>
          <button
            onClick={() => setActiveTab(ConfirmStatus.Reject)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === ConfirmStatus.Reject
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bị từ chối
          </button>
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Đang tải sự kiện...</p>
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {allEvents.length === 0 
                ? 'Chưa có sự kiện nào' 
                : 'Không có sự kiện'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {allEvents.length === 0 
                ? 'Bắt đầu tạo sự kiện đầu tiên của bạn ngay bây giờ!'
                : `Không có sự kiện nào trong danh mục "${getTabDisplayName(activeTab)}".`
              }
            </p>
            {allEvents.length === 0 && (
              <Button
                onClick={() => navigate(PATH.ORGANIZER_CREATE)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo sự kiện mới
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedEvents.map((event) => {
            const eventImage = getEventImage(event);
            const eventStatus = 'status' in event ? event.status : null;

            return (
              <Card key={event.eventId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 flex-shrink-0">
                      {eventImage ? (
                        <img
                          src={eventImage}
                          alt={event.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-10 w-10 text-blue-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 
                              className="text-lg font-semibold text-balance hover:text-blue-600 cursor-pointer"
                              onClick={() => handleViewEvent(event.eventId)}
                            >
                              {event.title}
                            </h3>
                            {eventStatus && (
                              <Badge 
                                variant="outline" 
                                className={
                                  eventStatus === ConfirmStatus.Approve 
                                    ? 'text-green-600 border-green-200 bg-green-50' 
                                    : eventStatus === ConfirmStatus.Reject 
                                      ? 'text-red-600 border-red-200 bg-red-50' 
                                      : 'text-orange-600 border-orange-200 bg-orange-50'
                                }
                              >
                                {eventStatus === ConfirmStatus.Approve && <CheckCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === ConfirmStatus.Reject && <XCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === ConfirmStatus.NeedConfirm && <Clock className="w-3 h-3 mr-1" />}
                                {ConfirmStatusDisplay[eventStatus] || eventStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2 text-primary" />
                          <span>
                            {formatDate(event.startTime).split(' ')[0]} • {formatDate(event.startTime).split(' ')[1]}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2 text-primary" />
                          <span className="truncate">
                            {event.isOnlineEvent ? 'Trực tuyến' : (event.locationName || 'Không có địa điểm')}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-2 text-primary" />
                          <span>
                            {('totalPersonJoin' in event) ? event.totalPersonJoin : (event.soldQuantity || 0)}/
                            {('totalPerson' in event) ? event.totalPerson : (event.totalTickets || 0)} người
                          </span>
                        </div>
                      </div>

                      {/* Event category and ticket type badges */}
                      <div className="flex items-center gap-2 mb-4">
                        {event.eventCategoryName && (
                          <Badge variant="outline" className="text-xs">
                            {event.eventCategoryName}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getTicketTypeLabel(event.ticketType)}
                        </Badge>
                      </div>

                      {/* Event Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                          <span className="text-xs text-muted-foreground">Lượt xem</span>
                          <span className="font-semibold">
                            {event.viewCount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                          <span className="text-xs text-muted-foreground">Đăng ký</span>
                          <span className="font-semibold">
                            {('totalPersonJoin' in event) ? event.totalPersonJoin : (event.soldQuantity || 0)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                          <span className="text-xs text-muted-foreground">Doanh thu</span>
                          <span className="font-semibold">
                            {event.revenue ? `${event.revenue.toLocaleString()}đ` : '0đ'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                          <span className="text-xs text-muted-foreground">Hoàn tiền</span>
                          <span className="font-semibold">
                            {event.refundCount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                          <span className="text-xs text-muted-foreground">Đánh giá</span>
                          <span className="font-semibold">
                            {event.rating ? `${event.rating.toFixed(1)}/5` : 'Chưa có'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewEvent(event.eventId)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditEvent(event.eventId)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Sửa
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent"
                            onClick={() => handleDeleteEvent(event.eventId)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
  );
};

export default MyEventsPage;