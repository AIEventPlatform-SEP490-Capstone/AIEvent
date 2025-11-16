import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Users,
  Calendar,
  DollarSign,
  Ticket,
  Building2,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  UserCheck,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { dashboardAPI } from '../../api/dashboardAPI';
import { userManagementAPI } from '../../api/userManagementAPI';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

// Gradient Stat Card Component
const GradientStatCard = ({ title, value, change, changeText, icon: Icon, gradient, isNegative, onClick }) => (
  <Card onClick={onClick} className={`relative overflow-hidden border-0 shadow-lg ${gradient} cursor-pointer`}>
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -mr-16 -mt-16 bg-white" />
    <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full opacity-10 -mr-8 -mb-8 bg-white" />
    <CardContent className="p-6 relative z-10">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/90 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-white text-3xl font-bold mb-3">{value}</h3>
          <div className={`flex items-center gap-1 text-sm ${isNegative ? 'text-red-100' : 'text-white/90'}`}>
            {isNegative ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            <span className="font-semibold">{changeText}</span>
          </div>
        </div>
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Compact Stat Card Component
const SmallStatCard = ({ title, value, icon: Icon }) => (
  <Card className="border-0 shadow-md">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-gray-100">
            <Icon className="w-5 h-5 text-gray-700" />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Inline compact stat (for dialog use)
const InlineStat = ({ label, value, icon: Icon }) => (
  <div className="rounded-md border p-3 bg-white flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
    {Icon ? <Icon className="w-4 h-4 text-gray-600" /> : null}
  </div>
);

// Multi-bar Chart Component
const MultiBarChart = ({ data, title, colors }) => {
  const allValues = Array.isArray(data)
    ? data.flatMap(d => (Array.isArray(d.values) ? d.values : []))
    : [];
  const maxValue = Math.max(0, ...allValues);
  const safeMax = maxValue > 0 ? maxValue : 1;
 
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-600">{title}</h4>
      {/* Empty state */}
      {(!data || data.length === 0 || allValues.length === 0) && (
        <div className="h-64 flex items-center justify-center text-sm text-gray-500 border rounded-md">
          Chưa có dữ liệu
        </div>
      )}
      <div className="h-64 flex items-end gap-6">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-3">
            <div className="w-full flex items-end justify-center gap-2 h-48">
              {item.values.map((value, vIdx) => {
                const height = safeMax === 0 ? 0 : (value / safeMax) * 100;
                return (
                  <div key={vIdx} className="relative flex-1 h-full group flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${colors[vIdx]} hover:opacity-80 cursor-pointer`}
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {value.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-gray-500 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ segments, size = 200, centerPrimary, centerSecondary }) => {
  let currentAngle = 0;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
 
  return (
    <div className="flex items-center gap-8">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Handle empty data: render a neutral ring */}
          {total === 0 ? (() => {
            const innerRadius = size * 0.3;
            const outerRadius = size * 0.45;
            const centerX = size / 2;
            const centerY = size / 2;
            const ringRadius = (innerRadius + outerRadius) / 2;
            const ringWidth = outerRadius - innerRadius;
            return (
              <circle
                cx={centerX}
                cy={centerY}
                r={ringRadius}
                stroke="#e5e7eb"
                strokeWidth={ringWidth}
                fill="none"
              />
            );
          })() : null}
          {segments.map((segment, idx) => {
            const percentage = total === 0 ? 0 : (segment.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
           
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);
           
            const innerRadius = size * 0.3;
            const outerRadius = size * 0.45;
            const centerX = size / 2;
            const centerY = size / 2;
           
            const x1 = centerX + outerRadius * Math.cos(startRad);
            const y1 = centerY + outerRadius * Math.sin(startRad);
            const x2 = centerX + outerRadius * Math.cos(endRad);
            const y2 = centerY + outerRadius * Math.sin(endRad);
            const x3 = centerX + innerRadius * Math.cos(endRad);
            const y3 = centerY + innerRadius * Math.sin(endRad);
            const x4 = centerX + innerRadius * Math.cos(startRad);
            const y4 = centerY + innerRadius * Math.sin(startRad);
           
            const largeArc = angle > 180 ? 1 : 0;
           
            const path = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
           
            currentAngle = endAngle;
           
            return (
              <path
                key={idx}
                d={path}
                fill={segment.color}
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              />
            );
          })}
        </svg>
        {(centerPrimary || centerSecondary) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerPrimary && (
              <div className="text-lg font-bold text-gray-900">{centerPrimary}</div>
            )}
            {centerSecondary && (
              <div className="text-xs text-gray-500">{centerSecondary}</div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {segments.map((segment, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{segment.label}</span>
              <span className="text-sm font-bold">{segment.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ user, action, time, status, type }) => {
  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    pending: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  };
 
  const typeConfig = {
    user: { icon: Users, color: 'text-blue-500' },
    event: { icon: Calendar, color: 'text-purple-500' },
    booking: { icon: Ticket, color: 'text-green-500' },
    organizer: { icon: Building2, color: 'text-orange-500' },
    payment: { icon: DollarSign, color: 'text-emerald-500' },
  };
 
  const StatusIcon = statusConfig[status]?.icon || Activity;
  const TypeIcon = typeConfig[type]?.icon || Activity;
 
  return (
    <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors rounded-lg">
      <div className={`p-2 rounded-lg ${statusConfig[status]?.bg || 'bg-gray-50'}`}>
        <TypeIcon className={`w-5 h-5 ${typeConfig[type]?.color || 'text-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{user}</p>
        <p className="text-sm text-gray-600 truncate">{action}</p>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {time}
        </p>
      </div>
      <StatusIcon className={`w-5 h-5 ${statusConfig[status]?.color || 'text-gray-400'}`} />
    </div>
  );
};

// User Item Component
const UserItem = ({ name, email, role, date, status, avatar }) => (
  <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors rounded-lg">
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
      {avatar}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500 truncate">{email}</p>
    </div>
    <div className="text-right">
      <Badge variant={role === 'Organizer' ? 'default' : 'secondary'} className="mb-1">
        {role}
      </Badge>
      <p className="text-xs text-gray-400">{date}</p>
    </div>
    <Badge variant={status === 'Active' ? 'default' : 'secondary'} className="ml-2">
      {status}
    </Badge>
  </div>
);

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'users' | 'organizers' | 'events' | 'revenue'
  const nowInit = new Date();
  const [selectedYear, setSelectedYear] = useState(String(nowInit.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(nowInit.getMonth() + 1)); // "1".."12"
  const [timeMode, setTimeMode] = useState('month'); // 'day' | 'month'

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [ov, sys, users] = await Promise.all([
          dashboardAPI.getAdminOverview({ year: Number(selectedYear), month: Number(selectedMonth) }),
          dashboardAPI.getAdminSystemReport({ pageNumber: 1, pageSize: 10 }),
          userManagementAPI.getAllUsers(1, 10),
        ]);
        setOverview(ov);
        setRecentActivities(sys?.recentActivities?.items || []);
        const userItems = users?.data?.items || users?.items || [];
        setRecentUsers(userItems);
      } catch (e) {
        console.error('Dashboard fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedYear, selectedMonth]);

  // Chart Data
  const { visitSalesData, monthRangeLabel } = useMemo(() => {
    if (timeMode === 'day') {
      const today = new Date();
      const label = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
      const data = [
        {
          label,
          values: [
            Number(overview?.revenueToday ?? 0),
            Number(overview?.ticketsSoldToday ?? 0),
            Number(overview?.bookingsToday ?? 0),
          ],
        },
      ];
      return { visitSalesData: data, monthRangeLabel: label };
    }
    // month mode: use API monthlyStatistics for selected year/month
    const stats = Array.isArray(overview?.monthlyStatistics) ? overview.monthlyStatistics : [];
    const label = `Thg ${String(selectedMonth)} / ${String(selectedYear)}`;
    const valuesFromApi =
      stats.find(
        (s) => Number(s?.year) === Number(selectedYear) && Number(s?.month) === Number(selectedMonth)
      ) || {};

    const data = [
      {
        label,
        values: [
          Number(valuesFromApi?.revenue ?? overview?.revenueThisMonth ?? 0),
          Number(valuesFromApi?.ticketsSoldCount ?? 0),
          Number(valuesFromApi?.bookingsCount ?? 0),
        ],
      },
    ];
    return { visitSalesData: data, monthRangeLabel: label };
  }, [overview, selectedMonth, selectedYear, timeMode]);

  const trafficSegments = useMemo(() => [
    { label: 'Đã sử dụng', value: overview?.usedTickets ?? 0, percentage: Math.round(((overview?.usedTickets ?? 0) / ((overview?.usedTickets ?? 0) + (overview?.validTickets ?? 0) || 1)) * 100), color: '#f43f5e' },
    { label: 'Còn hiệu lực', value: overview?.validTickets ?? 0, percentage: Math.round(((overview?.validTickets ?? 0) / ((overview?.usedTickets ?? 0) + (overview?.validTickets ?? 0) || 1)) * 100), color: '#10b981' },
  ], [overview]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const openDetail = (section) => {
    setActiveSection(section);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Tổng quan hệ thống quản lý sự kiện</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <GradientStatCard
          title="Người dùng"
          value={(overview?.totalUsers ?? 0).toLocaleString()}
          changeText={`${overview?.monthlyUserGrowthPercentage ?? 0}%`}
          icon={Users}
          gradient="bg-gradient-to-br from-pink-400 via-pink-500 to-orange-400"
          onClick={() => openDetail('users')}
        />
        <GradientStatCard
          title="Tổ chức"
          value={(overview?.totalOrganizers ?? 0).toLocaleString()}
          changeText={`${overview?.monthlyOrganizerGrowthPercentage ?? 0}%`}
          icon={Building2}
          gradient="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600"
          isNegative
          onClick={() => openDetail('organizers')}
        />
        <GradientStatCard
          title="Sự kiện"
          value={(overview?.totalEvents ?? 0).toLocaleString()}
          changeText={`${overview?.monthlyEventGrowthPercentage ?? 0}%`}
          icon={Calendar}
          gradient="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500"
          onClick={() => openDetail('events')}
        />
        <GradientStatCard
          title="Doanh thu"
          value={`${(overview?.totalRevenue ?? 0).toLocaleString()} VNĐ`}
          changeText={`${overview?.monthlyRevenueGrowthPercentage ?? 0}%`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500"
          onClick={() => openDetail('revenue')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Visit and Sales Statistics */}
        <Card className="lg:col-span-2 shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Doanh thu & người dùng</CardTitle>
                <p className="text-xs text-gray-500 mt-1">{monthRangeLabel}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-36">
                  <Select value={timeMode} onValueChange={setTimeMode}>
                    <SelectTrigger aria-label="Kiểu thời gian">
                      <SelectValue placeholder="Kiểu thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Theo ngày</SelectItem>
                      <SelectItem value="month">Theo tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {timeMode === 'month' && (
                  <>
                    <div className="w-36">
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger aria-label="Chọn năm">
                          <SelectValue placeholder="Chọn năm" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 6 }, (_, i) => nowInit.getFullYear() - i).map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-36">
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger aria-label="Chọn tháng">
                          <SelectValue placeholder="Chọn tháng" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <SelectItem key={m} value={String(m)}>{`Thg ${m}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-xs text-gray-600">Doanh thu {timeMode === 'day' ? 'hôm nay' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs text-gray-600">Vé bán {timeMode === 'day' ? 'hôm nay' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-600">Booking {timeMode === 'day' ? 'hôm nay' : ''}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MultiBarChart
              data={visitSalesData}
              colors={['bg-purple-500', 'bg-rose-500', 'bg-blue-500']}
            />
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Phân bố Vé</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <DonutChart
              segments={trafficSegments}
              centerPrimary={`${(overview?.totalTicketsSold ?? 0).toLocaleString()} / ${(overview?.usedTickets ?? 0).toLocaleString()}`}
              centerSecondary="Đã bán / Đã sử dụng"
            />
          </CardContent>
        </Card>
      </div>

      {/* Detail Popup for main four cards */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {activeSection === 'users' && 'Chi tiết Người dùng'}
              {activeSection === 'organizers' && 'Chi tiết Tổ chức'}
              {activeSection === 'events' && 'Chi tiết Sự kiện'}
              {activeSection === 'revenue' && 'Chi tiết Doanh thu'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {activeSection === 'users' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <SmallStatCard title="Tổng người dùng" value={(overview?.totalUsers ?? 0).toLocaleString()} icon={Users} />
                <SmallStatCard title="Tăng trưởng tháng" value={`${overview?.monthlyUserGrowthPercentage ?? 0}%`} icon={TrendingUp} />
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold mb-2 text-gray-700">Người dùng mới gần đây</p>
                  <div className="max-h-48 overflow-auto border rounded-md">
                    {(recentUsers || []).slice(0, 6).map(u => (
                      <div key={u.id} className="px-3 py-2 text-sm flex justify-between border-b last:border-b-0">
                        <span className="text-gray-700">{u.fullName}</span>
                        <span className="text-gray-500">{u.email}</span>
                      </div>
                    ))}
                    {((recentUsers || []).length === 0) && (
                      <div className="px-3 py-6 text-sm text-gray-500 text-center">Chưa có dữ liệu</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'organizers' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <SmallStatCard title="Tổng tổ chức" value={(overview?.totalOrganizers ?? 0).toLocaleString()} icon={Building2} />
                <SmallStatCard title="Yêu cầu chờ duyệt" value={(overview?.pendingOrganizerRequestsCount ?? 0).toLocaleString()} icon={AlertCircle} />
              </div>
            )}

            {activeSection === 'events' && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InlineStat label="Tổng sự kiện" value={(overview?.totalEvents ?? 0).toLocaleString()} icon={Calendar} />
                  <InlineStat label="Sự kiện chờ duyệt" value={(overview?.pendingEventsCount ?? 0).toLocaleString()} icon={AlertCircle} />
                  <InlineStat label="Sự kiện đã hủy" value={(overview?.cancelledEventsCount ?? 0).toLocaleString()} icon={XCircle} />
                  <InlineStat label="Booking hôm nay" value={(overview?.bookingsToday ?? 0).toLocaleString()} icon={Ticket} />
                  <InlineStat label="Tổng đặt chỗ" value={(overview?.totalBookings ?? 0).toLocaleString()} icon={Ticket} />
                  <InlineStat label="Hoàn tất" value={(overview?.completedBookings ?? 0).toLocaleString()} icon={CheckCircle} />
                  <InlineStat label="Đang xử lý" value={(overview?.pendingBookings ?? 0).toLocaleString()} icon={AlertCircle} />
                  <InlineStat label="Đã hủy" value={(overview?.cancelledBookings ?? 0).toLocaleString()} icon={XCircle} />
                  <InlineStat label="Tổng vé đã bán" value={(overview?.totalTicketsSold ?? 0).toLocaleString()} icon={Ticket} />
                  <InlineStat label="Vé bán hôm nay" value={(overview?.ticketsSoldToday ?? 0).toLocaleString()} icon={Ticket} />
                </div>
              </div>
            )}

            {activeSection === 'revenue' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <SmallStatCard title="Doanh thu hôm nay" value={`${(overview?.revenueToday ?? 0)} VNĐ`} icon={DollarSign} />
                <SmallStatCard title="Doanh thu tháng" value={`${(overview?.revenueThisMonth ?? 0)} VNĐ`} icon={DollarSign} />
                <SmallStatCard title="Tổng doanh thu" value={`${(overview?.totalRevenue ?? 0)} VNĐ`} icon={DollarSign} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Activities table at bottom */}
      <div className="mt-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 bg-gray-50 text-xs font-medium text-gray-600">
                <div className="py-3 px-4">Assignee</div>
                <div className="py-3 px-4">Subject</div>
                <div className="py-3 px-4">Status</div>
                <div className="py-3 px-4">Last Update</div>
              </div>
              {/* Rows */}
              <div className="divide-y">
                {(recentActivities || []).slice(0, 5).map((act, i) => {
                  const name = act.user || act.title || 'Không xác định';
                  const parts = (name || '').trim().split(/\s+/);
                  const initials = (parts[0]?.[0] || 'U') + (parts[parts.length - 1]?.[0] || '');
                  const status = (act.status || 'completed')?.toLowerCase();
                  const statusStyle = {
                    completed: 'bg-emerald-100 text-emerald-700',
                    pending: 'bg-yellow-100 text-yellow-700',
                    cancelled: 'bg-rose-100 text-rose-700',
                  }[status] || 'bg-gray-100 text-gray-700';
                  const code = act.trackingId || act.id || `EV-${String(i + 1).padStart(3, '0')}`;
                  return (
                    <div key={act.id || i} className="grid grid-cols-4 items-center bg-white">
                      <div className="py-4 px-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                          {initials.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{name}</p>
                        </div>
                      </div>
                      <div className="py-4 px-4">
                        <p className="text-sm text-gray-700 whitespace-normal break-words">{act.action || act.description || '—'}</p>
                      </div>
                      <div className="py-4 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${statusStyle}`}>
                          {status === 'completed' ? 'DONE' : status === 'pending' ? 'IN PROGRESS' : status === 'cancelled' ? 'CANCELLED' : status.toUpperCase()}
                        </span>
                      </div>
                      <div className="py-4 px-4 text-sm text-gray-600">
                        {new Date(act.createdAt || act.time || Date.now()).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  );
                })}
                {((recentActivities || []).length === 0) && (
                  <div className="py-10 text-center text-sm text-gray-500">Chưa có hoạt động</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;