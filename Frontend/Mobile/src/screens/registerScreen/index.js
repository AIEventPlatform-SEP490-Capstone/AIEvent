import React, { useState } from 'react';
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { styles } from './styles';

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const { fullName, email, password, confirmPassword, phone } = formData;

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

        if (!phone.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại!');
            return false;
        }

        if (password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự!');
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');
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
            // TODO: Implement register API call
            // const result = await dispatch(register(formData));
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            Alert.alert(
                'Thành công', 
                'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('LoginScreen')
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/images/loginpanel.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={styles.overlay} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.contentContainer}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
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
                                        onChangeText={(value) => handleInputChange('fullName', value)}
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
                                        onChangeText={(value) => handleInputChange('email', value)}
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
                                        value={formData.phone}
                                        onChangeText={(value) => handleInputChange('phone', value)}
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
                                        style={styles.input}
                                        placeholder="Mật khẩu"
                                        placeholderTextColor="#A0AEC0"
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Image
                                        source={require('../../assets/icons/lock.png')}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Xác nhận mật khẩu"
                                        placeholderTextColor="#A0AEC0"
                                        value={formData.confirmPassword}
                                        onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                                onPress={handleRegister}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.registerButtonText}>
                                    {isLoading ? 'Đang đăng ký...' : 'ĐĂNG KÝ'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Đã có tài khoản? </Text>
                                <TouchableOpacity 
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('LoginScreen')}
                                >
                                    <Text style={styles.loginLink}>Đăng nhập ngay</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>hoặc đăng ký với</Text>
                                <View style={styles.divider} />
                            </View>

                            <View style={styles.socialRow}>
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={require('../../assets/icons/facebook.png')}
                                        style={styles.socialIcon}
                                    />
                                    <Text style={styles.socialText}>Facebook</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={require('../../assets/icons/google.png')}
                                        style={styles.socialIcon}
                                    />
                                    <Text style={styles.socialText}>Google</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default RegisterScreen;
