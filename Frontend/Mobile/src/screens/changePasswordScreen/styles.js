import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    textAlign: 'center',
    fontSize: 18,
    color: '#1E293B',
  },
  headerSubtitle: {
    fontFamily: Fonts.regular,
    textAlign: 'center',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  placeholder: {
    width: 49,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingTop: 20,
  },
  welcomeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  title: {
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 22,
    color: '#1E293B',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 15,
    color: '#64748B',
  },

  // Form
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: Fonts.semiBold,
    marginBottom: 10,
    fontSize: 15,
    color: '#374151',
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
  },
  input: {
    height: width < 375 ? 52 : 56,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingRight: 60,
    fontFamily: Fonts.regular,
    fontSize: width < 375 ? 15 : 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
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
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  requirementsTitle: {
    fontFamily: Fonts.semiBold,
    marginBottom: 16,
    color: '#0C4A6E',
    fontSize: 16,
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
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    height: width < 375 ? 52 : 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.7,
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