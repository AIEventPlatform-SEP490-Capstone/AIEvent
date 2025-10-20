import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

const styles = StyleSheet.create({
  // Base button styles
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },

  // Variant styles
  iconButton: {
    backgroundColor: 'transparent',
    padding: 8,
    minWidth: 40,
    minHeight: 40,
  },

  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  fullButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },

  // Size styles
  smallButton: {
    minWidth: 32,
    minHeight: 32,
    padding: 6,
  },

  mediumButton: {
    minWidth: 40,
    minHeight: 40,
    padding: 8,
  },

  largeButton: {
    minWidth: 48,
    minHeight: 48,
    padding: 12,
  },

  // Text styles
  buttonText: {
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },

  iconText: {
    fontSize: 18,
    color: Colors.error,
  },

  textText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },

  fullText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },

  // Size text styles
  smallText: {
    fontSize: 12,
  },

  mediumText: {
    fontSize: 14,
  },

  largeText: {
    fontSize: 16,
  },

  // Disabled styles
  disabledButton: {
    opacity: 0.5,
  },

  disabledText: {
    opacity: 0.7,
  },

  // Icon image styles
  iconImage: {
    width: 20,
    height: 20,
  },
});

export { styles };
