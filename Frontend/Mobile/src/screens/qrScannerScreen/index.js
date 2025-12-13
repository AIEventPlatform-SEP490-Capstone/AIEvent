import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import CustomButton from '../../components/common/customButtonRN';
import CustomText from '../../components/common/customTextRN';
import Colors from '../../constants/Colors';
import BookingService from '../../api/services/BookingService';

const { width } = Dimensions.get('window');

const QrScannerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [showLoading, setShowLoading] = useState(false);

  // useRef để kiểm soát trạng thái xử lý
  const isProcessingRef = useRef(false);
  // useRef để chống spam quét cùng 1 mã
  const lastScannedRef = useRef({ data: null, timestamp: 0 });

  // Throttle function: chỉ cho phép xử lý 1 lần mỗi 3 giây
  const throttle = (func, delay) => {
    let inThrottle = false;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, delay);
      }
    };
  };

  // Hàm xử lý quét QR
  const handleBarCodeScanned = async ({ data }) => {
    const now = Date.now();

    // 1. Kiểm tra nếu đang xử lý → bỏ qua
    if (isProcessingRef.current) return;

    // 2. Kiểm tra nếu cùng mã QR trong vòng 3 giây → bỏ qua
    if (lastScannedRef.current.data === data && (now - lastScannedRef.current.timestamp) < 3000) {
      return;
    }

    // Đánh dấu bắt đầu xử lý
    isProcessingRef.current = true;
    lastScannedRef.current = { data, timestamp: now };
    setShowLoading(true);

    console.log('QR Scanned:', data.substring(0, 30) + '...');

    try {
      // First, get ticket information
      const response = await BookingService.checkInfor(data);
      console.log('Check-in information response:', response);
      
      if (response.success) {
        // Navigate to confirmation screen with ticket info
        navigation.navigate('CheckInConfirmationScreen', {
          ticketInfo: response.data,
          qrContent: data
        });
      } else {
        showErrorAlert(response.message || 'Không thể lấy thông tin vé');
      }
    } catch (error) {
      // Error already logged in BaseApiService, just show alert to user
      showErrorAlert(error.message || 'Lỗi không xác định');
    } finally {
      // Reset processing state after a delay to allow navigation
      setTimeout(() => {
        isProcessingRef.current = false;
        setShowLoading(false);
      }, 1500);
    }
  };

  // Hiển thị lỗi với message phù hợp
  const showErrorAlert = (rawMessage) => {
    let errorMessage = 'Không thể xác nhận vé. Vui lòng thử lại.';

    const msg = rawMessage.toLowerCase();

    if (msg.includes('invalid data') || msg.includes('bad request')) {
      errorMessage = 'Mã QR không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.';
    } else if (msg.includes('not found')) {
      errorMessage = 'Không tìm thấy thông tin vé. Vui lòng kiểm tra lại.';
    } else if (msg.includes('already') || msg.includes('used') || msg.includes('checked in')) {
      errorMessage = 'Vé này đã được sử dụng trước đó.';
    } else if (msg.includes('permission')) {
      errorMessage = 'Bạn không có quyền thực hiện check-in cho vé này.';
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Alert.alert('Lỗi', errorMessage, [
      { text: 'OK', onPress: resetProcessing },
    ]);
  };

  // Reset trạng thái để quét tiếp
  const resetProcessing = () => {
    setTimeout(() => {
      isProcessingRef.current = false;
      setShowLoading(false);
    }, 1500);
  };

  // Phát âm thanh thành công (tùy chọn)
  const playSuccessSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/success.mp3') // Thay bằng file bạn có
      );
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 1000);
    } catch (e) {
      console.log('Sound not played (optional)');
    }
  };

  // Throttled handler: chỉ xử lý 1 lần mỗi 3 giây
  const throttledScan = useRef(throttle(handleBarCodeScanned, 3000)).current;

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // --- Giao diện ---
  if (!permission) {
    return (
      <View style={styles.container}>
        <CustomText variant="body" color="primary">
          Đang yêu cầu quyền truy cập camera...
        </CustomText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <CustomText variant="body" color="primary">
          Không có quyền truy cập camera. Vui lòng cấp quyền trong cài đặt.
        </CustomText>
        <CustomButton
          title="Yêu cầu lại"
          onPress={requestPermission}
          variant="primary"
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chỉ hiển thị camera khi KHÔNG đang xử lý */}
      {!showLoading && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={throttledScan}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      )}

      {/* Loading overlay */}
      {showLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.white} />
          <CustomText variant="h3" color="white" style={styles.loadingText}>
            Đang xử lý check-in...
          </CustomText>
        </View>
      )}

      {/* Overlay hướng dẫn */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />

        <View style={styles.centerOverlay}>
          <View style={styles.leftOverlay} />
          <View style={styles.scanArea} />
          <View style={styles.rightOverlay} />
        </View>

        <View style={styles.bottomOverlay}>
          <CustomText variant="h3" color="white" style={styles.instructionText}>
            Quét mã QR trên vé của khách
          </CustomText>

          <CustomButton
            title="Quay lại"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centerOverlay: {
    flexDirection: 'row',
    height: width * 0.7,
  },
  leftOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 10,
  },
  rightOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionText: {
    marginBottom: 30,
    textAlign: 'center',
  },
  backButton: {
    width: '80%',
  },
});

export default QrScannerScreen;