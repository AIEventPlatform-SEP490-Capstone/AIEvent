import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import LogoutButton from '../../components/common/LogoutButton';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';

const ProfileScreen = () => {
  const handleLogoutSuccess = () => {
    // Callback khi logout thành công
    console.log('Logout successful');
  };

  const handleEditProfile = () => {
    Alert.alert('Thông báo', 'Chức năng chỉnh sửa hồ sơ sẽ được phát triển trong tương lai');
  };

  const handleSettings = () => {
    Alert.alert('Thông báo', 'Chức năng cài đặt sẽ được phát triển trong tương lai');
  };

  const handleNotifications = () => {
    Alert.alert('Thông báo', 'Chức năng thông báo sẽ được phát triển trong tương lai');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image source={Images.avatar1} style={styles.avatar} />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Image source={Images.settings} style={styles.editIcon} />
          </TouchableOpacity>
        </View>
        
        <CustomText variant="h2" color="primary" style={styles.userName}>
          {Strings.USER_NAME}
        </CustomText>
        
        <CustomText variant="body" color="secondary" style={styles.userEmail}>
          {Strings.USER_EMAIL}
        </CustomText>
      </View>

      {/* Profile Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionItem} onPress={handleEditProfile}>
          <View style={styles.actionLeft}>
            <Image source={Images.profile} style={styles.actionIcon} />
            <CustomText variant="body" color="primary">
              Chỉnh sửa hồ sơ
            </CustomText>
          </View>
          <Image source={Images.arrow} style={styles.arrowIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleSettings}>
          <View style={styles.actionLeft}>
            <Image source={Images.settings} style={styles.actionIcon} />
            <CustomText variant="body" color="primary">
              Cài đặt
            </CustomText>
          </View>
          <Image source={Images.arrow} style={styles.arrowIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleNotifications}>
          <View style={styles.actionLeft}>
            <Image source={Images.notification} style={styles.actionIcon} />
            <CustomText variant="body" color="primary">
              Thông báo
            </CustomText>
          </View>
          <Image source={Images.arrow} style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>

      {/* Logout Section */}
      <View style={styles.logoutSection}>
        <LogoutButton 
          variant="full" 
          size="large"
          showConfirmation={true}
          onLogoutSuccess={handleLogoutSuccess}
          style={styles.logoutButton}
        />
      </View>

      {/* App Info */}
      <View style={styles.appInfoSection}>
        <CustomText variant="caption" color="secondary" align="center">
          Phiên bản 1.0.0
        </CustomText>
        <CustomText variant="caption" color="secondary" align="center">
          © 2025 AIEvent. Tất cả quyền của bạn là của bạn.
        </CustomText>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
