import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Filter,
  RefreshCw
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { useEvents } from '../../hooks/useEvents';
import { PATH } from '../../routes/path';

// Import EventStatus constants
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';

// Import the new SaleCountdown component
import SaleCountdown from '../../components/Event/SaleCountdown';

// Import new UI enhancement components
import EventCardSkeleton from '../../components/Event/EventCardSkeleton';
import EmptyEventState from '../../components/Event/EmptyEventState';
import QuickFilterChips from '../../components/Event/QuickFilterChips';
import RadialStatusMenu from '../../components/Event/RadialStatusMenu';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const initiationDropdownRef = useRef(null);
  const completionDropdownRef = useRef(null);
  const pageSize = 5;

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // New state for storing all events for statistics
  const [allEventsForStats, setAllEventsForStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // UI Enhancement states
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'compact'
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState(null);
  const [expandedMetrics, setExpandedMetrics] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Load all events for statistics when component mounts
  useEffect(() => {
    const loadAllEventsForStats = async () => {
      setLoadingStats(true);
      try {
        // Fetch all events with a large page size to get everything
        const response = await getEventsByStatus({
          pageNumber: 1,
          pageSize: 10000, // Large number to get all events
        });
        
        if (response) {
          const eventsData = response.items || response || [];
          setAllEventsForStats(eventsData);
        } else {
          setAllEventsForStats([]);
        }
      } catch (error) {
        console.error('Error loading all events for stats:', error);
        toast.error('Không thể tải thống kê sự kiện');
        setAllEventsForStats([]);
      } finally {
        setLoadingStats(false);
      }
    };

    loadAllEventsForStats();
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
    else if ([EventStatus.WaitingForPayout, EventStatus.PaidOut, EventStatus.ErrorPayment,
              'all', 'draft', EventStatus.Cancelled].includes(activeTab)) {
      setInitiationDropdownLabel('Khởi tạo sự kiện');
    }

    // Update completion dropdown label
    if (activeTab === EventStatus.WaitingForPayout) {
      setCompletionDropdownLabel('Chờ thanh toán');
    } else if (activeTab === EventStatus.PaidOut) {
      setCompletionDropdownLabel('Đã thanh toán');
    } else if (activeTab === EventStatus.ErrorPayment) {
      setCompletionDropdownLabel('Lỗi thanh toán');
    }
    // Reset completion dropdown to default when selecting initiation statuses or other main tabs
    else if ([EventStatus.PendingApproval, EventStatus.Approved, 
              EventStatus.Rejected, 'all', 'draft', EventStatus.Cancelled].includes(activeTab)) {
      setCompletionDropdownLabel('Kết thúc sự kiện');
    }
  }, [activeTab]);

  // Load events initially and when tab changes
  useEffect(() => {
    setCurrentPage(1);
    loadEvents(1);
  }, [activeTab, searchTerm, filterStatus, sortBy, startDate, endDate]);

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
      if (activeTab === 'draft') {
        // Load draft events using the dedicated API endpoint
        response = await getDraftEvents({
          pageNumber: page,
          pageSize: pageSize,
          search: searchTerm || '',
          startDate: startDate ? new Date(startDate).toISOString() : '',
          endDate: endDate ? new Date(endDate).toISOString() : '',
        });
      } else {
        // Load events by status for other tabs
        const statusParam = activeTab === 'all' ? null : activeTab;
        response = await getEventsByStatus({
          search: searchTerm || '',
          status: statusParam,
          pageNumber: page,
          pageSize: pageSize,
          startDate: startDate ? new Date(startDate).toISOString() : '',
          endDate: endDate ? new Date(endDate).toISOString() : '',
        });
      }
      
      if (response) {
        const eventsData = response.items || response || [];
        const totalCount = response.totalItems || response.totalCount || eventsData.length;
        
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
    navigate(`/organizer/event/${eventId}`);
  };

  const handleEditEvent = (eventId) => {
    navigate(`/organizer/event/${eventId}/edit`);
  };

  const handleDeleteEvent = (eventId) => {
    const event = allEvents.find(e => e.eventId === eventId);
    setEventToDelete(event);
    setDeleteReason('');
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    const hasBookings = eventToDelete.totalPersonJoin > 0;
    
    if (hasBookings && !deleteReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy bỏ sự kiện');
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = hasBookings 
        ? await deleteEventAPI(eventToDelete.eventId, deleteReason.trim())
        : await deleteEventAPI(eventToDelete.eventId);
      
      if (response !== null) {
        toast.success('Xóa sự kiện thành công!', { duration: 3000 });
        
        // Update local state immediately for better UX
        setAllEvents(prev => prev.filter(event => event.eventId !== eventToDelete.eventId));
        setEvents(prev => prev.filter(event => event.eventId !== eventToDelete.eventId));
        
        // Close dialog and reset state
        setDeleteDialogOpen(false);
        setEventToDelete(null);
        setDeleteReason('');
        
        // Reload to sync with server
        loadEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền xóa sự kiện này');
      } else if (error.response?.status === 404) {
        toast.error('Sự kiện không tồn tại');
      } else if (error.response?.status === 400) {
        toast.error('Không thể xóa sự kiện đã có người đăng ký');
      } else {
        toast.error('Có lỗi xảy ra khi xóa sự kiện');
      }
    } finally {
      setIsDeleting(false);
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
  const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '0đ';

  const absAmount = Math.abs(amount);

  if (absAmount >= 1_000_000_000) {
    // Tỷ
    return `${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
  } else if (absAmount >= 1_000_000) {
    // Triệu
    return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M`;
  } else if (absAmount >= 1_000) {
    // Nghìn
    return `${(amount / 1_000).toFixed(0)}K`;
  } else {
    // Dưới 1 nghìn thì hiển thị đầy đủ
    return `${amount.toLocaleString('vi-VN')}đ`;
  }
};

  const getTabDisplayName = (tab) => {
    switch (tab) {
      case 'all': return 'Tất cả sự kiện';
      case 'draft': return 'Bản nháp';
      case EventStatus.PendingApproval: return 'Chờ phê duyệt';
      case EventStatus.Approved: return 'Đã phê duyệt';
      case EventStatus.Rejected: return 'Bị từ chối';
      case EventStatus.Cancelled: return 'Đã hủy';
      case EventStatus.WaitingForPayout: return 'Chờ thanh toán';
      case EventStatus.PaidOut: return 'Đã thanh toán';
      case EventStatus.ErrorPayment: return 'Lỗi thanh toán';
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

  // Modified getEventStats to use allEventsForStats instead of allEvents
  const getEventStats = () => {
    if (!allEventsForStats.length) return { 
      total: 0, 
      approved: 0, 
      pendingApproval: 0, 
      rejected: 0, 
      totalRegistrations: 0 
    };

    // Count events by status
    const approved = allEventsForStats.filter(event => 
      'status' in event && event.status === EventStatus.Approved
    ).length;
    
    const pendingApproval = allEventsForStats.filter(event => 
      'status' in event && event.status === EventStatus.PendingApproval
    ).length;
    
    const rejected = allEventsForStats.filter(event => 
      'status' in event && event.status === EventStatus.Rejected
    ).length;
    
    // Calculate total registrations
    const totalRegistrations = allEventsForStats.reduce((sum, event) => {
      return sum + (('totalPersonJoin' in event) ? event.totalPersonJoin : 0);
    }, 0);

    return {
      total: allEventsForStats.length,
      approved,
      pendingApproval,
      rejected,
      totalRegistrations
    };
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
    setStartDate('');
    setEndDate('');
    setDateError('');
    setQuickFilter(null);
  };

  // Handle quick filter change
  const handleQuickFilterChange = (range, filter) => {
    setStartDate(range.start);
    setEndDate(range.end);
    setQuickFilter(filter);
    setDateError('');
  };

  // Toggle metrics expansion for a specific event
  const toggleMetrics = (eventId) => {
    setExpandedMetrics(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents(currentPage);
    setIsRefreshing(false);
    toast.success('Đã cập nhật danh sách sự kiện');
  };

  // Get tab count for badge display
  const getTabCount = useCallback((tab) => {
    if (!allEventsForStats.length) return 0;
    
    switch (tab) {
      case 'all':
        return allEventsForStats.length;
      case 'draft':
        return allEventsForStats.filter(e => !e.status).length;
      case EventStatus.PendingApproval:
        return allEventsForStats.filter(e => e.status === EventStatus.PendingApproval).length;
      case EventStatus.Approved:
        return allEventsForStats.filter(e => e.status === EventStatus.Approved).length;
      case EventStatus.Rejected:
        return allEventsForStats.filter(e => e.status === EventStatus.Rejected).length;
      case EventStatus.Cancelled:
        return allEventsForStats.filter(e => e.status === EventStatus.Cancelled).length;
      case EventStatus.WaitingForPayout:
        return allEventsForStats.filter(e => e.status === EventStatus.WaitingForPayout).length;
      case EventStatus.PaidOut:
        return allEventsForStats.filter(e => e.status === EventStatus.PaidOut).length;
      case EventStatus.ErrorPayment:
        return allEventsForStats.filter(e => e.status === EventStatus.ErrorPayment).length;
      default:
        return 0;
    }
  }, [allEventsForStats]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm || startDate || endDate || sortBy !== 'newest';
  }, [searchTerm, startDate, endDate, sortBy]);

  // Handle start date change with validation
  const handleStartDateChange = (value) => {
    setDateError(''); // Clear error when user starts changing
    setStartDate(value);
    
    // Validate if both dates are set
    if (value && endDate) {
      const start = new Date(value);
      const end = new Date(endDate);
      
      if (start > end) {
        setDateError('Ngày bắt đầu không thể sau ngày kết thúc');
        return;
      }
    }
  };

  // Handle end date change with validation
  const handleEndDateChange = (value) => {
    setDateError(''); // Clear error when user starts changing
    setEndDate(value);
    
    // Validate if both dates are set
    if (startDate && value) {
      const start = new Date(startDate);
      const end = new Date(value);
      
      if (start > end) {
        setDateError('Ngày kết thúc không thể trước ngày bắt đầu');
        return;
      }
    }
  };

  const stats = getEventStats();
  
  // Use server-side pagination - events array already contains the correct page of events
  const paginatedEvents = events;

  // Get event image
  const getEventImage = (event) => {
    if (event.imgListEvent && event.imgListEvent.length > 0) {
      return event.imgListEvent[0];
    }
    return null;
  };

  const handleCloneEvent = (event) => {
    // Store only the event ID for cloning - will fetch full details in CreateEventPage
    localStorage.setItem('cloneEventId', event.eventId);
    
    // Navigate to create event page
    navigate(PATH.ORGANIZER_CREATE);
  };

  // Get status configuration for styling
  const getStatusConfig = (status) => {
    const config = {
      [EventStatus.Approved]: {
        badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300",
        icon: CheckCircle,
        glow: "shadow-lg shadow-emerald-500/20"
      },
      [EventStatus.Rejected]: {
        badge: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300",
        icon: XCircle,
        glow: "shadow-lg shadow-red-500/20"
      },
      [EventStatus.Cancelled]: {
        badge: "bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300",
        icon: XCircle,
        glow: "shadow-lg shadow-gray-500/20"
      },
      [EventStatus.WaitingForPayout]: {
        badge: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300",
        icon: Clock,
        glow: "shadow-lg shadow-indigo-500/20"
      },
      [EventStatus.PaidOut]: {
        badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300",
        icon: CheckCircle,
        glow: "shadow-lg shadow-blue-500/20"
      },
      [EventStatus.ErrorPayment]: {
        badge: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300",
        icon: AlertTriangle,
        glow: "shadow-lg shadow-orange-500/20"
      },
      [EventStatus.PendingApproval]: {
        badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300",
        icon: Clock,
        glow: "shadow-lg shadow-amber-500/20"
      },
      default: {
        badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300",
        icon: Clock,
        glow: "shadow-lg shadow-amber-500/20"
      }
    };
    
    return config[status] || config.default;
  };

  // Get hero event for featured display
  const heroEvent = events.length > 0 ? events[0] : null;
  const heroEventOccupancyRate = heroEvent ? Math.round((heroEvent.totalPersonJoin || 0) / (heroEvent.totalPerson || 1) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Stats Section - Static at top instead of fixed */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-slate-900/50 border-b border-white/20 dark:border-white/10 shadow-lg shadow-slate-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Total Events */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl p-4 hover:scale-[1.03] transition-transform duration-300">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Tổng sự kiện
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tất cả sự kiện</p>
              </div>
            </div>

            {/* Approved */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl p-4 hover:scale-[1.03] transition-transform duration-300">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Đã phê duyệt
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  {stats.approved}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đã được công khai</p>
              </div>
            </div>

            {/* Pending */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl p-4 hover:scale-[1.03] transition-transform duration-300">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Chờ phê duyệt
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                  {stats.pendingApproval}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đợi hệ thống xử lý</p>
              </div>
            </div>

            {/* Rejected */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl p-4 hover:scale-[1.03] transition-transform duration-300">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Bị từ chối
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.rejected}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kiểm tra nguyên do</p>
              </div>
            </div>

            {/* Total Registrations */}
            <div className="group relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl p-4 hover:scale-[1.03] transition-transform duration-300">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Mua vé
                </p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-2">
                  {stats.totalRegistrations}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tổng số người mua vé</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - with reduced padding since stats section is no longer fixed */}
      <div className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Event Section */}
          {heroEvent && (
            <div className="mb-8 group pt-6">
              <div className="relative rounded-[32px] overflow-hidden h-96 shadow-2xl">
                {/* Background image with overlay */}
                {getEventImage(heroEvent) ? (
                  <img
                    src={getEventImage(heroEvent)}
                    alt={heroEvent.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Calendar className="h-24 w-24 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />

                {/* Content overlay */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  {/* Status badge top-right */}
                  <div className="flex justify-end">
                    {heroEvent.status && (() => {
                      const statusConfig = getStatusConfig(heroEvent.status);
                      return (
                        <Badge className={`${statusConfig.badge} backdrop-blur-sm border-0 rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg ${statusConfig.glow}`}>
                          {statusConfig.icon && <statusConfig.icon className="w-3 h-3 mr-1.5" />}
                          {EventStatusDisplay[heroEvent.status] || heroEvent.status}
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Title and details */}
                  <div className="text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{heroEvent.title}</h1>
                    <div className="flex flex-wrap gap-3 mb-6">
                      <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {formatDate(heroEvent.startTime).split(' ')[0]} • {formatDate(heroEvent.startTime).split(' ')[1]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {heroEvent.locationName || 'Không có địa điểm'}
                        </span>
                      </div>
                    </div>

                    {/* Metrics pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-center hover:bg-white/20 transition-colors">
                        <p className="text-xs text-white/70 mb-0.5">Lượt xem</p>
                        <p className="text-lg font-bold text-white">{heroEvent.viewCount || 0}</p>
                      </div>
                      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-center hover:bg-white/20 transition-colors">
                        <p className="text-xs text-white/70 mb-0.5">Đăng ký</p>
                        <p className="text-lg font-bold text-white">
                          {heroEvent.totalPersonJoin || heroEvent.soldQuantity || 0}
                        </p>
                      </div>
                      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-center hover:bg-white/20 transition-colors">
                        <p className="text-xs text-white/70 mb-0.5">Doanh thu</p>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(heroEvent.totalAmount)}
                        </p>
                      </div>
                      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-center hover:bg-white/20 transition-colors">
                        <p className="text-xs text-white/70 mb-0.5">Thanh toán</p>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(heroEvent.payoutAmount)}
                        </p>
                      </div>
                      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-center hover:bg-white/20 transition-colors">
                        <p className="text-xs text-white/70 mb-0.5">Sức chứa</p>
                        <p className="text-lg font-bold text-white">{heroEventOccupancyRate}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="mb-8 backdrop-blur-sm bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl shadow-lg overflow-visible">
            {/* Filter Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Radial Status Menu */}
                <div className="relative z-50">
                  <RadialStatusMenu
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setShowInitiationDropdown(false);
                      setShowCompletionDropdown(false);
                    }}
                    stats={{
                      total: getTabCount('all'),
                      draft: getTabCount('draft'),
                      pendingApproval: getTabCount(EventStatus.PendingApproval),
                      approved: getTabCount(EventStatus.Approved),
                      rejected: getTabCount(EventStatus.Rejected),
                      cancelled: getTabCount(EventStatus.Cancelled),
                      waitingForPayout: getTabCount(EventStatus.WaitingForPayout),
                      paidOut: getTabCount(EventStatus.PaidOut),
                      errorPayment: getTabCount(EventStatus.ErrorPayment),
                    }}
                    showDraft={true}
                    showFlagged={false}
                    EventStatus={EventStatus}
                  />
                </div>
                
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Bộ lọc
                  {hasActiveFilters && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">
                      !
                    </span>
                  )}
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Xóa tất cả
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    title="Chế độ danh sách"
                  >
                    <List className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    title="Chế độ thu gọn"
                  >
                    <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Collapsible Filter Content */}
            <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="p-6 space-y-4">
                {/* Quick Filter Chips */}
                <QuickFilterChips
                  onFilterChange={handleQuickFilterChange}
                  activeFilter={quickFilter}
                  startDate={startDate}
                  endDate={endDate}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* Search */}
                  <div className="relative md:col-span-3">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm sự kiện..."
                      className="pl-11 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>

                  {/* Start Date */}
                  <div className="relative">
                    <Input
                      type="date"
                      placeholder="Từ ngày"
                      className={`py-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${dateError ? 'border-red-500 focus:border-red-500' : ''}`}
                      value={startDate}
                      onChange={(e) => { handleStartDateChange(e.target.value); setQuickFilter(null); }}
                      max={endDate || undefined}
                    />
                    {startDate && (
                      <button
                        onClick={() => { setStartDate(''); setDateError(''); setQuickFilter(null); }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="relative">
                    <Input
                      type="date"
                      placeholder="Đến ngày"
                      className={`py-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${dateError ? 'border-red-500 focus:border-red-500' : ''}`}
                      value={endDate}
                      onChange={(e) => { handleEndDateChange(e.target.value); setQuickFilter(null); }}
                      min={startDate || undefined}
                    />
                    {endDate && (
                      <button
                        onClick={() => { setEndDate(''); setDateError(''); setQuickFilter(null); }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                      <SelectItem value="name">Theo tên A-Z</SelectItem>
                      <SelectItem value="startTime">Theo ngày bắt đầu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Error message */}
                {dateError && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{dateError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Events List */}
          {isLoading ? (
            <EventCardSkeleton count={3} />
          ) : events.length === 0 ? (
            <EmptyEventState
              type={hasActiveFilters ? 'no-results' : (allEventsForStats.length === 0 ? 'no-events' : 'no-category')}
              categoryName={getTabDisplayName(activeTab)}
              onCreateEvent={() => navigate(PATH.ORGANIZER_CREATE)}
              onClearFilters={handleClearFilters}
              showCreateButton={!hasActiveFilters}
            />
          ) : (
            <div className={`${viewMode === 'compact' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}`}>
              {paginatedEvents.map((event) => {
                const eventImage = getEventImage(event);
                const eventStatus = 'status' in event ? event.status : null;
                const statusConfig = eventStatus ? getStatusConfig(eventStatus) : getStatusConfig('default');
                const occupancyRate = event.totalPerson && event.totalPerson > 0 
                  ? Math.round((event.totalPersonJoin || 0) / event.totalPerson * 100) 
                  : 0;
                const isMetricsExpanded = expandedMetrics[event.eventId] === true; // Default to collapsed

                return (
                  <div
                    key={event.eventId}
                    className={`group backdrop-blur-sm ${
                      event.isFlagWarning 
                        ? 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' 
                        : 'bg-white/60 dark:bg-white/5 border-white/60 dark:border-white/10'
                    } border rounded-2xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 shadow-lg`}
                  >
                    <div className={`flex ${viewMode === 'compact' ? 'flex-col' : 'flex-col lg:flex-row'} gap-0`}>
                      {/* Event thumbnail */}
                      <div className={`flex-shrink-0 ${viewMode === 'compact' ? 'w-full aspect-[16/9]' : 'lg:w-[420px] w-full h-56 lg:h-auto lg:min-h-[280px]'} overflow-hidden relative`}>
                        {eventImage ? (
                          <>
                            <img
                              src={eventImage}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                            <SaleCountdown saleStartTime={event.saleStartTime} variant="thumbnail" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-blue-400" />
                          </div>
                        )}
                        {/* Quick status indicator on image */}
                        {eventStatus && viewMode === 'compact' && (
                          <div className="absolute top-2 right-2">
                            <Badge className={`${statusConfig.badge} border-0 rounded-full px-2 py-0.5 text-xs font-semibold shadow-lg`}>
                              {statusConfig.icon && <statusConfig.icon className="w-3 h-3" />}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 ${viewMode === 'compact' ? 'p-4' : 'p-6 lg:p-8'} flex flex-col justify-between`}>
                        {/* Header */}
                        <div className={viewMode === 'compact' ? 'mb-2' : 'mb-4'}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 
                              className={`${viewMode === 'compact' ? 'text-base line-clamp-1' : 'text-lg'} font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer`}
                              onClick={() => handleViewEvent(event.eventId)}
                            >
                              {event.title}
                            </h3>
                            {eventStatus && activeTab !== 'draft' && viewMode !== 'compact' && (
                              <Badge
                                className={`${statusConfig.badge} border-0 whitespace-nowrap flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all group-hover:shadow-lg group-hover:${statusConfig.glow}`}
                              >
                                {statusConfig.icon && <statusConfig.icon className="w-3 h-3 mr-1.5" />}
                                {EventStatusDisplay[eventStatus] || eventStatus}
                              </Badge>
                            )}
                          </div>

                          {/* Event details */}
                          <div className={`flex flex-wrap ${viewMode === 'compact' ? 'gap-2 text-xs' : 'gap-4 text-sm'} text-slate-600 dark:text-slate-400`}>
                            <div className="flex items-center gap-1.5">
                              <Calendar className={`${viewMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} text-indigo-500/70`} />
                              <span>
                                {formatDate(event.startTime).split(' ')[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className={`${viewMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} text-indigo-500/70`} />
                              <span className={`truncate ${viewMode === 'compact' ? 'max-w-[100px]' : ''}`}>
                                {event.locationName || 'Không có địa điểm'}
                              </span>
                            </div>
                            {viewMode !== 'compact' && (
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-indigo-500/70" />
                                <span>
                                  {event.totalPersonJoin || event.soldQuantity || 0}/
                                  {event.totalPerson || event.totalTickets || 0} người
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status messages */}
                        {eventStatus === EventStatus.Rejected && event.rejectReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-red-800 text-sm">
                              <strong>Lý do từ chối:</strong> {event.rejectReason}
                            </p>
                          </div>
                        )}

                        {/* {eventStatus === EventStatus.Cancelled && event.reasonCancel && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                            <p className="text-gray-800 text-sm">
                              <strong>Lý do hủy:</strong> {event.reasonCancel}
                            </p>
                          </div>
                        )} */}

                        {event.isFlagWarning && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <p className="text-orange-800 text-sm">
                              <strong>Sự kiện đã bị hủy với lý do:</strong> {event.reasonCancel}
                            </p>
                          </div>
                        )}

                        {/* Event category and ticket type badges */}
                        <div className="flex items-center gap-2 mb-4">
                          {event.eventCategoryName && (
                            <Badge variant="outline" className="text-xs bg-white/50 dark:bg-white/10 border-white/20">
                              {event.eventCategoryName}
                            </Badge>
                          )}
                        </div>

                        {/* Collapsible Metrics grid */}
                        <div className="mb-4">
                          {viewMode !== 'compact' && (
                            <button
                              onClick={() => toggleMetrics(event.eventId)}
                              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2 transition-colors"
                            >
                              {isMetricsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isMetricsExpanded ? 'Ẩn thống kê' : 'Xem thống kê'}
                            </button>
                          )}
                          
                          <div className={`transition-all duration-300 ease-in-out ${isMetricsExpanded || viewMode === 'compact' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className={`grid ${viewMode === 'compact' ? 'grid-cols-3 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'} pb-4 border-b border-white/10`}>
                              <div className="backdrop-blur-sm bg-gradient-to-br from-slate-100/50 to-slate-50/30 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl p-2 sm:p-3 text-center hover:scale-105 transition-transform">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Lượt xem</p>
                                <p className={`${viewMode === 'compact' ? 'text-sm' : 'text-base'} font-bold text-slate-900 dark:text-white`}>{event.viewCount || 0}</p>
                              </div>
                              <div className="backdrop-blur-sm bg-gradient-to-br from-blue-100/50 to-blue-50/30 dark:from-blue-900/50 dark:to-blue-800/30 rounded-xl p-2 sm:p-3 text-center hover:scale-105 transition-transform">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Đăng ký</p>
                                <p className={`${viewMode === 'compact' ? 'text-sm' : 'text-base'} font-bold text-blue-700 dark:text-blue-400`}>
                                  {event.totalPersonJoin || event.soldQuantity || 0}
                                </p>
                              </div>
                              <div className="backdrop-blur-sm bg-gradient-to-br from-green-100/50 to-green-50/30 dark:from-green-900/50 dark:to-green-800/30 rounded-xl p-2 sm:p-3 text-center hover:scale-105 transition-transform">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Doanh thu</p>
                                <p className={`${viewMode === 'compact' ? 'text-sm' : 'text-base'} font-bold text-green-700 dark:text-green-400`}>
                                  {formatCurrency(event.totalAmount)}
                                </p>
                              </div>
                              {viewMode !== 'compact' && (
                                <>
                                  <div className="backdrop-blur-sm bg-gradient-to-br from-emerald-100/50 to-emerald-50/30 dark:from-emerald-900/50 dark:to-emerald-800/30 rounded-xl p-2 sm:p-3 text-center hover:scale-105 transition-transform">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Thanh toán</p>
                                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                                      {formatCurrency(event.payoutAmount)}
                                    </p>
                                  </div>
                                  <div className="backdrop-blur-sm bg-gradient-to-br from-purple-100/50 to-purple-50/30 dark:from-purple-900/50 dark:to-purple-800/30 rounded-xl p-2 sm:p-3 text-center hover:scale-105 transition-transform">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Sức chứa</p>
                                    <p className="text-base font-bold text-purple-700 dark:text-purple-400">{occupancyRate}%</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className={`flex items-center ${viewMode === 'compact' ? 'justify-between' : 'justify-end'} gap-2`}>
                          {viewMode === 'compact' ? (
                            <>
                              {/* Compact view: Icon-only buttons */}
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors h-8 w-8 p-0"
                                  onClick={() => handleViewEvent(event.eventId)}
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {eventStatus === EventStatus.PendingApproval && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors h-8 w-8 p-0"
                                    onClick={() => handleEditEvent(event.eventId)}
                                    title="Chỉnh sửa"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-slate-600 dark:text-slate-400 hover:bg-red-100/50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors h-8 w-8 p-0"
                                  onClick={() => handleDeleteEvent(event.eventId)}
                                  title="Hủy sự kiện"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 rounded-lg transition-colors h-8 w-8 p-0"
                                title="Thêm tùy chọn"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {/* List view: Full buttons with labels */}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors h-9"
                                onClick={() => handleViewEvent(event.eventId)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Xem
                              </Button>
                              {eventStatus === EventStatus.PendingApproval && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors h-9"
                                  onClick={() => handleEditEvent(event.eventId)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Sửa
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors h-9"
                                onClick={() => handleDeleteEvent(event.eventId)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Hủy
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors h-9"
                                onClick={() => handleCloneEvent(event)}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Clone
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 rounded-lg transition-colors h-9"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  setCurrentPage(newPage);
                  loadEvents(newPage);
                }}
                disabled={currentPage === 1}
                className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
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
                    className={`rounded-xl ${
                      currentPage === page 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg' 
                        : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
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
                className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Xác nhận hủy sự kiện
            </DialogTitle>
            <DialogDescription className="text-left">
              Bạn có chắc chắn muốn hủy sự kiện <span className="font-semibold text-slate-900 dark:text-white">"{eventToDelete?.title}"</span>?
              {eventToDelete?.totalPersonJoin > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  ⚠️ Sự kiện này đã có {eventToDelete.totalPersonJoin} người đăng ký.
                </span>
              )}
              <span className="block mt-2 text-red-500">
                Hành động này không thể hoàn tác!
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {eventToDelete?.totalPersonJoin > 0 && (
            <div className="space-y-2">
              <Label htmlFor="deleteReason" className="text-sm font-medium">
                Lý do hủy sự kiện <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="deleteReason"
                placeholder="Nhập lý do hủy sự kiện..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setEventToDelete(null);
                setDeleteReason('');
              }}
              disabled={isDeleting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteEvent}
              disabled={isDeleting || (eventToDelete?.totalPersonJoin > 0 && !deleteReason.trim())}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xác nhận hủy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyEventsPage;