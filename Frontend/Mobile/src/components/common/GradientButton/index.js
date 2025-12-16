import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CustomText from '../customTextRN';

const GradientButton = ({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false,
  style,
  gradientStyle,
  textStyle,
  colors,
  children 
}) => {
  const defaultColors = ['#2196F3', '#1976D2', '#1565C0'];
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={style}
    >
      <LinearGradient
        colors={colors || defaultColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          disabled && styles.disabled,
          gradientStyle
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : children ? (
          children
        ) : (
          <CustomText variant="body" color="white" style={[styles.text, textStyle]}>
            {title}
          </CustomText>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 16,
    lineHeight: 20,
  },
});

export default GradientButton;

