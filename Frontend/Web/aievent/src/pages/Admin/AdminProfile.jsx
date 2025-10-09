import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Edit3, 
  Star,
  Activity,
  Calendar,
  Users,
  Shield,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

const AdminProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  // Mock data - thay thế bằng API calls thực tế
  const adminData = {
    name: "Lê Văn C",
    email: "admin@demo.com",
    phone: "+84 123 456 789",
    address: "Hà Nội, Việt Nam",
    description: "Quản trị viên hệ thống AIEvent Platform",
    role: "System Administrator",
    department: "IT Administration",
    joinDate: "15/1/2023",
    lastLogin: "14:30:00 15/3/2024"
  };

  const adminStats = {
    totalOperations: 1247,
    eventsApproved: 89,
    usersManaged: 156,
    systemUptime: "99.9%"
  };

  const tabs = [
    { id: 'personal', label: 'Thông tin cá nhân' },
    { id: 'security', label: 'Bảo mật' },
    { id: 'activity', label: 'Hoạt động' },
    { id: 'options', label: 'Tùy chọn' }
  ];

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // Implement save logic here
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ sơ Admin</h1>
          <p className="text-muted-foreground">Quản lý thông tin cá nhân và cài đặt bảo mật</p>
        </div>
        <Button>
          <Star className="h-4 w-4 mr-2" />
          Super Admin
        </Button>
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
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Thông tin cá nhân</CardTitle>
                      <CardDescription>Quản lý thông tin cá nhân của bạn</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleEdit}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <User className="h-12 w-12 text-blue-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">{adminData.name}</h4>
                      <p className="text-gray-600">{adminData.role}</p>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mt-2">
                        {adminData.department}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Họ và tên</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            type="text"
                            defaultValue={adminData.name}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-medium mt-1">{adminData.name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Số điện thoại</Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            type="tel"
                            defaultValue={adminData.phone}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-medium mt-1">{adminData.phone}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description">Mô tả</Label>
                        {isEditing ? (
                          <Textarea
                            id="description"
                            defaultValue={adminData.description}
                            rows={3}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-medium mt-1">{adminData.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          defaultValue={adminData.email}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">{adminData.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address">Địa chỉ</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          type="text"
                          defaultValue={adminData.address}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">{adminData.address}</p>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex space-x-3 pt-4">
                        <Button onClick={handleSave}>
                          Lưu thay đổi
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Hủy
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê Admin</CardTitle>
                <CardDescription>Thống kê hoạt động của bạn</CardDescription>
              </CardHeader>
              <CardContent>
              
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-muted-foreground mr-3" />
                      <span className="text-sm">Tổng thao tác</span>
                    </div>
                    <span className="font-semibold">{adminStats.totalOperations.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-muted-foreground mr-3" />
                      <span className="text-sm">Sự kiện đã duyệt</span>
                    </div>
                    <span className="font-semibold">{adminStats.eventsApproved}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-muted-foreground mr-3" />
                      <span className="text-sm">User đã quản lý</span>
                    </div>
                    <span className="font-semibold">{adminStats.usersManaged}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-muted-foreground mr-3" />
                      <span className="text-sm">Uptime hệ thống</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {adminStats.systemUptime}
                    </Badge>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tham gia từ:</span>
                        <span className="text-sm font-medium">{adminData.joinDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Đăng nhập cuối:</span>
                        <span className="text-sm font-medium">{adminData.lastLogin}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật</CardTitle>
              <CardDescription>Quản lý bảo mật tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Đổi mật khẩu</h4>
                  <p className="text-sm text-muted-foreground">Cập nhật mật khẩu để bảo mật tài khoản</p>
                  <Button>Đổi mật khẩu</Button>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Xác thực hai yếu tố</h4>
                  <p className="text-sm text-muted-foreground">Thêm lớp bảo mật bổ sung cho tài khoản</p>
                  <Button variant="outline">Bật 2FA</Button>
                </div>
              </Card>
            </CardContent>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động</CardTitle>
              <CardDescription>Lịch sử hoạt động gần đây của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Đăng nhập thành công</p>
                  <p className="text-sm text-muted-foreground">14:30:00 15/3/2024</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Duyệt sự kiện "Tech Conference 2024"</p>
                  <p className="text-sm text-muted-foreground">10:15:00 15/3/2024</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Quản lý người dùng mới</p>
                  <p className="text-sm text-muted-foreground">09:45:00 15/3/2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'options' && (
          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn</CardTitle>
              <CardDescription>Cài đặt cá nhân hóa giao diện</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Thông báo email</h4>
                  <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Chế độ tối</h4>
                  <p className="text-sm text-muted-foreground">Sử dụng giao diện tối</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;
