import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import styles from './styles';
import CustomText from '../../components/common/customTextRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import {
  changePassword,
  clearChangePasswordError,
  clearChangePasswordSuccess,
} from '../../redux/actions/Action';

// Memoized PasswordInput component to prevent unnecessary re-renders
const PasswordInput = React.memo(
  ({
    field,
    label,
    placeholder,
    value,
    isValid,
    errorMessage,
    showPassword,
    onToggleVisibility,
    onChangeText,
    disabled,
  }) => {
    const hasValue = value.length > 0;
    const showValidation = (hasValue || errorMessage) && field !== 'currentPassword';

    return (
      <View style={styles.inputContainer}>
        <CustomText variant="body" color="primary" style={styles.inputLabel}>
          {label} <CustomText variant="body" color="error">*</CustomText>
        </CustomText>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              field === 'currentPassword' 
                ? styles.inputDefault
                : !hasValue
                ? styles.inputDefault
                : isValid
                ? styles.inputValid
                : styles.inputInvalid,
            ]}
            value={value}
            onChangeText={(text) => onChangeText(field, text)}
            placeholder={placeholder}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!disabled}
            accessibilityLabel={label}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={[styles.eyeButton, disabled && styles.eyeButtonDisabled]}
            onPress={() => onToggleVisibility(field)}
            disabled={disabled}
            accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            accessibilityRole="button"
          >
            <Image
              source={
                showPassword
                  ? require('../../assets/icons/show-eye.png')
                  : require('../../assets/icons/close-eye.png')
              }
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
        {showValidation && (
          <View style={styles.validationContainer}>
            <CustomText
              variant="caption"
              color={isValid ? 'success' : 'error'}
              style={styles.validationText}
            >
              {isValid ? '✓ Hợp lệ' : `✗ ${errorMessage}`}
            </CustomText>
          </View>
        )}
      </View>
    );
  }
);

// Memoized PasswordRequirements component
const PasswordRequirements = React.memo(({ password }) => {
  const requirements = [
    { 
      label: `Ít nhất 8 ký tự`, 
      met: password.length >= 8,
      progress: Math.min(password.length, 8),
      max: 8
    },
    { label: '1 chữ hoa (A-Z)', met: /[A-Z]/.test(password) },
    { label: '1 chữ thường (a-z)', met: /[a-z]/.test(password) },
    { label: '1 số (0-9)', met: /\d/.test(password) },
  ];

  // Calculate password strength
  const metRequirements = requirements.filter(req => req.met).length;
  const strengthLevel = metRequirements === 4 ? 'Mạnh' : metRequirements >= 2 ? 'Trung bình' : 'Yếu';
  const strengthColor = metRequirements === 4 ? '#10B981' : metRequirements >= 2 ? '#F59E0B' : '#EF4444';

  return (
    <View style={styles.requirementsContainer}>
      <CustomText variant="h4" color="primary" style={styles.requirementsTitle}>
        🔐 Yêu cầu mật khẩu mới
      </CustomText>
      
      {/* Password Strength Indicator */}
      {password.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBar}>
            <View 
              style={[
                styles.strengthFill, 
                { 
                  width: `${(metRequirements / 4) * 100}%`,
                  backgroundColor: strengthColor
                }
              ]} 
            />
          </View>
          <CustomText 
            variant="caption" 
            style={[styles.strengthText, { color: strengthColor }]}
          >
            Độ mạnh: {strengthLevel}
          </CustomText>
        </View>
      )}

      <View style={styles.requirementsList}>
        {requirements.map(({ label, met, progress, max }, index) => (
          <View key={index} style={styles.requirementItem}>
            <View
              style={[
                styles.requirementIcon,
                { backgroundColor: met ? '#10B981' : '#E5E7EB' },
              ]}
            >
              <CustomText variant="caption" color="white" style={{ fontSize: 12 }}>
                {met ? '✓' : '○'}
              </CustomText>
            </View>
            <CustomText
              variant="caption"
              color={met ? 'success' : 'secondary'}
              style={styles.requirementText}
            >
              {label}
              {progress !== undefined && (
                <CustomText variant="caption" color="secondary" style={{ fontSize: 12 }}>
                  {' '}({progress}/{max})
                </CustomText>
              )}
            </CustomText>
          </View>
        ))}
      </View>
    </View>
  );
});

const ChangePasswordScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isChangingPassword, changePasswordError, changePasswordSuccess } =
    useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Memoized validation function
  const validateForm = useCallback(() => {
    const newValidation = {
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
      messages: {},
    };

    // Current password: no validation required
    newValidation.currentPassword = true;
    newValidation.messages.currentPassword = '';

    // New password: minimum 8 characters, uppercase, lowercase, number
    const newPassword = formData.newPassword;
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const isNewPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

    if (newPassword.length > 0) {
      if (!isNewPasswordValid) {
        newValidation.newPassword = false;
        newValidation.messages.newPassword =
          'Mật khẩu mới cần ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số';
      } else if (newPassword === formData.currentPassword) {
        newValidation.newPassword = false;
        newValidation.messages.newPassword =
          'Mật khẩu mới phải khác mật khẩu hiện tại';
      } else {
        newValidation.newPassword = true;
        newValidation.messages.newPassword = 'Mật khẩu mới hợp lệ';
      }
    } else {
      newValidation.newPassword = false;
      newValidation.messages.newPassword = 'Vui lòng nhập mật khẩu mới';
    }

    // Confirm password: must match new password
    if (formData.confirmPassword.length > 0) {
      if (formData.confirmPassword !== formData.newPassword) {
        newValidation.confirmPassword = false;
        newValidation.messages.confirmPassword = 'Mật khẩu xác nhận không khớp';
      } else {
        newValidation.confirmPassword = true;
        newValidation.messages.confirmPassword = 'Mật khẩu xác nhận khớp';
      }
    } else {
      newValidation.confirmPassword = false;
      newValidation.messages.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    }

    return newValidation;
  }, [formData]);

  // Compute validation state
  const validation = useMemo(() => validateForm(), [validateForm]);

  // Handle input change
  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Only clear error when user starts typing, not success message
      if (changePasswordError) {
        dispatch(clearChangePasswordError());
      }
    },
    [changePasswordError, dispatch]
  );

  // Handle password visibility toggle
  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    const hasCurrentPassword = formData.currentPassword.length > 0;
    const hasNewPassword =
      formData.newPassword.length >= 8 &&
      /[A-Z]/.test(formData.newPassword) &&
      /[a-z]/.test(formData.newPassword) &&
      /\d/.test(formData.newPassword);
    const hasConfirmPassword =
      formData.confirmPassword === formData.newPassword &&
      formData.confirmPassword.length > 0;
    const isDifferentPassword = formData.currentPassword !== formData.newPassword;

    return (
      hasCurrentPassword && hasNewPassword && hasConfirmPassword && isDifferentPassword
    );
  }, [formData]);

  // Handle success and error messages
  useEffect(() => {
    if (changePasswordSuccess) {
      Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
        {
          text: 'OK',
          onPress: () => {
            dispatch(clearChangePasswordSuccess()); // Clear success message
            navigation.goBack();
          },
        },
      ]);
    }
  }, [changePasswordSuccess, dispatch, navigation]);

  useEffect(() => {
    if (changePasswordError) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.', [
        {
          text: 'OK',
          onPress: () => dispatch(clearChangePasswordError()),
        },
      ]);
    }
  }, [changePasswordError, dispatch]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin nhập vào');
      return;
    }

    try {
      await dispatch(
        changePassword(
          formData.currentPassword,
          formData.newPassword,
          formData.confirmPassword
        )
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.');
    }
  }, [dispatch, formData, isFormValid]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isChangingPassword}
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
          >
            <CustomText
              variant="h3"
              color={isChangingPassword ? 'secondary' : 'primary'}
              style={styles.backIcon}
            >
              ←
            </CustomText>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <CustomText variant="h2" color="primary" style={styles.headerTitle}>
              Đổi mật khẩu
            </CustomText>
            <CustomText variant="caption" color="secondary" style={styles.headerSubtitle}>
              Bảo mật tài khoản của bạn
            </CustomText>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.welcomeContainer}>
            <CustomText variant="h3" color="primary" style={styles.title}>
              🛡️ Bảo mật tài khoản
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.subtitle}>
              Để bảo mật tài khoản của bạn, vui lòng nhập mật khẩu hiện tại và tạo mật khẩu mới an toàn
            </CustomText>
          </View>

          <View style={styles.form}>
            <PasswordInput
              field="currentPassword"
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu hiện tại"
              value={formData.currentPassword}
              isValid={validation.currentPassword}
              errorMessage={validation.messages.currentPassword}
              showPassword={showPasswords.currentPassword}
              onToggleVisibility={togglePasswordVisibility}
              onChangeText={handleInputChange}
              disabled={isChangingPassword}
            />

            <PasswordInput
              field="newPassword"
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới"
              value={formData.newPassword}
              isValid={validation.newPassword}
              errorMessage={validation.messages.newPassword}
              showPassword={showPasswords.newPassword}
              onToggleVisibility={togglePasswordVisibility}
              onChangeText={handleInputChange}
              disabled={isChangingPassword}
            />

            <PasswordInput
              field="confirmPassword"
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={formData.confirmPassword}
              isValid={validation.confirmPassword}
              errorMessage={validation.messages.confirmPassword}
              showPassword={showPasswords.confirmPassword}
              onToggleVisibility={togglePasswordVisibility}
              onChangeText={handleInputChange}
              disabled={isChangingPassword}
            />

            <PasswordRequirements password={formData.newPassword} />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid || isChangingPassword) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isChangingPassword}
              accessibilityLabel="Đổi mật khẩu"
              accessibilityRole="button"
              accessibilityState={{ disabled: !isFormValid || isChangingPassword }}
            >
              {isChangingPassword ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <CustomText variant="body" color="white" style={styles.loadingText}>
                    Đang xử lý...
                  </CustomText>
                </View>
              ) : (
                <View style={styles.submitButtonContent}>
                  <CustomText variant="body" color="white" style={styles.submitButtonText}>
                    Đổi mật khẩu
                  </CustomText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;