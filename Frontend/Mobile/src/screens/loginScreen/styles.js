import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 30,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    marginHorizontal: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#87CEEB',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 15,
  },
  logo: {
    width: 120,
    height: 80,
    marginBottom: 15,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  showHideText: {
    color: '#4A90E2',
    fontSize: 14,
    fontFamily: Fonts.bold,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: '#7B8BA1',
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#A0AEC0',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: Fonts.medium,
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#87CEEB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#B0DFF6',
    opacity: 1,
  },
  loginButtonEnabled: {
    backgroundColor: '#2196F3',
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  linksRow: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  linkText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginHorizontal: 16,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  socialIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  socialIconOnly: {
    width: 24,
    height: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  registerText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  registerLink: {
    color: '#4A90E2',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
});

export { styles };