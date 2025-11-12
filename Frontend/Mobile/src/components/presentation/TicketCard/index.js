import React from 'react';
import {View, TouchableOpacity, Image} from 'react-native';
import CustomText from '../../common/customTextRN';
import {LinearGradient} from 'expo-linear-gradient';
import {Calendar, QrCode} from 'lucide-react-native';
import Colors from '../../../constants/Colors';
import {styles} from './styles';

const TicketCard = ({ticket, event, onPressQR, onPressCalendar}) => {
  if (!ticket || !event) return null;

  // Ensure gradient colors are valid strings and filter out any undefined
  const headerColors = [Colors.primaryLight, Colors.primary].filter(Boolean);

  const eventImage =
    event.image ||
    'https://res.cloudinary.com/demo/image/upload/v1680000000/default-event.jpg';

  return (
    <View style={styles.cardContainer}>
      {/* Hình ảnh sự kiện */}
      <LinearGradient colors={headerColors} style={styles.ticketHeader}>
        <Image
          source={{uri: eventImage}}
          style={styles.eventImage}
          resizeMode="cover"
        />
        <View style={styles.headerTextContainer}>
          <CustomText variant="h4" color="white" numberOfLines={1}>
            {event.title || 'Sự kiện không tên'}
          </CustomText>
          <CustomText variant="caption" color="white">
            {event.address || 'Địa điểm chưa cập nhật'}
          </CustomText>
        </View>
      </LinearGradient>

      {/* Thông tin vé */}
      <View style={styles.ticketBody}>
        <CustomText
          variant="subtitle"
          color="primary"
          style={styles.ticketType}>
          Loại vé: {ticket.ticketTypeName}
        </CustomText>

        <CustomText variant="body" color="secondary">
          Mã vé: {ticket.code}
        </CustomText>

        <CustomText variant="body" color="secondary">
          Giá vé: {ticket.price?.toLocaleString('vi-VN')}₫
        </CustomText>

        <CustomText variant="caption" color="secondary">
          Ngày mua: {new Date(ticket.createdAt).toLocaleString('vi-VN')}
        </CustomText>

        <CustomText
          variant="caption"
          color={ticket.status === 'Valid' ? 'success' : 'error'}
          style={styles.status}>
          Trạng thái: {ticket.status === 'Valid' ? 'Hợp lệ' : 'Không hợp lệ'}
        </CustomText>

        {/* Nút hành động */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPressQR && onPressQR(ticket)}>
            <QrCode color={Colors.primary} size={20} />
            <CustomText
              variant="caption"
              color="primary"
              style={styles.actionText}>
              Xem QR
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPressCalendar && onPressCalendar(ticket)}>
            <Calendar color={Colors.primary} size={20} />
            <CustomText
              variant="caption"
              color="primary"
              style={styles.actionText}>
              Thêm Lịch
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TicketCard;
