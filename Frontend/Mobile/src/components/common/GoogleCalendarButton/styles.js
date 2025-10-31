import { StyleSheet } from 'react-native';
import Fonts from '../../../constants/Fonts';

const styles = StyleSheet.create({
  button: {
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E8EDF2',
    overflow: 'hidden',
    position: 'relative',
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  
  buttonText: {
    fontSize: Fonts.md,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
    fontWeight: '700',
    color: '#1A1A2E',
  },
});

export { styles };

