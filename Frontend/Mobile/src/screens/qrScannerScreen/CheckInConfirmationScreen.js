import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import CustomButton from '../../components/common/customButtonRN';
import CustomText from '../../components/common/customTextRN';
import Colors from '../../constants/Colors';
import BookingService from '../../api/services/BookingService';

const CheckInConfirmationScreen = ({ route, navigation }) => {
  const { ticketInfo, qrContent } = route.params;

  const handleAllowCheckIn = async () => {
    try {
      const response = await BookingService.checkInTicket(qrContent);
      
      if (response.success) {
        Alert.alert(
          'Check-in thành công',
          'Vé đã được xác nhận check-in thành công!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(), // Go back to QR scanner screen
            },
          ]
        );
      } else {
        Alert.alert(
          'Check-in thất bại',
          response.message || 'Không thể hoàn tất check-in. Vui lòng thử lại.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(), // Go back to QR scanner screen even on failure
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert(
        'Lỗi',
        'Đã xảy ra lỗi khi thực hiện check-in. Vui lòng thử lại.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(), // Go back to QR scanner screen on error
          },
        ]
      );
    }
  };

  const handleDenyCheckIn = () => {
    // Go back to QR scanner screen
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <CustomText variant="h1" color="primary" style={styles.title}>
          Thông tin vé
        </CustomText>
        <CustomText variant="body" color="secondary" style={styles.subtitle}>
          Vui lòng xác nhận thông tin trước khi check-in
        </CustomText>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <CustomText variant="body" color="secondary" style={styles.label}>
            Họ và tên:
          </CustomText>
          <CustomText variant="body" color="primary" style={styles.value}>
            {ticketInfo.fullName}
          </CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText variant="body" color="secondary" style={styles.label}>
            Email:
          </CustomText>
          <CustomText variant="body" color="primary" style={styles.value}>
            {ticketInfo.email}
          </CustomText>
        </View>

        {ticketInfo.phone && (
          <View style={styles.infoRow}>
            <CustomText variant="body" color="secondary" style={styles.label}>
              Số điện thoại:
            </CustomText>
            <CustomText variant="body" color="primary" style={styles.value}>
              {ticketInfo.phone}
            </CustomText>
          </View>
        )}

        <View style={styles.infoRow}>
          <CustomText variant="body" color="secondary" style={styles.label}>
            Tên sự kiện:
          </CustomText>
          <CustomText variant="body" color="primary" style={styles.value}>
            {ticketInfo.eventName}
          </CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText variant="body" color="secondary" style={styles.label}>
            Loại vé:
          </CustomText>
          <CustomText variant="body" color="primary" style={styles.value}>
            {ticketInfo.ticketTypeName}
          </CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText variant="body" color="secondary" style={styles.label}>
            Mã vé:
          </CustomText>
          <CustomText variant="body" color="primary" style={styles.value}>
            {ticketInfo.ticketCode}
          </CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText variant="body" color="secondary" style={styles.label}>
            Trạng thái:
          </CustomText>
          <CustomText variant="body" color="primary" style={styles.value}>
            {ticketInfo.status}
          </CustomText>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Cho phép check-in"
          onPress={handleAllowCheckIn}
          variant="secondary"
          style={{ backgroundColor: "green", marginBottom: 16 }}
        />
        <CustomButton
          title="Từ chối"
          onPress={handleDenyCheckIn}
          variant="secondary"
          style={{ backgroundColor: "red" }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 16,
    flex: 2,
    textAlign: 'right',
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 10,
  },
  actionButton: {
    marginBottom: 16,
  },
});

export default CheckInConfirmationScreen;