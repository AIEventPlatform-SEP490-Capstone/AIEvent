import React from 'react';
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
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PATH } from '../../routes/path';
import { EventStatus } from '../../constants/eventConstants';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Mock statistics data
  const stats = {
    totalEvents: 24,
    upcomingEvents: 8,
    totalRegistrations: 1240,
    totalRevenue: 836500000,
    totalViews: 15420,
    pendingApprovals: 3,
    rejectedEvents: 1,
    activeEvents: 5
  };

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
      // Navigate to events page with approval tab
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
    },
    {
      title: "Quy tắc hoàn tiền",
      description: "Quản lý quy tắc hoàn tiền sự kiện",
      icon: Receipt,
      path: PATH.MANAGER_REFUND_RULES,
      color: "bg-red-500"
    }
  ];

  const recentEvents = [
    {
      id: 1,
      title: "Hội thảo công nghệ 2023",
      date: "2023-12-15",
      status: "upcoming",
      registrations: 120,
      revenue: 24000000
    },
    {
      id: 2,
      title: "Workshop thiết kế UI/UX",
      date: "2023-12-10",
      status: "ongoing",
      registrations: 85,
      revenue: 17000000
    },
    {
      id: 3,
      title: "Khóa học lập trình React",
      date: "2023-12-05",
      status: "completed",
      registrations: 210,
      revenue: 42000000
    }
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'upcoming':
        return { label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800' };
      case 'ongoing':
        return { label: 'Đang diễn ra', color: 'bg-green-100 text-green-800' };
      case 'completed':
        return { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
      default:
        return { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Xin chào, {user?.userName || 'Quản lý'} 👋
          </h1>
          <p className="text-gray-600">
            Đây là bảng điều khiển quản lý sự kiện của bạn
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng sự kiện</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sắp diễn ra</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng đăng ký</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRegistrations}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN').format(stats.totalRevenue)} đ
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
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
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${action.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pending Approvals Card */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Sự kiện cần phê duyệt
            </CardTitle>
            <CardDescription>
              Có {stats.pendingApprovals} sự kiện đang chờ phê duyệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sự kiện chờ duyệt</p>
                  <p className="text-sm text-gray-500">
                    {stats.pendingApprovals} sự kiện cần được phê duyệt
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate(`${PATH.MANAGER_EVENTS}?tab=${EventStatus.PendingApproval}`)}>
                Xem tất cả
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Sự kiện gần đây
            </CardTitle>
            <CardDescription>
              Các sự kiện đã tạo gần đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => {
                const statusConfig = getStatusConfig(event.status);
                return (
                  <div key={event.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString('vi-VN')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN').format(event.registrations)} đăng ký
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Intl.NumberFormat('vi-VN').format(event.revenue)} đ
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;