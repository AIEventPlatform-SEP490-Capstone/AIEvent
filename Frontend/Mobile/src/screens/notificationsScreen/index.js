import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RenderHTML from 'react-native-render-html';
import { useNotifications } from '../../hooks/useNotifications';
import CustomText from '../../components/common/customTextRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import styles from './styles';

// Notification type icon mapping
const notificationTypeIcons = {
  OrganizerRegistrationPending: Images.user,
  OrganizerApproved: Images.check,
  OrganizerRejected: Images.close,
  EventCreated: Images.calendar,
  EventApproved: Images.check,
  EventRejected: Images.close,
  EventCancelled: Images.close,
  BookingConfirmed: Images.ticket,
  EventInvitation: Images.user,
  EventInvitationAccepted: Images.check,
  EventInvitationRejected: Images.close,
  PaymentSuccess: Images.wallet,
  Refund: Images.wallet,
  PayoutCompleted: Images.wallet,
  PayoutFailed: Images.close,
  EventReminder: Images.clock,
  ReportEvent: Images.alert,
  System: Images.info,
};

const notificationTypeLabels = {
  OrganizerRegistrationPending: 'Đăng ký Organizer',
  OrganizerApproved: 'Duyệt Organizer',
  OrganizerRejected: 'Từ chối Organizer',
  EventCreated: 'Tạo sự kiện',
  EventApproved: 'Duyệt sự kiện',
  EventRejected: 'Từ chối sự kiện',
  EventCancelled: 'Hủy sự kiện',
  BookingConfirmed: 'Xác nhận đặt vé',
  EventInvitation: 'Lời mời sự kiện',
  EventInvitationAccepted: 'Chấp nhận lời mời',
  EventInvitationRejected: 'Từ chối lời mời',
  PaymentSuccess: 'Thanh toán',
  Refund: 'Hoàn tiền',
  PayoutCompleted: 'Thanh toán hoàn tất',
  PayoutFailed: 'Thanh toán thất bại',
  EventReminder: 'Nhắc nhở sự kiện',
  ReportEvent: 'Báo cáo sự kiện',
  System: 'Hệ thống',
};

