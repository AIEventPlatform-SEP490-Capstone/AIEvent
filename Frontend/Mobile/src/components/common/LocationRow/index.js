import React from 'react';
import { View, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import CustomText from '../customTextRN';
import Images from '../../../constants/Images';
import { styles } from './styles';

const LocationRow = ({
  address,
  label = 'Địa điểm:',
  onPress,
  style,
  labelStyle,
  valueStyle,
}) => {
  if (!address) return null;

  const handlePress = () => {
    if (onPress) {
      onPress(address);
      return;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
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
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <View style={styles.leftContainer}>
        <View style={styles.iconCircle}>
          <View style={styles.iconInnerCircle}>
            <Image source={Images.location} style={styles.icon} resizeMode="contain" />
          </View>
        </View>
        <View style={styles.labelContainer}>
          <CustomText variant="caption" color="secondary" style={[styles.label, labelStyle]}>
            {label}
          </CustomText>
        </View>
      </View>
      <View style={styles.rightContainer}>
        <View style={styles.addressContainer}>
          <CustomText variant="body" color="primary" numberOfLines={3} style={[styles.value, valueStyle]}>
            {address}
          </CustomText>
        </View>
        <View style={styles.hintContainer}>
          <Image source={Images.location} style={styles.hintIcon} resizeMode="contain" />
          <CustomText variant="caption" color="secondary" style={styles.hintText}>
            Nhấn để mở Google Maps
          </CustomText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LocationRow;

