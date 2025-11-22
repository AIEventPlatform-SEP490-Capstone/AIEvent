import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Activity,
  CalendarDays,
  Building2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { PATH } from '../../routes/path';
import { EventStatus } from '../../constants/eventConstants';
import { dashboardAPI } from '../../api/dashboardAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const currentYear = new Date().getFullYear();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [totalOrganizerEvent, setTotalOrganizerEvent] = useState(null);
  const [organizerApprovedStats, setOrganizerApprovedStats] = useState({
    Approved: [],
    Rejected: [],
    Pending: []
  });
  const [eventMonthStats, setEventMonthStats] = useState({
    PendingApproval: [],
    Approved: [],
    Rejected: [],
    Cancelled: [],
    WaitingForPayout: [],
    PaidOut: []
  });
  const [organizerJoinStats, setOrganizerJoinStats] = useState([]);
  
  // Year filters for each chart
  const [organizerApprovedYear, setOrganizerApprovedYear] = useState(currentYear);
  const [eventMonthYear, setEventMonthYear] = useState(currentYear);
  const [organizerJoinYear, setOrganizerJoinYear] = useState(currentYear);
  
  // Status filters
  const [selectedOrganizerStatus, setSelectedOrganizerStatus] = useState('Approved');
  const [selectedEventStatus, setSelectedEventStatus] = useState('Approved');

  // Fetch total organizer/event (no year dependency)
  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const totalData = await dashboardAPI.getTotalOrganizerEvent();
        setTotalOrganizerEvent(totalData);
      } catch (error) {
        console.error('Error fetching total data:', error);
      }
    };
    fetchTotal();
  }, []);

  // Fetch organizer approved statistics
  useEffect(() => {
    const fetchOrganizerApproved = async () => {
      try {
        const [approvedData, rejectedData, pendingData] = await Promise.all([
          dashboardAPI.getOrganizerApprovedStatistics({ year: organizerApprovedYear, status: 'Approved' }),
          dashboardAPI.getOrganizerApprovedStatistics({ year: organizerApprovedYear, status: 'Rejected' }),
          dashboardAPI.getOrganizerApprovedStatistics({ year: organizerApprovedYear, status: 'Pending' })
        ]);
        setOrganizerApprovedStats({
          Approved: approvedData || [],
          Rejected: rejectedData || [],
          Pending: pendingData || []
        });
      } catch (error) {
        console.error('Error fetching organizer approved stats:', error);
      }
    };
    fetchOrganizerApproved();
  }, [organizerApprovedYear]);

  // Fetch event month statistics
  useEffect(() => {
    const fetchEventMonth = async () => {
      try {
        const [pendingApprovalData, approvedEventData, rejectedEventData, cancelledData, waitingPayoutData, paidOutData] = await Promise.all([
          dashboardAPI.getEventMonthStatistics({ year: eventMonthYear, status: 'PendingApproval' }),
          dashboardAPI.getEventMonthStatistics({ year: eventMonthYear, status: 'Approved' }),
          dashboardAPI.getEventMonthStatistics({ year: eventMonthYear, status: 'Rejected' }),
          dashboardAPI.getEventMonthStatistics({ year: eventMonthYear, status: 'Cancelled' }),
          dashboardAPI.getEventMonthStatistics({ year: eventMonthYear, status: 'WaitingForPayout' }),
          dashboardAPI.getEventMonthStatistics({ year: eventMonthYear, status: 'PaidOut' })
        ]);
        setEventMonthStats({
          PendingApproval: pendingApprovalData || [],
          Approved: approvedEventData || [],
          Rejected: rejectedEventData || [],
          Cancelled: cancelledData || [],
          WaitingForPayout: waitingPayoutData || [],
          PaidOut: paidOutData || []
        });
      } catch (error) {
        console.error('Error fetching event month stats:', error);
      }
    };
    fetchEventMonth();
  }, [eventMonthYear]);

  // Fetch organizer join statistics
  useEffect(() => {
    const fetchOrganizerJoin = async () => {
      try {
        const joinData = await dashboardAPI.getOrganizerJoinStatistics({ year: organizerJoinYear });
        setOrganizerJoinStats(joinData || []);
      } catch (error) {
        console.error('Error fetching organizer join stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizerJoin();
  }, [organizerJoinYear]);

  // Prepare chart data for organizer approved statistics
  const organizerApprovedChartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const currentData = organizerApprovedStats[selectedOrganizerStatus] || [];
    
    return months.map(month => {
      const monthData = currentData.find(d => d.month === month);
      return {
        month: `Tháng ${month}`,
        monthNum: month,
        value: monthData?.totalApproved || 0
      };
    });
  }, [organizerApprovedStats, selectedOrganizerStatus]);

  // Prepare chart data for event month statistics
  const eventMonthChartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const currentData = eventMonthStats[selectedEventStatus] || [];
    
    return months.map(month => {
      const monthData = currentData.find(d => d.month === month);
      return {
        month: `Tháng ${month}`,
        monthNum: month,
        value: monthData?.totalApproved || 0
      };
    });
  }, [eventMonthStats, selectedEventStatus]);

  // Prepare chart data for organizer join statistics
  const organizerJoinChartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    return months.map(month => {
      const monthData = organizerJoinStats.find(d => d.month === month);
      return {
        month: `Tháng ${month}`,
        monthNum: month,
        value: monthData?.totalApproved || 0
      };
    });
  }, [organizerJoinStats]);

  // Calculate totals
  const totalOrganizerApproved = useMemo(() => {
    return organizerApprovedChartData.reduce((sum, item) => sum + item.value, 0);
  }, [organizerApprovedChartData]);

  const totalEventApproved = useMemo(() => {
    return eventMonthChartData.reduce((sum, item) => sum + item.value, 0);
  }, [eventMonthChartData]);

  const totalOrganizerJoined = useMemo(() => {
    return organizerJoinChartData.reduce((sum, item) => sum + item.value, 0);
  }, [organizerJoinChartData]);

  const quickActions = [
    {
      title: "Quản lý sự kiện",
      description: "Xem và quản lý tất cả sự kiện",
      icon: Calendar,
      path: PATH.MANAGER_EVENTS,
      color: "bg-blue-500"
    },
    {
      title: "Sự kiện cần duyệt",
      description: "Duyệt các sự kiện đang chờ",
      icon: AlertCircle,
      path: `${PATH.MANAGER_EVENTS}?tab=${EventStatus.PendingApproval}`,
      color: "bg-orange-500"
    },
    {
      title: "Thống kê",
      description: "Xem báo cáo và phân tích",
      icon: BarChart3,
      path: "/manager/analytics",
      color: "bg-green-500"
    },
    {
      title: "Người dùng",
      description: "Quản lý người tham gia sự kiện",
      icon: Users,
      path: "/manager/users",
      color: "bg-purple-500"
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      Approved: 'bg-green-100 text-green-800 border-green-200',
      Rejected: 'bg-red-100 text-red-800 border-red-200',
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PendingApproval: 'bg-orange-100 text-orange-800 border-orange-200',
      Cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      WaitingForPayout: 'bg-blue-100 text-blue-800 border-blue-200',
      PaidOut: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      Approved: 'Đã duyệt',
      Rejected: 'Đã từ chối',
      Pending: 'Đang chờ',
      PendingApproval: 'Chờ duyệt',
      Cancelled: 'Đã hủy',
      WaitingForPayout: 'Chờ thanh toán',
      PaidOut: 'Đã thanh toán'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Xin chào, {user?.userName || 'Quản lý'} 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Đây là bảng điều khiển quản lý sự kiện của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Total Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-2">Tổng Organizer</p>
                  <p className="text-3xl font-bold">{totalOrganizerEvent?.totalApprovedOrganizers || 0}</p>
                  <p className="text-blue-100 text-xs mt-1">Đã được duyệt</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Building2 className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-2">Tổng Sự kiện</p>
                  <p className="text-3xl font-bold">{totalOrganizerEvent?.totalApprovedEvents || 0}</p>
                  <p className="text-green-100 text-xs mt-1">Đã được duyệt</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-2">Organizer đã duyệt</p>
                  <p className="text-3xl font-bold">{totalOrganizerApproved}</p>
                  <p className="text-purple-100 text-xs mt-1">Năm {organizerApprovedYear}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-2">Organizer tham gia</p>
                  <p className="text-3xl font-bold">{totalOrganizerJoined}</p>
                  <p className="text-orange-100 text-xs mt-1">Năm {organizerJoinYear}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Users className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className="bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className={`p-4 rounded-full ${action.color} shadow-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Organizer Approved Statistics Chart */}
          <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-row items-center justify-between gap-4 w-fulls">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BarChart3 className="h-6 w-6 text-blue-500" />
                      Thống kê Organizer đã duyệt
                    </CardTitle>
                    <CardDescription className="mt-1">Thống kê theo tháng</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={String(organizerApprovedYear)} onValueChange={(value) => setOrganizerApprovedYear(Number(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 6 }, (_, i) => currentYear - 5 + i).map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedOrganizerStatus} onValueChange={setSelectedOrganizerStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Đã duyệt</SelectItem>
                      <SelectItem value="Rejected">Đã từ chối</SelectItem>
                      <SelectItem value="Pending">Đang chờ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Badge className={getStatusColor(selectedOrganizerStatus)}>
                  {getStatusLabel(selectedOrganizerStatus)}: {totalOrganizerApproved}
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={organizerApprovedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    radius={[8, 8, 0, 0]}
                    name="Số lượng"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Event Month Statistics Chart */}
          <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-row items-center justify-between gap-4 w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calendar className="h-6 w-6 text-green-500" />
                      Thống kê Sự kiện theo tháng
                    </CardTitle>
                    <CardDescription className="mt-1">Thống kê theo tháng</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={String(eventMonthYear)} onValueChange={(value) => setEventMonthYear(Number(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 6 }, (_, i) => currentYear - 5 + i).map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedEventStatus} onValueChange={setSelectedEventStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PendingApproval">Chờ duyệt</SelectItem>
                      <SelectItem value="Approved">Đã duyệt</SelectItem>
                      <SelectItem value="Rejected">Đã từ chối</SelectItem>
                      <SelectItem value="Cancelled">Đã hủy</SelectItem>
                      <SelectItem value="WaitingForPayout">Chờ thanh toán</SelectItem>
                      <SelectItem value="PaidOut">Đã thanh toán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Badge className={getStatusColor(selectedEventStatus)}>
                  {getStatusLabel(selectedEventStatus)}: {totalEventApproved}
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={eventMonthChartData}>
                  <defs>
                    <linearGradient id="colorEvent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorEvent)"
                    name="Số lượng"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Organizer Join Statistics Chart */}
        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                  Thống kê Organizer tham gia
                </CardTitle>
                <CardDescription className="mt-1">
                  Số lượng organizer mới tham gia theo tháng
                </CardDescription>
              </div>
              <Select value={String(organizerJoinYear)} onValueChange={(value) => setOrganizerJoinYear(Number(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => currentYear - 5 + i).map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                Tổng: {totalOrganizerJoined} organizer
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={organizerJoinChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  dot={{ fill: '#f97316', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Số lượng"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Tổng quan Organizer</CardTitle>
              <CardDescription className="text-xs">Năm {organizerApprovedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Đã duyệt</span>
                  <span className="font-bold text-green-600 text-lg">
                    {organizerApprovedStats.Approved.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Đã từ chối</span>
                  <span className="font-bold text-red-600 text-lg">
                    {organizerApprovedStats.Rejected.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Đang chờ</span>
                  <span className="font-bold text-yellow-600 text-lg">
                    {organizerApprovedStats.Pending.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Tổng quan Sự kiện</CardTitle>
              <CardDescription className="text-xs">Năm {eventMonthYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Đã duyệt</span>
                  <span className="font-bold text-green-600 text-lg">
                    {eventMonthStats.Approved.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Chờ duyệt</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {eventMonthStats.PendingApproval.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Đã từ chối</span>
                  <span className="font-bold text-red-600 text-lg">
                    {eventMonthStats.Rejected.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Đã hủy</span>
                  <span className="font-bold text-gray-600 text-lg">
                    {eventMonthStats.Cancelled.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Thanh toán</CardTitle>
              <CardDescription className="text-xs">Năm {eventMonthYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Chờ thanh toán</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {eventMonthStats.WaitingForPayout.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Đã thanh toán</span>
                  <span className="font-bold text-purple-600 text-lg">
                    {eventMonthStats.PaidOut.reduce((sum, item) => sum + (item.totalApproved || 0), 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
