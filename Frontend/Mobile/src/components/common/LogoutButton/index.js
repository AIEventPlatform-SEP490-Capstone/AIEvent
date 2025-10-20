import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../../redux/actions/Action';
import { styles } from './styles';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';
import Images from '../../../constants/Images';

const LogoutButton = ({
  variant = 'icon', // 'icon', 'text', 'full'
  size = 'medium', // 'small', 'medium', 'large'
  showConfirmation = true,
  confirmationTitle = 'Đăng xuất',
  confirmationMessage = 'Bạn có chắc chắn muốn đăng xuất?',
  onLogoutSuccess,
  style,
  textStyle,
  disabled = false,
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (disabled || isLoading) return;

    if (showConfirmation) {
      Alert.alert(
        confirmationTitle,
        confirmationMessage,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Đăng xuất',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
        { cancelable: true }
      );
    } else {
      performLogout();
    }
  };

  const performLogout = async () => {
    try {
      setIsLoading(true);
      await dispatch(logoutUser());
      
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`${variant}Button`], styles[`${size}Button`]];
    if (disabled || isLoading) baseStyle.push(styles.disabledButton);
    if (style) baseStyle.push(style);
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${variant}Text`], styles[`${size}Text`]];
    if (disabled || isLoading) baseStyle.push(styles.disabledText);
    if (textStyle) baseStyle.push(textStyle);
    return baseStyle;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'icon' ? Colors.error : Colors.white} 
        />
      );
    }

    if (variant === 'icon') {
      return (
        <Image 
          source={Images.close} 
          style={[styles.iconImage, { tintColor: Colors.error }]} 
          resizeMode="contain"
        />
      );
    }

    return <Text style={getTextStyle()}>Đăng xuất</Text>;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleLogout}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default LogoutButton;
