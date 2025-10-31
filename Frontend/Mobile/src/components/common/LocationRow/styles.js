import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#34A853',
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 16,
  },
  
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: '#E8F5E9',
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  iconInnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34A853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  icon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  
  label: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.medium,
    color: '#757575',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  
  rightContainer: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  
  addressContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
  
  value: {
    fontSize: Fonts.md,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: '#1A1A2E',
    textAlign: 'right',
    letterSpacing: 0.2,
    lineHeight: 22,
    marginBottom: 6,
  },
  
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F8F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  
  hintIcon: {
    width: 12,
    height: 12,
    tintColor: '#34A853',
    marginRight: 6,
  },
  
  hintText: {
    fontSize: Fonts.xs,
    fontFamily: Fonts.medium,
    color: '#34A853',
    letterSpacing: 0.1,
  },
});

export { styles };

