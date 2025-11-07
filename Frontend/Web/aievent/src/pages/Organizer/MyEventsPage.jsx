import React, { useState, useEffect, useRef } from 'react';
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
  XCircle,
  Copy
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { useEvents } from '../../hooks/useEvents';
import { PATH } from '../../routes/path';

// Import EndEventRequestButton
import EndEventRequestButton from '../../components/Organizer/EndEventRequestButton';

// Import EventStatus constants
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';

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
  const [showInitiationDropdown, setShowInitiationDropdown] = useState(false);
  const [showCompletionDropdown, setShowCompletionDropdown] = useState(false);
  const [initiationDropdownLabel, setInitiationDropdownLabel] = useState('Khởi tạo sự kiện');
  const [completionDropdownLabel, setCompletionDropdownLabel] = useState('Kết thúc sự kiện');
  const initiationDropdownRef = useRef(null);
  const completionDropdownRef = useRef(null);
  const pageSize = 12;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (initiationDropdownRef.current && !initiationDropdownRef.current.contains(event.target)) {
        setShowInitiationDropdown(false);
      }
      if (completionDropdownRef.current && !completionDropdownRef.current.contains(event.target)) {
        setShowCompletionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update dropdown labels when activeTab changes
  useEffect(() => {
    // Update initiation dropdown label
    if (activeTab === EventStatus.PendingApproval) {
      setInitiationDropdownLabel('Chờ phê duyệt');
    } else if (activeTab === EventStatus.Approved) {
      setInitiationDropdownLabel('Đã phê duyệt');
    } else if (activeTab === EventStatus.Rejected) {
      setInitiationDropdownLabel('Bị từ chối');
    } 
    // Reset initiation dropdown to default when selecting completion statuses or other main tabs
    else if ([EventStatus.PendingApprovalEnd, EventStatus.RejectEnded, 
              EventStatus.WaitingForPayout, EventStatus.Ended, 
              'all', 'draft', EventStatus.Cancelled].includes(activeTab)) {
      setInitiationDropdownLabel('Khởi tạo sự kiện');
    }

    // Update completion dropdown label
    if (activeTab === EventStatus.PendingApprovalEnd) {
      setCompletionDropdownLabel('Chờ kết thúc');
    } else if (activeTab === EventStatus.RejectEnded) {
      setCompletionDropdownLabel('Từ chối kết thúc');
    } else if (activeTab === EventStatus.WaitingForPayout) {
      setCompletionDropdownLabel('Chờ thanh toán');
    } else if (activeTab === EventStatus.Ended) {
      setCompletionDropdownLabel('Đã kết thúc');
    }
    // Reset completion dropdown to default when selecting initiation statuses or other main tabs
    else if ([EventStatus.PendingApproval, EventStatus.Approved, 
              EventStatus.Rejected, 'all', 'draft', EventStatus.Cancelled].includes(activeTab)) {
      setCompletionDropdownLabel('Kết thúc sự kiện');
    }
  }, [activeTab]);

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
    // Approval status tabs (PendingApproval, Approved, Rejected, etc.) are handled by the API call
    // Draft tab is also handled by the API call
    const isSpecialTab = [
      'draft', 
      EventStatus.PendingApproval, 
      EventStatus.Approved, 
      EventStatus.Rejected,
      EventStatus.Cancelled,
      EventStatus.PendingApprovalEnd,
      EventStatus.RejectEnded,
      EventStatus.WaitingForPayout,
      EventStatus.Ended
    ].includes(activeTab);
    
    if (filterStatus && filterStatus !== 'all' && !isSpecialTab) {
      filtered = filtered.filter(event => {
        const status = getEventStatus(event);
        return status === filterStatus;
      });
      console.log('After status filter:', filtered.length);
    }
    
    // If filterStatus is one of the EventStatus values, apply it regardless of activeTab
    if (filterStatus && filterStatus !== 'all' && Object.values(EventStatus).includes(filterStatus)) {
      filtered = filtered.filter(event => {
        const eventStatus = 'status' in event ? event.status : null;
        return eventStatus === filterStatus;
      });
      console.log('After EventStatus filter:', filtered.length);
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
    if (ticketType === 1 || ticketType === "Free" || ticketType === "free" || ticketType === "Miễn phí") return 'Miễn phí';
    if (ticketType === 2 || ticketType === "Paid" || ticketType === "paid" || ticketType === "Có phí") return 'Có phí';
    
    // Additional check for string values (case insensitive)
    if (typeof ticketType === 'string') {
      const lowerTicketType = ticketType.toLowerCase();
      if (lowerTicketType === 'free') return 'Miễn phí';
      if (lowerTicketType === 'paid') return 'Có phí';
    }
    
    // Default fallback
    return 'Không xác định';
  };

  const getTabDisplayName = (tab) => {
    switch (tab) {
      case 'all': return 'Tất cả sự kiện';
      case 'draft': return 'Bản nháp';
      case EventStatus.PendingApproval: return 'Chờ phê duyệt';
      case EventStatus.Approved: return 'Đã phê duyệt';
      case EventStatus.Rejected: return 'Bị từ chối';
      case EventStatus.Cancelled: return 'Đã hủy';
      case EventStatus.PendingApprovalEnd: return 'Chờ kết thúc';
      case EventStatus.RejectEnded: return 'Từ chối kết thúc';
      case EventStatus.WaitingForPayout: return 'Chờ thanh toán';
      case EventStatus.Ended: return 'Đã kết thúc';
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
    
    if (activeTab === EventStatus.PendingApproval) {
      // Count events needing approval
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === EventStatus.Approved) {
      // Count approved events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === EventStatus.Rejected) {
      // Count rejected events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === EventStatus.Cancelled) {
      // Count cancelled events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === EventStatus.PendingApprovalEnd) {
      // Count pending approval end events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === EventStatus.RejectEnded) {
      // Count reject ended events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === EventStatus.WaitingForPayout) {
      // Count waiting for payout events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        drafts: 0
      };
    }
    
    if (activeTab === EventStatus.Ended) {
      // Count ended events
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

  const handleCloneEvent = (event) => {
    // Store event data in localStorage or pass as state
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
            <SelectItem value={EventStatus.PendingApproval}>Chờ phê duyệt</SelectItem>
            <SelectItem value={EventStatus.Approved}>Đã phê duyệt</SelectItem>
            <SelectItem value={EventStatus.Rejected}>Bị từ chối</SelectItem>
            <SelectItem value={EventStatus.Cancelled}>Đã hủy</SelectItem>
            <SelectItem value={EventStatus.PendingApprovalEnd}>Chờ kết thúc</SelectItem>
            <SelectItem value={EventStatus.RejectEnded}>Từ chối kết thúc</SelectItem>
            <SelectItem value={EventStatus.WaitingForPayout}>Chờ thanh toán</SelectItem>
            <SelectItem value={EventStatus.Ended}>Đã kết thúc</SelectItem>
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
            onClick={() => {
              setActiveTab('all');
              setShowInitiationDropdown(false);
              setShowCompletionDropdown(false);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tất cả sự kiện
          </button>
          <button
            onClick={() => {
              setActiveTab('draft');
              setShowInitiationDropdown(false);
              setShowCompletionDropdown(false);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'draft'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bản nháp ({stats.drafts})
          </button>
          
          {/* Event Initiation Dropdown */}
          <div className="relative" ref={initiationDropdownRef}>
            <button
              onClick={() => {
                setShowInitiationDropdown(!showInitiationDropdown);
                setShowCompletionDropdown(false);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                [EventStatus.PendingApproval, EventStatus.Approved, EventStatus.Rejected].includes(activeTab)
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {initiationDropdownLabel}
              <svg className={`ml-1 w-4 h-4 transition-transform ${showInitiationDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showInitiationDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.PendingApproval);
                    setShowInitiationDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === EventStatus.PendingApproval
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Chờ phê duyệt
                </button>
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.Approved);
                    setShowInitiationDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === EventStatus.Approved
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Đã phê duyệt
                </button>
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.Rejected);
                    setShowInitiationDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === EventStatus.Rejected
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Bị từ chối
                </button>
              </div>
            )}
          </div>
          
          {/* Event Completion Dropdown */}
          <div className="relative" ref={completionDropdownRef}>
            <button
              onClick={() => {
                setShowCompletionDropdown(!showCompletionDropdown);
                setShowInitiationDropdown(false);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                [EventStatus.PendingApprovalEnd, EventStatus.RejectEnded, EventStatus.WaitingForPayout, EventStatus.Ended].includes(activeTab)
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {completionDropdownLabel}
              <svg className={`ml-1 w-4 h-4 transition-transform ${showCompletionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showCompletionDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.PendingApprovalEnd);
                    setShowCompletionDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === EventStatus.PendingApprovalEnd
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Chờ kết thúc
                </button>
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.RejectEnded);
                    setShowCompletionDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === EventStatus.RejectEnded
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Từ chối kết thúc
                </button>
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.WaitingForPayout);
                    setShowCompletionDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === EventStatus.WaitingForPayout
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Chờ thanh toán
                </button>
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.Ended);
                    setShowCompletionDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === EventStatus.Ended
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Đã kết thúc
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setActiveTab(EventStatus.Cancelled);
              setShowInitiationDropdown(false);
              setShowCompletionDropdown(false);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === EventStatus.Cancelled
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đã hủy
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
                                  eventStatus === EventStatus.Approved 
                                    ? 'text-green-600 border-green-200 bg-green-50' 
                                    : eventStatus === EventStatus.Rejected 
                                      ? 'text-red-600 border-red-200 bg-red-50' 
                                      : eventStatus === EventStatus.Cancelled
                                        ? 'text-gray-600 border-gray-200 bg-gray-50'
                                        : eventStatus === EventStatus.PendingApprovalEnd
                                          ? 'text-yellow-600 border-yellow-200 bg-yellow-50'
                                          : eventStatus === EventStatus.RejectEnded
                                            ? 'text-purple-600 border-purple-200 bg-purple-50'
                                            : eventStatus === EventStatus.WaitingForPayout
                                              ? 'text-indigo-600 border-indigo-200 bg-indigo-50'
                                              : eventStatus === EventStatus.Ended
                                                ? 'text-blue-600 border-blue-200 bg-blue-50'
                                                : 'text-orange-600 border-orange-200 bg-orange-50'
                                }
                              >
                                {eventStatus === EventStatus.Approved && <CheckCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.Rejected && <XCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.Cancelled && <XCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.PendingApprovalEnd && <Clock className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.RejectEnded && <XCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.WaitingForPayout && <Clock className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.Ended && <CheckCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.PendingApproval && <Clock className="w-3 h-3 mr-1" />}
                                {EventStatusDisplay[eventStatus] || eventStatus}
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
                            {event.locationName || 'Không có địa điểm'}
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
                          {getTicketTypeLabel(event.ticketPricingType || event.ticketType)}
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
                            {event.totalPersonJoin || event.soldQuantity || 0}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                          <span className="text-xs text-muted-foreground">Doanh thu</span>
                          <span className="font-semibold">
                            {event.totalAmount ? `${event.totalAmount.toLocaleString()}đ` : '0đ'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                          <span className="text-xs text-muted-foreground">Thanh toán</span>
                          <span className="font-semibold">
                            {event.payoutAmount ? `${event.payoutAmount.toLocaleString()}đ` : '0đ'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                          <span className="text-xs text-muted-foreground">Đánh giá</span>
                          <span className="font-semibold">
                            {event.averageRating ? `${event.averageRating.toFixed(1)}/5` : 'Chưa có'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {eventStatus === EventStatus.Approved || eventStatus === EventStatus.RejectEnded && event.endTime && (
                            <EndEventRequestButton 
                              event={event} 
                              onEndEventRequested={() => loadEvents()} // Reload events after request
                            />
                          )}
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
                            onClick={() => handleCloneEvent(event)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Clone
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