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
  Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useUserManagement } from '../../hooks/useUserManagement';

const UserManagement = () => {
  
  const { 
    users, 
    selectedUser, 
    loading, 
    error, 
    pagination, 
    filters, 
    loadUsers, 
    loadUserById, 
    selectUser, 
    clearSelectedUserDetails, 
    banSelectedUser, 
    updateUserFilters,
    refreshUsers,
    clearUserManagementError
  } = useUserManagement();

  const [searchTerm, setSearchTerm] = useState(filters.name || '');
  const [filterRole, setFilterRole] = useState(filters.role || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserDetail, setShowUserDetail] = useState(false);

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

  const handleBanUser = async (userId) => {
    if (window.confirm('Are you sure you want to ban this user?')) {
      try {
        await banSelectedUser(userId);
      } catch (err) {
        console.error('Failed to ban user:', err);
      }
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

  if (loading && users.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý và theo dõi người dùng hệ thống</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            <Shield className="w-4 h-4 mr-2" />
            Administrator
          </Badge>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Tổng người dùng</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Tổ chức sự kiện</p>
                <p className="text-2xl font-bold text-purple-600">{stats.organizers}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Mới tháng này</p>
                <p className="text-2xl font-bold text-orange-600">0</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent w-full md:w-48"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="User">Người dùng</option>
              <option value="Organizer">Tổ chức</option>
              <option value="Admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent w-full md:w-48"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Tạm khóa</option>
              <option value="inactive">Không hoạt động</option>
            </select>
            
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
              Error: {error}
            </div>
          )}

          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full flex-shrink-0 flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                      {getRoleBadge(user.roles)}
                      {getStatusBadge('active')}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-800 mt-1">
                      <span className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {user.city || user.address || 'N/A'}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Tham gia: N/A
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewUser(user.id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBanUser(user.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Khóa người dùng"
                  >
                    <Lock className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">Không tìm thấy người dùng</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(pagination.currentPage - 1) * pagination.pageSize + 1} đến {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} trong tổng số {pagination.totalItems}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => loadUsers(
                  Math.max(pagination.currentPage - 1, 1),
                  pagination.pageSize,
                  filters.email,
                  filters.name,
                  filters.role
                )}
                disabled={pagination.currentPage === 1}
                variant="outline"
                size="sm"
              >
                Trước
              </Button>
              <Button
                onClick={() => loadUsers(
                  Math.min(pagination.currentPage + 1, pagination.totalPages),
                  pagination.pageSize,
                  filters.email,
                  filters.name,
                  filters.role
                )}
                disabled={pagination.currentPage === pagination.totalPages}
                variant="outline"
                size="sm"
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Thông tin chi tiết người dùng</h3>
                <button 
                  onClick={() => {
                    setShowUserDetail(false);
                    clearSelectedUserDetails();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex-shrink-0 flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.fullName}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleBadge(selectedUser.roles)}
                      {getStatusBadge('active')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-800">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-800">Số điện thoại</label>
                    <p className="text-gray-900">{selectedUser.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-800">Địa điểm</label>
                    <p className="text-gray-900">{selectedUser.city || selectedUser.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-800">Ngày tham gia</label>
                    <p className="text-gray-900">N/A</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-800">Hoạt động cuối</label>
                    <p className="text-gray-900">N/A</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-800">Bạn bè</label>
                    <p className="text-gray-900">{selectedUser.totalFriends || 0} người</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedUser.totalJoinedEvents || 0}</p>
                      <p className="text-sm text-gray-800">Sự kiện đã tham gia</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedUser.totalFavoriteEvents || 0}</p>
                      <p className="text-sm text-gray-800">Sự kiện yêu thích</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;