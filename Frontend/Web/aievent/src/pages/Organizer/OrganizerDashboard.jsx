import React, { useEffect, useState, useMemo } from 'react';
import { dashboardAPI } from '../../api/dashboardAPI';
import { eventCategoryAPI } from '../../api/eventCategoryAPI';
import { EventStatus, EventStatusDisplay } from '../../constants/eventConstants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Calendar, Users, DollarSign, CheckCircle, TrendingUp, 
  Filter, RefreshCw, ChevronDown, LayoutGrid, List,
  Wallet, Tag, FolderOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../../components/ui/select';

const CHART_COLORS = {
  primary: '#6366f1',
  success: '#22c55e', 
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
  pink: '#ec4899',
  slate: '#64748b'
};

const STATUS_COLORS = {
  0: CHART_COLORS.warning,   // PendingApproval
  1: CHART_COLORS.success,   // Approved
  2: CHART_COLORS.danger,    // Rejected
  3: CHART_COLORS.slate,     // Cancelled
  4: CHART_COLORS.info,      // WaitingForPayout
  5: CHART_COLORS.primary,   // PaidOut
  6: CHART_COLORS.pink       // ErrorPayment
};

const PIE_COLORS = [
  CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning,
  CHART_COLORS.info, CHART_COLORS.purple, CHART_COLORS.pink,
  CHART_COLORS.danger, CHART_COLORS.slate
];

