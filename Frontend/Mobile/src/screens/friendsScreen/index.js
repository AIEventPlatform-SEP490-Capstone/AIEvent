import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import CustomButton from '../../components/common/customButtonRN';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import FriendService from '../../api/services/FriendService';
import Images from '../../constants/Images';

const FriendsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'search', 'requests'
  
  // Friends list state
  const [friends, setFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState(null);
  const [friendsStatusFilter, setFriendsStatusFilter] = useState('Accepted'); // Mặc định là "Đã kết bạn"
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
  const [addingFriendId, setAddingFriendId] = useState(null);
  const [sentFriendRequests, setSentFriendRequests] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriendForMenu, setSelectedFriendForMenu] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  // Fetch friends
  const fetchFriends = useCallback(async (pageNumber = 1) => {
    setIsLoadingFriends(true);
    setFriendsError(null);

    try {
      const result = await FriendService.getFriends({ 
        pageNumber, 
        pageSize: 10,
        status: friendsStatusFilter 
      });
      if (result.success && result.data) {
        setFriends(result.data.items || []);
        setFriendsPagination({
          currentPage: result.data.currentPage || pageNumber,
          totalPages: result.data.totalPages || 1,
          totalItems: result.data.totalItems || 0,
          pageSize: result.data.pageSize || 10
        });
      } else {
        setFriendsError(result.message || 'Không thể tải danh sách bạn bè');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriendsError(error.message || 'Không thể tải danh sách bạn bè');
    } finally {
      setIsLoadingFriends(false);
    }
  }, [friendsStatusFilter]);

  // Search friends
  const handleSearchFriends = useCallback(async (pageNumber = 1) => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await FriendService.searchFriends({
        keyword: searchKeyword.trim(),
        pageNumber,
        pageSize: 10
      });

      if (result.success && result.data) {
        setSearchResults(result.data.items || []);
        setSearchPagination({
          currentPage: result.data.currentPage || pageNumber,
          totalPages: result.data.totalPages || 1,
          totalItems: result.data.totalItems || 0,
          pageSize: result.data.pageSize || 10
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

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async (pageNumber = 1) => {
    setIsLoadingFriendRequests(true);
    setFriendRequestsError(null);

    try {
      const result = await FriendService.getFriendRequests({ pageNumber, pageSize: 10 });
      if (result.success && result.data) {
        setFriendRequests(result.data.items || []);
        setFriendRequestsPagination({
          currentPage: result.data.currentPage || pageNumber,
          totalPages: result.data.totalPages || 1,
          totalItems: result.data.totalItems || 0,
          pageSize: result.data.pageSize || 10
        });
      } else {
        setFriendRequestsError(result.message || 'Không thể tải danh sách lời mời kết bạn');
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setFriendRequestsError(error.message || 'Không thể tải danh sách lời mời kết bạn');
    } finally {
      setIsLoadingFriendRequests(false);
    }
  }, []);

  // Accept friend request
  const handleAcceptFriendRequest = async (requestId, senderName) => {
    if (processingRequestId === requestId) return;

    setProcessingRequestId(requestId);
    try {
      const result = await FriendService.acceptFriendRequest(requestId);
      if (result.success) {
        Alert.alert('Thành công', `Đã chấp nhận lời mời kết bạn từ ${senderName}`);
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        setFriendRequestsPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1)
        }));
        if (activeTab === 'friends') {
          fetchFriends(friendsPagination.currentPage);
        }
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể chấp nhận lời mời kết bạn');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chấp nhận lời mời');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Reject friend request
  const handleRejectFriendRequest = async (requestId, senderName) => {
    if (processingRequestId === requestId) return;

    Alert.alert(
      'Xác nhận',
      `Bạn có chắc chắn muốn từ chối lời mời kết bạn từ ${senderName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            setProcessingRequestId(requestId);
            try {
              const result = await FriendService.rejectFriendRequest(requestId);
              if (result.success) {
                Alert.alert('Thành công', `Đã từ chối lời mời kết bạn từ ${senderName}`);
                setFriendRequests(prev => prev.filter(req => req.id !== requestId));
                setFriendRequestsPagination(prev => ({
                  ...prev,
                  totalItems: Math.max(0, prev.totalItems - 1)
                }));
              } else {
                Alert.alert('Lỗi', result.message || 'Không thể từ chối lời mời kết bạn');
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Đã xảy ra lỗi khi từ chối lời mời');
            } finally {
              setProcessingRequestId(null);
            }
          }
        }
      ]
    );
  };

  // Add friend
  const handleAddFriend = async (userId) => {
    if (addingFriendId === userId || sentFriendRequests.has(userId)) return;

    setAddingFriendId(userId);
    try {
      const result = await FriendService.addFriend(userId);
      if (result.success) {
        setSentFriendRequests(prev => new Set([...prev, userId]));
        Alert.alert('Thành công', 'Đã gửi lời mời kết bạn thành công');
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể gửi lời mời kết bạn');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi gửi lời mời kết bạn');
    } finally {
      setAddingFriendId(null);
    }
  };

  // Delete friend
  const handleDeleteFriend = (friendId, friendName) => {
    Alert.alert(
      'Xác nhận hủy kết bạn',
      `Bạn có chắc chắn muốn hủy kết bạn với ${friendName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await FriendService.deleteFriend(friendId);
              if (result.success) {
                Alert.alert('Thành công', `Đã hủy kết bạn với ${friendName}`);
                setFriends(prev => prev.filter(f => (f.id || f.friendId) !== friendId));
                setFriendsPagination(prev => ({
                  ...prev,
                  totalItems: Math.max(0, prev.totalItems - 1)
                }));
                if (friends.length === 1 && friendsPagination.currentPage > 1) {
                  fetchFriends(friendsPagination.currentPage - 1);
                }
              } else {
                Alert.alert('Lỗi', result.message || 'Không thể hủy kết bạn');
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Đã xảy ra lỗi khi hủy kết bạn');
            }
          }
        }
      ]
    );
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

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'friends') {
      await fetchFriends(friendsPagination.currentPage);
    } else if (activeTab === 'search') {
      if (searchKeyword.trim()) {
        await handleSearchFriends(1);
      }
    } else if (activeTab === 'requests') {
      await fetchFriendRequests(1);
    }
    setRefreshing(false);
  }, [activeTab, fetchFriends, handleSearchFriends, fetchFriendRequests, searchKeyword, friendsPagination.currentPage]);

  // Initial load for friend requests to update badge immediately
  useEffect(() => {
    fetchFriendRequests(1);
  }, [fetchFriendRequests]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends(1);
    } else if (activeTab === 'requests') {
      fetchFriendRequests(1);
    }
  }, [activeTab, fetchFriends, fetchFriendRequests]);

  // Reload when filter changes
  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends(1);
    }
  }, [friendsStatusFilter]);

  // Handle menu actions
  const handleOpenMenu = (friend) => {
    setSelectedFriendForMenu(friend);
    setShowActionMenu(true);
  };

  const handleCloseMenu = () => {
    setShowActionMenu(false);
    setSelectedFriendForMenu(null);
  };

  const handleViewProfile = () => {
    if (selectedFriendForMenu) {
      const friendId = selectedFriendForMenu.id || selectedFriendForMenu.friendId;
      // Không cho phép xem profile nếu đang filter theo Blocked
      if (friendsStatusFilter === 'Blocked') {
        Alert.alert('Thông báo', 'Không thể xem profile của người dùng đã bị chặn');
        handleCloseMenu();
        return;
      }
      handleCloseMenu();
      navigation.navigate('FriendDetailScreen', { friendId });
    }
  };

  const handleUnfriend = () => {
    if (selectedFriendForMenu) {
      const friendId = selectedFriendForMenu.id || selectedFriendForMenu.friendId;
      const friendName = selectedFriendForMenu.friendName || selectedFriendForMenu.fullName || 'Người dùng';
      handleCloseMenu();
      handleDeleteFriend(friendId, friendName);
    }
  };

  const handleBlock = () => {
    if (selectedFriendForMenu) {
      const friendId = selectedFriendForMenu.id || selectedFriendForMenu.friendId;
      const friendName = selectedFriendForMenu.friendName || selectedFriendForMenu.fullName || 'Người dùng';
      handleCloseMenu();
      
      Alert.alert(
        'Xác nhận chặn người dùng',
        `Bạn có chắc chắn muốn chặn ${friendName}?\n\nKhi chặn, bạn sẽ không thể nhìn thấy hoạt động của người này và họ cũng không thể nhìn thấy hoạt động của bạn.`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận chặn',
            style: 'destructive',
            onPress: async () => {
              setIsBlocking(true);
              try {
                const result = await FriendService.blockFriend(friendId);
                if (result.success) {
                  Alert.alert('Thành công', `Đã chặn ${friendName}`);
                  setFriends(prev => prev.filter(f => (f.id || f.friendId) !== friendId));
                  setFriendsPagination(prev => ({
                    ...prev,
                    totalItems: Math.max(0, prev.totalItems - 1)
                  }));
                  if (friends.length === 1 && friendsPagination.currentPage > 1) {
                    fetchFriends(friendsPagination.currentPage - 1);
                  }
                } else {
                  Alert.alert('Lỗi', result.message || 'Không thể chặn bạn bè');
                }
              } catch (error) {
                Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chặn bạn bè');
              } finally {
                setIsBlocking(false);
              }
            }
          }
        ]
      );
    }
  };

  const handleUnblock = () => {
    if (selectedFriendForMenu) {
      const friendId = selectedFriendForMenu.id || selectedFriendForMenu.friendId;
      const friendName = selectedFriendForMenu.friendName || selectedFriendForMenu.fullName || 'Người dùng';
      handleCloseMenu();
      
      Alert.alert(
        'Xác nhận gỡ chặn người dùng',
        `Bạn có chắc chắn muốn gỡ chặn ${friendName}?\n\nSau khi gỡ chặn, bạn và người này có thể nhìn thấy hoạt động của nhau trở lại.`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận gỡ chặn',
            onPress: async () => {
              setIsUnblocking(true);
              try {
                const result = await FriendService.unblockFriend(friendId);
                if (result.success) {
                  Alert.alert('Thành công', `Đã gỡ chặn ${friendName}`);
                  setFriends(prev => prev.filter(f => (f.id || f.friendId) !== friendId));
                  setFriendsPagination(prev => ({
                    ...prev,
                    totalItems: Math.max(0, prev.totalItems - 1)
                  }));
                  if (friends.length === 1 && friendsPagination.currentPage > 1) {
                    fetchFriends(friendsPagination.currentPage - 1);
                  }
                } else {
                  Alert.alert('Lỗi', result.message || 'Không thể gỡ chặn bạn bè');
                }
              } catch (error) {
                Alert.alert('Lỗi', 'Đã xảy ra lỗi khi gỡ chặn bạn bè');
              } finally {
                setIsUnblocking(false);
              }
            }
          }
        ]
      );
    }
  };

  // Render friend card
  const renderFriendCard = (friend, isSearchResult = false) => {
    const friendData = friend;
    const isFriend = !isSearchResult;
    const isBlocked = friendsStatusFilter === 'Blocked'; // Check if current filter is Blocked
    const friendId = friendData.id || friendData.friendId;
    const friendName = friendData.friendName || friendData.fullName || 'Người dùng';
    const friendImage = friendData.image || friendData.avatarImgUrl;
    const mutualFriends = friendData.mutualFriends || friendData.mutualFriendCount || 0;

    return (
      <View key={friendId} style={styles.friendCard}>
        <View style={styles.friendCardContent}>
          {/* Avatar */}
          <TouchableOpacity
            style={styles.friendAvatarContainer}
            onPress={() => {
              if (isFriend && !isBlocked) {
                navigation.navigate('FriendDetailScreen', { friendId });
              } else if (isBlocked) {
                Alert.alert('Thông báo', 'Không thể xem profile của người dùng đã bị chặn');
              }
            }}
            disabled={isBlocked}
          >
            {friendImage ? (
              <Image 
                source={{ uri: friendImage }} 
                style={[
                  styles.friendAvatar,
                  isBlocked && { opacity: 0.6 }
                ]} 
              />
            ) : (
              <View style={[
                styles.friendAvatarPlaceholder,
                isBlocked && { opacity: 0.6 }
              ]}>
                <CustomText variant="h3" color="white">👤</CustomText>
              </View>
            )}
          </TouchableOpacity>

          {/* Name and Info */}
          <TouchableOpacity
            style={styles.friendInfo}
            onPress={() => {
              if (isFriend && !isBlocked) {
                navigation.navigate('FriendDetailScreen', { friendId });
              } else if (isBlocked) {
                Alert.alert('Thông báo', 'Không thể xem profile của người dùng đã bị chặn');
              }
            }}
            disabled={isBlocked}
          >
            <CustomText 
              variant="h3" 
              color={isBlocked ? "secondary" : "primary"} 
              style={[
                styles.friendName,
                isBlocked && { opacity: 0.6 }
              ]}
            >
              {friendName}
            </CustomText>
            {isFriend && (
              <CustomText variant="body" color="secondary" style={styles.friendSubtext}>
                {mutualFriends > 0 ? `${mutualFriends} sự kiện chung` : 'Chưa có sự kiện chung'}
              </CustomText>
            )}
            {!isFriend && (
              <CustomText variant="body" color="secondary" style={styles.friendSubtext}>
                {friendData.district || `${friendData.eventNumber || 0} sự kiện chung`}
              </CustomText>
            )}
          </TouchableOpacity>

          {/* Action Button */}
          <View style={styles.friendActions}>
            {isFriend ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => handleOpenMenu(friendData)}
              >
                <CustomText variant="h3" color="secondary" style={styles.moreIcon}>⋯</CustomText>
              </TouchableOpacity>
            ) : (
              <CustomButton
                title={
                  addingFriendId === friendId
                    ? 'Đang gửi...'
                    : sentFriendRequests.has(friendId)
                    ? 'Đã gửi'
                    : 'Kết bạn'
                }
                onPress={() => handleAddFriend(friendId)}
                disabled={addingFriendId === friendId || sentFriendRequests.has(friendId)}
                loading={addingFriendId === friendId}
                variant="secondary"
                size="small"
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render friend request card
  const renderFriendRequestCard = (request) => {
    const requestId = request.id;
    const senderName = request.senderName || 'Người dùng';
    const senderImage = request.senderAvatar || request.senderImage;
    const isProcessing = processingRequestId === requestId;

    return (
      <View key={requestId} style={styles.requestCard}>
        <LinearGradient
          colors={['#FFFFFF', '#FAFAFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.requestCardGradient}
        >
          <View style={styles.requestCardContent}>
            {/* Avatar with border */}
            <View style={styles.requestAvatarWrapper}>
              <View style={styles.requestAvatarContainer}>
                {senderImage ? (
                  <Image source={{ uri: senderImage }} style={styles.requestAvatar} />
                ) : (
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.requestAvatarPlaceholder}
                  >
                    <CustomText variant="h3" color="white" style={styles.requestAvatarText}>
                      {senderName.charAt(0).toUpperCase()}
                    </CustomText>
                  </LinearGradient>
                )}
              </View>
              <View style={styles.requestAvatarBadge}>
                <CustomText variant="caption" color="white" style={styles.requestAvatarBadgeText}>
                  ✉️
                </CustomText>
              </View>
            </View>

            {/* Name and Info */}
            <View style={styles.requestInfo}>
              <CustomText variant="h3" color="primary" style={styles.requestName}>
                {senderName}
              </CustomText>
              <View style={styles.requestMeta}>
                <CustomText variant="caption" color="secondary" style={styles.requestDate}>
                  {formatDate(request.sentDate)}
                </CustomText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  isProcessing && styles.acceptButtonDisabled
                ]}
                onPress={() => handleAcceptFriendRequest(requestId, senderName)}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#64B5F6', '#42A5F5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.acceptButtonGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <CustomText variant="body" color="white" style={styles.acceptButtonText}>
                        ✓
                      </CustomText>
                      <CustomText variant="body" color="white" style={[styles.acceptButtonLabel, { marginLeft: 6 }]}>
                        Chấp nhận
                      </CustomText>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rejectButton,
                  isProcessing && styles.rejectButtonDisabled
                ]}
                onPress={() => handleRejectFriendRequest(requestId, senderName)}
                disabled={isProcessing}
              >
                <CustomText variant="body" color="error" style={styles.rejectButtonText}>
                  ✕ Từ chối
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradientHeaderTitle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <CustomText variant="h2" color="white" style={styles.title}>
          {activeTab === 'friends' ? `${friendsPagination.totalItems} người bạn` : 'Bạn bè'}
        </CustomText>
        <CustomText variant="body" color="white" style={styles.subtitle}>
          {activeTab === 'friends' ? 'Danh sách bạn bè của bạn' : 'Kết nối với cộng đồng'}
        </CustomText>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <CustomText
            variant="body"
            color={activeTab === 'friends' ? 'primary' : 'secondary'}
            style={styles.tabText}
          >
            Danh sách
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <CustomText
            variant="body"
            color={activeTab === 'search' ? 'primary' : 'secondary'}
            style={styles.tabText}
          >
            Tìm kiếm
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={styles.tabWithBadge}>
            <CustomText
              variant="body"
              color={activeTab === 'requests' ? 'primary' : 'secondary'}
              style={styles.tabText}
            >
              Lời mời
            </CustomText>
            {friendRequestsPagination.totalItems > 0 && (
              <View style={styles.badge}>
                <CustomText variant="caption" color="white" style={styles.badgeText}>
                  {friendRequestsPagination.totalItems}
                </CustomText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <View style={styles.content}>
            {/* Status Filter */}
            <View style={styles.filterContainer}>
              <CustomText variant="body" color="primary" style={styles.filterLabel}>
                Lọc theo trạng thái:
              </CustomText>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterPicker(true)}
              >
                <CustomText variant="body" color="primary" style={styles.filterButtonText}>
                  {friendsStatusFilter === 'Accepted' ? 'Đã kết bạn' :
                   friendsStatusFilter === 'Blocked' ? 'Block' :
                   friendsStatusFilter === 'Canceled' ? 'Cancel' : 'Đã kết bạn'}
                </CustomText>
                <CustomText variant="h3" color="secondary" style={styles.filterIcon}>▼</CustomText>
              </TouchableOpacity>
            </View>

            {isLoadingFriends ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <CustomText variant="body" color="secondary" style={styles.loadingText}>
                  Đang tải danh sách bạn bè...
                </CustomText>
              </View>
            ) : friendsError ? (
              <View style={styles.errorContainer}>
                <CustomText variant="body" color="error" style={styles.errorText}>
                  {friendsError}
                </CustomText>
                <CustomButton
                  title="Thử lại"
                  onPress={() => fetchFriends(1)}
                  variant="outline"
                  size="medium"
                  style={styles.retryButton}
                />
              </View>
            ) : friends.length > 0 ? (
              <>
                {friends.map((friend) => renderFriendCard(friend, false))}
                {/* Pagination */}
                {friendsPagination.totalPages > 1 && (
                  <View style={styles.pagination}>
                    <CustomButton
                      title="Trước"
                      onPress={() => fetchFriends(friendsPagination.currentPage - 1)}
                      disabled={friendsPagination.currentPage === 1}
                      variant="outline"
                      size="small"
                    />
                    <CustomText variant="body" color="secondary" style={styles.paginationText}>
                      Trang {friendsPagination.currentPage} / {friendsPagination.totalPages}
                    </CustomText>
                    <CustomButton
                      title="Sau"
                      onPress={() => fetchFriends(friendsPagination.currentPage + 1)}
                      disabled={friendsPagination.currentPage === friendsPagination.totalPages}
                      variant="outline"
                      size="small"
                    />
          </View>
                )}
              </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <CustomText variant="h1" color="secondary">👤</CustomText>
            </View>
                <CustomText variant="h3" color="primary" style={styles.emptyStateTitle}>
                  Chưa có bạn bè
                </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
                  Hãy kết bạn với mọi người để cùng tham gia các sự kiện thú vị
                </CustomText>
                <CustomButton
                  title="Tìm kiếm bạn bè"
                  onPress={() => setActiveTab('search')}
                  variant="secondary"
                  size="medium"
                  style={styles.emptyStateButton}
                />
              </View>
            )}
          </View>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <View style={styles.content}>
            {/* Modern Search Input */}
            <View style={styles.searchWrapper}>
              <LinearGradient
                colors={['#FFFFFF', '#F8F9FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.searchContainer}
              >
                <View style={styles.searchInputContainer}>
                  <Image source={Images.search} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm bạn bè..."
                    placeholderTextColor={Colors.textLight}
                    value={searchKeyword}
                    onChangeText={setSearchKeyword}
                    onSubmitEditing={() => handleSearchFriends(1)}
                    returnKeyType="search"
                  />
                  {searchKeyword.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchKeyword('');
                        setSearchResults([]);
                      }}
                      style={styles.clearButton}
                    >
                      <CustomText variant="h3" color="secondary">✕</CustomText>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    (!searchKeyword.trim() || isSearching) && styles.searchButtonDisabled
                  ]}
                  onPress={() => handleSearchFriends(1)}
                  disabled={isSearching || !searchKeyword.trim()}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <CustomText variant="body" color="white" style={styles.searchButtonText}>
                      Tìm
                    </CustomText>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <CustomText variant="body" color="secondary" style={styles.loadingText}>
                  Đang tìm kiếm...
                </CustomText>
              </View>
            ) : searchKeyword && searchResults.length > 0 ? (
              <>
                <View style={styles.resultHeader}>
                  <CustomText variant="h3" color="primary" style={styles.resultCountTitle}>
                    Kết quả tìm kiếm
                  </CustomText>
                  <View style={styles.resultBadge}>
                    <CustomText variant="caption" color="white" style={styles.resultBadgeText}>
                      {searchPagination.totalItems}
                    </CustomText>
                  </View>
                </View>
                {searchResults.map((friend) => renderFriendCard(friend, true))}
                {/* Pagination */}
                {searchPagination.totalPages > 1 && (
                  <View style={styles.pagination}>
                    <CustomButton
                      title="Trước"
                      onPress={() => handleSearchFriends(searchPagination.currentPage - 1)}
                      disabled={searchPagination.currentPage === 1}
                      variant="outline"
                      size="small"
                    />
                    <CustomText variant="body" color="secondary" style={styles.paginationText}>
                      Trang {searchPagination.currentPage} / {searchPagination.totalPages}
                    </CustomText>
                    <CustomButton
                      title="Sau"
                      onPress={() => handleSearchFriends(searchPagination.currentPage + 1)}
                      disabled={searchPagination.currentPage === searchPagination.totalPages}
                      variant="outline"
                      size="small"
                    />
                  </View>
                )}
              </>
            ) : searchKeyword && searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={[Colors.error + '15', Colors.warning + '08']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyStateIconContainer}
                >
                  <CustomText variant="h1" color="error" style={styles.emptyStateIcon}>🔍</CustomText>
                </LinearGradient>
                <CustomText variant="h3" color="primary" style={styles.emptyStateTitle}>
                  Không tìm thấy kết quả
                </CustomText>
                <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
                  Không tìm thấy người dùng nào phù hợp với "{searchKeyword}"
                </CustomText>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={[Colors.primary + '15', Colors.secondary + '08']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyStateIconContainer}
                >
                  <CustomText variant="h1" color="primary" style={styles.emptyStateIcon}>🔍</CustomText>
                </LinearGradient>
                <CustomText variant="h3" color="primary" style={styles.emptyStateTitle}>
                  Tìm kiếm bạn bè
                </CustomText>
                <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
                  Nhập từ khóa để tìm kiếm người dùng theo tên, email hoặc sở thích
                </CustomText>
              </View>
            )}
          </View>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <View style={styles.content}>
            {isLoadingFriendRequests ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <CustomText variant="body" color="secondary" style={styles.loadingText}>
                  Đang tải lời mời kết bạn...
                </CustomText>
              </View>
            ) : friendRequestsError ? (
              <View style={styles.errorContainer}>
                <CustomText variant="body" color="error" style={styles.errorText}>
                  {friendRequestsError}
                </CustomText>
                <CustomButton
                  title="Thử lại"
                  onPress={() => fetchFriendRequests(1)}
                  variant="outline"
                  size="medium"
                  style={styles.retryButton}
                />
              </View>
            ) : friendRequests.length > 0 ? (
              <>
                <View style={styles.resultHeader}>
                  <CustomText variant="h3" color="primary" style={styles.resultCountTitle}>
                    Lời mời kết bạn
                  </CustomText>
                  <View style={styles.resultBadge}>
                    <CustomText variant="caption" color="white" style={styles.resultBadgeText}>
                      {friendRequestsPagination.totalItems}
                    </CustomText>
                  </View>
                </View>
                {friendRequests.map((request) => renderFriendRequestCard(request))}
                {/* Pagination */}
                {friendRequestsPagination.totalPages > 1 && (
                  <View style={styles.pagination}>
                    <CustomButton
                      title="Trước"
                      onPress={() => fetchFriendRequests(friendRequestsPagination.currentPage - 1)}
                      disabled={friendRequestsPagination.currentPage === 1}
                      variant="outline"
                      size="small"
                    />
                    <CustomText variant="body" color="secondary" style={styles.paginationText}>
                      Trang {friendRequestsPagination.currentPage} / {friendRequestsPagination.totalPages}
                    </CustomText>
                    <CustomButton
                      title="Sau"
                      onPress={() => fetchFriendRequests(friendRequestsPagination.currentPage + 1)}
                      disabled={friendRequestsPagination.currentPage === friendRequestsPagination.totalPages}
                      variant="outline"
                      size="small"
                    />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={[Colors.primary + '15', Colors.secondary + '08']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyStateIconContainer}
                >
                  <CustomText variant="h1" color="primary" style={styles.emptyStateIcon}>✉️</CustomText>
                </LinearGradient>
                <CustomText variant="h3" color="primary" style={styles.emptyStateTitle}>
                  Không có lời mời kết bạn
                </CustomText>
                <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
                  Bạn chưa có lời mời kết bạn nào. Hãy tìm kiếm và kết nối với mọi người!
                </CustomText>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setActiveTab('search')}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyStateButtonGradient}
                  >
                    <CustomText variant="body" color="white" style={styles.emptyStateButtonText}>
                      Tìm kiếm bạn bè
                    </CustomText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={handleCloseMenu}
        >
          <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            {friendsStatusFilter !== 'Blocked' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleViewProfile}
              >
                <CustomText variant="body" color="primary" style={styles.menuItemText}>
                  Hồ sơ
                </CustomText>
              </TouchableOpacity>
            )}
            {friendsStatusFilter === 'Blocked' ? (
              <>
                {friendsStatusFilter === 'Blocked' && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleUnblock}
                    disabled={isUnblocking}
                  >
                    <CustomText variant="body" color="success" style={styles.menuItemText}>
                      {isUnblocking ? 'Đang xử lý...' : '🔓 Gỡ chặn'}
                    </CustomText>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleBlock}
                  disabled={isBlocking}
                >
                  <CustomText variant="body" color="warning" style={styles.menuItemText}>
                    {isBlocking ? 'Đang xử lý...' : '🚫 Chặn'}
                  </CustomText>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleUnfriend}
                >
                  <CustomText variant="body" color="error" style={styles.menuItemText}>
                    Hủy kết bạn
                  </CustomText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Picker Modal */}
      <Modal
        visible={showFilterPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterPicker(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterPicker(false)}
        >
          <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setFriendsStatusFilter('Accepted');
                setShowFilterPicker(false);
                setFriendsPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
            >
              <CustomText 
                variant="body" 
                color={friendsStatusFilter === 'Accepted' ? 'primary' : 'secondary'} 
                style={styles.menuItemText}
              >
                {friendsStatusFilter === 'Accepted' ? '✓ ' : ''}Đã kết bạn
              </CustomText>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setFriendsStatusFilter('Blocked');
                setShowFilterPicker(false);
                setFriendsPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
            >
              <CustomText 
                variant="body" 
                color={friendsStatusFilter === 'Blocked' ? 'primary' : 'secondary'} 
                style={styles.menuItemText}
              >
                {friendsStatusFilter === 'Blocked' ? '✓ ' : ''}Block
              </CustomText>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setFriendsStatusFilter('Canceled');
                setShowFilterPicker(false);
                setFriendsPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
            >
              <CustomText 
                variant="body" 
                color={friendsStatusFilter === 'Canceled' ? 'primary' : 'secondary'} 
                style={styles.menuItemText}
              >
                {friendsStatusFilter === 'Canceled' ? '✓ ' : ''}Cancel
              </CustomText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default FriendsScreen;
