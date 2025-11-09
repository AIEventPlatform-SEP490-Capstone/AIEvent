import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  // Header Gradient
  headerGradient: {
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
  headerTitle: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    opacity: 0.9,
    lineHeight: 20,
  },
  settingsSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
  },
  logoutCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE5E5',
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  settingIcon: {
    fontSize: 28,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  logoutIcon: {
    fontSize: 28,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    marginBottom: 4,
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  settingDescription: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#6C757D',
  },
  toggleSwitch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  chevron: {
    fontSize: 24,
    color: '#ADB5BD',
    fontWeight: '300',
    marginLeft: 8,
  },
  versionBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  versionText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export { styles };

