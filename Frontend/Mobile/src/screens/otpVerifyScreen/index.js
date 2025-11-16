import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {styles} from './styles';
import AuthService from '../../api/services/AuthService';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const OtpVerifyScreen = ({route, navigation}) => {
  const {email} = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    // Countdown timer for resend OTP
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all 6 digits are filled
    if (value && index === 5) {
      const otpCode = newOtp.join('');
      if (otpCode.length === 6) {
        handleVerifyOtp(otpCode);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode = null) => {
    const code = otpCode || otp.join('');

    if (code.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 chữ số OTP!');
      return;
    }

    if (!email) {
      Alert.alert('Lỗi', 'Email không hợp lệ!');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.verifyOtp(email, code);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Xác thực thành công',
          text2: result.message || 'Tài khoản đã được xác thực thành công!',
          visibilityTime: 2000,
          onHide: () => {
            // Navigate to login screen after toast is hidden
            navigation.reset({
              index: 0,
              routes: [{name: 'LoginScreen'}],
            });
          },
        });
      } else {
        Alert.alert(
          'Lỗi',
          result.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!',
        );
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi xác thực. Vui lòng thử lại!');
      console.error('Verify OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !email) {
      return;
    }

    setIsResending(true);
    try {
      const result = await AuthService.resendOtp(email);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Gửi lại mã thành công',
          text2: result.message || 'Mã OTP mới đã được gửi đến email của bạn',
          visibilityTime: 2000,
        });
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert(
          'Lỗi',
          result.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại!',
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi lại mã OTP. Vui lòng thử lại!');
      console.error('Resend OTP error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/loginpanel.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover">
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.contentContainer}>
          <View style={styles.formContainer}>
            <View style={styles.brandBadge} />
            <View style={styles.logoWrapper}>
              <Text style={styles.headerTitle}>Xác thực OTP</Text>
              <Image
                source={require('../../assets/images/AIEventLogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Chúng tôi đã gửi mã xác thực 6 chữ số đến email:
              </Text>
              <Text style={styles.emailText}>{email}</Text>
              <Text style={styles.infoText}>
                Vui lòng nhập mã OTP để hoàn tất đăng ký.
              </Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (inputRefs.current[index] = ref)}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={value => handleOtpChange(value, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (isLoading || otp.join('').length !== 6) &&
                  styles.verifyButtonDisabled,
              ]}
              onPress={() => handleVerifyOtp()}
              disabled={isLoading || otp.join('').length !== 6}
              activeOpacity={0.8}>
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Đang xác thực...' : 'XÁC THỰC'}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Không nhận được mã? </Text>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Gửi lại sau {countdown}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={isResending}
                  activeOpacity={0.7}>
                  <Text style={styles.resendLink}>
                    {isResending ? 'Đang gửi...' : 'Gửi lại'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}>
              <Text style={styles.backButtonText}>← Quay lại đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default OtpVerifyScreen;
