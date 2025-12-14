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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {styles} from './styles';
import AuthService from '../../api/services/AuthService';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const ForgotPasswordScreen = ({navigation}) => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password

  // Step 1: Email
  const [email, setEmail] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  // Step 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  // Step 3: Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    // Auto focus first OTP input when step 2 is active
    if (currentStep === 2 && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [currentStep]);

  useEffect(() => {
    // Countdown timer for resend OTP
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Handle email submission
  const handleSubmitEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email!');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Lỗi', 'Email không hợp lệ!');
      return;
    }

    setIsLoadingEmail(true);
    try {
      const result = await AuthService.forgotPassword(email.trim());

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: result.message || 'Mã OTP đã được gửi đến email của bạn!',
          visibilityTime: 3000,
        });
        setCurrentStep(2);
        setCountdown(60); // Start countdown for resend
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể gửi mã OTP. Vui lòng thử lại!');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại!');
      console.error('Forgot password error:', error);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // Step 2: Handle OTP input
  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);
    setOtpError(false); // Clear error when user types

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

  // Step 2: Verify OTP
  const handleVerifyOtp = async (otpCode = null) => {
    const code = otpCode || otp.join('');

    if (code.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 chữ số OTP!');
      return;
    }

    setIsLoadingOtp(true);
    setOtpError(false);
    try {
      const result = await AuthService.verifyForgotPasswordOtp(email.trim(), code);

      if (result.success) {
        // Save reset token
        if (result.data && result.data.resetToken) {
          setResetToken(result.data.resetToken);
        }
        Toast.show({
          type: 'success',
          text1: 'Xác thực thành công',
          text2: result.message || 'Vui lòng nhập mật khẩu mới!',
          visibilityTime: 2000,
        });
        setCurrentStep(3);
      } else {
        // Show error and allow retry
        setOtpError(true);
        Alert.alert('Lỗi', result.message || 'Mã OTP không hợp lệ. Vui lòng thử lại!');
        // Clear OTP inputs for retry
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setOtpError(true);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi xác thực. Vui lòng thử lại!');
      console.error('Verify OTP error:', error);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoadingOtp(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || !email) {
      return;
    }

    setIsResending(true);
    try {
      const result = await AuthService.forgotPassword(email.trim());

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Gửi lại mã thành công',
          text2: result.message || 'Mã OTP mới đã được gửi đến email của bạn',
          visibilityTime: 2000,
        });
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        setOtpError(false);
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

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới!');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng xác nhận mật khẩu!');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');
      return;
    }

    if (!resetToken) {
      Alert.alert('Lỗi', 'Mã xác thực không hợp lệ. Vui lòng thử lại từ đầu!');
      return;
    }

    setIsLoadingReset(true);
    try {
      const result = await AuthService.resetPassword(
        email.trim(),
        resetToken,
        newPassword,
      );

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: result.message || 'Đặt lại mật khẩu thành công!',
          visibilityTime: 3000,
          onHide: () => {
            // Navigate back to login screen
            navigation.navigate('LoginScreen'); // Using string as LoginScreen doesn't use ScreenNames constant
          },
        });
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại!');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại!');
      console.error('Reset password error:', error);
    } finally {
      setIsLoadingReset(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3].map((step, index) => (
          <View key={step} style={styles.stepIndicatorRow}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= step && styles.stepCircleActive,
              ]}>
              <Text
                style={[
                  styles.stepNumber,
                  currentStep >= step && styles.stepNumberActive,
                ]}>
                {step}
              </Text>
            </View>
            {index < 2 && (
              <View
                style={[
                  styles.stepLine,
                  currentStep > step && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStep1 = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
          </Text>
        </View>

        <View style={styles.inputWrapper}>
          <Image
            source={require('../../assets/icons/profile.png')}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A0AEC0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoadingEmail}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!email.trim() || isLoadingEmail) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitEmail}
          disabled={!email.trim() || isLoadingEmail}
          activeOpacity={0.8}>
          {isLoadingEmail ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>GỬI MÃ OTP</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep2 = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Chúng tôi đã gửi mã xác thực 6 chữ số đến email:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.infoText}>
            Vui lòng nhập mã OTP để tiếp tục.
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                otpError && styles.otpInputError,
              ]}
              value={digit}
              onChangeText={value => handleOtpChange(value, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoadingOtp}
            />
          ))}
        </View>

        {otpError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Mã OTP không đúng. Vui lòng nhập lại!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (otp.join('').length !== 6 || isLoadingOtp) &&
              styles.submitButtonDisabled,
          ]}
          onPress={() => handleVerifyOtp()}
          disabled={otp.join('').length !== 6 || isLoadingOtp}
          activeOpacity={0.8}>
          {isLoadingOtp ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>XÁC THỰC</Text>
          )}
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
      </View>
    );
  };

  const renderStep3 = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Vui lòng nhập mật khẩu mới và xác nhận lại
          </Text>
        </View>

        <View style={styles.inputWrapper}>
          <Image
            source={require('../../assets/icons/lock.png')}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            placeholderTextColor="#A0AEC0"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            editable={!isLoadingReset}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            disabled={isLoadingReset}>
            <Image
              source={
                isPasswordVisible
                  ? require('../../assets/icons/show-eye.png')
                  : require('../../assets/icons/close-eye.png')
              }
              style={[styles.eyeIcon, {opacity: isLoadingReset ? 0.5 : 1}]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Image
            source={require('../../assets/icons/lock.png')}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            placeholderTextColor="#A0AEC0"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!isConfirmPasswordVisible}
            autoCapitalize="none"
            editable={!isLoadingReset}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
            }
            disabled={isLoadingReset}>
            <Image
              source={
                isConfirmPasswordVisible
                  ? require('../../assets/icons/show-eye.png')
                  : require('../../assets/icons/close-eye.png')
              }
              style={[styles.eyeIcon, {opacity: isLoadingReset ? 0.5 : 1}]}
            />
          </TouchableOpacity>
        </View>

        {newPassword &&
          confirmPassword &&
          newPassword !== confirmPassword && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Mật khẩu xác nhận không khớp!
              </Text>
            </View>
          )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!newPassword.trim() ||
              !confirmPassword.trim() ||
              newPassword !== confirmPassword ||
              isLoadingReset) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={
            !newPassword.trim() ||
            !confirmPassword.trim() ||
            newPassword !== confirmPassword ||
            isLoadingReset
          }
          activeOpacity={0.8}>
          {isLoadingReset ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>ĐẶT LẠI MẬT KHẨU</Text>
          )}
        </TouchableOpacity>
      </View>
    );
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.formContainer}>
              <View style={styles.brandBadge} />
              <View style={styles.logoWrapper}>
                <Text style={styles.headerTitle}>Quên mật khẩu</Text>
                <Image
                  source={require('../../assets/images/AIEventLogo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {renderStepIndicator()}

              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (currentStep === 1) {
                    navigation.goBack();
                  } else {
                    setCurrentStep(currentStep - 1);
                    if (currentStep === 2) {
                      setOtp(['', '', '', '', '', '']);
                      setOtpError(false);
                    }
                  }
                }}
                activeOpacity={0.7}>
                <Text style={styles.backButtonText}>
                  ← {currentStep === 1 ? 'Quay lại đăng nhập' : 'Quay lại'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ForgotPasswordScreen;

