import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollView: {
    flex: 1,
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  loadingText: {
    marginTop: 16,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },

  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },

  // Enhanced Profile Header - Mobile Optimized
  profileHeaderCard: {
    backgroundColor: Colors.primary,
    margin: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  profileHeaderContent: {
    padding: 16,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },

  avatarContainer: {
    marginBottom: 12,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.white,
  },

  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },

  avatarText: {
    fontFamily: Fonts.bold,
  },

  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },

  editButtonText: {
    fontFamily: Fonts.medium,
  },

  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },

  userName: {
    fontFamily: Fonts.bold,
    marginBottom: 6,
    textAlign: 'center',
  },

  userEmail: {
    fontFamily: Fonts.regular,
    marginBottom: 4,
    textAlign: 'center',
    opacity: 0.9,
  },

  userRole: {
    fontFamily: Fonts.medium,
    marginBottom: 4,
    textAlign: 'center',
  },

  userLocation: {
    fontFamily: Fonts.regular,
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.9,
  },

  userBio: {
    fontFamily: Fonts.regular,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Skills Section - Mobile Optimized
  skillsSection: {
    marginBottom: 20,
    alignItems: 'center',
  },

  skillsTitle: {
    fontFamily: Fonts.bold,
    marginBottom: 12,
    textAlign: 'center',
  },

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },

  // Stats Cards - Mobile Optimized
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 16,
    minWidth: 70,
    flex: 1,
    marginHorizontal: 4,
  },

  statNumber: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    marginBottom: 4,
  },

  statLabel: {
    fontFamily: Fonts.regular,
    textAlign: 'center',
    fontSize: 10,
  },

  // Tab Navigation - Mobile Optimized
  tabNavigation: {
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: 12,
    minWidth: 60,
  },

  activeTabButton: {
    backgroundColor: Colors.primary,
  },

  tabButtonText: {
    fontFamily: Fonts.medium,
  },

  activeTabButtonText: {
    fontFamily: Fonts.bold,
  },

  // Tab Content - Mobile Optimized
  tabContent: {
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  tabTitle: {
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },

  // Event Tickets
  ticketCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  ticketLeft: {
    backgroundColor: Colors.primary,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },

  ticketLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  ticketInfo: {
    alignItems: 'center',
  },

  ticketTitle: {
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },

  ticketRight: {
    flex: 1,
    padding: 16,
  },

  eventTitle: {
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },

  ticketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },

  ticketDetails: {
    marginTop: 8,
  },

  // Settings
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  settingsLeft: {
    flex: 1,
  },

  settingsButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },

  logoutButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },

  // Professional Settings Styles
  settingsHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  settingsTitle: {
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },

  settingsSubtitle: {
    fontFamily: Fonts.regular,
    opacity: 0.8,
  },

  settingsSection: {
    marginBottom: 32,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },

  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  logoutCard: {
    borderColor: 'rgba(255, 59, 48, 0.15)',
    shadowColor: '#FF3B30',
    shadowOpacity: 1,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  notificationIcon: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
  },

  privacyIcon: {
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
  },

  passwordIcon: {
    backgroundColor: 'rgba(241, 196, 15, 0.15)',
  },

  securityIcon: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },

  logoutIconContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },

  infoIcon: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
  },

  helpIcon: {
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 20,
  },

  settingDescription: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },

  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },

  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    fontSize: 18,
    fontWeight: '300',
  },

  versionBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  versionText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },

  // Modal Styles - Mobile Optimized
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  modalHeader: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalContent: {
    flex: 1,
  },

  sidebar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  sidebarTitle: {
    fontFamily: Fonts.bold,
    marginBottom: 4,
    textAlign: 'center',
  },

  sidebarSubtitle: {
    marginBottom: 8,
    textAlign: 'center',
  },

  sidebarItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 4,
    minWidth: 100,
    alignItems: 'center',
  },

  activeSidebarItem: {
    backgroundColor: Colors.primary,
  },

  contentArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  contentHeader: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  editSection: {
    padding: 16,
    backgroundColor: Colors.white,
    margin: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    backgroundColor: Colors.white,
    fontSize: 16,
  },

  disabledInput: {
    backgroundColor: Colors.background,
    color: Colors.textLight,
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  addSkillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  addSkillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: Fonts.regular,
    backgroundColor: Colors.white,
    marginRight: 8,
  },

  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  removeButton: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editRemoveButton: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edit Modal specific styles
  editSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },

  editSkillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },

  // Dropdown styles
  dropdown: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  dropdownItemWithBorder: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  selectedDropdownItem: {
    backgroundColor: Colors.primary,
  },

  modalFooter: {
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flex: 1,
    marginRight: 6,
    alignItems: 'center',
  },

  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },

  saveButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.7,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar Edit Styles
  avatarEditSection: {
    marginBottom: 24,
    alignItems: 'center',
  },

  avatarEditContainer: {
    alignItems: 'center',
    marginTop: 8,
  },

  avatarEditPreview: {
    marginBottom: 12,
  },

  avatarEditImage: {
    width: 130,
    height: 130,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },

  avatarEditPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },

  avatarEditButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  // Legacy styles for backward compatibility
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },

  avatar: {
    width: 130,
    height: 130,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.primary,
  },

  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },

  editIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.white,
  },

  userName: {
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },

  userEmail: {
    fontFamily: Fonts.regular,
  },

  // Actions Section
  actionsSection: {
    backgroundColor: Colors.white,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },

  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.primary,
    marginRight: 16,
  },

  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.textLight,
  },

  // Logout Section
  logoutSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },

  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
  },

  // App Info Section
  appInfoSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});

export { styles };
