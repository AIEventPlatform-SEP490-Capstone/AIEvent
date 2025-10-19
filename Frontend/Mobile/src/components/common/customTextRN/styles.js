import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.regular,
  },
  
  // Variants
  h1Text: {
    fontSize: Fonts.title,
    fontFamily: Fonts.bold,
    lineHeight: 40,
  },
  h2Text: {
    fontSize: Fonts.xxxl,
    fontFamily: Fonts.bold,
    lineHeight: 36,
  },
  h3Text: {
    fontSize: Fonts.xxl,
    fontFamily: Fonts.semiBold,
    lineHeight: 32,
  },
  bodyText: {
    fontSize: Fonts.md,
    lineHeight: 24,
  },
  captionText: {
    fontSize: Fonts.sm,
    lineHeight: 20,
  },
  buttonText: {
    fontSize: Fonts.md,
    fontFamily: Fonts.semiBold,
  },
  
  // Colors
  primaryText: {
    color: Colors.textPrimary,
  },
  secondaryText: {
    color: Colors.textSecondary,
  },
  lightText: {
    color: Colors.textLight,
  },
  whiteText: {
    color: Colors.white,
  },
  accentText: {
    color: Colors.primary,
  },
  
  // Alignment
  leftText: {
    textAlign: 'left',
  },
  centerText: {
    textAlign: 'center',
  },
  rightText: {
    textAlign: 'right',
  },
});

export { styles };
