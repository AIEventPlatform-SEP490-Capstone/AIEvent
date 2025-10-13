import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - thay thế bằng API calls thực tế
  const stats = {
    totalUsers: 15420,
    organizers: 342,
    totalEvents: 1250,
    pendingEvents: 23,
    pendingOrganizers: 1
  };

  const pendingEvents = [
    {
      id: 1,
      title: "Vietnam Tech Conference 2024",
      date: "10/3/2024",
      image: "/api/placeholder/300/200",
      organizer: "Tech Community"
    },
    {
      id: 2,
      title: "Indie Music Night",
      date: "10/3/2024",
      image: "/api/placeholder/300/200",
      organizer: "Music Group"
    }
  ];

  const pendingOrganizers = [
    {
      id: 1,
      name: "Vietnam Tech Community",
      applicant: "Nguyễn Văn A",
      date: "10/3/2024"
    }
  ];

  const newUsers = [
    {
      id: 1,
      name: "Nguyễn Văn An",
      email: "an.nguyen@email.com",
      role: "User",
      avatar: "/api/placeholder/40/40"
    },
    {
      id: 2,
      name: "Trần Thị Bình",
      email: "binh.tran@organizer.com",
      role: "Organizer",
      avatar: "/api/placeholder/40/40"
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'events', label: 'Quản lý sự kiện' },
    { id: 'users', label: 'Quản lý người dùng' },
    { id: 'organizers', label: 'Duyệt Organizer' },
    { id: 'reports', label: 'Báo cáo' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Quản lý hệ thống AIEvent</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-3 w-3 mr-1" />
          Administrator
        </Badge>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    +12.5% so với tháng trước
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nhà tổ chức</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.organizers}</div>
                  <p className="text-xs text-muted-foreground">
                    Tổ chức sự kiện
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng sự kiện</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    Sự kiện đã tạo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sự kiện chờ duyệt</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    Cần xem xét
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đơn Organizer</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingOrganizers}</div>
                  <p className="text-xs text-muted-foreground">
                    Chờ phê duyệt
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Events */}
            <Card>
              <CardHeader>
                <CardTitle>Sự kiện chờ duyệt</CardTitle>
                <CardDescription>Các sự kiện đang chờ phê duyệt từ admin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingEvents.map((event) => (
                    <Card key={event.id} className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">Gửi ngày {event.date}</p>
                          <div className="flex space-x-2 mt-3">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Organizers */}
            <Card>
              <CardHeader>
                <CardTitle>Đơn Organizer chờ duyệt</CardTitle>
                <CardDescription>Các đơn đăng ký trở thành organizer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingOrganizers.map((org) => (
                    <Card key={org.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{org.name}</h4>
                            <p className="text-sm text-muted-foreground">{org.applicant} - {org.date}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Clock className="h-4 w-4 text-yellow-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* New Users */}
            <Card>
              <CardHeader>
                <CardTitle>Người dùng mới</CardTitle>
                <CardDescription>Những người dùng mới đăng ký gần đây</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newUsers.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0 flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant={user.role === 'Organizer' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'events' && (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý sự kiện</CardTitle>
              <CardDescription>Quản lý và duyệt các sự kiện trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tính năng đang được phát triển...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý người dùng</CardTitle>
              <CardDescription>Quản lý tài khoản người dùng và phân quyền</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tính năng đang được phát triển...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'organizers' && (
          <Card>
            <CardHeader>
              <CardTitle>Duyệt Organizer</CardTitle>
              <CardDescription>Duyệt và quản lý các đơn đăng ký organizer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tính năng đang được phát triển...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'reports' && (
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo</CardTitle>
              <CardDescription>Thống kê và báo cáo hoạt động hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tính năng đang được phát triển...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
