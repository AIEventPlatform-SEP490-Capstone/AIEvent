import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/common/customButtonRN';
import CustomText from '../../components/common/customTextRN';
import Colors from '../../constants/Colors';
import Images from '../../constants/Images';
import BookingService from '../../api/services/BookingService';

const { width, height } = Dimensions.get('window');

const QrScannerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    requestPermission();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setScanning(false);
    
    try {
      // Call check-in API with the scanned QR code data
      const response = await BookingService.checkInTicket(data);
      
      if (response.success) {
        Alert.alert(
          'Check-in thành công',
          'Vé đã được xác nhận check-in thành công!',
          [
            {
              text: 'Tiếp tục',
              onPress: () => {
                setScanned(false);
                setScanning(true);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Check-in thất bại',
          response.message || 'Không thể xác nhận vé. Vui lòng thử lại.',
          [
            {
              text: 'Thử lại',
              onPress: () => {
                setScanned(false);
                setScanning(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi kiểm tra vé. Vui lòng thử lại.',
        [
          {
            text: 'Thử lại',
            onPress: () => {
              setScanned(false);
              setScanning(true);
            },
          },
        ]
      );
    }
  };

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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      )}
      
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
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
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