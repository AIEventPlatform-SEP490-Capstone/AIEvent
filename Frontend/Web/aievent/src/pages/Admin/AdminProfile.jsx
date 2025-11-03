import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/userProfile';
import { 
  User, 
  Edit3, 
  Activity,
  Calendar,
  Users,
  Shield,
  Lock,
  Mail,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ChangePasswordModal from '../../components/Auth/ChangePasswordModal';
import fireworkSound from '../../assets/firework.mp3';

const AdminProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [superAdminClickCount, setSuperAdminClickCount] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [easterEggActivated, setEasterEggActivated] = useState(false);
  const [fireworkTrigger, setFireworkTrigger] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    introduction: ''
  });
  const hasFetchedProfile = useRef(false);
  const clickTimeoutRef = useRef(null);
  
  const {
    profile,
    isLoading,
    isUpdating,
    error,
    updateError,
    getUserProfile,
    updateProfile,
    clearError,
  } = useUserProfile();

  useEffect(() => {
    if (!profile && !isLoading && !hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      getUserProfile();
    }
  }, [profile, isLoading, getUserProfile]);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        introduction: profile.introduction || ''
      });
    }
  }, [profile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Transform API data to display
  const adminData = profile ? {
    name: profile.fullName || "Chưa cập nhật",
    email: profile.email || "Chưa cập nhật",
    phone: profile.phoneNumber || "Chưa cập nhật",
    address: profile.address || "Chưa cập nhật",
    description: profile.introduction || "Quản trị viên hệ thống AIEvent Platform",
    role: profile.jobTitle || "System Administrator",
    department: profile.occupation || "IT Administration",
    avatarUrl: profile.avatarImgUrl || null,
    joinDate: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : "Chưa có",
    lastLogin: profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString('vi-VN') : "Chưa có"
  } : {
    name: "Chưa tải",
    email: "Chưa tải",
    phone: "Chưa tải",
    address: "Chưa tải",
    description: "Đang tải thông tin...",
    role: "System Administrator",
    department: "IT Administration",
    avatarUrl: null,
    joinDate: "Chưa có",
    lastLogin: "Chưa có"
  };

  // Mock stats - có thể tích hợp API riêng sau
  const adminStats = {
    totalOperations: 1247,
    eventsApproved: 89,
    usersManaged: 156,
  };

  const tabs = [
    { id: 'personal', label: 'Thông tin cá nhân' },
    { id: 'security', label: 'Bảo mật' },
    { id: 'activity', label: 'Hoạt động' }
  ];

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        introduction: profile.introduction || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        introduction: formData.introduction
      });
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSuperAdminClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    if (easterEggActivated && showFireworks) {
      setFireworkTrigger(prev => prev + 1);
      return;
    }
    const newCount = superAdminClickCount + 1;
    setSuperAdminClickCount(newCount);
    if (newCount >= 7) {
      setShowFireworks(true);
      setEasterEggActivated(true);
      setSuperAdminClickCount(0);
            setTimeout(() => {
        setShowFireworks(false);
        setEasterEggActivated(false);
      }, 15000);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        setSuperAdminClickCount(0);
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground text-lg">Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Hồ sơ Admin</h1>
              <p className="text-gray-300">Quản lý thông tin cá nhân và cài đặt bảo mật</p>
            </div>
          </div>
        </div>
        <Card className="shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Đã xảy ra lỗi khi tải thông tin hồ sơ</p>
              <p className="text-sm text-muted-foreground mb-6">{error.message || 'Vui lòng thử lại sau'}</p>
              <Button onClick={getUserProfile} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Header với gradient đen-xám bo góc */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden mt-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Hồ sơ Admin</h1>
            <p className="text-gray-300 text-lg">Quản lý thông tin cá nhân và cài đặt bảo mật</p>
          </div>
          <Badge 
            className="bg-white/10 backdrop-blur-sm text-white border-white/20 px-5 py-2 text-base h-auto hover:bg-white/20 transition-colors cursor-pointer select-none"
            onClick={handleSuperAdminClick}
          >
            <Shield className="h-4 w-4 mr-2" />
            Super Admin
          </Badge>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-4 font-semibold text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === 'personal' && (
          <div className="space-y-8">
            {/* Personal Information Card */}
            <Card className="shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Thông tin cá nhân</CardTitle>
                    <CardDescription className="text-base mt-1">Quản lý thông tin cá nhân của bạn</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button 
                      variant="outline" 
                      onClick={handleEdit}
                      className="border-gray-300 hover:bg-gray-50 shadow-sm"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {/* Profile Summary */}
                <div className="flex items-center space-x-8 mb-8 pb-8 border-b border-gray-200">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                      <div className="w-full h-full rounded-full bg-white p-1">
                        {adminData.avatarUrl ? (
                          <img
                            src={adminData.avatarUrl}
                            alt={adminData.name}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <User className="h-16 w-16 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-3xl font-bold text-gray-900 mb-2">{adminData.name}</h4>
                    <p className="text-lg text-gray-600 mb-3">{adminData.role}</p>
                    <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-0 px-4 py-1.5 text-sm font-semibold">
                      {adminData.department}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="group">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        Họ và tên
                      </Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="mt-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-900 font-medium">{adminData.name}</p>
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        Số điện thoại
                      </Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className="mt-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-900 font-medium">{adminData.phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        Mô tả
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="description"
                          value={formData.introduction}
                          onChange={(e) => handleInputChange('introduction', e.target.value)}
                          rows={4}
                          className="mt-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-900">{adminData.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="group">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        Email
                      </Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-900 font-medium">{adminData.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                      </div>
                    </div>

                    <div className="group">
                      <Label htmlFor="address" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        Địa chỉ
                      </Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="mt-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-900 font-medium">{adminData.address}</p>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex space-x-3 pt-6">
                        <Button 
                          onClick={handleSave} 
                          disabled={isUpdating}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all flex-1"
                        >
                          {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancel} 
                          disabled={isUpdating}
                          className="flex-1 border-gray-300 hover:bg-gray-50"
                        >
                          Hủy
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {updateError && (
                  <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                    <p className="text-sm text-red-700 font-medium">
                      Có lỗi xảy ra khi cập nhật: {updateError.message || 'Vui lòng thử lại'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Statistics - Moved below Personal Information */}
            <Card className="shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Thống kê Admin</CardTitle>
                  <CardDescription className="text-base mt-1">Thống kê hoạt động của bạn</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
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

                  <div className="border-t border-gray-200 pt-4 mt-4">
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
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50/50 border-b">
              <CardTitle className="text-2xl font-bold text-gray-900">Bảo mật</CardTitle>
              <CardDescription className="text-base mt-1">Quản lý bảo mật tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="max-w-2xl">
                <Card className="border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Lock className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">Đổi mật khẩu</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Cập nhật mật khẩu để bảo mật tài khoản của bạn. Chúng tôi khuyến nghị sử dụng mật khẩu mạnh với ít nhất 8 ký tự.
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all ml-6"
                      >
                        Đổi mật khẩu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
              <CardTitle className="text-2xl font-bold text-gray-900">Hoạt động</CardTitle>
              <CardDescription className="text-base mt-1">Lịch sử hoạt động gần đây của bạn</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="space-y-4">
                <div className="relative flex items-start space-x-4 p-5 bg-gradient-to-r from-blue-50/50 to-transparent rounded-xl border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 mb-1">Đăng nhập thành công</p>
                    <p className="text-sm text-gray-600 mb-2">Hệ thống đã xác thực thành công đăng nhập của bạn</p>
                    <p className="text-xs text-gray-500">14:30:00 15/3/2024</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-0">Thành công</Badge>
                </div>
                
                <div className="relative flex items-start space-x-4 p-5 bg-gradient-to-r from-green-50/50 to-transparent rounded-xl border-l-4 border-green-500 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 mb-1">Duyệt sự kiện "Tech Conference 2024"</p>
                    <p className="text-sm text-gray-600 mb-2">Bạn đã phê duyệt sự kiện thành công</p>
                    <p className="text-xs text-gray-500">10:15:00 15/3/2024</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-0">Đã duyệt</Badge>
                </div>
                
                <div className="relative flex items-start space-x-4 p-5 bg-gradient-to-r from-purple-50/50 to-transparent rounded-xl border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 mb-1">Quản lý người dùng mới</p>
                    <p className="text-sm text-gray-600 mb-2">Bạn đã thêm và quản lý người dùng mới vào hệ thống</p>
                    <p className="text-xs text-gray-500">09:45:00 15/3/2024</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-0">Hoàn thành</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* Fireworks Easter Egg */}
      {showFireworks && <Fireworks trigger={fireworkTrigger} />}
    </div>
  );
};

const Fireworks = ({ trigger }) => {
  const [particles, setParticles] = useState([]);
  const waveCountRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(fireworkSound);
    audioRef.current.volume = 0.5;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playFireworkSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.log('Không thể phát âm thanh:', error);
      });
    }
  }, []);

  useEffect(() => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800'];
    
    const createFireworks = () => {
      const newParticles = [];
      
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 50 + 10;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        for (let j = 0; j < 40; j++) {
          const angle = (Math.PI * 2 * j) / 40;
          const velocity = 2 + Math.random() * 4;
          newParticles.push({
            id: `${waveCountRef.current}-${i}-${j}`,
            x,
            y,
            color,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            life: 1,
          });
        }
      }
      
      return newParticles;
    };

    setParticles(createFireworks());
    playFireworkSound();

    const waveInterval = setInterval(() => {
      waveCountRef.current += 1;
      setParticles(prev => [...prev, ...createFireworks()]);
      playFireworkSound();
    }, 2000);

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.vx * 0.3,
          y: p.y + p.vy * 0.3,
          vy: p.vy + 0.15, // Gravity (nhẹ hơn)
          life: p.life - 0.008, // Fade out chậm hơn
        })).filter(p => p.life > 0 && p.y < 110)
      );
    }, 16);

    return () => {
      clearInterval(interval);
      clearInterval(waveInterval);
    };
  }, []);

  useEffect(() => {
    if (trigger > 0) {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800'];
      const newParticles = [];
      
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 50 + 10;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        for (let j = 0; j < 40; j++) {
          const angle = (Math.PI * 2 * j) / 40;
          const velocity = 2 + Math.random() * 4;
          waveCountRef.current += 1;
          newParticles.push({
            id: `trigger-${trigger}-${waveCountRef.current}-${i}-${j}`,
            x,
            y,
            color,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            life: 1,
          });
        }
      }
      
      setParticles(prev => [...prev, ...newParticles]);
      playFireworkSound();
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `scale(${particle.life})`,
            boxShadow: `0 0 ${particle.life * 10}px ${particle.color}`,
            transition: 'none',
          }}
        />
      ))}
    </div>
  );
};

export default AdminProfile;