const OrganizerDashboard = () => {
  // Data states
  const [eventStatistics, setEventStatistics] = useState(null);
  const [buyerStatistics, setBuyerStatistics] = useState(null);
  const [checkInStatistics, setCheckInStatistics] = useState(null);
  const [revenueStatistics, setRevenueStatistics] = useState(null);
  const [netRevenueStatistics, setNetRevenueStatistics] = useState(null);
  const [revenueByCategoryTag, setRevenueByCategoryTag] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter states
  const [filters, setFilters] = useState({
    categoryId: '',
    startDate: '',
    endDate: '',
    year: new Date().getFullYear().toString(),
    month: ''
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'Tháng 1' }, { value: '2', label: 'Tháng 2' },
    { value: '3', label: 'Tháng 3' }, { value: '4', label: 'Tháng 4' },
    { value: '5', label: 'Tháng 5' }, { value: '6', label: 'Tháng 6' },
    { value: '7', label: 'Tháng 7' }, { value: '8', label: 'Tháng 8' },
    { value: '9', label: 'Tháng 9' }, { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' }, { value: '12', label: 'Tháng 12' }
  ];

  useEffect(() => {
    loadCategories();
    fetchData();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await eventCategoryAPI.getEventCategories(1, 100);
      const items = response?.data?.items || response?.data || [];
      setCategories(items);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const getFilterParams = () => {
    const params = {};
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.year) params.year = parseInt(filters.year);
    if (filters.month) params.month = parseInt(filters.month);
    return params;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const filterParams = getFilterParams();
      
      const [eventStats, buyerStats, checkInStats, revenueStats, netRevenueStats, revenueCatTag] = 
        await Promise.all([
          dashboardAPI.getEventStatistics(filterParams).catch(() => null),
          dashboardAPI.getBuyerStatistics(filterParams).catch(() => null),
          dashboardAPI.getCheckInStatistics(filterParams).catch(() => null),
          dashboardAPI.getRevenueStatistics(filterParams).catch(() => null),
          dashboardAPI.getNetRevenueStatistics(filterParams).catch(() => null),
          dashboardAPI.getRevenueByCategoryTag(filterParams).catch(() => null)
        ]);

      setEventStatistics(eventStats);
      setBuyerStatistics(buyerStats);
      setCheckInStatistics(checkInStats);
      setRevenueStatistics(revenueStats);
      setNetRevenueStatistics(netRevenueStats);
      setRevenueByCategoryTag(revenueCatTag);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      startDate: '',
      endDate: '',
      year: currentYear.toString(),
      month: ''
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '0₫';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Chart data transformers
  const eventsByStatusData = useMemo(() => {
    if (!eventStatistics?.eventsByStatus) return [];
    return eventStatistics.eventsByStatus.map(item => {
      const statusKeys = Object.keys(EventStatus);
      const statusKey = statusKeys[item.status] || null;
      return {
        name: statusKey ? EventStatusDisplay[EventStatus[statusKey]] : item.statusName || 'Khác',
        value: item.count || 0,
        fill: STATUS_COLORS[item.status] || CHART_COLORS.slate
      };
    });
  }, [eventStatistics]);

  const eventsByCategoryData = useMemo(() => {
    if (!eventStatistics?.eventsByCategory) return [];
    return eventStatistics.eventsByCategory.map((item, idx) => ({
      name: item.categoryName || 'Khác',
      value: item.count || 0,
      fill: PIE_COLORS[idx % PIE_COLORS.length]
    }));
  }, [eventStatistics]);

  const revenueByEventData = useMemo(() => {
    if (!revenueStatistics?.revenueByEvent) return [];
    return revenueStatistics.revenueByEvent.slice(0, 10).map(item => ({
      name: item.eventName?.length > 20 ? item.eventName.substring(0, 20) + '...' : item.eventName || 'N/A',
      revenue: item.revenue || 0,
      fullName: item.eventName
    }));
  }, [revenueStatistics]);

  const buyersByEventData = useMemo(() => {
    if (!buyerStatistics?.buyersByEvent) return [];
    return buyerStatistics.buyersByEvent.slice(0, 10).map(item => ({
      name: item.eventName?.length > 20 ? item.eventName.substring(0, 20) + '...' : item.eventName || 'N/A',
      buyers: item.buyerCount || 0,
      fullName: item.eventName
    }));
  }, [buyerStatistics]);

  const checkInsByEventData = useMemo(() => {
    if (!checkInStatistics?.checkInsByEvent) return [];
    return checkInStatistics.checkInsByEvent.slice(0, 10).map(item => ({
      name: item.eventName?.length > 20 ? item.eventName.substring(0, 20) + '...' : item.eventName || 'N/A',
      checkIns: item.checkedInCount || 0,
      fullName: item.eventName
    }));
  }, [checkInStatistics]);

  const eventsByDateData = useMemo(() => {
    if (!eventStatistics?.eventsByDate) return [];
    return eventStatistics.eventsByDate.map(item => ({
      date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      count: item.count || 0
    }));
  }, [eventStatistics]);

  const revenueByCategoryData = useMemo(() => {
    if (!revenueByCategoryTag?.revenueByCategory) return [];
    return revenueByCategoryTag.revenueByCategory.map((item, idx) => ({
      name: item.categoryName || 'Khác',
      value: item.revenue || 0,
      fill: PIE_COLORS[idx % PIE_COLORS.length]
    }));
  }, [revenueByCategoryTag]);

  // Stats cards data
  const statsCards = [
    {
      title: 'Tổng sự kiện',
      value: eventStatistics?.totalEvents || 0,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Sự kiện đã tạo'
    },
    {
      title: 'Người mua vé',
      value: buyerStatistics?.totalBuyers || 0,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Tổng người mua'
    },
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(revenueStatistics?.totalRevenue),
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Doanh thu gộp'
    },
    {
      title: 'Doanh thu ròng',
      value: formatCurrency(netRevenueStatistics?.totalNetRevenue),
      icon: Wallet,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: 'Sau phí nền tảng'
    },
    {
      title: 'Đã check-in',
      value: checkInStatistics?.totalCheckedIn || 0,
      icon: CheckCircle,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      description: 'Người tham dự'
    }
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-100">
        <p className="font-medium text-gray-900 mb-1">{payload[0]?.payload?.fullName || label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'revenue' ? formatCurrency(entry.value) : entry.value.toLocaleString('vi-VN')}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchData}>Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
          <p className="text-gray-500 mt-1">Tổng quan hoạt động sự kiện của bạn</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          <Button size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Lọc dữ liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Danh mục</label>
                <Select value={filters.categoryId || 'all'} onValueChange={(v) => handleFilterChange('categoryId', v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.eventCategoryId} value={cat.eventCategoryId}>
                        {cat.eventCategoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Năm</label>
                <Select value={filters.year} onValueChange={(v) => handleFilterChange('year', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tháng</label>
                <Select value={filters.month || 'all'} onValueChange={(v) => handleFilterChange('month', v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tháng</SelectItem>
                    {months.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Từ ngày</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Đến ngày</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={clearFilters}>Xóa bộ lọc</Button>
              <Button size="sm" onClick={applyFilters}>Áp dụng</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Tổng quan', icon: LayoutGrid },
          { id: 'revenue', label: 'Doanh thu', icon: TrendingUp },
          { id: 'events', label: 'Sự kiện', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Sự kiện theo trạng thái
              </CardTitle>
              <CardDescription>Phân bố trạng thái các sự kiện</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={eventsByStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {eventsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Sự kiện']} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-400">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                Sự kiện theo danh mục
              </CardTitle>
              <CardDescription>Phân bố sự kiện theo danh mục</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={eventsByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {eventsByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Sự kiện']} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-400">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyers by Event */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Người mua theo sự kiện
              </CardTitle>
              <CardDescription>Top 10 sự kiện có nhiều người mua nhất</CardDescription>
            </CardHeader>
            <CardContent>
              {buyersByEventData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={buyersByEventData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="buyers" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} name="Người mua" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-400">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-ins by Event */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-violet-600" />
                Check-in theo sự kiện
              </CardTitle>
              <CardDescription>Top 10 sự kiện có nhiều check-in nhất</CardDescription>
            </CardHeader>
            <CardContent>
              {checkInsByEventData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={checkInsByEventData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="checkIns" fill={CHART_COLORS.purple} radius={[0, 4, 4, 0]} name="Check-in" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-400">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Event */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                Doanh thu theo sự kiện
              </CardTitle>
              <CardDescription>Top 10 sự kiện có doanh thu cao nhất</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByEventData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueByEventData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                    />
                    <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">
                  Chưa có dữ liệu doanh thu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-600" />
                Doanh thu theo danh mục
              </CardTitle>
              <CardDescription>Phân bố doanh thu theo danh mục sự kiện</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {revenueByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Tổng kết doanh thu
              </CardTitle>
              <CardDescription>So sánh doanh thu gộp và doanh thu ròng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-700">Doanh thu gộp</span>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Gross</Badge>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatCurrency(revenueStatistics?.totalRevenue)}
                  </p>
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-emerald-700">Doanh thu ròng</span>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Net</Badge>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(netRevenueStatistics?.totalNetRevenue)}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Phí nền tảng</span>
                    <Badge variant="outline">Fee</Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">
                    {formatCurrency((revenueStatistics?.totalRevenue || 0) - (netRevenueStatistics?.totalNetRevenue || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Events Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Xu hướng sự kiện theo thời gian
              </CardTitle>
              <CardDescription>Số lượng sự kiện được tạo theo ngày</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsByDateData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={eventsByDateData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [value, 'Sự kiện']} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={CHART_COLORS.primary} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      name="Số sự kiện"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Status Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <List className="w-4 h-4 text-slate-600" />
                Chi tiết trạng thái sự kiện
              </CardTitle>
              <CardDescription>Bảng tổng hợp số lượng sự kiện theo từng trạng thái</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsByStatusData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Số lượng</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventsByStatusData.map((item, idx) => {
                        const total = eventStatistics?.totalEvents || 1;
                        const percentage = ((item.value / total) * 100).toFixed(1);
                        return (
                          <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.fill }}
                                />
                                <span className="text-gray-900">{item.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-medium text-gray-900">
                              {item.value}
                            </td>
                            <td className="text-right py-3 px-4">
                              <Badge variant="outline" className="font-normal">
                                {percentage}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">Tổng cộng</td>
                        <td className="text-right py-3 px-4 font-semibold text-gray-900">
                          {eventStatistics?.totalEvents || 0}
                        </td>
                        <td className="text-right py-3 px-4">
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">100%</Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  Chưa có dữ liệu
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
