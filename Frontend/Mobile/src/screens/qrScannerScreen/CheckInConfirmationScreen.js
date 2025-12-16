import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../../components/common/customButtonRN';
import CustomText from '../../components/common/customTextRN';
import Colors from '../../constants/Colors';
import BookingService from '../../api/services/BookingService';

const { width } = Dimensions.get('window');

const CheckInConfirmationScreen = ({ route, navigation }) => {
  const { ticketInfo, qrContent } = route.params;

  const handleAllowCheckIn = async () => {
    try {
      const response = await BookingService.checkInTicket(qrContent);
      
      if (response.success) {
        Alert.alert(
          'Check-in thành công',
          'Vé đã được xác nhận check-in thành công!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Check-in thất bại',
          response.message || 'Không thể hoàn tất check-in. Vui lòng thử lại.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      const errorMessage = error.isBusinessError 
        ? error.message 
        : 'Đã xảy ra lỗi khi thực hiện check-in. Vui lòng thử lại.';
      
      Alert.alert(
        error.isBusinessError ? 'Thông báo' : 'Lỗi',
        errorMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handleDenyCheckIn = () => {
    navigation.goBack();
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('active') || statusLower.includes('valid') || statusLower.includes('chưa')) {
      return { bg: '#E8F5E9', text: '#2E7D32' };
    }
    if (statusLower.includes('used') || statusLower.includes('checked') || statusLower.includes('đã')) {
      return { bg: '#FFF3E0', text: '#E65100' };
    }
    return { bg: '#ECEFF1', text: '#546E7A' };
  };

  const statusColors = getStatusColor(ticketInfo.status);

  const InfoRow = ({ icon, label, value, isStatus }) => (
    <View style={styles.infoRow}>
      <View style={styles.labelContainer}>
        <View style={styles.iconWrapper}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <CustomText variant="body" color="secondary" style={styles.label}>
          {label}
        </CustomText>
      </View>
      {isStatus ? (
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <CustomText style={[styles.statusText, { color: statusColors.text }]}>
            {value}
          </CustomText>
        </View>
      ) : (
        <CustomText variant="body" color="primary" style={styles.value} numberOfLines={2}>
          {value}
        </CustomText>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1565C0', '#42A5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.ticketIconWrapper}>
            <Ionicons name="ticket" size={40} color="#fff" />
          </View>
          <CustomText style={styles.title}>Xác nhận Check-in</CustomText>
          <CustomText style={styles.subtitle}>
            Vui lòng kiểm tra thông tin vé trước khi xác nhận
          </CustomText>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={24} color={Colors.primary} />
            <CustomText style={styles.cardTitle}>Thông tin khách hàng</CustomText>
          </View>
          
          <InfoRow 
            icon="person-outline" 
            label="Họ và tên" 
            value={ticketInfo.fullName} 
          />
          <InfoRow 
            icon="mail-outline" 
            label="Email" 
            value={ticketInfo.email} 
          />
          {ticketInfo.phone && (
            <InfoRow 
              icon="call-outline" 
              label="Số điện thoại" 
              value={ticketInfo.phone} 
            />
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <CustomText style={styles.cardTitle}>Thông tin vé</CustomText>
          </View>
          
          <InfoRow 
            icon="musical-notes-outline" 
            label="Sự kiện" 
            value={ticketInfo.eventName} 
          />
          <InfoRow 
            icon="pricetag-outline" 
            label="Loại vé" 
            value={ticketInfo.ticketTypeName} 
          />
          <InfoRow 
            icon="qr-code-outline" 
            label="Mã vé" 
            value={ticketInfo.ticketCode} 
          />
          <InfoRow 
            icon="checkmark-circle-outline" 
            label="Trạng thái" 
            value={ticketInfo.status}
            isStatus
          />
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Cho phép Check-in"
            onPress={handleAllowCheckIn}
            variant="secondary"
            style={styles.allowButton}
            icon={<Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />}
          />
          <CustomButton
            title="Từ chối"
            onPress={handleDenyCheckIn}
            variant="secondary"
            style={styles.denyButton}
            icon={<Ionicons name="close-circle" size={20} color="#fff" style={{ marginRight: 8 }} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ticketIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF2',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F6',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    color: '#78909C',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#37474F',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 30,
  },
  allowButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 12,
    borderRadius: 12,
    height: 52,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  denyButton: {
    backgroundColor: '#EF5350',
    borderRadius: 12,
    height: 52,
    shadowColor: '#EF5350',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default CheckInConfirmationScreen;
