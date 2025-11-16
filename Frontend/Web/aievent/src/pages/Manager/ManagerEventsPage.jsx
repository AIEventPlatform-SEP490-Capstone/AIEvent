import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Download,
  TrendingUp,
  Shield,
  Plus,
  Flag,
  Loader2,
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../components/ui/dialog';
import { useEvents } from '../../hooks/useEvents';
import { PATH } from '../../routes/path';
import eventAPI from '../../api/eventAPI';
import EventReportManager from '../../components/Manager/EventReportManager';

// Import EventStatus constants
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';

const ManagerEventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for client-side filtering
  const [isLoading, setIsLoading] = useState(true);
  const { getEvents, getEventsByStatus, confirmEvent: confirmEventAPI, deleteEvent: deleteEventAPI, loading: eventLoading } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState('all'); // For switching between event statuses
  const [rejectionReason, setRejectionReason] = useState('');
  const [showInitiationDropdown, setShowInitiationDropdown] = useState(false);
  const [showCompletionDropdown, setShowCompletionDropdown] = useState(false);
  const [initiationDropdownLabel, setInitiationDropdownLabel] = useState('Khởi tạo sự kiện');
  const [completionDropdownLabel, setCompletionDropdownLabel] = useState('Kết thúc sự kiện');
  const initiationDropdownRef = useRef(null);
  const completionDropdownRef = useRef(null);
  const pageSize = 12;
  const [reportCounts, setReportCounts] = useState({});
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportDialogEvent, setReportDialogEvent] = useState(null);

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
    else if ([EventStatus.WaitingForPayout, EventStatus.PaidOut, 
              'all', EventStatus.Cancelled].includes(activeTab)) {
      setInitiationDropdownLabel('Khởi tạo sự kiện');
    }

    // Update completion dropdown label
    if (activeTab === EventStatus.WaitingForPayout) {
      setCompletionDropdownLabel('Chờ thanh toán');
    } else if (activeTab === EventStatus.PaidOut) {
      setCompletionDropdownLabel('Đã thanh toán');
    }
    // Reset completion dropdown to default when selecting initiation statuses or other main tabs
    else if ([EventStatus.PendingApproval, EventStatus.Approved,
    EventStatus.Rejected, 'all', EventStatus.Cancelled].includes(activeTab)) {
      setCompletionDropdownLabel('Kết thúc sự kiện');
    }
  }, [activeTab]);

  // Load events initially and when tab changes
  useEffect(() => {
    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');

    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    } else {
      setCurrentPage(1);
      loadEvents(1);
    }
  }, [location.search, activeTab, searchTerm, filterStatus, sortBy]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFiltersAndSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, sortBy]);

  const loadEvents = async (page = 1) => {
    try {
      setIsLoading(true);
      // Clear existing events immediately when switching tabs
      setEvents([]);
      setAllEvents([]);

      let response;
      if (activeTab === 'all') {
        // For the 'all' tab, we want to show all events including all approval statuses
        response = await getEvents({ 
          search: searchTerm || '',
          pageNumber: page, 
          pageSize: pageSize 
        });
      } else {
        // Load events by specific status
        response = await getEventsByStatus({
          search: searchTerm || '',
          status: activeTab !== 'all' ? activeTab : null,
          pageNumber: page,
          pageSize: pageSize,
        });
      }

      if (response) {
        const eventsData = response.items || response || [];
        const totalCount = response.totalCount || eventsData.length;
        
        setAllEvents(eventsData);
        setEvents(eventsData);
        setTotalPages(Math.ceil(totalCount / pageSize));
      } else {
        setAllEvents([]);
        setEvents([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Không thể tải danh sách sự kiện');
      setAllEvents([]);
      setEvents([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // With server-side pagination, we no longer need client-side filtering
  // The filtering and sorting should be handled by the API
  const applyFiltersAndSearch = () => {
    // Reset to first page when filtering
    setCurrentPage(1);
    loadEvents(1);
  };

  const handleViewEvent = (eventId) => {
    navigate(`/manager/event/${eventId}`);
  };

  const handleEditEvent = (eventId) => {
    navigate(`/manager/event/${eventId}/edit`);
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

  // Handle event approval
  const handleApproveEvent = async (eventId) => {
    try {
      const response = await confirmEventAPI(eventId, {
        status: EventStatus.Approved
      });

      if (response) {
        toast.success('Sự kiện đã được phê duyệt thành công!');
        loadEvents();
      }
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Có lỗi xảy ra khi phê duyệt sự kiện');
    }
  };

  // Handle event rejection
  const handleRejectEvent = async (eventId, reason) => {
    if (!reason.trim()) {
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
        loadEvents();
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Có lỗi xảy ra khi từ chối sự kiện');
    }
  };

  const handleOpenReports = (event) => {
    setReportDialogEvent(event);
    setIsReportDialogOpen(true);
  };

  const handleCloseReports = () => {
    setIsReportDialogOpen(false);
    setReportDialogEvent(null);
  };

  const handleReportCountChange = (eventId, count) => {
    setReportCounts((prev) => ({
      ...prev,
      [eventId]: count,
    }));
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
      case EventStatus.PendingApproval: return 'Chờ phê duyệt';
      case EventStatus.Approved: return 'Đã phê duyệt';
      case EventStatus.Rejected: return 'Bị từ chối';
      case EventStatus.Cancelled: return 'Đã hủy';
      case EventStatus.WaitingForPayout: return 'Chờ thanh toán';
      case EventStatus.PaidOut: return 'Đã thanh toán';
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
    if (!allEvents.length) return { total: 0, upcoming: 0, ongoing: 0, completed: 0, pendingApprovals: 0 };

    // When on a specific approval tab, we should count based on that tab
    if (activeTab === EventStatus.PendingApproval) {
      // Count events needing approval
      const pendingApprovals = allEvents.filter(event =>
        'status' in event && event.status === EventStatus.PendingApproval
      ).length;

      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        pendingApprovals: pendingApprovals
      };
    }

    if (activeTab === EventStatus.Approved) {
      // Count approved events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        pendingApprovals: 0
      };
    }

    if (activeTab === EventStatus.Rejected) {
      // Count rejected events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        pendingApprovals: 0
      };
    }

    if (activeTab === EventStatus.Cancelled) {
      // Count cancelled events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        pendingApprovals: 0
      };
    }
    
    if (activeTab === EventStatus.WaitingForPayout) {
      // Count waiting for payout events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        pendingApprovals: 0
      };
    }
    
    if (activeTab === EventStatus.PaidOut) {
      // Count paid out events
      return {
        total: allEvents.length,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        pendingApprovals: 0
      };
    }

    // For 'all' tab, calculate based on time-based status
    return allEvents.reduce((acc, event) => {
      const status = getEventStatus(event);

      // Count events needing approval - check if property exists before accessing
      // EventsRawResponse doesn't have requireApproval property
      const pendingApproval = ('status' in event && event.status === EventStatus.PendingApproval) ? 1 : 0;

      return {
        total: acc.total + 1,
        upcoming: acc.upcoming + (status === 'upcoming' ? 1 : 0),
        ongoing: acc.ongoing + (status === 'ongoing' ? 1 : 0),
        completed: acc.completed + (status === 'completed' ? 1 : 0),
        pendingApprovals: acc.pendingApprovals + pendingApproval
      };
    }, { total: 0, upcoming: 0, ongoing: 0, completed: 0, pendingApprovals: 0 });
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value);
  };

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setFilterStatus(status);
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setSortBy('newest');
  };

  const stats = getEventStats();

  // Pagination for current events
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return events.slice(startIndex, startIndex + pageSize);
  }, [events, currentPage, pageSize]);

  useEffect(() => {
    const idsToFetch = paginatedEvents
      .map((event) => event?.eventId)
      .filter((eventId) => eventId && reportCounts[eventId] === undefined);

    if (!idsToFetch.length) return;

    let isCancelled = false;

    const preloadCounts = async () => {
      try {
        const results = await Promise.all(
          idsToFetch.map(async (eventId) => {
            const response = await eventAPI.getEventReports(eventId, { pageNumber: 1, pageSize: 1 });
            const count = response.totalItems ?? (response.items?.length ?? 0);
            return { eventId, count };
          })
        );

        if (isCancelled) return;

        setReportCounts((prev) => {
          const next = { ...prev };
          results.forEach(({ eventId, count }) => {
            next[eventId] = count;
          });
          return next;
        });
      } catch (error) {
        console.error('Error preloading event report counts:', error);
        if (!isCancelled) {
          setReportCounts((prev) => {
            const next = { ...prev };
            idsToFetch.forEach((eventId) => {
              if (next[eventId] === undefined) {
                next[eventId] = 0;
              }
            });
            return next;
          });
        }
      }
    };

    preloadCounts();

    return () => {
      isCancelled = true;
    };
  }, [paginatedEvents, reportCounts]);

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
          <h1 className="text-3xl font-bold text-foreground">Quản lý sự kiện</h1>
          <p className="text-muted-foreground">Quản lý và phê duyệt các sự kiện trong hệ thống</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Shield className="w-4 h-4 mr-2" />
          Administrator
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">{stats.upcoming + stats.ongoing}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Từ chối</p>
                <p className="text-2xl font-bold text-red-600">
                  {allEvents.filter(e => e.status === EventStatus.Rejected).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng sự kiện</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
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
            <SelectItem value={EventStatus.WaitingForPayout}>Chờ thanh toán</SelectItem>
            <SelectItem value={EventStatus.PaidOut}>Đã thanh toán</SelectItem>
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
              navigate(PATH.MANAGER_EVENTS);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'all'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Tất cả sự kiện
          </button>

          {/* Event Initiation Dropdown */}
          <div className="relative" ref={initiationDropdownRef}>
            <button
              onClick={() => {
                setShowInitiationDropdown(!showInitiationDropdown);
                setShowCompletionDropdown(false);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${[EventStatus.PendingApproval, EventStatus.Approved, EventStatus.Rejected].includes(activeTab)
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
                    navigate(`${PATH.MANAGER_EVENTS}?tab=${EventStatus.PendingApproval}`);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${activeTab === EventStatus.PendingApproval
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Chờ phê duyệt
                  {stats.pendingApprovals > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 inline-flex items-center justify-center">
                      {stats.pendingApprovals}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.Approved);
                    setShowInitiationDropdown(false);
                    navigate(`${PATH.MANAGER_EVENTS}?tab=${EventStatus.Approved}`);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${activeTab === EventStatus.Approved
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
                    navigate(`${PATH.MANAGER_EVENTS}?tab=${EventStatus.Rejected}`);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${activeTab === EventStatus.Rejected
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
                [EventStatus.WaitingForPayout, EventStatus.PaidOut].includes(activeTab)
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
                    setActiveTab(EventStatus.WaitingForPayout);
                    setShowCompletionDropdown(false);
                    navigate(`${PATH.MANAGER_EVENTS}?tab=${EventStatus.WaitingForPayout}`);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${activeTab === EventStatus.WaitingForPayout
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Chờ thanh toán
                </button>
                <button
                  onClick={() => {
                    setActiveTab(EventStatus.PaidOut);
                    setShowCompletionDropdown(false);
                    navigate(`${PATH.MANAGER_EVENTS}?tab=${EventStatus.PaidOut}`);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === EventStatus.PaidOut
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Đã thanh toán
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setActiveTab(EventStatus.Cancelled);
              setShowInitiationDropdown(false);
              setShowCompletionDropdown(false);
              navigate(`${PATH.MANAGER_EVENTS}?tab=${EventStatus.Cancelled}`);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === EventStatus.Cancelled
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
                ? 'Bắt đầu quản lý sự kiện trong hệ thống!'
                : `Không có sự kiện nào trong danh mục "${getTabDisplayName(activeTab)}".`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedEvents.map((event) => {
            const eventImage = getEventImage(event);
            const eventStatus = 'status' in event ? event.status : null;
            const eventReportCount = reportCounts[event.eventId];
            const displayReportCount = typeof eventReportCount === 'number' ? eventReportCount : '…';

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
                                        : eventStatus === EventStatus.WaitingForPayout
                                          ? 'text-indigo-600 border-indigo-200 bg-indigo-50'
                                          : eventStatus === EventStatus.PaidOut
                                            ? 'text-blue-600 border-blue-200 bg-blue-50'
                                            : 'text-orange-600 border-orange-200 bg-orange-50'
                                }
                              >
                                {eventStatus === EventStatus.Approved && <CheckCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.Rejected && <XCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.Cancelled && <XCircle className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.WaitingForPayout && <Clock className="w-3 h-3 mr-1" />}
                                {eventStatus === EventStatus.PaidOut && <CheckCircle className="w-3 h-3 mr-1" />}
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

                      {eventStatus === EventStatus.Rejected && event.rejectReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <p className="text-red-800 text-sm">
                            <strong>Lý do từ chối:</strong> {event.rejectReason}
                          </p>
                        </div>
                      )}

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
                            {('totalPersonJoin' in event) ? event.totalPersonJoin : (event.soldQuantity || 0)}
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
                            onClick={() => handleOpenReports(event)}
                            className="relative"
                          >
                            <Flag className="w-4 h-4 mr-2 text-red-600" />
                            Báo cáo
                            <span className="ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                              {displayReportCount}
                            </span>
                          </Button>

                          {eventStatus === EventStatus.PendingApproval && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveEvent(event.eventId)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Duyệt
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
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
                                        onClick={() => handleRejectEvent(event.eventId, rejectionReason)}
                                        disabled={!rejectionReason.trim()}
                                      >
                                        Xác nhận từ chối
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}

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
            onClick={() => {
              const newPage = Math.max(1, currentPage - 1);
              setCurrentPage(newPage);
              loadEvents(newPage);
            }}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => {
                  setCurrentPage(page);
                  loadEvents(page);
                }}
                className={currentPage === page ? 'bg-blue-600' : ''}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const newPage = Math.min(totalPages, currentPage + 1);
              setCurrentPage(newPage);
              loadEvents(newPage);
            }}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Event Report Manager Component */}
      <EventReportManager
        event={reportDialogEvent}
        isOpen={isReportDialogOpen}
        onClose={handleCloseReports}
        onReportCountChange={handleReportCountChange}
      />

    </div>
  );
};

export default ManagerEventsPage;