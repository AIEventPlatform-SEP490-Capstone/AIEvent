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
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../redux/actions/Action';
import { styles } from './styles';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const dispatch = useDispatch();
    const { isLoading, error } = useSelector(state => state.auth);
    const canSubmit = email.trim().length > 0 && password.trim().length > 0;

    // Animation values
    const fadeAnim = useState(new Animated.Value(1))[0];
    const scaleAnim = useState(new Animated.Value(1))[0];
    const progressAnim = useState(new Animated.Value(0))[0];

    const handleLogin = async () => {
        if (!canSubmit || isLoading) {
            return;
        }

        // Start loading animations
        startLoadingAnimation();
        
        try {
            await dispatch(login(email, password));
        } catch (error) {
            // Reset animations on error
            resetLoadingAnimation();
        }
    };

    const startLoadingAnimation = () => {
        // Fade out form elements
        Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Scale down button
        Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 200,
            useNativeDriver: true,
        }).start();

        // Animate progress bar
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
        }).start();
    };

    const resetLoadingAnimation = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
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
                        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
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
                                        editable={!isLoading}
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
                                        secureTextEntry={!isPasswordVisible}
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                        disabled={isLoading}
                                    >
                                        <Image
                                            source={
                                                isPasswordVisible
                                                    ? require('../../assets/icons/show-eye.png')
                                                    : require('../../assets/icons/close-eye.png')
                                            }
                                            style={[styles.eyeIcon, { opacity: isLoading ? 0.5 : 1 }]}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {/* Loading Progress Bar */}
                            {isLoading && (
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <Animated.View 
                                            style={[
                                                styles.progressFill,
                                                {
                                                    width: progressAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: ['0%', '100%'],
                                                    }),
                                                }
                                            ]} 
                                        />
                                    </View>
                                    <Text style={styles.progressText}>Đang xác thực...</Text>
                                </View>
                            )}

                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <TouchableOpacity
                                    style={[
                                        styles.loginButton,
                                        canSubmit ? styles.loginButtonEnabled : styles.loginButtonDisabled,
                                        isLoading && styles.loginButtonLoading,
                                    ]}
                                    onPress={handleLogin}
                                    disabled={!canSubmit || isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator 
                                                size="small" 
                                                color="#FFFFFF" 
                                                style={styles.loadingSpinner}
                                            />
                                            <Text style={styles.loginButtonText}>Đang đăng nhập...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>

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
                        </Animated.View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default LoginScreen;