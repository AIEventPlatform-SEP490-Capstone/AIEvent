import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../constants/Colors';
import Fonts from '../constants/Fonts';

const { width, height } = Dimensions.get('window');

const GlobalStyle = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  headerTitle: {
    fontSize: Fonts.xxl,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  primaryButtonText: {
    color: Colors.white,
    fontSize: Fonts.md,
    fontFamily: Fonts.semiBold,
  },
  
  secondaryButton: {
    backgroundColor: Colors.white,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: Fonts.md,
    fontFamily: Fonts.semiBold,
  },
  
  // Input styles
  inputContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginVertical: 8,
  },
  
  input: {
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
  },
  
  inputLabel: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.semiBold,
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  
  // Card styles
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  
  // Text styles
  title: {
    fontSize: Fonts.title,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  
  subtitle: {
    fontSize: Fonts.xl,
    fontFamily: Fonts.semiBold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  
  bodyText: {
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  
  caption: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  
  loadingText: {
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  
  // Error styles
  errorContainer: {
    backgroundColor: Colors.error,
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  
  errorText: {
    color: Colors.white,
    fontSize: Fonts.sm,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  
  // Success styles
  successContainer: {
    backgroundColor: Colors.success,
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  
  successText: {
    color: Colors.white,
    fontSize: Fonts.sm,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  
  // Tab styles
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 5,
    paddingBottom: 5,
    height: 60,
  },
  
  tabLabel: {
    fontSize: Fonts.xs,
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: width * 0.9,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  
  listItemContent: {
    flex: 1,
    marginLeft: 10,
  },
  
  listItemTitle: {
    fontSize: Fonts.md,
    fontFamily: Fonts.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  
  listItemSubtitle: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
});

export default GlobalStyle;
