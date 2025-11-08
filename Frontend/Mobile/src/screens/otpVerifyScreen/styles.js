import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
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
  formContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 25,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
  },
  brandBadge: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 28,
    backgroundColor: Colors.primary,
    opacity: 0.08,
    top: -30,
    left: -25,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -5,
  },
  logo: {
    width: 200,
    height: 150,
    marginTop: 20,
    marginBottom: 20,
  },
  headerTitle: {
    color: Colors.textSecondary,
    fontSize: 28,
    fontFamily: Fonts.light,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'none',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  infoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  emailText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: (width - 120) / 6,
    height: 60,
    borderWidth: 2,
    borderColor: '#E8ECF0',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: Fonts.bold,
    letterSpacing: 1.2,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  resendText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  resendLink: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: Fonts.bold,
    textDecorationLine: 'underline',
  },
  countdownText: {
    color: Colors.textLight,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: Fonts.regular,
    textDecorationLine: 'underline',
  },
});

export { styles };
