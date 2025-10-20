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
import { login } from '../../redux/actions/Action';
import { styles } from './styles';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const { isLoading, error } = useSelector(state => state.auth);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu!');
            return;
        }

        const result = await dispatch(login(email, password));
        if (result.success) {
            Alert.alert('Thành công', 'Đăng nhập thành công!');
        } else {
            Alert.alert('Lỗi', result.message);
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
                            <View style={styles.logoWrapper}>
                                <Text style={styles.logoText}>AIEVENT</Text>
                                <Image
                                    source={require('../../assets/images/AIEventLogo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                                <Text style={styles.headerTitle}>Welcome back!</Text>
                            </View>

                            <View style={styles.inputContainer}>
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
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.linksRow}>
                                <TouchableOpacity activeOpacity={0.7}>
                                    <Text style={styles.linkText}>Quên mật khẩu?</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>Chưa có tài khoản? </Text>
                                <TouchableOpacity 
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('RegisterScreen')}
                                >
                                    <Text style={styles.registerLink}>Đăng ký</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>hoặc đăng nhập với</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.socialRow}>
                                <TouchableOpacity
                                    style={[styles.socialIconButton, styles.googleButton]}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={require('../../assets/icons/google.png')}
                                        style={styles.socialIconOnly}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default LoginScreen;