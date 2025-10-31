import React from 'react';
import { TouchableOpacity, View, Image, Linking, Alert } from 'react-native';
import CustomText from '../customTextRN';
import Images from '../../../constants/Images';
import { styles } from './styles';

const formatDateForGoogleCalendar = (date) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const GoogleCalendarButton = ({
  eventTitle,
  startTime,
  endTime,
  description,
  location,
  style,
}) => {
  const handleAddToGoogleCalendar = () => {
    if (!startTime) {
      Alert.alert('Lỗi', 'Không có thông tin thời gian sự kiện.');
      return;
    }

    try {
      const startDate = formatDateForGoogleCalendar(startTime);
      const endDate = endTime 
        ? formatDateForGoogleCalendar(endTime) 
        : formatDateForGoogleCalendar(new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000));
      
      const title = encodeURIComponent(eventTitle || 'Event');
      const details = encodeURIComponent(description || 'Sự kiện từ AIEvent');
      const locationEncoded = encodeURIComponent(location || '');
      const dates = `${startDate}/${endDate}`;

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${locationEncoded}`;

      Linking.openURL(googleCalendarUrl).catch((err) => {
        console.error('Error opening Google Calendar:', err);
        Alert.alert('Lỗi', 'Không thể mở Google Calendar. Vui lòng thử lại.');
      });
    } catch (error) {
      console.error('Error creating Google Calendar URL:', error);
      Alert.alert('Lỗi', 'Không thể tạo sự kiện trên Google Calendar. Vui lòng thử lại.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleAddToGoogleCalendar}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        <Image source={Images.calendar} style={styles.icon} resizeMode="contain" />
        <CustomText variant="body" style={styles.buttonText}>
          Thêm vào Google Calendar
        </CustomText>
      </View>
    </TouchableOpacity>
  );
};

export default GoogleCalendarButton;

