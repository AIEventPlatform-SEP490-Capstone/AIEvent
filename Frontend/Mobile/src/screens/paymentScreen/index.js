import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
  Clipboard,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const PaymentScreen = ({ route, navigation }) => {
  const { paymentData } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Chưa xác định";
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  const handleCopyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Đã sao chép', `${label} đã được sao chép vào clipboard`);
  };

  const handleOpenCheckoutUrl = () => {
    if (paymentData?.checkoutUrl) {
      Linking.openURL(paymentData.checkoutUrl);
    }
  };

  const handleSharePayment = async () => {
    try {
      const shareContent = {
        message: `Thông tin thanh toán:\nSố tiền: ${formatCurrency(paymentData?.amount || 0)}\nMã đơn hàng: ${paymentData?.orderCode}\nLink thanh toán: ${paymentData?.checkoutUrl}`,
        url: paymentData?.checkoutUrl,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chia sẻ thông tin thanh toán');
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return { 
          text: 'Đang chờ thanh toán', 
          color: '#F59E0B', 
          bgColor: 'rgba(245, 158, 11, 0.1)',
          icon: '⏳'
        };
      case 'SUCCESS':
        return { 
          text: 'Thanh toán thành công', 
          color: Colors.success, 
          bgColor: 'rgba(34, 197, 94, 0.1)',
          icon: '✅'
        };
      case 'FAILED':
        return { 
          text: 'Thanh toán thất bại', 
          color: Colors.error, 
          bgColor: 'rgba(239, 68, 68, 0.1)',
          icon: '❌'
        };
      default:
        return { 
          text: status, 
          color: Colors.textLight, 
          bgColor: 'rgba(107, 114, 128, 0.1)',
          icon: '❓'
        };
    }
  };

  if (!paymentData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <CustomText variant="h3" color="error">
            Không có dữ liệu thanh toán
          </CustomText>
          <CustomText variant="body" color="secondary" style={styles.errorText}>
            Vui lòng thử lại từ màn hình ví
          </CustomText>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => navigation.goBack()}
          >
            <CustomText variant="body" color="white">
              Quay lại
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(paymentData.status);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <CustomText variant="h3" color="primary">←</CustomText>
          </TouchableOpacity>
          <CustomText variant="h3" color="primary" style={styles.headerTitle}>
            Thông tin thanh toán
          </CustomText>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleSharePayment}
          >
            <CustomText variant="h3" color="primary">📤</CustomText>
          </TouchableOpacity>
        </View>

        {/* Payment Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <CustomText variant="h1" color="primary">
              {statusInfo.icon}
            </CustomText>
          </View>
          <CustomText variant="h2" color="primary" style={styles.statusTitle}>
            {statusInfo.text}
          </CustomText>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <CustomText 
              variant="caption" 
              color={statusInfo.color}
              style={styles.statusBadgeText}
            >
              {paymentData.status}
            </CustomText>
          </View>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <CustomText variant="body" color="secondary" style={styles.amountLabel}>
            Số tiền thanh toán
          </CustomText>
          <CustomText variant="h1" color="primary" style={styles.amountValue}>
            {formatCurrency(paymentData.amount || 0)}
          </CustomText>
          <CustomText variant="caption" color="secondary" style={styles.currencyLabel}>
            {paymentData.currency || 'VND'}
          </CustomText>
        </View>

        {/* QR Code Card */}
        {paymentData.qrCode && (
          <View style={styles.qrCard}>
            <CustomText variant="h3" color="primary" style={styles.qrTitle}>
              Quét mã QR để thanh toán
            </CustomText>
            <View style={styles.qrContainer}>
              <QRCode
                value={paymentData.qrCode}
                size={200}
                color={Colors.primary}
                backgroundColor="white"
              />
            </View>
            <CustomText variant="caption" color="secondary" style={styles.qrHint}>
              Sử dụng ứng dụng ngân hàng để quét mã QR này
            </CustomText>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.detailsCard}>
          <CustomText variant="h3" color="primary" style={styles.detailsTitle}>
            Chi tiết thanh toán
          </CustomText>
          
          <View style={styles.detailRow}>
            <CustomText variant="body" color="secondary" style={styles.detailLabel}>
              Mã đơn hàng
            </CustomText>
            <TouchableOpacity 
              style={styles.detailValueContainer}
              onPress={() => handleCopyToClipboard(paymentData.orderCode?.toString(), 'Mã đơn hàng')}
            >
              <CustomText variant="body" color="primary" style={styles.detailValue}>
                {paymentData.orderCode}
              </CustomText>
              <CustomText variant="caption" color="secondary">📋</CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <CustomText variant="body" color="secondary" style={styles.detailLabel}>
              Số tài khoản
            </CustomText>
            <TouchableOpacity 
              style={styles.detailValueContainer}
              onPress={() => handleCopyToClipboard(paymentData.accountNumber, 'Số tài khoản')}
            >
              <CustomText variant="body" color="primary" style={styles.detailValue}>
                {paymentData.accountNumber}
              </CustomText>
              <CustomText variant="caption" color="secondary">📋</CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <CustomText variant="body" color="secondary" style={styles.detailLabel}>
              Mã ngân hàng
            </CustomText>
            <CustomText variant="body" color="primary" style={styles.detailValue}>
              {paymentData.bin}
            </CustomText>
          </View>

          <View style={styles.detailRow}>
            <CustomText variant="body" color="secondary" style={styles.detailLabel}>
              Mô tả
            </CustomText>
            <CustomText variant="body" color="primary" style={styles.detailValue}>
              {paymentData.description}
            </CustomText>
          </View>

          <View style={styles.detailRow}>
            <CustomText variant="body" color="secondary" style={styles.detailLabel}>
              Hết hạn
            </CustomText>
            <CustomText variant="body" color="primary" style={styles.detailValue}>
              {formatDate(paymentData.expiredAt)}
            </CustomText>
          </View>

          <View style={styles.detailRow}>
            <CustomText variant="body" color="secondary" style={styles.detailLabel}>
              Payment Link ID
            </CustomText>
            <TouchableOpacity 
              style={styles.detailValueContainer}
              onPress={() => handleCopyToClipboard(paymentData.paymentLinkId, 'Payment Link ID')}
            >
              <CustomText variant="body" color="primary" style={styles.detailValue}>
                {paymentData.paymentLinkId}
              </CustomText>
              <CustomText variant="caption" color="secondary">📋</CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {paymentData.checkoutUrl && (
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleOpenCheckoutUrl}
            >
              <CustomText variant="body" color="white" style={styles.checkoutButtonText}>
                Mở trang thanh toán
              </CustomText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              // TODO: Implement refresh payment status
              Alert.alert('Thông báo', 'Tính năng làm mới sẽ được cập nhật');
            }}
          >
            <CustomText variant="body" color="primary" style={styles.refreshButtonText}>
              Làm mới trạng thái
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <CustomText variant="h3" color="primary" style={styles.instructionsTitle}>
            Hướng dẫn thanh toán
          </CustomText>
          <View style={styles.instructionStep}>
            <CustomText variant="caption" color="primary" style={styles.stepNumber}>1</CustomText>
            <CustomText variant="body" color="secondary" style={styles.stepText}>
              Mở ứng dụng ngân hàng trên điện thoại
            </CustomText>
          </View>
          <View style={styles.instructionStep}>
            <CustomText variant="caption" color="primary" style={styles.stepNumber}>2</CustomText>
            <CustomText variant="body" color="secondary" style={styles.stepText}>
              Quét mã QR hoặc chuyển khoản đến số tài khoản
            </CustomText>
          </View>
          <View style={styles.instructionStep}>
            <CustomText variant="caption" color="primary" style={styles.stepNumber}>3</CustomText>
            <CustomText variant="body" color="secondary" style={styles.stepText}>
              Nhập đúng số tiền và nội dung chuyển khoản
            </CustomText>
          </View>
          <View style={styles.instructionStep}>
            <CustomText variant="caption" color="primary" style={styles.stepNumber}>4</CustomText>
            <CustomText variant="body" color="secondary" style={styles.stepText}>
              Hoàn tất giao dịch và chờ xác nhận
            </CustomText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PaymentScreen;
