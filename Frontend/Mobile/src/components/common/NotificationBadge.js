import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNotifications } from '../../hooks/useNotifications';
import CustomText from '../common/customTextRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import NotificationService from '../../api/services/NotificationService';

const NotificationBadge = ({ onPress, style }) => {
  const { unreadCount, fetchNotifications } = useNotifications();
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread count on mount
  useEffect(() => {
    loadUnreadCount();
  }, []);

  // Update local count when Redux unreadCount changes
  useEffect(() => {
    setLocalUnreadCount(unreadCount);
  }, [unreadCount]);

  const loadUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getUnreadCount();
      if (response.success) {
        setLocalUnreadCount(response.data);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async () => {
    // Load fresh data before navigating
    await loadUnreadCount();
    // Also fetch notifications
    try {
      await fetchNotifications(null, 1, 50);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
    // Navigate to notifications screen
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.notificationButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image source={Images.bell} style={styles.notificationIcon} />
      {localUnreadCount > 0 && (
        <View style={styles.badge}>
          <CustomText
            style={styles.badgeText}
            numberOfLines={1}
          >
            {localUnreadCount > 99 ? '99+' : localUnreadCount}
          </CustomText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.white,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error || '#FF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default NotificationBadge;
