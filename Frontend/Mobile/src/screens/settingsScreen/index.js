import React from 'react';
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

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              dispatch(logoutUser());
            } catch (error) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
            }
          },
        },
      ]
    );
  };

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

        {/* Account Settings Section */}
        <View style={styles.settingsSection}>
          <CustomText variant="h4" color="primary" style={styles.sectionTitle}>
            Tài khoản
          </CustomText>
          
          {/* Notifications Setting */}
          <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <CustomText variant="h3" style={styles.settingIcon}>
                🔔
              </CustomText>
              <View style={styles.settingContent}>
                <CustomText variant="body" color="primary" style={styles.settingTitle}>
                  Thông báo
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                  Nhận thông báo về sự kiện mới và cập nhật
                </CustomText>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={styles.toggleSwitch}>
                <View style={styles.toggleThumb} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Privacy Setting */}
          <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <CustomText variant="h3" style={styles.settingIcon}>
                🔒
              </CustomText>
              <View style={styles.settingContent}>
                <CustomText variant="body" color="primary" style={styles.settingTitle}>
                  Quyền riêng tư
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                  Hiển thị hồ sơ công khai cho người khác
                </CustomText>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={[styles.toggleSwitch, styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, styles.toggleThumbActive]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

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

          {/* Two-Factor Authentication */}
          <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <CustomText variant="h3" style={styles.settingIcon}>
                🔐
              </CustomText>
              <View style={styles.settingContent}>
                <CustomText variant="body" color="primary" style={styles.settingTitle}>
                  Xác thực 2 bước
                </CustomText>
                <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                  Bảo mật tài khoản với mã xác thực
                </CustomText>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={[styles.toggleSwitch, styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, styles.toggleThumbActive]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity 
            style={[styles.settingCard, styles.logoutCard]} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <CustomText variant="h3" style={styles.logoutIcon}>
                🚪
              </CustomText>
              <View style={styles.settingContent}>
                <CustomText variant="body" color="error" style={styles.settingTitle}>
                  Đăng xuất
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

