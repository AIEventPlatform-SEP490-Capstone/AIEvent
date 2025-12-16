import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import CustomButton from '../../components/common/customButtonRN';
import CustomText from '../../components/common/customTextRN';
import Colors from '../../constants/Colors';
import BookingService from '../../api/services/BookingService';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

const QrScannerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [showLoading, setShowLoading] = useState(false);

  // Animation cho scan line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // useRef để kiểm soát trạng thái xử lý
  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef({ data: null, timestamp: 0 });

  // Animation scan line
  useEffect(() => {
    const animateScanLine = () => {
      scanLineAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    animateScanLine();
  }, []);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  // Throttle function
  const throttle = (func, delay) => {
    let inThrottle = false;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, delay);
      }
    };
  };

  const handleBarCodeScanned = async ({ data }) => {
    const now = Date.now();
    if (isProcessingRef.current) return;
    if (lastScannedRef.current.data === data && (now - lastScannedRef.current.timestamp) < 3000) return;

    isProcessingRef.current = true;
    lastScannedRef.current = { data, timestamp: now };
    setShowLoading(true);

    // Haptic feedback khi quét được
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await BookingService.checkInfor(data);
      
      if (response.success) {
        navigation.navigate('CheckInConfirmationScreen', {
          ticketInfo: response.data,
          qrContent: data
        });
      } else {
        showErrorAlert(response.message || 'Không thể lấy thông tin vé');
      }
    } catch (error) {
      showErrorAlert(error.message || 'Lỗi không xác định');
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
        setShowLoading(false);
      }, 1500);
    }
  };

  const showErrorAlert = (rawMessage) => {
    let errorMessage = 'Không thể xác nhận vé. Vui lòng thử lại.';
    const msg = rawMessage.toLowerCase();

    if (msg.includes('invalid data') || msg.includes('bad request')) {
      errorMessage = 'Mã QR không hợp lệ hoặc đã hết hạn.';
    } else if (msg.includes('not found')) {
      errorMessage = 'Không tìm thấy thông tin vé.';
    } else if (msg.includes('already') || msg.includes('used') || msg.includes('checked in')) {
      errorMessage = 'Vé này đã được sử dụng trước đó.';
    } else if (msg.includes('permission')) {
      errorMessage = 'Bạn không có quyền thực hiện check-in.';
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('Lỗi', errorMessage, [{ text: 'OK', onPress: resetProcessing }]);
  };

  const resetProcessing = () => {
    setTimeout(() => {
      isProcessingRef.current = false;
      setShowLoading(false);
    }, 1500);
  };

  const throttledScan = useRef(throttle(handleBarCodeScanned, 3000)).current;

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Corner component
  const Corner = ({ position }) => {
    const cornerStyles = {
      topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
      topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
      bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
      bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
    };
    return <View style={[styles.corner, cornerStyles[position]]} />;
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <CustomText variant="body" style={styles.permissionText}>
          Đang yêu cầu quyền camera...
        </CustomText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={60} color={Colors.primary} />
        </View>
        <CustomText variant="h2" style={styles.permissionTitle}>
          Cần quyền Camera
        </CustomText>
        <CustomText variant="body" style={styles.permissionText}>
          Vui lòng cấp quyền camera để quét mã QR
        </CustomText>
        <CustomButton
          title="Cấp quyền Camera"
          onPress={requestPermission}
          variant="primary"
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!showLoading && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={throttledScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
      )}

      {/* Loading overlay */}
      {showLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <CustomText style={styles.loadingText}>Đang xử lý...</CustomText>
          </View>
        </View>
      )}

      {/* Main overlay */}
      <View style={styles.overlay}>
        {/* Top section với gradient */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)']}
          style={styles.topSection}
        >
          <View style={styles.header}>
            <View style={{ width: 44 }} />
            <View style={styles.headerCenter}>
              <Ionicons name="qr-code" size={28} color="#fff" />
              <CustomText style={styles.headerTitle}>Quét mã QR</CustomText>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBtn}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Center scan area */}
        <View style={styles.centerSection}>
          <View style={styles.sideOverlay} />
          
          <View style={styles.scanAreaWrapper}>
            <View style={styles.scanArea}>
              <Corner position="topLeft" />
              <Corner position="topRight" />
              <Corner position="bottomLeft" />
              <Corner position="bottomRight" />
              
              {/* Animated scan line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineTranslate }] },
                ]}
              >
                <LinearGradient
                  colors={['transparent', Colors.primary, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.scanLineGradient}
                />
              </Animated.View>
            </View>
          </View>
          
          <View style={styles.sideOverlay} />
        </View>

        {/* Bottom section */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
          style={styles.bottomSection}
        >
          <View style={styles.instructionBox}>
            <Ionicons name="scan-outline" size={24} color={Colors.primary} />
            <CustomText style={styles.instructionText}>
              Đưa mã QR vào khung để quét
            </CustomText>
          </View>
          
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Ionicons name="sunny-outline" size={18} color="#aaa" />
              <CustomText style={styles.tipText}>Đảm bảo đủ ánh sáng</CustomText>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="move-outline" size={18} color="#aaa" />
              <CustomText style={styles.tipText}>Giữ camera ổn định</CustomText>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    color: '#78909C',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    width: '100%',
    borderRadius: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#37474F',
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  topSection: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  centerSection: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanAreaWrapper: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
  },
  scanLineGradient: {
    flex: 1,
    borderRadius: 2,
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 15,
    color: '#fff',
    marginLeft: 10,
    fontWeight: '500',
  },
  tipsContainer: {
    width: '100%',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#aaa',
    marginLeft: 10,
  },
});

export default QrScannerScreen;
