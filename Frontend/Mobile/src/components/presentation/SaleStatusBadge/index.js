import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

const SaleStatusBadge = ({ 
  saleStartTime, 
  saleEndTime, 
  startTime, 
  endTime, 
  onImage = false 
}) => {
  const [timeStatus, setTimeStatus] = useState({
    status: 'not-started',
    label: '',
    description: '',
  });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const saleStart = new Date(saleStartTime);
      const saleEnd = new Date(saleEndTime);
      const eventStart = new Date(startTime);
      const eventEnd = new Date(endTime);

      // Event has ended
      if (now > eventEnd) {
        setTimeStatus({
          status: 'event-ended',
          label: 'Đã kết thúc',
          description: '',
        });
        return;
      }

      // Event is ongoing
      if (now >= eventStart && now <= eventEnd) {
        setTimeStatus({
          status: 'event-ongoing',
          label: 'Đang diễn ra',
          description: '',
        });
        return;
      }

      // Sale has ended but event hasn't started yet
      if (now > saleEnd && now < eventStart) {
        setTimeStatus({
          status: 'sale-closed',
          label: 'Đóng bán vé',
          description: '',
        });
        return;
      }

      // Sale is ongoing
      if (now >= saleStart && now <= saleEnd) {
        const diff = saleEnd - now;
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const totalMinutesLeft = Math.floor(diff / (1000 * 60));

        setTimeStatus({
          status: 'on-sale',
          label: 'Đang mở bán',
          description: totalMinutesLeft <= 120 ? `${hours}h ${minutes}m` : '',
        });
        return;
      }

      // Sale hasn't started yet
      if (now < saleStart) {
        const diff = saleStart - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);

        let timeText = '';
        if (days > 0) {
          timeText = `${days}d`;
        } else if (hours > 0) {
          timeText = `${hours}h`;
        } else {
          timeText = `${minutes}m`;
        }

        setTimeStatus({
          status: 'not-started',
          label: 'Chưa bán vé',
          description: timeText,
        });
        return;
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [saleStartTime, saleEndTime, startTime, endTime]);

  const getStatusStyle = () => {
    if (onImage) {
      // On-image badge - solid colors for good contrast
      switch (timeStatus.status) {
        case 'not-started':
          return { backgroundColor: '#475569', borderWidth: 0 };
        case 'on-sale':
          return { backgroundColor: '#10b981', borderWidth: 0 };
        case 'sale-closed':
          return { backgroundColor: '#ea580c', borderWidth: 0 };
        case 'event-ongoing':
          return { backgroundColor: '#2563eb', borderWidth: 0 };
        case 'event-ended':
          return { backgroundColor: '#dc2626', borderWidth: 0 };
        default:
          return { backgroundColor: '#475569', borderWidth: 0 };
      }
    } else {
      // Below-image badge - light backgrounds with borders
      switch (timeStatus.status) {
        case 'not-started':
          return { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' };
        case 'on-sale':
          return { backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#6ee7b7' };
        case 'sale-closed':
          return { backgroundColor: '#fed7aa', borderWidth: 1, borderColor: '#fdba74' };
        case 'event-ongoing':
          return { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd' };
        case 'event-ended':
          return { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' };
        default:
          return { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' };
      }
    }
  };

  const getTextStyle = () => {
    if (onImage) {
      return { color: '#ffffff' };
    } else {
      switch (timeStatus.status) {
        case 'not-started':
          return { color: '#334155' };
        case 'on-sale':
          return { color: '#047857' };
        case 'sale-closed':
          return { color: '#c2410c' };
        case 'event-ongoing':
          return { color: '#1d4ed8' };
        case 'event-ended':
          return { color: '#b91c1c' };
        default:
          return { color: '#334155' };
      }
    }
  };

  return (
    <View style={[styles.badge, getStatusStyle()]}>
      {timeStatus.description ? (
        <View style={styles.badgeContent}>
          <Text style={[styles.badgeLabel, getTextStyle()]}>{timeStatus.label}</Text>
          <Text style={[styles.badgeDescription, getTextStyle(), { opacity: 0.85 }]}>
            {timeStatus.description}
          </Text>
        </View>
      ) : (
        <Text style={[styles.badgeLabel, getTextStyle()]}>{timeStatus.label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeDescription: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SaleStatusBadge;
