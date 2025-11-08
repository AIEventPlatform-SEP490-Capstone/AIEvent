import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  ImageBackground,
  Modal,
  Switch,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {styles} from './styles';
import AuthService from '../../api/services/AuthService';
import ScreenNames from '../../constants/ScreenNames';

const CITIES = [
  'Quận 1',
  'Quận 3',
  'Quận 4',
  'Quận 5',
  'Quận 6',
  'Quận 7',
  'Quận 8',
  'Quận 10',
  'Quận 11',
  'Quận 12',
  'Quận Bình Tân',
  'Quận Bình Thạnh',
  'Quận Gò Vấp',
  'Quận Phú Nhuận',
  'Quận Tân Bình',
  'Quận Tân Phú',
  'Thành phố Thủ Đức',
  'Huyện Bình Chánh',
  'Huyện Cần Giờ',
  'Huyện Củ Chi',
  'Huyện Hóc Môn',
  'Huyện Nhà Bè',
];

const FREQUENCY_OPTIONS = [
  {value: 'Weekly', label: 'Hàng tuần'},
  {value: 'Monthly', label: 'Hàng tháng'},
  {value: 'Occasionally', label: 'Thỉnh thoảng'},
  {value: 'Daily', label: 'Hàng ngày'},
];

const BUDGET_OPTIONS = [
  {value: 'Under500k', label: 'Dưới 500k VND'},
  {value: 'From500kTo2M', label: '500k - 2M VND'},
  {value: 'Above2M', label: 'Trên 2M VND'},
  {value: 'Flexible', label: 'Linh hoạt'},
];

const INTERESTS = [
  'Công nghệ',
  'Kinh doanh',
  'Âm nhạc',
  'Thể thao',
  'Nghệ thuật',
  'Du lịch',
  'Ẩm thực',
  'Giáo dục',
  'Sức khỏe',
  'Thời trang',
  'Gaming',
  'Khởi nghiệp',
  'Marketing',
  'Thiết kế',
  'Nhiếp ảnh',
];

