import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX,
  Shield,
  Eye,
  Calendar,
  MapPin,
  Mail,
  Users,
  TrendingUp,
  UserPlus,
  Lock,
  Unlock,
  Phone,
  Activity,
  Heart,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { useUserManagement } from '../../hooks/useUserManagement';
import { userManagementAPI } from '../../api/userManagementAPI';
import { showSuccess, showError } from '../../lib/toastUtils';

const UserManagement = () => {
  
  const { 
    users, 
    bannedUsers,
    selectedUser, 
    loading, 
    error, 
    pagination, 
    bannedPagination,
    filters, 
    activeTab,
    loadUsers, 
    loadUserById, 
    selectUser, 
    clearSelectedUserDetails, 
    banSelectedUser, 
    unbanSelectedUser,
    updateUserFilters,
    refreshUsers,
    clearUserManagementError,
    switchToActiveTab,
    switchToBannedTab
  } = useUserManagement();

  const [searchTerm, setSearchTerm] = useState(filters.name || '');
  const [filterRole, setFilterRole] = useState(filters.role || 'all');
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserDetail, setShowUserDetail] = useState(false);
  
  // State for create manager modal
  const [isCreateManagerModalOpen, setIsCreateManagerModalOpen] = useState(false);
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const [newManagerData, setNewManagerData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    image: null
  });

  // State for block/unblock confirmation
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [userToUnblock, setUserToUnblock] = useState(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const isInitialMount = useRef(true);
  const lastFilters = useRef({ name: '', role: 'all' });

  // Load users when component mounts
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadUsers(
        pagination.currentPage,
        pagination.pageSize,
        filters.email,
        filters.name,
        filters.role
      );
    }
  }, []); // Empty dependency array to run only once

  // Handle search with debounce to prevent infinite loops
  const debouncedSearch = useCallback(() => {
    // Prevent searching with the same filters
    if (searchTerm === lastFilters.current.name && filterRole === lastFilters.current.role) {
      return;
    }
    
    // Update last filters
    lastFilters.current = { name: searchTerm, role: filterRole };
    
    // Clear any existing errors before searching
    clearUserManagementError();
    
    // Update filters in Redux store
    updateUserFilters({
      name: searchTerm,
      role: filterRole === 'all' ? '' : filterRole,
      email: ''
    });
    
    // Load users with new filters
    loadUsers(
      1, // Reset to first page when filters change
      pagination.pageSize,
      '',
      searchTerm,
      filterRole === 'all' ? '' : filterRole
    );
  }, [searchTerm, filterRole, pagination.pageSize, loadUsers, updateUserFilters, clearUserManagementError]);

  // Auto-search when user has finished typing a meaningful search term
  useEffect(() => {
    let timeoutId;
    
    // Only trigger search automatically if we have a meaningful search term (3+ characters)
    if (searchTerm.length >= 3) {
      timeoutId = setTimeout(() => {
        debouncedSearch();
      }, 1000); // Wait 1 second after user stops typing
    }
    // If search term is cleared, reload with empty search
    else if (searchTerm.length === 0) {
      timeoutId = setTimeout(() => {
        debouncedSearch();
      }, 300); // Shorter delay for clearing search
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchTerm, filterRole, debouncedSearch]); // Remove localFilters from dependencies

  // Update local state when Redux filters change (e.g., from other components)
  useEffect(() => {
    // Only update if filters have actually changed
    if (filters.name !== searchTerm || filters.role !== filterRole) {
      setSearchTerm(filters.name || '');
      setFilterRole(filters.role || 'all');
    }
  }, [filters]); // Remove localFilters from dependencies

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearUserManagementError();
      }, 5000); // Clear error after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [error, clearUserManagementError]);

  const stats = {
    totalUsers: pagination.totalItems || 0,
    activeUsers: users.filter(u => u.roles && u.roles.some(r => r === 'User')).length,
    inactiveUsers: 0, // This would need to be calculated from user status
    pendingUsers: 0, // This would need to be calculated from user status
    organizers: users.filter(u => u.roles && u.roles.some(r => r === 'Organizer')).length
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleViewUser = async (userId) => {
    try {
      await loadUserById(userId);
      setShowUserDetail(true);
    } catch (err) {
      console.error('Failed to load user details:', err);
    }
  };

  const handleBanUser = (user) => {
    setUserToBlock(user);
    setShowBlockConfirm(true);
  };

  const handleUnbanUser = (user) => {
    setUserToUnblock(user);
    setShowUnblockConfirm(true);
  };

  const confirmBlockUser = async () => {
    if (!userToBlock) return;
    
    setIsBlocking(true);
    try {
      await banSelectedUser(userToBlock.id);
      showSuccess('Đã khóa người dùng thành công');
      setShowBlockConfirm(false);
      setUserToBlock(null);
    } catch (err) {
      console.error('Failed to ban user:', err);
      showError(err.message || 'Không thể khóa người dùng');
    } finally {
      setIsBlocking(false);
    }
  };

  const confirmUnblockUser = async () => {
    if (!userToUnblock) return;
    
    setIsUnblocking(true);
    try {
      await unbanSelectedUser(userToUnblock.id);
      showSuccess('Đã mở khóa người dùng thành công');
      setShowUnblockConfirm(false);
      setUserToUnblock(null);
    } catch (err) {
      console.error('Failed to unban user:', err);
      showError(err.message || 'Không thể mở khóa người dùng');
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleCreateManagerChange = (field, value) => {
    setNewManagerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewManagerData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleCreateManager = async () => {
    // Validate required fields
    if (!newManagerData.fullName || !newManagerData.email || !newManagerData.password || !newManagerData.phoneNumber) {
      showError('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newManagerData.email)) {
      showError('Please enter a valid email address');
      return;
    }

    // Validate phone number format (simple validation)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(newManagerData.phoneNumber)) {
      showError('Please enter a valid phone number');
      return;
    }

    // Validate password length
    if (newManagerData.password.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    setIsCreatingManager(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('FullName', newManagerData.fullName);
      formData.append('Email', newManagerData.email);
      formData.append('Password', newManagerData.password);
      formData.append('PhoneNumber', newManagerData.phoneNumber);
      if (newManagerData.address) {
        formData.append('Address', newManagerData.address);
      }
      if (newManagerData.image) {
        formData.append('Image', newManagerData.image);
      }

      await userManagementAPI.createManagerAccount(formData);
      showSuccess('Manager account created successfully');
      
      // Close modal and reset form
      setIsCreateManagerModalOpen(false);
      setNewManagerData({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        address: '',
        image: null
      });
      
      // Refresh user list
      refreshUsers();
    } catch (err) {
      console.error('Failed to create manager account:', err);
      showError(err.message || 'Failed to create manager account');
    } finally {
      setIsCreatingManager(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Hoạt động' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Không hoạt động' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Chờ duyệt' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Tạm khóa' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (roles) => {
    if (!roles || roles.length === 0) {
      return <Badge className="bg-gray-100 text-gray-800">User</Badge>;
    }

    const roleConfig = {
      Admin: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      Organizer: { color: 'bg-blue-100 text-blue-800', label: 'Tổ chức' },
      User: { color: 'bg-gray-100 text-gray-800', label: 'Người dùng' }
    };

    return roles.map((role, index) => {
      const config = roleConfig[role] || { color: 'bg-gray-100 text-gray-800', label: role };
      return (
        <Badge key={index} className={`${config.color} ml-1`}>
          {config.label}
        </Badge>
      );
    });
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    // Prevent searching with the same filters
    if (searchTerm === lastFilters.current.name && filterRole === lastFilters.current.role) {
      return;
    }
    
    // Update last filters
    lastFilters.current = { name: searchTerm, role: filterRole };
    
    // Clear any existing errors before searching
    clearUserManagementError();
    
    // Update filters in Redux store
    updateUserFilters({
      name: searchTerm,
      role: filterRole === 'all' ? '' : filterRole,
      email: ''
    });
    
    // Load users with new filters
    loadUsers(
      1, // Reset to first page when filters change
      pagination.pageSize,
      '',
      searchTerm,
      filterRole === 'all' ? '' : filterRole
    );
  };

  const getCurrentUsers = () => {
    return activeTab === 'active' ? users : bannedUsers;
  };

  const getCurrentPagination = () => {
    return activeTab === 'active' ? pagination : bannedPagination;
  };

  if (loading && getCurrentUsers().length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Quản lý người dùng
              </h1>
              <p className="text-slate-600 text-lg">Quản lý và theo dõi người dùng hệ thống</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0">
                <Shield className="w-4 h-4 mr-2" />
                Administrator
              </Badge>
              <Dialog open={isCreateManagerModalOpen} onOpenChange={setIsCreateManagerModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Thêm người dùng
                  </Button>
                </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader className="space-y-3 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">Tạo tài khoản Manager</DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Nhập thông tin cho tài khoản Manager mới
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-5 py-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Tên đầy đủ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="fullName"
                    value={newManagerData.fullName}
                    onChange={(e) => handleCreateManagerChange('fullName', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nhập tên đầy đủ"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={newManagerData.email}
                    onChange={(e) => handleCreateManagerChange('email', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="example@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={newManagerData.password}
                    onChange={(e) => handleCreateManagerChange('password', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" />
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="phoneNumber"
                    value={newManagerData.phoneNumber}
                    onChange={(e) => handleCreateManagerChange('phoneNumber', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="+84 xxx xxx xxx"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Địa chỉ
                  </label>
                  <Input
                    id="address"
                    value={newManagerData.address}
                    onChange={(e) => handleCreateManagerChange('address', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ (tùy chọn)"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="image" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    Ảnh đại diện
                  </label>
                  <div className="relative">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {newManagerData.image && (
                    <p className="text-xs text-slate-500 mt-1">Đã chọn: {newManagerData.image.name}</p>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateManagerModalOpen(false)}
                  disabled={isCreatingManager}
                  className="rounded-xl"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateManager}
                  disabled={isCreatingManager}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                >
                  {isCreatingManager ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Tạo tài khoản
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>


        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'active' 
                ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/20' 
                : 'text-slate-600 hover:bg-white/50'
            }`}
            onClick={switchToActiveTab}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Người dùng hoạt động
            </div>
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'banned' 
                ? 'bg-white text-red-600 shadow-lg shadow-red-500/20' 
                : 'text-slate-600 hover:bg-white/50'
            }`}
            onClick={switchToBannedTab}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Người dùng bị cấm
              <Badge className="ml-1 bg-red-100 text-red-700 border-0">
                {bannedPagination.totalItems || 0}
              </Badge>
            </div>
          </button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={handleSearchTermChange}
                    className="pl-12 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="pl-10 pr-4 py-3 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-48 appearance-none bg-white cursor-pointer"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="User">User</option>
                    <option value="Organizer">Organizer</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                
                <Button 
                  onClick={handleSearch}
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-xl font-semibold text-slate-800">
              {activeTab === 'active' ? 'Danh sách người dùng' : 'Danh sách người dùng bị cấm'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Error: {error}</span>
              </div>
            )}

            <div className="space-y-3">
              {getCurrentUsers().map((user, index) => (
                <div 
                  key={user.id} 
                  className="group relative flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-white"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative">
                      {user.avatarImgUrl ? (
                        <img 
                          src={user.avatarImgUrl} 
                          alt={user.fullName}
                          className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg">
                          <Users className="h-7 w-7 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 text-lg truncate">{user.fullName}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {user.email}
                        </span>
                        {user.phoneNumber && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {user.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'active' ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewUser(user.id)}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Xem
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleBanUser(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                          title="Khóa người dùng"
                        >
                          <Lock className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUnbanUser(user)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                        title="Mở khóa người dùng"
                      >
                        <Unlock className="w-4 h-4 mr-1.5" />
                        Mở khóa
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {getCurrentUsers().length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl mb-4">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {activeTab === 'active' ? 'Không tìm thấy người dùng' : 'Không có người dùng bị cấm'}
                </h3>
                <p className="text-slate-500">
                  {activeTab === 'active' 
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' 
                    : 'Tất cả người dùng đều đang hoạt động bình thường.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {getCurrentUsers().length > 0 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <div className="text-sm text-slate-600 font-medium">
                  Hiển thị <span className="text-blue-600 font-semibold">{(getCurrentPagination().currentPage - 1) * getCurrentPagination().pageSize + 1}</span> đến <span className="text-blue-600 font-semibold">{Math.min(getCurrentPagination().currentPage * getCurrentPagination().pageSize, getCurrentPagination().totalItems)}</span> trong tổng số <span className="text-blue-600 font-semibold">{getCurrentPagination().totalItems}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => loadUsers(
                      Math.max(getCurrentPagination().currentPage - 1, 1),
                      getCurrentPagination().pageSize,
                      filters.email,
                      filters.name,
                      filters.role
                    )}
                    disabled={getCurrentPagination().currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, getCurrentPagination().totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => loadUsers(
                            pageNum,
                            getCurrentPagination().pageSize,
                            filters.email,
                            filters.name,
                            filters.role
                          )}
                          variant={getCurrentPagination().currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className={getCurrentPagination().currentPage === pageNum 
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600" 
                            : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => loadUsers(
                      Math.min(getCurrentPagination().currentPage + 1, getCurrentPagination().totalPages),
                      getCurrentPagination().pageSize,
                      filters.email,
                      filters.name,
                      filters.role
                    )}
                    disabled={getCurrentPagination().currentPage === getCurrentPagination().totalPages}
                    variant="outline"
                    size="sm"
                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        {showUserDetail && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-xl font-bold">Thông tin chi tiết người dùng</h3>
                <button 
                  onClick={() => {
                    setShowUserDetail(false);
                    clearSelectedUserDetails();
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <span className="text-xl">&times;</span>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                  <div className="relative">
                    {selectedUser.avatarImgUrl ? (
                      <img 
                        src={selectedUser.avatarImgUrl} 
                        alt={selectedUser.fullName}
                        className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">{selectedUser.fullName}</h3>
                  </div>
                </div>

                {/* User Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <label className="text-xs font-semibold text-slate-600">Email</label>
                    </div>
                    <p className="text-sm text-slate-900 font-medium truncate">{selectedUser.email}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <label className="text-xs font-semibold text-slate-600">Số điện thoại</label>
                    </div>
                    <p className="text-sm text-slate-900 font-medium">{selectedUser.phoneNumber || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <label className="text-xs font-semibold text-slate-600">Địa điểm</label>
                    </div>
                    <p className="text-sm text-slate-900 font-medium truncate">{selectedUser.city || selectedUser.address || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <label className="text-xs font-semibold text-slate-600">Ngày tham gia</label>
                    </div>
                    <p className="text-sm text-slate-900 font-medium">N/A</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <label className="text-xs font-semibold text-slate-600">Hoạt động cuối</label>
                    </div>
                    <p className="text-sm text-slate-900 font-medium">N/A</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <label className="text-xs font-semibold text-slate-600">Bạn bè</label>
                    </div>
                    <p className="text-sm text-slate-900 font-medium">{selectedUser.totalFriends || 0} người</p>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-6 h-6 opacity-80" />
                      <p className="text-3xl font-bold">{selectedUser.totalJoinedEvents || 0}</p>
                    </div>
                    <p className="text-blue-100 text-sm font-medium">Sự kiện đã tham gia</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Heart className="w-6 h-6 opacity-80" />
                      <p className="text-3xl font-bold">{selectedUser.totalFavoriteEvents || 0}</p>
                    </div>
                    <p className="text-pink-100 text-sm font-medium">Sự kiện yêu thích</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Block User Confirmation Dialog */}
        {showBlockConfirm && userToBlock && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">Khóa người dùng</h3>
                    <p className="text-sm text-slate-500">Xác nhận hành động này</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-700 mb-2">
                    Bạn có chắc chắn muốn khóa người dùng này?
                  </p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-red-200">
                    {userToBlock.avatarImgUrl ? (
                      <img 
                        src={userToBlock.avatarImgUrl} 
                        alt={userToBlock.fullName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{userToBlock.fullName}</p>
                      <p className="text-xs text-slate-600 truncate">{userToBlock.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBlockConfirm(false);
                      setUserToBlock(null);
                    }}
                    disabled={isBlocking}
                    className="flex-1 rounded-xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={confirmBlockUser}
                    disabled={isBlocking}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    {isBlocking ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Đang khóa...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Khóa người dùng
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unblock User Confirmation Dialog */}
        {showUnblockConfirm && userToUnblock && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Unlock className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">Mở khóa người dùng</h3>
                    <p className="text-sm text-slate-500">Xác nhận hành động này</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-700 mb-2">
                    Bạn có chắc chắn muốn mở khóa người dùng này?
                  </p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-green-200">
                    {userToUnblock.avatarImgUrl ? (
                      <img 
                        src={userToUnblock.avatarImgUrl} 
                        alt={userToUnblock.fullName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{userToUnblock.fullName}</p>
                      <p className="text-xs text-slate-600 truncate">{userToUnblock.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUnblockConfirm(false);
                      setUserToUnblock(null);
                    }}
                    disabled={isUnblocking}
                    className="flex-1 rounded-xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={confirmUnblockUser}
                    disabled={isUnblocking}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  >
                    {isUnblocking ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Đang mở khóa...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Mở khóa người dùng
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default UserManagement;