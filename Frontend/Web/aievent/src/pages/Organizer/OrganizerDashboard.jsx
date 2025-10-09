import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, Calendar, BarChart3, Users, Settings } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { PATH } from '../../routes/path';

const OrganizerDashboard = () => {
  const { user } = useSelector((state) => state.auth);


  const dashboardCards = [
    {
      title: 'Tạo sự kiện mới',
      description: 'Tạo và quản lý sự kiện của bạn',
      icon: Plus,
      link: PATH.ORGANIZER_CREATE,
      color: 'bg-blue-500',
    },
    {
      title: 'Sự kiện của tôi',
      description: 'Xem và quản lý các sự kiện đã tạo',
      icon: Calendar,
      link: PATH.ORGANIZER_MY_EVENTS,
      color: 'bg-green-500',
    },
    {
      title: 'Thống kê',
      description: 'Xem báo cáo và phân tích',
      icon: BarChart3,
      link: PATH.ORGANIZER_EVENTS,
      color: 'bg-purple-500',
    },
    {
      title: 'Quản lý người tham gia',
      description: 'Quản lý danh sách người tham gia',
      icon: Users,
      link: PATH.ORGANIZER_EVENTS,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chào mừng, {user?.fullName || user?.unique_name || user?.name || 'Organizer'}!
        </h1>
        <p className="text-gray-600">
          Quản lý sự kiện và theo dõi hiệu suất của bạn
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          <Link to={PATH.ORGANIZER_CREATE}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tạo sự kiện mới
            </Button>
          </Link>
          <Link to={PATH.ORGANIZER_MY_EVENTS}>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sự kiện của tôi
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Link key={index} to={card.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`${card.color} p-2 rounded-full`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sự kiện gần đây</CardTitle>
            <CardDescription>
              Các sự kiện bạn đã tạo gần đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Chưa có sự kiện nào</p>
                  <p className="text-sm text-gray-500">
                    Tạo sự kiện đầu tiên của bạn
                  </p>
                </div>
                <Link to={PATH.ORGANIZER_CREATE}>
                  <Button size="sm">Tạo ngay</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê tổng quan</CardTitle>
            <CardDescription>
              Tổng quan về hoạt động của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tổng sự kiện</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Sự kiện đang diễn ra</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tổng người tham gia</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Doanh thu</span>
                <span className="font-medium">0 VNĐ</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
