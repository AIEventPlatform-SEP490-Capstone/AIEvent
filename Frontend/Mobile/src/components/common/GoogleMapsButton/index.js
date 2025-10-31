import React from 'react';
import { TouchableOpacity, View, Image, Linking, Alert } from 'react-native';
import CustomText from '../customTextRN';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';
import { styles } from './styles';

const GoogleMapsButton = ({
  address,
  onPress,
  style,
  showIcon = true,
  textStyle,
}) => {
  const handleOpenGoogleMaps = () => {
    if (!address) {
      Alert.alert('Lỗi', 'Không có địa chỉ.');
      return;
    }

    if (onPress) {
      onPress(address);
      return;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      // Try Google Maps app first, fallback to web
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      
      Linking.openURL(googleMapsUrl).catch((err) => {
        console.error('Error opening Google Maps:', err);
        Alert.alert('Lỗi', 'Không thể mở Google Maps. Vui lòng thử lại.');
      });
    } catch (error) {
      console.error('Error creating Google Maps URL:', error);
      Alert.alert('Lỗi', 'Không thể mở Google Maps. Vui lòng thử lại.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleOpenGoogleMaps}
      activeOpacity={0.7}
    >
      {showIcon && (
        <View style={styles.iconContainer}>
          <Image source={Images.location} style={styles.icon} resizeMode="contain" />
        </View>
      )}
      <CustomText 
        variant="body" 
        color="primary" 
        numberOfLines={3} 
        style={[styles.text, textStyle]}
      >
        {address}
      </CustomText>
    </TouchableOpacity>
  );
};

export default GoogleMapsButton;

