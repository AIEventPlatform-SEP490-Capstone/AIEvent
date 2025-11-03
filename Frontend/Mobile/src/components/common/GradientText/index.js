import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-community/masked-view';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

const GradientText = ({ 
  children, 
  style, 
  variant = 'h2',
  colors = Colors.gradientHeaderTitle, // Xanh dương đậm -> nhạt -> đen xám
  ...props 
}) => {
  // Map variant to font sizes
  const getFontSize = () => {
    switch (variant) {
      case 'h1': return Fonts.xxl;
      case 'h2': return Fonts.xl;
      case 'h3': return Fonts.lg;
      case 'h4': return Fonts.md;
      case 'body': return Fonts.md;
      case 'caption': return Fonts.sm;
      default: return Fonts.xl;
    }
  };

  const getFontFamily = () => {
    switch (variant) {
      case 'h1':
      case 'h2':
      case 'h3':
        return Fonts.bold;
      case 'h4':
        return Fonts.semibold;
      default:
        return Fonts.regular;
    }
  };

  const textStyle = [
    styles.text,
    {
      fontSize: getFontSize(),
      fontFamily: getFontFamily(),
    },
    style,
  ];

  return (
    <MaskedView
      style={styles.maskedView}
      maskElement={
        <Text
          style={[textStyle, styles.maskText]}
          {...props}
        >
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text
          style={textStyle}
          {...props}
        >
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  maskedView: {
    flexDirection: 'row',
  },
  text: {
    backgroundColor: 'transparent',
  },
  maskText: {
    color: 'white',
  },
});

export default GradientText;

