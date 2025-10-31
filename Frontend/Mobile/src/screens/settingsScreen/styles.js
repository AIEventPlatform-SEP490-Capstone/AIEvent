import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  settingsSection: {
    marginBottom: 32,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityIconContainer: {
    backgroundColor: '#FF6B35',
  },
  appIconContainer: {
    backgroundColor: '#8E44AD',
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: '#1A1A1A',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 18,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  logoutCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEE2E2',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRight: {
    alignItems: 'flex-end',
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notificationIcon: {
    backgroundColor: '#E3F2FD',
  },
  privacyIcon: {
    backgroundColor: '#F3E5F5',
  },
  passwordIcon: {
    backgroundColor: '#FFF9C4',
  },
  securityIcon: {
    backgroundColor: '#E8F5E9',
  },
  logoutIconContainer: {
    backgroundColor: '#FFEBEE',
  },
  infoIcon: {
    backgroundColor: '#E3F2FD',
  },
  helpIcon: {
    backgroundColor: '#F3E5F5',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    marginBottom: 4,
    color: '#1A1A1A',
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
    backgroundColor: '#DEE2E6',
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
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 20,
    color: '#ADB5BD',
    fontWeight: '300',
  },
  versionBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: '#2E7D32',
  },
});

export { styles };

