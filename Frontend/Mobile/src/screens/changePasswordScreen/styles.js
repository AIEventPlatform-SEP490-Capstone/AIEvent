import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 28,
    marginBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: Fonts.regular,
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 20,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  welcomeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
  },
  title: {
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 20,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
    color: '#6C757D',
  },

  // Form
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: Fonts.semibold,
    marginBottom: 10,
    fontSize: 15,
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
  },
  input: {
    height: width < 375 ? 52 : 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingRight: 56,
    fontFamily: Fonts.regular,
    fontSize: width < 375 ? 15 : 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  inputDefault: {
    borderColor: '#E5E7EB',
  },
  inputValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  inputInvalid: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: width < 375 ? -25 : -20 }],
    padding: 8,
  },
  eyeButtonDisabled: {
    opacity: 0.5,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: '#6B7280',
  },
  validationContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  validationText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },

  // Requirements
  requirementsContainer: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requirementsTitle: {
    fontFamily: Fonts.semibold,
    marginBottom: 16,
    color: '#1A1A1A',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requirementText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },

  // Submit Button
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: width < 375 ? 52 : 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Fonts.regular,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
});