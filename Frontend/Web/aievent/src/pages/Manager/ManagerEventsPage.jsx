import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
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
  DialogTrigger,
} from '../../components/ui/dialog';
import { useEvents } from '../../hooks/useEvents';
import { PATH } from '../../routes/path';
import eventAPI from '../../api/eventAPI';
import organizerAPI from '../../api/organizerAPI';
import EventReportManager from '../../components/Manager/EventReportManager';

// Import EventStatus constants
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';

// Import the new SaleCountdown component
import SaleCountdown from '../../components/Event/SaleCountdown';

// Import new UI enhancement components
import EventCardSkeleton from '../../components/Event/EventCardSkeleton';
import EmptyEventState from '../../components/Event/EmptyEventState';
import QuickFilterChips from '../../components/Event/QuickFilterChips';
import RadialStatusMenu from '../../components/Event/RadialStatusMenu';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const initiationDropdownRef = useRef(null);
  const completionDropdownRef = useRef(null);
  const pageSize = 5;
  const [reportCounts, setReportCounts] = useState({});
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportDialogEvent, setReportDialogEvent] = useState(null);
  const [flaggedOrganizers, setFlaggedOrganizers] = useState([]);
  const [flaggedLoading, setFlaggedLoading] = useState(false);
  const [flaggedSearchTerm, setFlaggedSearchTerm] = useState('');

  // Add loading states for approval/rejection actions
  const [approvingEventId, setApprovingEventId] = useState(null);
  const [rejectingEventId, setRejectingEventId] = useState(null);
  const [resolvingPaymentEventId, setResolvingPaymentEventId] = useState(null);
  
  // State for resolve payment confirmation dialog
  const [isResolvePaymentDialogOpen, setIsResolvePaymentDialogOpen] = useState(false);
  const [selectedEventForPayment, setSelectedEventForPayment] = useState(null);
  
  // State for cancel event dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedEventForCancel, setSelectedEventForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingEventId, setCancellingEventId] = useState(null);

  // New state for storing all events for statistics
  const [allEventsForStats, setAllEventsForStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // UI Enhancement states
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'compact'
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState(null);
  const [expandedMetrics, setExpandedMetrics] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for expanded flagged organizers (to show/hide their events list)
  const [expandedFlaggedOrganizers, setExpandedFlaggedOrganizers] = useState({});

  // State for organizer filter
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState('');
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);

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

  // Load organizers when component mounts
  useEffect(() => {
    const loadOrganizers = async () => {
      setLoadingOrganizers(true);
      try {
        const response = await organizerAPI.getOrganizers({
          pageNumber: 1,
          pageSize: 1000, // Get all organizers
        });
        
        if (response) {
          const organizersData = response.items || response || [];
          console.log('Organizers data:', organizersData);
          console.log('First organizer:', organizersData[0]);
          setOrganizers(organizersData);
        } else {
          setOrganizers([]);
        }
      } catch (error) {
        console.error('Error loading organizers:', error);
        toast.error('Không thể tải danh sách nhà tổ chức');
        setOrganizers([]);
      } finally {
        setLoadingOrganizers(false);
      }
    };

    loadOrganizers();
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

  const loadFlaggedOrganizers = async (organizerIdParam = '', minFlagsParam = '') => {
    setFlaggedLoading(true);
    try {
      const response = await organizerAPI.getOrganizerFlags({
        organizerId: organizerIdParam || undefined,
        minFlags: minFlagsParam !== '' ? Number(minFlagsParam) : undefined,
        pageNumber: 1,
        pageSize: 50,
      });
      const items = response?.items || response || [];
      setFlaggedOrganizers(items);
    } catch (error) {
      console.error('Error loading flagged organizers:', error);
      toast.error('Không thể tải danh sách tổ chức/sự kiện bị gán cờ');
      setFlaggedOrganizers([]);
    } finally {
      setFlaggedLoading(false);
    }
  };

  useEffect(() => {
    loadFlaggedOrganizers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              'all', EventStatus.Cancelled].includes(activeTab)) {
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
      return;
    }

    if (activeTab === 'flagged') {
      setIsLoading(false);
      setEvents([]);
      setAllEvents([]);
      return;
    }

    setCurrentPage(1);
    loadEvents(1);
  }, [location.search, activeTab, searchTerm, filterStatus, sortBy, startDate, endDate, selectedOrganizerId]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFiltersAndSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, sortBy]);

  const loadEvents = async (page = 1) => {
    if (activeTab === 'flagged') {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      // Clear existing events immediately when switching tabs
      setEvents([]);
      setAllEvents([]);

      let response;
      if (activeTab === 'all') {
        // For the 'all' tab, we want to show all events including all approval statuses
        // Use getEventsByStatus without a status parameter to get all events
        response = await getEventsByStatus({ 
          search: searchTerm || '',
          pageNumber: page, 
          pageSize: pageSize,
          startDate: startDate ? new Date(startDate).toISOString() : '',
          endDate: endDate ? new Date(endDate).toISOString() : '',
          organizerId: selectedOrganizerId || undefined,
        });
      } else {
        // Load events by specific status
        response = await getEventsByStatus({
          search: searchTerm || '',
          status: activeTab !== 'all' ? activeTab : null,
          pageNumber: page,
          pageSize: pageSize,
          startDate: startDate ? new Date(startDate).toISOString() : '',
          endDate: endDate ? new Date(endDate).toISOString() : '',
          organizerId: selectedOrganizerId || undefined,
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

  const handleCancelEvent = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }

    if (!selectedEventForCancel) return;

    setCancellingEventId(selectedEventForCancel.eventId);
    try {
      const response = await eventAPI.cancelEvent(selectedEventForCancel.eventId, cancelReason.trim());

      if (response !== null) {
        toast.success('Hủy sự kiện thành công!', {
          duration: 3000,
        });

        // Close dialog and reset state
        setIsCancelDialogOpen(false);
        setSelectedEventForCancel(null);
        setCancelReason('');

        // Update local state immediately for better UX
        setAllEvents(prev => prev.filter(event => event.eventId !== selectedEventForCancel.eventId));
        setEvents(prev => prev.filter(event => event.eventId !== selectedEventForCancel.eventId));

        // Reload to sync with server
        loadEvents();
      }
    } catch (error) {
      console.error('Error canceling event:', error);
      if (error.response?.status === 403) {
        toast.error(' Bạn không có quyền hủy sự kiện này');
      } else if (error.response?.status === 404) {
        toast.error(' Sự kiện không tồn tại');
      } else if (error.response?.status === 400) {
        toast.error(' Không thể hủy sự kiện này');
      } else {
        toast.error(' Có lỗi xảy ra khi hủy sự kiện');
      }
    } finally {
      setCancellingEventId(null);
    }
  };

  // Handle event approval
  const handleApproveEvent = async (eventId) => {
    // Prevent multiple clicks
    if (approvingEventId) return;
    
    setApprovingEventId(eventId);
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
    } finally {
      setApprovingEventId(null);
    }
  };

  // Handle event rejection
  const handleRejectEvent = async (eventId, reason) => {
    // Prevent multiple clicks
    if (rejectingEventId) return;
    
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    setRejectingEventId(eventId);
    try {
      const response = await confirmEventAPI(eventId, {
        status: EventStatus.Rejected,
        reason: reason
      });

      if (response) {
        setRejectionReason('');
        loadEvents();
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Có lỗi xảy ra khi từ chối sự kiện');
    } finally {
      setRejectingEventId(null);
    }
  };

  // Handle resolve error payment
  const handleResolveErrorPayment = async (eventId) => {
    // Prevent multiple clicks
    if (resolvingPaymentEventId) return;

    setResolvingPaymentEventId(eventId);
    try {
      const response = await eventAPI.resolveErrorPayment(eventId);

      if (response) {
        toast.success('✅ Thanh toán lại thành công! Trạng thái sự kiện đã được cập nhật sang "Đã thanh toán".', {
          duration: 4000,
        });
        setIsResolvePaymentDialogOpen(false);
        setSelectedEventForPayment(null);
        loadEvents();
      }
    } catch (error) {
      console.error('Error resolving payment:', error);
      
      // Get error message from response
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.data?.statusCode;
      
      // Handle specific error cases
      if (errorMessage?.includes('Event not found')) {
        toast.error(' Không tìm thấy sự kiện hoặc sự kiện không ở trạng thái lỗi thanh toán');
      } else if (errorMessage?.includes('Payment information not found')) {
        toast.error(' Nhà tổ chức chưa thêm thông tin thanh toán. Vui lòng yêu cầu nhà tổ chức cập nhật thông tin ngân hàng.');
      } else if (errorMessage?.includes('Organizer profile not found')) {
        toast.error(' Không tìm thấy thông tin nhà tổ chức');
      } else if (errorMessage?.includes('System setting not found')) {
        toast.error(' Lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên.');
      } else if (errorMessage?.includes('Payout amount is negative')) {
        toast.error(' Số tiền thanh toán không hợp lệ (âm). Vui lòng kiểm tra lại doanh thu sự kiện.');
      } else if (errorMessage?.includes('Payout transaction failed')) {
        toast.error(' Giao dịch thanh toán thất bại. Vui lòng thử lại sau hoặc kiểm tra thông tin ngân hàng.');
      } else if (errorMessage?.includes('Failed to process payout')) {
        toast.error(' Lỗi xử lý thanh toán: ' + errorMessage);
      } else if (error.response?.status === 403) {
        toast.error(' Bạn không có quyền thực hiện thao tác này');
      } else if (error.response?.status === 400) {
        toast.error(' ' + (errorMessage || 'Không thể thanh toán lại cho sự kiện này'));
      } else {
        toast.error(' Có lỗi xảy ra khi thanh toán lại: ' + (errorMessage || 'Vui lòng thử lại sau'));
      }
    } finally {
      setResolvingPaymentEventId(null);
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
  const getTabDisplayName = (tab) => {
    switch (tab) {
      case 'all': return 'Tất cả sự kiện';
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
    setSelectedOrganizerId('');
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
    return searchTerm || startDate || endDate || sortBy !== 'newest' || selectedOrganizerId;
  }, [searchTerm, startDate, endDate, sortBy, selectedOrganizerId]);

  const handleSearchFlagged = () => {
    const trimmed = flaggedSearchTerm.trim();
    setFlaggedSearchTerm(trimmed);

    const isNumeric = trimmed !== '' && !Number.isNaN(Number(trimmed));
    const minFlags = isNumeric ? trimmed : '';
    loadFlaggedOrganizers('', minFlags);
  };

  const handleClearFlagged = () => {
    setFlaggedSearchTerm('');
    loadFlaggedOrganizers('');
  };

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

  const filteredFlaggedOrganizers = useMemo(() => {
    const term = flaggedSearchTerm.trim().toLowerCase();
    if (!term) return flaggedOrganizers;

    return flaggedOrganizers.filter((org) => {
      const companyName = (org.companyName || org.contactName || '').toLowerCase();
      const organizerId = (org.id || '').toLowerCase();
      const totalFlags = String(org.totalEventFlags ?? '').toLowerCase();
      const eventMatch = (org.flaggedEvents || []).some(
        (fe) => (fe.title || '').toLowerCase().includes(term)
      );

      return (
        companyName.includes(term) ||
        organizerId.includes(term) ||
        totalFlags.includes(term) ||
        eventMatch
      );
    });
  }, [flaggedSearchTerm, flaggedOrganizers]);

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
                    {heroEvent.status && (
                      <Badge className="bg-emerald-500/90 dark:bg-emerald-600/90 text-white backdrop-blur-sm border-emerald-400/50 rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg shadow-emerald-500/30">
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        {EventStatusDisplay[heroEvent.status] || heroEvent.status}
                      </Badge>
                    )}
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
                          {heroEvent.totalAmount ? `${(heroEvent.totalAmount / 1000000).toFixed(1)}M` : '0đ'}
                        </p>
                      </div>
                      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-center hover:bg-white/20 transition-colors">
                        <p className="text-xs text-white/70 mb-0.5">Thanh toán</p>
                        <p className="text-lg font-bold text-white">
                          {heroEvent.payoutAmount ? `${(heroEvent.payoutAmount / 1000000).toFixed(1)}M` : '0đ'}
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
                      navigate(`${PATH.MANAGER_EVENTS}?tab=${tab}`);
                    }}
                    stats={{
                      total: getTabCount('all'),
                      pendingApproval: getTabCount(EventStatus.PendingApproval),
                      approved: getTabCount(EventStatus.Approved),
                      rejected: getTabCount(EventStatus.Rejected),
                      cancelled: getTabCount(EventStatus.Cancelled),
                      waitingForPayout: getTabCount(EventStatus.WaitingForPayout),
                      paidOut: getTabCount(EventStatus.PaidOut),
                      errorPayment: getTabCount(EventStatus.ErrorPayment),
                      flagged: flaggedOrganizers.length,
                    }}
                    showDraft={false}
                    showFlagged={true}
                    EventStatus={EventStatus}
                  />
                </div>
                
                {activeTab !== 'flagged' && (
                  <>
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
                  </>
                )}
              </div>
              
              {activeTab !== 'flagged' && (
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
              )}
            </div>
            
            {/* Collapsible Filter Content - Hidden when on flagged tab */}
            <div className={`transition-all duration-300 ease-in-out ${showFilters && activeTab !== 'flagged' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
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
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm sự kiện..."
                      className="pl-11 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>

                  {/* Organizer Filter */}
                  <Select value={selectedOrganizerId || "all"} onValueChange={(value) => setSelectedOrganizerId(value === "all" ? "" : value)}>
                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                      <SelectValue placeholder="Nhà tổ chức" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả nhà tổ chức</SelectItem>
                      {organizers.map((organizer, index) => {
                        const displayName = organizer.companyName || 
                                           organizer.CompanyName || 
                                           organizer.organizerName || 
                                           organizer.OrganizerName || 
                                           organizer.name || 
                                           organizer.Name ||
                                           organizer.fullName ||
                                           organizer.FullName ||
                                           organizer.contactEmail || 
                                           organizer.email || 
                                           organizer.Email ||
                                           `Organizer ${index + 1}`;
                        
                        const organizerId = organizer.id || organizer.organizerProfileId || organizer.OrganizerProfileId || `organizer-${index}`;
                        
                        return (
                          <SelectItem key={organizerId} value={organizerId}>
                            {displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

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

          {activeTab === 'flagged' ? (
            <div className="mb-8 backdrop-blur-sm bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Organizer & sự kiện bị gán cờ
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Danh sách các organizer bị gán cờ vi phạm, kèm các sự kiện đã bị hủy.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    placeholder="Tìm tên công ty, sự kiện hoặc số sự kiện bị gắn cờ"
                    value={flaggedSearchTerm}
                    onChange={(e) => setFlaggedSearchTerm(e.target.value)}
                    className="w-72"
                  />
                  <Button onClick={handleSearchFlagged} className="whitespace-nowrap">
                    Tìm
                  </Button>
                  <Button variant="outline" onClick={handleClearFlagged} className="whitespace-nowrap">
                    Xóa lọc
                  </Button>
                </div>
              </div>

              {flaggedLoading ? (
                <div className="flex items-center justify-center py-6 text-slate-500">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang tải danh sách bị gán cờ...
                </div>
              ) : filteredFlaggedOrganizers.length === 0 ? (
                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  Không có organizer/sự kiện nào bị gán cờ phù hợp bộ lọc.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {filteredFlaggedOrganizers.map((org) => {
                    const isExpanded = expandedFlaggedOrganizers[org.id] === true;
                    const flaggedEventsCount = org.flaggedEvents?.length || 0;
                    const maxVisibleEvents = 2; // Show only 2 events by default
                    const hasMoreEvents = flaggedEventsCount > maxVisibleEvents;
                    const visibleEvents = isExpanded 
                      ? org.flaggedEvents 
                      : (org.flaggedEvents?.slice(0, maxVisibleEvents) || []);

                    return (
                      <Card key={org.id} className="border-slate-200/60 dark:border-slate-800/60">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                                {org.companyName || org.contactName || 'Organizer'}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {org.contactEmail || 'Không có email'} • {org.contactPhone || 'Không có SĐT'}
                              </p>
                              <p className="text-sm text-slate-500">
                                Tổng số sự kiện bị gán cờ: {org.totalEventFlags ?? 0}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {org.isBanned && (
                                <Badge variant="destructive" className="px-3 py-1">
                                  Đã cấm
                                </Badge>
                              )}
                              <Badge variant="outline" className="px-3 py-1">
                                {org.organizationType || 'Organizer'}
                              </Badge>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                            {flaggedEventsCount > 0 ? (
                              <>
                                {visibleEvents.map((fe) => (
                                  <div
                                    key={fe.eventId}
                                    className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white/70 dark:bg-slate-900/40"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{fe.title || 'Sự kiện'}</p>
                                        <p className="text-xs text-slate-500">
                                          {fe.startTime ? formatDate(fe.startTime) : 'Chưa có thời gian'}
                                        </p>
                                        {fe.reasonCancel && (
                                          <p className="text-xs text-red-500 mt-1">Lý do hủy: {fe.reasonCancel}</p>
                                        )}
                                      </div>
                                      <Badge variant="outline" className="whitespace-nowrap">
                                        {EventStatusDisplay[fe.status] || fe.status || 'Đã hủy'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Expand/Collapse button */}
                                {hasMoreEvents && (
                                  <button
                                    onClick={() => setExpandedFlaggedOrganizers(prev => ({
                                      ...prev,
                                      [org.id]: !prev[org.id]
                                    }))}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-4 h-4" />
                                        Thu gọn
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4" />
                                        Xem thêm {flaggedEventsCount - maxVisibleEvents} sự kiện
                                      </>
                                    )}
                                  </button>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">Không có sự kiện bị gán cờ.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Events List */}
              {isLoading ? (
                <EventCardSkeleton count={3} />
              ) : events.length === 0 ? (
                <EmptyEventState
                  type={hasActiveFilters ? 'no-results' : (allEventsForStats.length === 0 ? 'no-events' : 'no-category')}
                  categoryName={getTabDisplayName(activeTab)}
                  onClearFilters={handleClearFilters}
                  showCreateButton={false}
                />
              ) : (
                <div className={`${viewMode === 'compact' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}`}>
                  {paginatedEvents.map((event) => {
                const eventImage = getEventImage(event);
                const eventStatus = 'status' in event ? event.status : null;
                const statusConfig = eventStatus ? getStatusConfig(eventStatus) : getStatusConfig('default');
                const eventReportCount = reportCounts[event.eventId];
                const displayReportCount = typeof eventReportCount === 'number' ? eventReportCount : '…';
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
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <SaleCountdown saleStartTime={event.saleStartTime} variant="thumbnail" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-blue-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
                        {/* Header */}
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3
                              className="text-lg font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              onClick={() => handleViewEvent(event.eventId)}
                            >
                              {event.title}
                            </h3>
                            {eventStatus && (
                              <Badge
                                className={`${statusConfig.badge} border-0 whitespace-nowrap flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all group-hover:shadow-lg group-hover:${statusConfig.glow}`}
                              >
                                {statusConfig.icon && <statusConfig.icon className="w-3 h-3 mr-1.5" />}
                                {EventStatusDisplay[eventStatus] || eventStatus}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Event details */}
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500/70" />
                            <span>
                              {formatDate(event.startTime).split(' ')[0]} • {formatDate(event.startTime).split(' ')[1]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-500/70" />
                            <span className="truncate">
                              {event.locationName || 'Không có địa điểm'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500/70" />
                            <span>
                              {event.totalPersonJoin || event.soldQuantity || 0}/
                              {event.totalPerson || event.totalTickets || 0} người
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

                        {eventStatus === EventStatus.Cancelled && event.reasonCancel && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                            <p className="text-gray-800 text-sm">
                              <strong>Lý do hủy:</strong> {event.reasonCancel}
                            </p>
                          </div>
                        )}

                        {event.isFlagWarning && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <p className="text-orange-800 text-sm">
                              <strong>Cảnh báo:</strong> Sự kiện này có báo cáo vi phạm
                            </p>
                          </div>
                        )}

                        {/* Event category badges */}
                        <div className="flex items-center gap-2 mb-4">
                          {event.eventCategoryName && (
                            <Badge variant="outline" className="text-xs bg-white/50 dark:bg-white/10 border-white/20">
                              {event.eventCategoryName}
                            </Badge>
                          )}
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4 pb-4 border-b border-white/10">
                          <div className="backdrop-blur-sm bg-gradient-to-br from-slate-100/50 to-slate-50/30 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl p-3 text-center hover:scale-105 transition-transform">
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Lượt xem</p>
                            <p className="text-base font-bold text-slate-900 dark:text-white">{event.viewCount || 0}</p>
                          </div>
                          <div className="backdrop-blur-sm bg-gradient-to-br from-blue-100/50 to-blue-50/30 dark:from-blue-900/50 dark:to-blue-800/30 rounded-xl p-3 text-center hover:scale-105 transition-transform">
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Đăng ký</p>
                            <p className="text-base font-bold text-blue-700 dark:text-blue-400">
                              {('totalPersonJoin' in event) ? event.totalPersonJoin : (event.soldQuantity || 0)}
                            </p>
                          </div>
                          <div className="backdrop-blur-sm bg-gradient-to-br from-green-100/50 to-green-50/30 dark:from-green-900/50 dark:to-green-800/30 rounded-xl p-3 text-center hover:scale-105 transition-transform">
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Doanh thu</p>
                            <p className="text-base font-bold text-green-700 dark:text-green-400">
                              {formatCurrency(event.totalAmount)}
                            </p>
                          </div>
                          <div className="backdrop-blur-sm bg-gradient-to-br from-emerald-100/50 to-emerald-50/30 dark:from-emerald-900/50 dark:to-emerald-800/30 rounded-xl p-3 text-center hover:scale-105 transition-transform">
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Thanh toán</p>
                            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(event.payoutAmount)}
                            </p>
                          </div>
                          <div className="backdrop-blur-sm bg-gradient-to-br from-purple-100/50 to-purple-50/30 dark:from-purple-900/50 dark:to-purple-800/30 rounded-xl p-3 text-center hover:scale-105 transition-transform">
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Sức chứa</p>
                            <p className="text-base font-bold text-purple-700 dark:text-purple-400">{occupancyRate}%</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors h-9"
                            onClick={() => handleViewEvent(event.eventId)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Xem
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors h-9 relative"
                            onClick={() => handleOpenReports(event)}
                          >
                            <Flag className="w-4 h-4 mr-2 text-red-600" />
                            Báo cáo
                            <span className="ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                              {displayReportCount}
                            </span>
                          </Button>

                          {(eventStatus === EventStatus.Approved || 
                            eventStatus === EventStatus.WaitingForPayout) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors h-9"
                              onClick={() => {
                                setSelectedEventForCancel(event);
                                setCancelReason('');
                                setIsCancelDialogOpen(true);
                              }}
                              disabled={cancellingEventId === event.eventId}
                            >
                              {cancellingEventId === event.eventId ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Đang hủy...
                                </>
                              ) : (
                                <>
                                  <Flag className="w-4 h-4 mr-1" />
                                  Hủy sự kiện
                                </>
                              )}
                            </Button>
                          )}

                          {eventStatus === EventStatus.ErrorPayment && (
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors h-9 shadow-md"
                              onClick={() => {
                                setSelectedEventForPayment(event);
                                setIsResolvePaymentDialogOpen(true);
                              }}
                              disabled={resolvingPaymentEventId === event.eventId}
                            >
                              {resolvingPaymentEventId === event.eventId ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Đang xử lý...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Thanh toán lại
                                </>
                              )}
                            </Button>
                          )}

                          {eventStatus === EventStatus.PendingApproval && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveEvent(event.eventId)}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={approvingEventId === event.eventId}
                              >
                                {approvingEventId === event.eventId ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang duyệt...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Duyệt
                                  </>
                                )}
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                    disabled={rejectingEventId === event.eventId}
                                  >
                                    {rejectingEventId === event.eventId ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang từ chối...
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Từ chối
                                      </>
                                    )}
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
                                        disabled={!rejectionReason.trim() || rejectingEventId === event.eventId}
                                      >
                                        {rejectingEventId === event.eventId ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang từ chối...
                                          </>
                                        ) : (
                                          "Xác nhận từ chối"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 rounded-lg transition-colors h-9"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
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
            </>
          )}

          {/* Event Report Manager Component */}
          <EventReportManager
            event={reportDialogEvent}
            isOpen={isReportDialogOpen}
            onClose={handleCloseReports}
            onReportCountChange={handleReportCountChange}
          />

          {/* Resolve Payment Confirmation Dialog */}
          <Dialog open={isResolvePaymentDialogOpen} onOpenChange={setIsResolvePaymentDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  Xác nhận thanh toán lại
                </DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn thử thanh toán lại cho sự kiện này?
                </DialogDescription>
              </DialogHeader>
              
              {selectedEventForPayment && (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{selectedEventForPayment.title}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Trạng thái:</strong> Lỗi thanh toán</p>
                      <p><strong>Số tiền thanh toán:</strong> {formatCurrency(selectedEventForPayment.payoutAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      ℹ️ Hệ thống sẽ thử xử lý lại giao dịch thanh toán cho nhà tổ chức.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsResolvePaymentDialogOpen(false);
                        setSelectedEventForPayment(null);
                      }}
                      disabled={resolvingPaymentEventId === selectedEventForPayment.eventId}
                    >
                      Hủy
                    </Button>
                    <Button
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleResolveErrorPayment(selectedEventForPayment.eventId)}
                      disabled={resolvingPaymentEventId === selectedEventForPayment.eventId}
                    >
                      {resolvingPaymentEventId === selectedEventForPayment.eventId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Xác nhận
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Cancel Event Dialog */}
          <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Flag className="w-5 h-5" />
                  Hủy sự kiện vi phạm
                </DialogTitle>
                <DialogDescription>
                  Gửi thông báo đến organizer và gán cờ cho sự kiện vi phạm. Vui lòng cung cấp lý do hủy.
                </DialogDescription>
              </DialogHeader>
              
              {selectedEventForCancel && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{selectedEventForCancel.title}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Trạng thái:</strong> {EventStatusDisplay[selectedEventForCancel.status] || selectedEventForCancel.status}</p>
                      {selectedEventForCancel.totalPersonJoin > 0 && (
                        <p><strong>Người tham gia:</strong> {selectedEventForCancel.totalPersonJoin} người</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      ⚠️ Hành động này sẽ hủy bỏ sự kiện và thông báo cho người tham gia. Organizer sẽ bị gán cờ vi phạm.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="cancel-reason">Lý do hủy</Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Nhập lý do hủy sự kiện vi phạm..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsCancelDialogOpen(false);
                        setSelectedEventForCancel(null);
                        setCancelReason('');
                      }}
                      disabled={cancellingEventId === selectedEventForCancel.eventId}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleCancelEvent}
                      disabled={cancellingEventId === selectedEventForCancel.eventId || !cancelReason.trim()}
                    >
                      {cancellingEventId === selectedEventForCancel.eventId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang hủy...
                        </>
                      ) : (
                        <>
                          <Flag className="w-4 h-4 mr-2" />
                          Xác nhận hủy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
};

export default ManagerEventsPage;