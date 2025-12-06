import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import ScreenNames from '../../constants/ScreenNames';
import { logoutUser } from '../../redux/actions/Action';
import { CommonActions } from '@react-navigation/native';

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }
    
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await dispatch(logoutUser());
  
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: ScreenNames.AUTH_NAVIGATOR }], 
                })
              );
  
            } catch (error) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [dispatch, isLoggingOut, navigation]);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={Colors.gradientHeaderTitle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <CustomText variant="h2" color="white" style={styles.headerTitle}>
            Cài đặt
          </CustomText>
          <CustomText variant="body" color="white" style={styles.headerSubtitle}>
            Quản lý tài khoản và cài đặt ứng dụng
          </CustomText>
        </LinearGradient>

        {/* Security Section */}
        <View style={styles.settingsSection}>
          <CustomText variant="h4" color="primary" style={styles.sectionTitle}>
            Bảo mật
          </CustomText>
          
          {/* Change Password */}
          <TouchableOpacity 
            style={styles.settingCard} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate(ScreenNames.CHANGE_PASSWORD_SCREEN)}
          >
            <View style={styles.settingLeft}>
              <CustomText variant="h3" style={styles.settingIcon}>
                🔑
              </CustomText>
              <View style={styles.settingContent}>
                <CustomText variant="body" color="primary" style={styles.settingTitle}>
                  Đổi mật khẩu
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                  Cập nhật mật khẩu để bảo vệ tài khoản
                </CustomText>
              </View>
            </View>
            <View style={styles.settingRight}>
              <CustomText variant="body" color="secondary" style={styles.chevron}>
                ›
              </CustomText>
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity 
            style={[styles.settingCard, styles.logoutCard]} 
            onPress={handleLogout}
            activeOpacity={0.7}
            disabled={isLoggingOut}
          >
            <View style={styles.settingLeft}>
              <CustomText variant="h3" style={styles.logoutIcon}>
                🚪
              </CustomText>
              <View style={styles.settingContent}>
                <CustomText variant="body" color="error" style={styles.settingTitle}>
                  {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                  Đăng xuất khỏi tài khoản hiện tại
                </CustomText>
              </View>
            </View>
            <View style={styles.settingRight}>
              <CustomText variant="body" color="error" style={styles.chevron}>
                ›
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.settingsSection}>
          <CustomText variant="h4" color="primary" style={styles.sectionTitle}>
            Ứng dụng
          </CustomText>
          
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <CustomText variant="h3" style={styles.settingIcon}>
                ℹ️
              </CustomText>
              <View style={styles.settingContent}>
                <CustomText variant="body" color="primary" style={styles.settingTitle}>
                  Phiên bản
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                  AIEvent v1.0.0 (Build 1001)
                </CustomText>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={styles.versionBadge}>
                <CustomText variant="caption" color="white" style={styles.versionText}>
                  Mới nhất
                </CustomText>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <CustomText variant="h3" style={styles.settingIcon}>
                ❓
              </CustomText>
              <View style={styles.settingContent}>
                <CustomText variant="body" color="primary" style={styles.settingTitle}>
                  Trợ giúp & Hỗ trợ
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                  FAQ, liên hệ và hướng dẫn sử dụng
                </CustomText>
              </View>
            </View>
            <View style={styles.settingRight}>
              <CustomText variant="body" color="secondary" style={styles.chevron}>
                ›
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;