const NotificationsScreen = ({ navigation }) => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteReadNotifications,
  } = useNotifications();

  const { width } = useWindowDimensions();
  const [filterType, setFilterType] = useState('all'); // all, unread, read
  const [refreshing, setRefreshing] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  // Fetch notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const isRead = filterType === 'unread' ? false : (filterType === 'read' ? true : null);
      await fetchNotifications(isRead, 1, 50);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }, [filterType, fetchNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setIsMarking(true);
    try {
      await markAllAsRead();
      Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo đã đọc');
    } catch (err) {
      console.error('Error marking all as read:', err);
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả thông báo');
    } finally {
      setIsMarking(false);
    }
  };

  const handleDeleteReadNotifications = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa tất cả thông báo đã đọc?',
      [
        { text: 'Hủy', onPress: () => {} },
        {
          text: 'Xóa',
          onPress: async () => {
            setIsMarking(true);
            try {
              await deleteReadNotifications();
              Alert.alert('Thành công', 'Đã xóa thông báo');
              await loadNotifications();
            } catch (err) {
              console.error('Error deleting notifications:', err);
              Alert.alert('Lỗi', 'Không thể xóa thông báo');
            } finally {
              setIsMarking(false);
            }
          },
        },
      ]
    );
  };

  const getFilteredNotifications = () => {
    if (filterType === 'unread') {
      return notifications.filter(n => !n.isRead && !n.IsRead);
    } else if (filterType === 'read') {
      return notifications.filter(n => n.isRead || n.IsRead);
    }
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Vừa xong';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // Check if message contains HTML tags
  const isHTMLContent = (text) => {
    if (!text) return false;
    return /<[a-z][\s\S]*>/i.test(text);
  };

  // HTML rendering configuration
  const htmlRenderConfig = {
    baseStyle: {
      fontSize: 14,
      color: Colors.textSecondary || '#666',
      lineHeight: 20,
    },
    tagsStyles: {
      p: { marginTop: 0, marginBottom: 4 },
      strong: { fontWeight: 'bold', color: Colors.text || '#000' },
      b: { fontWeight: 'bold', color: Colors.text || '#000' },
      em: { fontStyle: 'italic' },
      i: { fontStyle: 'italic' },
      u: { textDecorationLine: 'underline' },
      a: { color: Colors.primary || '#007AFF', textDecorationLine: 'underline' },
      ul: { marginTop: 4, marginBottom: 4 },
      ol: { marginTop: 4, marginBottom: 4 },
      li: { marginBottom: 2 },
    },
  };

  const renderNotificationItem = ({ item }) => {
    const isRead = item.isRead || item.IsRead;
    const notificationType = item.type || item.Type || 'System';
    const title = item.title || item.Title || 'Thông báo';
    const message = item.message || item.Message || '';
    const createdAt = item.createdDate || item.CreatedDate;
    const notificationId = item.notificationId || item.NotificationId;

    const iconSource = notificationTypeIcons[notificationType] || Images.bell;
    const typeLabel = notificationTypeLabels[notificationType] || 'Thông báo';

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !isRead && styles.notificationItemUnread,
          isRead && styles.notificationItemRead,
        ]}
        onPress={() => {
          if (!isRead) {
            handleMarkAsRead(notificationId);
          }
        }}
        activeOpacity={0.6}
      >
        <View style={[styles.notificationIcon, isRead && styles.notificationIconRead]}>
          <Image
            source={iconSource}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.typeBadge}>
            <CustomText style={styles.typeBadgeText}>{typeLabel}</CustomText>
          </View>
          <CustomText style={styles.notificationTitle} numberOfLines={2}>
            {title}
          </CustomText>
          {message ? (
            isHTMLContent(message) ? (
              <View style={styles.htmlMessageContainer}>
                <RenderHTML
                  contentWidth={width - 120}
                  source={{ html: message }}
                  baseStyle={htmlRenderConfig.baseStyle}
                  tagsStyles={htmlRenderConfig.tagsStyles}
                />
              </View>
            ) : (
              <CustomText
                style={styles.notificationMessage}
                numberOfLines={2}
                color="textSecondary"
              >
                {message}
              </CustomText>
            )
          ) : null}
          <CustomText style={styles.notificationMeta}>
            {formatTimeAgo(createdAt)}
          </CustomText>
        </View>

        {!isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Colors.gradientHeaderTitle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <CustomText style={styles.headerTitle}>Thông báo</CustomText>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <CustomText style={{ marginTop: 12, color: Colors.textSecondary }}>
            Đang tải...
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradientHeaderTitle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <CustomText style={styles.headerTitle}>Thông báo</CustomText>
        {unreadCount > 0 && (
          <CustomText style={styles.headerSubtitle}>
            {unreadCount} thông báo chưa đọc
          </CustomText>
        )}
      </LinearGradient>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'unread', label: 'Chưa đọc' },
            { key: 'read', label: 'Đã đọc' },
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterType === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType(filter.key)}
            >
              <CustomText
                style={[
                  styles.filterButtonText,
                  filterType === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={Images.bell}
            style={styles.emptyIcon}
            resizeMode="contain"
          />
          <CustomText style={styles.emptyTitle}>
            {filterType === 'unread'
              ? 'Không có thông báo chưa đọc'
              : filterType === 'read'
              ? 'Không có thông báo đã đọc'
              : 'Chưa có thông báo nào'}
          </CustomText>
          <CustomText style={styles.emptyMessage}>
            {filterType === 'unread'
              ? 'Bạn đã đọc tất cả thông báo'
              : 'Hãy quay lại sau để cập nhật'}
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item, index) =>
            item.notificationId ||
            item.NotificationId ||
            `notification-${index}`
          }
          style={styles.notificationsList}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          scrollEventThrottle={16}
        />
      )}

      {/* Bottom Action Bar */}
      {filteredNotifications.length > 0 && (
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={handleMarkAllAsRead}
            disabled={isMarking || unreadCount === 0}
            activeOpacity={0.7}
          >
            <CustomText style={styles.bottomButtonText}>
              {isMarking ? 'Đang...' : 'Đánh dấu'}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomButton, styles.bottomButtonSecondary]}
            onPress={handleDeleteReadNotifications}
            disabled={isMarking}
            activeOpacity={0.7}
          >
            <CustomText style={styles.bottomButtonTextSecondary}>
              {isMarking ? 'Đang...' : 'Xóa'}
            </CustomText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default NotificationsScreen;
