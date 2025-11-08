import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  MoreHorizontal,
  UserMinus,
  X,
  Calendar,
  MapPin,
  MessageCircle,
  CheckCircle2,
  XCircle,
  UserCheck
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { friendAPI } from '../../api/friendAPI';
import { showSuccess, showError } from '../../lib/toastUtils';

const FriendsTab = ({ user, initialFriendRequestsCount = 0, onFriendRequestsCountChange }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'search', 'requests'

  // Friends list state
  const [friends, setFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState(null);
  const [friendsPagination, setFriendsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchPagination, setSearchPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });

  // Friend requests state
  const [friendRequests, setFriendRequests] = useState([]);
  const [isLoadingFriendRequests, setIsLoadingFriendRequests] = useState(false);
  const [friendRequestsError, setFriendRequestsError] = useState(null);
  const [friendRequestsPagination, setFriendRequestsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [friendRequestsCount, setFriendRequestsCount] = useState(initialFriendRequestsCount);
  const [sentFriendRequests, setSentFriendRequests] = useState(new Set()); // Track sent friend requests
  const [addingFriendId, setAddingFriendId] = useState(null); // Track which friend request is being processed

  // UI state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [hoveredFriendId, setHoveredFriendId] = useState(null);
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
  const [friendToUnfriend, setFriendToUnfriend] = useState(null);
  const [isUnfriending, setIsUnfriending] = useState(false);
  const menuRefs = useRef({});
  const hoverCardRefs = useRef({});
  const friendsListRef = useRef(null);

  // Fetch friends when component mounts or user changes
  const fetchFriends = useCallback(async (pageNumber = 1) => {
    if (!user) return;

    setIsLoadingFriends(true);
    setFriendsError(null);

    try {
      const response = await friendAPI.getFriends({ pageNumber, pageSize: 10 });
      if (response.statusCode === "AIE20000" && response.data) {
        setFriends(response.data.items || []);
        setFriendsPagination({
          currentPage: response.data.currentPage || pageNumber,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalItems || 0,
          pageSize: response.data.pageSize || 10
        });
      } else {
        setFriendsError("Không thể tải danh sách bạn bè");
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriendsError(error.message || 'Không thể tải danh sách bạn bè');
    } finally {
      setIsLoadingFriends(false);
    }
  }, [user]);

  // Search friends
  const handleSearchFriends = useCallback(async (pageNumber = 1) => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await friendAPI.searchFriends({
        keyword: searchKeyword.trim(),
        pageNumber,
        pageSize: 10
      });

      if (response.statusCode === "AIE20000" && response.data) {
        setSearchResults(response.data.items || []);
        setSearchPagination({
          currentPage: response.data.currentPage || pageNumber,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalItems || 0,
          pageSize: response.data.pageSize || 10
        });
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching friends:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchKeyword]);

  // Fetch friend requests count only (for badge display)
  const fetchFriendRequestsCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await friendAPI.getFriendRequests({ pageNumber: 1, pageSize: 1 });
      if (response.statusCode === "AIE20000" && response.data) {
        // Update badge count from totalItems
        const count = response.data.totalItems || 0;
        setFriendRequestsCount(count);
        // Notify parent component
        if (onFriendRequestsCountChange) {
          onFriendRequestsCountChange(count);
        }
      }
    } catch (error) {
      console.error('Error fetching friend requests count:', error);
      // Silently fail - don't show error for badge count
    }
  }, [user, onFriendRequestsCountChange]);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async (pageNumber = 1) => {
    if (!user) return;

    setIsLoadingFriendRequests(true);
    setFriendRequestsError(null);

    try {
      const response = await friendAPI.getFriendRequests({ pageNumber, pageSize: 10 });
      if (response.statusCode === "AIE20000" && response.data) {
        setFriendRequests(response.data.items || []);
        setFriendRequestsPagination({
          currentPage: response.data.currentPage || pageNumber,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalItems || 0,
          pageSize: response.data.pageSize || 10
        });
        // Update badge count
        const count = response.data.totalItems || 0;
        setFriendRequestsCount(count);
        // Notify parent component
        if (onFriendRequestsCountChange) {
          onFriendRequestsCountChange(count);
        }
      } else {
        setFriendRequestsError("Không thể tải danh sách lời mời kết bạn");
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setFriendRequestsError(error.message || 'Không thể tải danh sách lời mời kết bạn');
    } finally {
      setIsLoadingFriendRequests(false);
    }
  }, [user, onFriendRequestsCountChange]);

  // Sync initial count from parent
  useEffect(() => {
    if (initialFriendRequestsCount !== undefined && initialFriendRequestsCount !== friendRequestsCount) {
      setFriendRequestsCount(initialFriendRequestsCount);
    }
  }, [initialFriendRequestsCount]);

  // Fetch friend requests count when component mounts (only if not provided by parent)
  useEffect(() => {
    if (user && initialFriendRequestsCount === 0) {
      fetchFriendRequestsCount();
    }
  }, [user, initialFriendRequestsCount, fetchFriendRequestsCount]);

  useEffect(() => {
    if (user && activeTab === 'friends') {
      fetchFriends(1);
    } else if (user && activeTab === 'requests') {
      fetchFriendRequests(1);
    }
  }, [user, activeTab, fetchFriends, fetchFriendRequests]);

  // Accept friend request
  const handleAcceptFriendRequest = async (requestId, senderName) => {
    if (processingRequestId === requestId) return;

    setProcessingRequestId(requestId);

    try {
      const response = await friendAPI.acceptFriendRequest(requestId);

      const statusCode = response?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        showSuccess(`Đã chấp nhận lời mời kết bạn từ ${senderName}`);
        // Remove from list
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        setFriendRequestsPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1)
        }));
        // Update badge count
        setFriendRequestsCount(prev => {
          const newCount = Math.max(0, prev - 1);
          // Notify parent component
          if (onFriendRequestsCountChange) {
            onFriendRequestsCountChange(newCount);
          }
          return newCount;
        });
        // Refresh friends list if on friends tab
        if (activeTab === 'friends') {
          fetchFriends(friendsPagination.currentPage);
        }
      } else {
        showError('Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      const errorStatusCode = error.response?.data?.statusCode;

      if (error.response?.status === 200 || errorStatusCode === "AIE20000" || errorStatusCode === "AIE20100") {
        showSuccess(`Đã chấp nhận lời mời kết bạn từ ${senderName}`);
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        setFriendRequestsPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1)
        }));
        setFriendRequestsCount(prev => {
          const newCount = Math.max(0, prev - 1);
          // Notify parent component
          if (onFriendRequestsCountChange) {
            onFriendRequestsCountChange(newCount);
          }
          return newCount;
        });
      } else {
        showError('Đã xảy ra lỗi khi chấp nhận lời mời. Vui lòng thử lại.');
      }
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Reject friend request
  const handleRejectFriendRequest = async (requestId, senderName) => {
    if (processingRequestId === requestId) return;

    setProcessingRequestId(requestId);

    try {
      const response = await friendAPI.rejectFriendRequest(requestId);

      const statusCode = response?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        showSuccess(`Đã từ chối lời mời kết bạn từ ${senderName}`);
        // Remove from list
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        setFriendRequestsPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1)
        }));
        // Update badge count
        setFriendRequestsCount(prev => {
          const newCount = Math.max(0, prev - 1);
          // Notify parent component
          if (onFriendRequestsCountChange) {
            onFriendRequestsCountChange(newCount);
          }
          return newCount;
        });
      } else {
        showError('Không thể từ chối lời mời kết bạn. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      const errorStatusCode = error.response?.data?.statusCode;

      if (error.response?.status === 200 || errorStatusCode === "AIE20000" || errorStatusCode === "AIE20100") {
        showSuccess(`Đã từ chối lời mời kết bạn từ ${senderName}`);
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        setFriendRequestsPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1)
        }));
        setFriendRequestsCount(prev => {
          const newCount = Math.max(0, prev - 1);
          // Notify parent component
          if (onFriendRequestsCountChange) {
            onFriendRequestsCountChange(newCount);
          }
          return newCount;
        });
      } else {
        showError('Đã xảy ra lỗi khi từ chối lời mời. Vui lòng thử lại.');
      }
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return diffMinutes <= 1 ? 'Vừa xong' : `${diffMinutes} phút trước`;
        }
        return `${diffHours} giờ trước`;
      } else if (diffDays === 1) {
        return 'Hôm qua';
      } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
      } else {
        return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch (e) {
      return dateString;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId) {
        const regularMenuRef = menuRefs.current[openMenuId];
        const hovercardMenuRef = menuRefs.current[`hovercard-${openMenuId}`];

        const isClickInsideRegularMenu = regularMenuRef && regularMenuRef.contains(event.target);
        const isClickInsideHovercardMenu = hovercardMenuRef && hovercardMenuRef.contains(event.target);

        if (!isClickInsideRegularMenu && !isClickInsideHovercardMenu) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  const handleViewProfile = (friendId) => {
    navigate(`/friend/${friendId}`);
    setOpenMenuId(null);
  };

  const handleUnfriend = (friendId) => {
    const friend = friends.find(f => f.id === friendId);
    setFriendToUnfriend(friend);
    setUnfriendDialogOpen(true);
    setOpenMenuId(null);
    setHoveredFriendId(null);
  };

  // Validate GUID format
  const isValidGuid = (guid) => {
    if (!guid || typeof guid !== 'string') return false;
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  };

  const confirmUnfriend = async () => {
    if (!friendToUnfriend) return;

    // Validate friend ID
    const friendId = friendToUnfriend.id || friendToUnfriend.friendId;
    if (!friendId) {
      showError('Không tìm thấy ID của bạn bè. Vui lòng thử lại.');
      setUnfriendDialogOpen(false);
      setFriendToUnfriend(null);
      return;
    }

    // Validate GUID format
    if (!isValidGuid(friendId)) {
      console.error('Invalid GUID format:', friendId);
      showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
      setUnfriendDialogOpen(false);
      setFriendToUnfriend(null);
      return;
    }

    setIsUnfriending(true);
    try {
      const response = await friendAPI.deleteFriend(friendId);

      const statusCode = response?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        showSuccess(`Đã hủy kết bạn với ${friendToUnfriend.friendName || 'người dùng này'}`);

        setFriends(prevFriends => {
          const remainingFriends = prevFriends.filter(f => (f.id || f.friendId) !== friendId);

          if (remainingFriends.length === 0 && friendsPagination.currentPage > 1) {
            setTimeout(() => {
              fetchFriends(friendsPagination.currentPage - 1);
            }, 100);
          }

          return remainingFriends;
        });

        setFriendsPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1)
        }));
      } else {
        // Check for specific error codes
        const errorMessage = response?.message || 'Không thể hủy kết bạn. Vui lòng thử lại.';
        if (statusCode === "AIE40001") {
          showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
        } else {
          showError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error unfriending:', error);
      const errorData = error.response?.data || {};
      const errorStatusCode = errorData.statusCode;
      const errorMessage = errorData.message || error.message || 'Đã xảy ra lỗi khi hủy kết bạn.';

      // Handle success responses that might be in error format
      if (error.response?.status === 200 || errorStatusCode === "AIE20000" || errorStatusCode === "AIE20100") {
        showSuccess(`Đã hủy kết bạn với ${friendToUnfriend.friendName || 'người dùng này'}`);
        setFriends(prevFriends => {
          const remainingFriends = prevFriends.filter(f => (f.id || f.friendId) !== friendId);
          if (remainingFriends.length === 0 && friendsPagination.currentPage > 1) {
            setTimeout(() => {
              fetchFriends(friendsPagination.currentPage - 1);
            }, 100);
          }
          return remainingFriends;
        });
        setFriendsPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1)
        }));
      } else if (errorStatusCode === "AIE40001") {
        // Invalid GUID format error
        showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsUnfriending(false);
      setUnfriendDialogOpen(false);
      setFriendToUnfriend(null);
    }
  };

  const handleMessage = (friendId) => {
    // TODO: Implement message functionality
    setHoveredFriendId(null);
  };

  const handleAddFriend = async (friendId) => {
    if (addingFriendId === friendId) return; // Prevent duplicate requests

    setAddingFriendId(friendId);
    setHoveredFriendId(null); // Close hovercard

    try {
      const response = await friendAPI.addFriend(friendId);

      // Log response for debugging
      console.log('Add friend response:', response);

      const statusCode = response?.statusCode;

      // Check for success status codes
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      // Check for specific error: friendship already exists
      const isAlreadyFriends = statusCode === "AIE40001";

      if (isSuccess) {
        // Add to sent requests set
        setSentFriendRequests(prev => new Set([...prev, friendId]));
        showSuccess('Đã gửi lời mời kết bạn thành công');
      } else if (isAlreadyFriends) {
        // Friendship already exists
        showError('Bạn đã là bạn bè với người này rồi');
      } else {
        // Other errors
        showError('Không thể gửi lời mời kết bạn. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      console.error('Error response:', error.response);

      const errorStatusCode = error.response?.data?.statusCode;

      // Check if it's actually a success but axios threw an error
      if (error.response?.status === 200 || errorStatusCode === "AIE20000" || errorStatusCode === "AIE20100") {
        setSentFriendRequests(prev => new Set([...prev, friendId]));
        showSuccess('Đã gửi lời mời kết bạn thành công');
      } else if (errorStatusCode === "AIE40001") {
        // Friendship already exists
        showError('Bạn đã gửi lời mời kết bạn tới người này rồi');
      } else {
        // Other errors
        showError('Đã xảy ra lỗi khi gửi lời mời kết bạn. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setAddingFriendId(null);
    }
  };

  const toggleMenu = (friendId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === friendId ? null : friendId);
  };

  const getHoverCardPosition = (friendId) => {
    if (!hoverCardRefs.current[friendId]) return { top: 0, left: 0 };
    const rect = hoverCardRefs.current[friendId].getBoundingClientRect();
    const cardWidth = 320;
    const spaceRight = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.bottom;

    let left = spaceRight > cardWidth + 20 ? rect.right + 10 : rect.left - cardWidth - 10;

    if (left < 10) left = 10;
    if (left + cardWidth > window.innerWidth - 10) {
      left = window.innerWidth - cardWidth - 10;
    }

    let top = rect.top;

    if (top + 250 > window.innerHeight - 10) {
      top = window.innerHeight - 250 - 10;
    }

    if (top < 10) top = 10;

    return { top, left };
  };

  const getMenuPosition = (friendId) => {
    if (!menuRefs.current[friendId]) return 'bottom';
    const rect = menuRefs.current[friendId].getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    return spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom';
  };

  const handlePageChange = (newPage, type = 'friends') => {
    if (type === 'friends') {
      if (newPage >= 1 && newPage <= friendsPagination.totalPages) {
        fetchFriends(newPage);
        setTimeout(() => {
          if (friendsListRef.current) {
            friendsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      }
    } else if (type === 'search') {
      if (newPage >= 1 && newPage <= searchPagination.totalPages) {
        handleSearchFriends(newPage);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearchFriends(1);
  };

  // Render friend card component
  const renderFriendCard = (friend, isSearchResult = false) => {
    const friendData = friend;
    const isFriend = !isSearchResult; // If it's from search, they're not friends yet

    return (
      <Card
        key={friendData.id}
        className="hover:shadow-md transition-all duration-200 border border-gray-200"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="flex-shrink-0 relative"
              ref={(el) => hoverCardRefs.current[friendData.id] = el}
              onMouseEnter={() => setHoveredFriendId(friendData.id)}
              onMouseLeave={() => setHoveredFriendId(null)}
            >
              {friendData.image ? (
                <img
                  src={friendData.image}
                  alt={friendData.friendName}
                  className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                  onClick={() => handleViewProfile(friendData.id)}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center cursor-pointer"
                  onClick={() => handleViewProfile(friendData.id)}
                >
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
              )}

              {/* Hovercard */}
              {hoveredFriendId === friendData.id && (
                <div
                  className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80"
                  style={{
                    top: `${getHoverCardPosition(friendData.id).top}px`,
                    left: `${getHoverCardPosition(friendData.id).left}px`,
                  }}
                  onMouseEnter={() => setHoveredFriendId(friendData.id)}
                  onMouseLeave={() => setHoveredFriendId(null)}
                >
                  <button
                    onClick={() => setHoveredFriendId(null)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>

                  <div className="flex gap-3 pr-6">
                    <div className="flex-shrink-0">
                      {friendData.image ? (
                        <img
                          src={friendData.image}
                          alt={friendData.friendName}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <UserCircle className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base mb-2 text-gray-900">
                        {friendData.friendName || "Người dùng"}
                      </h3>

                      {friendData.district && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{friendData.district}</span>
                        </div>
                      )}

                      {friendData.eventNumber !== undefined && friendData.eventNumber !== null && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{friendData.eventNumber} sự kiện chung</span>
                        </div>
                      )}

                      {friendData.interestsJson && (() => {
                        try {
                          const interests = JSON.parse(friendData.interestsJson);
                          if (Array.isArray(interests) && interests.length > 0) {
                            // Extract interest names - handle both string and object formats
                            const interestNames = interests
                              .slice(0, 3)
                              .map(interest => {
                                // If interest is an object with InterestName property
                                if (typeof interest === 'object' && interest !== null) {
                                  return interest.InterestName || interest.interestName || interest.name || '';
                                }
                                // If interest is already a string
                                return interest || '';
                              })
                              .filter(name => name !== ''); // Filter out empty strings

                            if (interestNames.length > 0) {
                              return (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1">Sở thích:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {interestNames.map((interestName, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                                      >
                                        {interestName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          }
                        } catch (e) {
                          // Invalid JSON
                          console.error('Error parsing interestsJson:', e);
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    {isFriend ? (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            handleViewProfile(friendData.id);
                            setHoveredFriendId(null);
                          }}
                        >
                          <UserCircle className="w-4 h-4 mr-2" />
                          Bạn bè
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleMessage(friendData.id)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Nhắn tin
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        onClick={() => handleAddFriend(friendData.id)}
                        disabled={addingFriendId === friendData.id || sentFriendRequests.has(friendData.id)}
                      >
                        {addingFriendId === friendData.id ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Đang gửi...
                          </>
                        ) : sentFriendRequests.has(friendData.id) ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Đã gửi lời mời
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Kết bạn
                          </>
                        )}
                      </Button>
                    )}
                    <div className="relative" ref={(el) => menuRefs.current[`hovercard-${friendData.id}`] = el}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(friendData.id, e);
                        }}
                        className="p-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-600" />
                      </button>
                      {openMenuId === friendData.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[101] py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(friendData.id);
                              setOpenMenuId(null);
                              setHoveredFriendId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <UserCircle className="w-4 h-4 text-muted-foreground" />
                            <span>Hồ sơ</span>
                          </button>
                          {isFriend && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnfriend(friendData.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-red-600"
                            >
                              <UserMinus className="w-4 h-4" />
                              <span>Hủy kết bạn</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Name and Info */}
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base mb-1 cursor-pointer hover:text-primary"
                onClick={() => handleViewProfile(friendData.id)}
              >
                {friendData.friendName || "Người dùng"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {friendData.district ? friendData.district :
                  `${friendData.eventNumber || 0} sự kiện chung`}
              </p>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {isFriend ? (
                <div className="relative" ref={(el) => menuRefs.current[friendData.id] = el}>
                  <button
                    onClick={(e) => toggleMenu(friendData.id, e)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Menu"
                  >
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {openMenuId === friendData.id && (
                    <div
                      className={`absolute right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 ${getMenuPosition(friendData.id) === 'top'
                          ? 'bottom-full mb-1'
                          : 'top-full mt-1'
                        }`}
                    >
                      <button
                        onClick={() => handleViewProfile(friendData.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        <span>Hồ sơ</span>
                      </button>
                      <button
                        onClick={() => handleUnfriend(friendData.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-red-600"
                      >
                        <UserMinus className="w-4 h-4" />
                        <span>Hủy kết bạn</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleAddFriend(friendData.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  disabled={addingFriendId === friendData.id || sentFriendRequests.has(friendData.id)}
                >
                  {addingFriendId === friendData.id ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang gửi...
                    </>
                  ) : sentFriendRequests.has(friendData.id) ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Đã gửi lời mời
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Kết bạn
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Users className="w-7 h-7 mr-3 text-blue-600" />
          Tìm kiếm bạn bè
        </h2>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'friends'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-gray-50'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Danh sách bạn bè
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-gray-50'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Tìm kiếm
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-gray-50'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Lời mời kết bạn
            {friendRequestsCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {friendRequestsCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Search Tab Content */}
      {activeTab === 'search' && (
        <div>
          {/* Search Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  Tìm kiếm người dùng
                </label>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder="Tìm theo tên, email hoặc sở thích..."
                  className="flex-1 h-12 text-base"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12"
                  disabled={isSearching}
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-3 text-sm">Đang tìm kiếm...</p>
            </div>
          ) : searchKeyword && searchResults.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Tìm thấy {searchPagination.totalItems} kết quả
                </p>
              </div>
              <div ref={friendsListRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {searchResults.map((friend) => renderFriendCard(friend, true))}
              </div>

              {/* Search Pagination */}
              {searchPagination.totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 mt-6">
                  <div className="text-sm text-muted-foreground">
                    Trang {searchPagination.currentPage} / {searchPagination.totalPages}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(searchPagination.currentPage - 1, 'search')}
                      disabled={searchPagination.currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trước
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: searchPagination.totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (searchPagination.totalPages <= 7) return true;
                          return (
                            page === 1 ||
                            page === searchPagination.totalPages ||
                            (page >= searchPagination.currentPage - 1 && page <= searchPagination.currentPage + 1)
                          );
                        })
                        .map((page, idx, array) => {
                          const showEllipsisBefore = idx > 0 && page - array[idx - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={searchPagination.currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page, 'search')}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(searchPagination.currentPage + 1, 'search')}
                      disabled={searchPagination.currentPage === searchPagination.totalPages}
                    >
                      Sau
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : searchKeyword && searchResults.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-base font-medium">Không tìm thấy kết quả</p>
              <p className="text-gray-500 text-sm mt-1">
                Không tìm thấy người dùng nào phù hợp với "{searchKeyword}"
              </p>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-base font-medium">Tìm kiếm bạn bè</p>
              <p className="text-gray-500 text-sm mt-1">
                Nhập từ khóa để tìm kiếm người dùng theo tên, email hoặc sở thích
              </p>
            </div>
          )}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {isLoadingFriendRequests ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600 mt-4 text-base font-medium">Đang tải lời mời kết bạn...</p>
            </div>
          ) : friendRequestsError ? (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-red-800 text-base font-semibold">Không thể tải dữ liệu</h3>
                  <p className="text-red-700 text-sm mt-1">{friendRequestsError}</p>
                  <Button
                    onClick={() => fetchFriendRequests(1)}
                    variant="outline"
                    size="sm"
                    className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Thử lại
                  </Button>
                </div>
              </div>
            </div>
          ) : friendRequests.length > 0 ? (
            <>
              {/* Header Stats */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Bạn có <span className="font-semibold text-gray-900">{friendRequestsPagination.totalItems}</span> lời mời kết bạn
                </p>
              </div>

              {/* Friend Requests List */}
              <div className="space-y-2">
                {friendRequests.map((request, index) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {request.senderAvatar ? (
                        <img
                          src={request.senderAvatar}
                          alt={request.senderName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Name and Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base text-gray-900 truncate">
                        {request.senderName || "Người dùng"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(request.sentDate)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptFriendRequest(request.id, request.senderName)}
                        disabled={processingRequestId === request.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 px-4"
                      >
                        {processingRequestId === request.id ? (
                          <>
                            <div className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Đang xử lý
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Chấp nhận
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectFriendRequest(request.id, request.senderName)}
                        disabled={processingRequestId === request.id}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 px-4"
                      >
                        {processingRequestId === request.id ? (
                          <>
                            <div className="w-3.5 h-3.5 mr-1.5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                            Đang xử lý
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Từ chối
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {friendRequestsPagination.totalPages > 1 && (
                <div className="flex flex-col items-center gap-5 mt-8 pt-6 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                    Trang {friendRequestsPagination.currentPage} / {friendRequestsPagination.totalPages}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = friendRequestsPagination.currentPage - 1;
                        if (newPage >= 1) {
                          fetchFriendRequests(newPage);
                        }
                      }}
                      disabled={friendRequestsPagination.currentPage === 1 || isLoadingFriendRequests}
                      className="border-2 hover:bg-gray-50 font-medium"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trước
                    </Button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: friendRequestsPagination.totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (friendRequestsPagination.totalPages <= 7) return true;
                          return (
                            page === 1 ||
                            page === friendRequestsPagination.totalPages ||
                            (page >= friendRequestsPagination.currentPage - 1 && page <= friendRequestsPagination.currentPage + 1)
                          );
                        })
                        .map((page, idx, array) => {
                          const showEllipsisBefore = idx > 0 && page - array[idx - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1.5">
                              {showEllipsisBefore && (
                                <span className="px-2 text-gray-400 font-bold">...</span>
                              )}
                              <Button
                                variant={friendRequestsPagination.currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => fetchFriendRequests(page)}
                                disabled={isLoadingFriendRequests}
                                className={`min-w-[44px] h-[44px] font-semibold transition-all ${friendRequestsPagination.currentPage === page
                                    ? "bg-blue-600 hover:bg-blue-700 shadow-lg scale-110"
                                    : "border-2 hover:bg-gray-50"
                                  }`}
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = friendRequestsPagination.currentPage + 1;
                        if (newPage <= friendRequestsPagination.totalPages) {
                          fetchFriendRequests(newPage);
                        }
                      }}
                      disabled={friendRequestsPagination.currentPage === friendRequestsPagination.totalPages || isLoadingFriendRequests}
                      className="border-2 hover:bg-gray-50 font-medium"
                    >
                      Sau
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-5 shadow-lg">
                <UserCheck className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-gray-900 text-xl font-bold mb-2">Không có lời mời kết bạn</p>
              <p className="text-gray-600 text-base">
                Bạn chưa có lời mời kết bạn nào. Hãy tìm kiếm và kết nối với mọi người!
              </p>
              <Button
                onClick={() => setActiveTab('search')}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm bạn bè
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Friends List Tab */}
      {activeTab === 'friends' && (
        <>
          {isLoadingFriends ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2 text-sm">Đang tải danh sách bạn bè...</p>
            </div>
          ) : friendsError ? (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 text-sm font-medium">{friendsError}</p>
                </div>
              </div>
              <Button
                onClick={() => fetchFriends(1)}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Thử lại
              </Button>
            </div>
          ) : friends.length > 0 ? (
            <>
              <div ref={friendsListRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {friends.map((friend) => renderFriendCard(friend, false))}
              </div>

              {friendsPagination.totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 mt-6">
                  <div className="text-sm text-muted-foreground">
                    Trang {friendsPagination.currentPage} / {friendsPagination.totalPages}
                    ({friendsPagination.totalItems} bạn bè)
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1, 'friends')}
                      disabled={friendsPagination.currentPage === 1}
                      className="min-w-[80px]"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Đầu
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(friendsPagination.currentPage - 1, 'friends')}
                      disabled={friendsPagination.currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trước
                    </Button>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {Array.from({ length: friendsPagination.totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (friendsPagination.totalPages <= 7) {
                            return true;
                          }
                          return (
                            page === 1 ||
                            page === friendsPagination.totalPages ||
                            (page >= friendsPagination.currentPage - 1 && page <= friendsPagination.currentPage + 1)
                          );
                        })
                        .map((page, idx, array) => {
                          const showEllipsisBefore = idx > 0 && page - array[idx - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={friendsPagination.currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page, 'friends')}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(friendsPagination.currentPage + 1, 'friends')}
                      disabled={friendsPagination.currentPage === friendsPagination.totalPages}
                    >
                      Sau
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(friendsPagination.totalPages, 'friends')}
                      disabled={friendsPagination.currentPage === friendsPagination.totalPages}
                      className="min-w-[80px]"
                    >
                      Cuối
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-base font-medium">Chưa có bạn bè</p>
              <p className="text-gray-500 text-sm mt-1">
                Hãy kết bạn với mọi người để cùng tham gia các sự kiện thú vị
              </p>
            </div>
          )}
        </>
      )}

      {/* Unfriend Confirmation Dialog */}
      <AlertDialog open={unfriendDialogOpen} onOpenChange={setUnfriendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy kết bạn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy kết bạn với <strong>{friendToUnfriend?.friendName || 'người dùng này'}</strong>?
              <br />
              <br />
              Hành động này không thể hoàn tác. Bạn sẽ không còn là bạn của người này nữa!.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnfriending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfriend}
              disabled={isUnfriending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isUnfriending ? 'Đang xử lý...' : 'Xác nhận hủy kết bạn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FriendsTab;