const RegisterScreen = ({navigation}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    userInterests: [],
    interestedCities: [],
    participationFrequency: 'Weekly',
    budgetOption: 'Flexible',
    isEmailNotificationEnabled: true,
    isPushNotificationEnabled: true,
    isSmsNotificationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showCitiesModal, setShowCitiesModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const validatePassword = password => {
    const errors = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordErrors(errors);
    return Object.values(errors).every(Boolean);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleInterest = interest => {
    setFormData(prev => {
      const interests = [...prev.userInterests];
      const index = interests.indexOf(interest);
      if (index > -1) {
        interests.splice(index, 1);
      } else {
        interests.push(interest);
      }
      return {...prev, userInterests: interests};
    });
  };

  const toggleCity = city => {
    setFormData(prev => {
      const cities = [...prev.interestedCities];
      const index = cities.indexOf(city);
      if (index > -1) {
        cities.splice(index, 1);
      } else {
        cities.push(city);
      }
      return {...prev, interestedCities: cities};
    });
  };

  const validateForm = () => {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      userInterests,
      interestedCities,
      participationFrequency,
      budgetOption,
    } = formData;

    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên!');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email!');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ!');
      return false;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại!');
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (phải có 10 chữ số)!');
      return false;
    }

    if (!validatePassword(password)) {
      Alert.alert('Lỗi', 'Mật khẩu không đáp ứng đủ yêu cầu!');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');
      return false;
    }

    if (userInterests.length < 3) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 3 sở thích!');
      return false;
    }

    if (interestedCities.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một thành phố quan tâm!');
      return false;
    }

    if (!participationFrequency) {
      Alert.alert('Lỗi', 'Vui lòng chọn tần suất tham gia!');
      return false;
    }

    if (!budgetOption) {
      Alert.alert('Lỗi', 'Vui lòng chọn mức ngân sách!');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Prepare register data - ensure all fields are properly formatted
      const registerData = {
        fullName: (formData.fullName || '').trim(),
        email: (formData.email || '').trim().toLowerCase(),
        password: formData.password || '',
        confirmPassword: formData.confirmPassword || '',
        phoneNumber: (formData.phoneNumber || '').trim(),
        userInterests: Array.isArray(formData.userInterests)
          ? formData.userInterests
          : [],
        interestedCities: Array.isArray(formData.interestedCities)
          ? formData.interestedCities
          : [],
        participationFrequency: formData.participationFrequency || 'Weekly',
        budgetOption: formData.budgetOption || 'Flexible',
        isEmailNotificationEnabled:
          formData.isEmailNotificationEnabled !== undefined
            ? formData.isEmailNotificationEnabled
            : true,
        isPushNotificationEnabled:
          formData.isPushNotificationEnabled !== undefined
            ? formData.isPushNotificationEnabled
            : true,
        isSmsNotificationEnabled:
          formData.isSmsNotificationEnabled !== undefined
            ? formData.isSmsNotificationEnabled
            : true,
      };

      // Validate required fields
      if (!registerData.fullName) {
        Alert.alert('Lỗi', 'Vui lòng nhập họ và tên!');
        setIsLoading(false);
        return;
      }

      if (!registerData.email) {
        Alert.alert('Lỗi', 'Vui lòng nhập email!');
        setIsLoading(false);
        return;
      }

      if (!registerData.phoneNumber) {
        Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại!');
        setIsLoading(false);
        return;
      }

      if (!registerData.password) {
        Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu!');
        setIsLoading(false);
        return;
      }

      console.log(
        'Register data being sent:',
        JSON.stringify(registerData, null, 2),
      );

      const result = await AuthService.register(registerData);

      console.log('Register result:', result);

      if (result.success) {
        // Navigate directly to OTP screen without showing alert
        // Or show a brief success message
        navigation.navigate(ScreenNames.OTP_VERIFY_SCREEN, {
          email: formData.email,
        });
      } else {
        Alert.alert(
          'Lỗi',
          result.message || 'Đăng ký thất bại. Vui lòng thử lại!',
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!');
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDropdown = (options, selectedValue, onSelect, show, onToggle) => {
    if (!show) return null;

    return (
      <View style={styles.dropdownContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.dropdownItem,
              selectedValue === option.value && styles.dropdownItemSelected,
            ]}
            onPress={() => {
              onSelect(option.value);
              onToggle(false);
            }}>
            <Text
              style={[
                styles.dropdownItemText,
                selectedValue === option.value &&
                  styles.dropdownItemTextSelected,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMultiSelectModal = (
    title,
    items,
    selectedItems,
    onToggle,
    visible,
    onClose,
  ) => {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.chipsContainer}>
                {items.map(item => {
                  const isSelected = selectedItems.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => onToggle(item)}>
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={onClose}>
              <Text style={styles.modalConfirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
                <Text style={styles.headerTitle}>Tạo tài khoản mới</Text>
                <Image
                  source={require('../../assets/images/AIEventLogo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.inputContainer}>
                {/* Basic Info */}
                <View style={styles.inputWrapper}>
                  <Image
                    source={require('../../assets/icons/profile.png')}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Họ và tên"
                    placeholderTextColor="#A0AEC0"
                    value={formData.fullName}
                    onChangeText={value => handleInputChange('fullName', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Image
                    source={require('../../assets/icons/email.png')}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#A0AEC0"
                    value={formData.email}
                    onChangeText={value => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Image
                    source={require('../../assets/icons/users.png')}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Số điện thoại"
                    placeholderTextColor="#A0AEC0"
                    value={formData.phoneNumber}
                    onChangeText={value =>
                      handleInputChange('phoneNumber', value)
                    }
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Image
                    source={require('../../assets/icons/lock.png')}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Mật khẩu"
                    placeholderTextColor="#A0AEC0"
                    value={formData.password}
                    onChangeText={value => {
                      handleInputChange('password', value);
                      validatePassword(value);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}>
                    <Image
                      source={
                        showPassword
                          ? require('../../assets/icons/show-eye.png')
                          : require('../../assets/icons/close-eye.png')
                      }
                      style={styles.inputIcon}
                    />
                  </TouchableOpacity>
                </View>

                {/* Password requirements */}
                <View style={styles.passwordRequirements}>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordErrors.length && styles.requirementMet,
                    ]}>
                    ✓ Ít nhất 8 ký tự
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordErrors.uppercase && styles.requirementMet,
                    ]}>
                    ✓ Ít nhất 1 chữ hoa
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordErrors.lowercase && styles.requirementMet,
                    ]}>
                    ✓ Ít nhất 1 chữ thường
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordErrors.number && styles.requirementMet,
                    ]}>
                    ✓ Ít nhất 1 số
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      passwordErrors.special && styles.requirementMet,
                    ]}>
                    ✓ Ít nhất 1 ký tự đặc biệt
                  </Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Image
                    source={require('../../assets/icons/lock.png')}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Xác nhận mật khẩu"
                    placeholderTextColor="#A0AEC0"
                    value={formData.confirmPassword}
                    onChangeText={value =>
                      handleInputChange('confirmPassword', value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }>
                    <Image
                      source={
                        showConfirmPassword
                          ? require('../../assets/icons/show-eye.png')
                          : require('../../assets/icons/close-eye.png')
                      }
                      style={styles.inputIcon}
                    />
                  </TouchableOpacity>
                </View>

                {/* Sở thích */}
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowInterestsModal(true)}>
                  <Text style={styles.selectButtonText}>
                    Sở thích{' '}
                    {formData.userInterests.length > 0 &&
                      `(${formData.userInterests.length})`}
                  </Text>
                  <Text style={styles.selectButtonArrow}>▼</Text>
                </TouchableOpacity>
                {/* Hiển thị các sở thích đã chọn dưới dạng chip */}
                {formData.userInterests.length > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginTop: 8,
                      marginBottom: 6,
                    }}>
                    {formData.userInterests.map(item => (
                      <View
                        key={item}
                        style={[
                          styles.chip,
                          {marginRight: 8, marginBottom: 8},
                        ]}>
                        <Text style={styles.chipText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Thành phố quan tâm */}
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowCitiesModal(true)}>
                  <Text style={styles.selectButtonText}>
                    Thành phố quan tâm{' '}
                    {formData.interestedCities.length > 0 &&
                      `(${formData.interestedCities.length})`}
                  </Text>
                  <Text style={styles.selectButtonArrow}>▼</Text>
                </TouchableOpacity>
                {/* Hiển thị các thành phố đã chọn dưới dạng chip */}
                {formData.interestedCities.length > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginTop: 8,
                      marginBottom: 6,
                    }}>
                    {formData.interestedCities.map(city => (
                      <View
                        key={city}
                        style={[
                          styles.chip,
                          {marginRight: 8, marginBottom: 8},
                        ]}>
                        <Text style={styles.chipText}>{city}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tần suất tham gia */}
                <Text style={styles.sectionTitle}>Tần suất tham gia</Text>
                <View style={styles.dropdownWrapperFirst}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      setShowBudgetDropdown(false);
                      setShowFrequencyDropdown(!showFrequencyDropdown);
                    }}>
                    <Text style={styles.selectButtonText}>
                      {FREQUENCY_OPTIONS.find(
                        opt => opt.value === formData.participationFrequency,
                      )?.label || 'Tần suất tham gia'}
                    </Text>
                    <Text style={styles.selectButtonArrow}>▼</Text>
                  </TouchableOpacity>
                  {renderDropdown(
                    FREQUENCY_OPTIONS,
                    formData.participationFrequency,
                    value => handleInputChange('participationFrequency', value),
                    showFrequencyDropdown,
                    setShowFrequencyDropdown,
                  )}
                </View>

                {/* Mức ngân sách */}
                <Text style={styles.sectionTitle}>Mức ngân sách</Text>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      setShowFrequencyDropdown(false);
                      setShowBudgetDropdown(!showBudgetDropdown);
                    }}>
                    <Text style={styles.selectButtonText}>
                      {BUDGET_OPTIONS.find(
                        opt => opt.value === formData.budgetOption,
                      )?.label || 'Mức ngân sách'}
                    </Text>
                    <Text style={styles.selectButtonArrow}>▼</Text>
                  </TouchableOpacity>
                  {renderDropdown(
                    BUDGET_OPTIONS,
                    formData.budgetOption,
                    value => handleInputChange('budgetOption', value),
                    showBudgetDropdown,
                    setShowBudgetDropdown,
                  )}
                </View>

                {/* Notification Settings */}
                <View style={styles.notificationContainer}>
                  <Text style={styles.sectionTitle}>Thông báo</Text>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Thông báo Email</Text>
                    <Switch
                      value={formData.isEmailNotificationEnabled}
                      onValueChange={value =>
                        handleInputChange('isEmailNotificationEnabled', value)
                      }
                      trackColor={{false: '#E8ECF0', true: '#2196F3'}}
                      thumbColor={
                        formData.isEmailNotificationEnabled
                          ? '#FFFFFF'
                          : '#F4F3F4'
                      }
                    />
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Thông báo Push</Text>
                    <Switch
                      value={formData.isPushNotificationEnabled}
                      onValueChange={value =>
                        handleInputChange('isPushNotificationEnabled', value)
                      }
                      trackColor={{false: '#E8ECF0', true: '#2196F3'}}
                      thumbColor={
                        formData.isPushNotificationEnabled
                          ? '#FFFFFF'
                          : '#F4F3F4'
                      }
                    />
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Thông báo SMS</Text>
                    <Switch
                      value={formData.isSmsNotificationEnabled}
                      onValueChange={value =>
                        handleInputChange('isSmsNotificationEnabled', value)
                      }
                      trackColor={{false: '#E8ECF0', true: '#2196F3'}}
                      thumbColor={
                        formData.isSmsNotificationEnabled
                          ? '#FFFFFF'
                          : '#F4F3F4'
                      }
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}>
                <Text style={styles.registerButtonText}>
                  {isLoading ? 'Đang đăng ký...' : 'ĐĂNG KÝ'}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Đã có tài khoản? </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('LoginScreen')}>
                  <Text style={styles.loginLink}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Multi-select Modals */}
      {renderMultiSelectModal(
        'Chọn sở thích',
        INTERESTS,
        formData.userInterests,
        toggleInterest,
        showInterestsModal,
        () => setShowInterestsModal(false),
      )}

      {renderMultiSelectModal(
        'Chọn thành phố quan tâm',
        CITIES,
        formData.interestedCities,
        toggleCity,
        showCitiesModal,
        () => setShowCitiesModal(false),
      )}
    </ImageBackground>
  );
};

export default RegisterScreen;
