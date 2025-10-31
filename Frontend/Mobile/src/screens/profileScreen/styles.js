import { StyleSheet, Dimensions } from 'react-native';

import Colors from '../../constants/Colors';

import Fonts from '../../constants/Fonts';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#F8F9FA',

  },

  scrollView: {

    flex: 1,

  },

  // Loading and Error States

  loadingContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: '#F8F9FA',

  },

  loadingText: {

    marginTop: 16,

    fontSize: 16,

    color: '#6C757D',

    fontFamily: Fonts.regular,

  },

  errorContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: '#F8F9FA',

    paddingHorizontal: 24,

  },

  retryButton: {

    backgroundColor: Colors.primary,

    paddingHorizontal: 32,

    paddingVertical: 14,

    borderRadius: 12,

    marginTop: 16,

    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.3,

    shadowRadius: 8,

    elevation: 6,

  },

  // Modern Profile Header with Gradient

  profileHeaderCard: {

    marginHorizontal: 16,

    marginTop: 16,

    marginBottom: 20,

    borderRadius: 24,

    overflow: 'hidden',

    backgroundColor: '#FFFFFF',

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 8 },

    shadowOpacity: 0.12,

    shadowRadius: 16,

    elevation: 10,

  },

  profileHeaderGradient: {

    padding: 0,

    paddingTop: 40,

    paddingBottom: 24,

    backgroundColor: Colors.primary,

  },

  profileHeaderContent: {

    paddingHorizontal: 20,

    backgroundColor: Colors.primary,

    paddingTop: 40,

    paddingBottom: 24,

  },

  // Avatar Section with Modern Design

  avatarSection: {

    alignItems: 'center',

    marginBottom: 20,

    position: 'relative',

  },

  avatarContainer: {

    position: 'relative',

    marginBottom: 16,

  },

  avatar: {

    width: 120,

    height: 120,

    borderRadius: 60,

    borderWidth: 5,

    borderColor: '#FFFFFF',

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.2,

    shadowRadius: 8,

    elevation: 8,

  },

  avatarPlaceholder: {

    width: 120,

    height: 120,

    borderRadius: 60,

    backgroundColor: 'rgba(255, 255, 255, 0.25)',

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 5,

    borderColor: '#FFFFFF',

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.2,

    shadowRadius: 8,

    elevation: 8,

  },

  avatarText: {

    fontFamily: Fonts.bold,

    fontSize: 48,

    color: '#FFFFFF',

  },

  onlineIndicator: {

    position: 'absolute',

    bottom: 8,

    right: 8,

    width: 20,

    height: 20,

    borderRadius: 10,

    backgroundColor: '#10B981',

    borderWidth: 3,

    borderColor: '#FFFFFF',

  },

  editProfileButton: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(255, 255, 255, 0.25)',

    paddingHorizontal: 24,

    paddingVertical: 10,

    borderRadius: 24,

    borderWidth: 1.5,

    borderColor: 'rgba(255, 255, 255, 0.4)',

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 3,

  },

  editButtonIcon: {

    marginRight: 8,

    fontSize: 16,

  },

  editButtonText: {

    fontFamily: Fonts.semibold,

    fontSize: 14,

    letterSpacing: 0.3,

    color: '#FFFFFF',

  },

  // Profile Info with Better Typography

  profileInfo: {

    alignItems: 'center',

    marginBottom: 24,

  },

  userName: {

    fontFamily: Fonts.bold,

    fontSize: 28,

    marginBottom: 6,

    textAlign: 'center',

    letterSpacing: 0.3,

    color: '#FFFFFF',

  },

  userEmail: {

    fontFamily: Fonts.regular,

    fontSize: 14,

    marginBottom: 4,

    textAlign: 'center',

    opacity: 0.9,

    color: '#FFFFFF',

  },

  userRole: {

    fontFamily: Fonts.medium,

    fontSize: 15,

    marginBottom: 8,

    textAlign: 'center',

    color: '#FFFFFF',

    opacity: 0.95,

  },

  userLocation: {

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 12,

    paddingHorizontal: 16,

    paddingVertical: 6,

    backgroundColor: 'rgba(255, 255, 255, 0.15)',

    borderRadius: 16,

  },

  locationIcon: {

    marginRight: 6,

    fontSize: 14,

  },

  userBio: {

    fontFamily: Fonts.regular,

    fontSize: 14,

    opacity: 0.9,

    textAlign: 'center',

    lineHeight: 22,

    paddingHorizontal: 20,

    color: '#FFFFFF',

  },

  // Modern Skills Section

  skillsSection: {

    marginBottom: 24,

    paddingHorizontal: 4,

  },

  skillsTitle: {

    fontFamily: Fonts.bold,

    fontSize: 12,

    marginBottom: 12,

    textAlign: 'center',

    letterSpacing: 1.5,

    color: '#FFFFFF',

    opacity: 0.8,

  },

  skillsContainer: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'center',

    gap: 8,

  },

  skillTag: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(255, 255, 255, 0.2)',

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

    borderWidth: 1,

    borderColor: 'rgba(255, 255, 255, 0.3)',

  },

  skillTagText: {

    fontFamily: Fonts.medium,

    fontSize: 13,

    color: '#FFFFFF',

  },

  // Modern Stats Cards

  statsContainer: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    paddingHorizontal: 8,

    marginTop: 8,

  },

  statCard: {

    alignItems: 'center',

    backgroundColor: 'rgba(255, 255, 255, 0.2)',

    padding: 16,

    borderRadius: 20,

    flex: 1,

    marginHorizontal: 6,

    borderWidth: 1,

    borderColor: 'rgba(255, 255, 255, 0.25)',

  },

  statNumber: {

    fontFamily: Fonts.bold,

    fontSize: 28,

    marginBottom: 4,

    color: '#FFFFFF',

  },

  statLabel: {

    fontFamily: Fonts.medium,

    textAlign: 'center',

    fontSize: 11,

    color: '#FFFFFF',

    opacity: 0.85,

    letterSpacing: 0.5,

  },

  // Modern Tab Navigation

  tabNavigation: {

    backgroundColor: '#FFFFFF',

    marginHorizontal: 16,

    marginBottom: 16,

    borderRadius: 20,

    paddingVertical: 8,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.08,

    shadowRadius: 12,

    elevation: 6,

  },

  tabScrollContainer: {

    paddingHorizontal: 12,

  },

  tabButton: {

    paddingHorizontal: 20,

    paddingVertical: 12,

    marginHorizontal: 6,

    borderRadius: 16,

    minWidth: 100,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: 'transparent',

  },

  activeTabButton: {

    backgroundColor: Colors.primary,

    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.3,

    shadowRadius: 8,

    elevation: 5,

  },

  tabButtonContent: {

    alignItems: 'center',

    justifyContent: 'center',

  },

  tabIconContainer: {

    width: 44,

    height: 44,

    borderRadius: 22,

    backgroundColor: 'rgba(0, 123, 255, 0.08)',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 8,

  },

  activeTabIconContainer: {

    backgroundColor: 'rgba(255, 255, 255, 0.25)',

    transform: [{ scale: 1.05 }],

  },

  tabIcon: {

    fontSize: 22,

  },

  tabButtonText: {

    fontFamily: Fonts.medium,

    fontSize: 13,

    textAlign: 'center',

    color: '#6C757D',

    letterSpacing: 0.2,

  },

  activeTabButtonText: {

    fontFamily: Fonts.bold,

    fontSize: 13,

    color: '#FFFFFF',

    letterSpacing: 0.3,

  },

  // Modern Tab Content

  tabContent: {

    backgroundColor: '#FFFFFF',

    marginHorizontal: 16,

    marginBottom: 16,

    borderRadius: 20,

    padding: 20,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.08,

    shadowRadius: 12,

    elevation: 6,

  },

  tabHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 20,

    paddingBottom: 16,

    borderBottomWidth: 1,

    borderBottomColor: '#F0F0F0',

  },

  tabHeaderLeft: {

    flexDirection: 'row',

    alignItems: 'center',

    flex: 1,

  },

  tabHeaderIconContainer: {

    width: 56,

    height: 56,

    borderRadius: 28,

    backgroundColor: Colors.primary,

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: 16,

    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.25,

    shadowRadius: 8,

    elevation: 6,

  },

  likesIconContainer: {

    backgroundColor: '#E91E63',

  },

  friendsIconContainer: {

    backgroundColor: '#4CAF50',

  },

  historyIconContainer: {

    backgroundColor: '#FF9800',

  },

  ticketCountBadge: {

    backgroundColor: Colors.primary,

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.25,

    shadowRadius: 4,

    elevation: 3,

  },

  ticketCountText: {

    fontFamily: Fonts.bold,

    fontSize: 13,

    color: '#FFFFFF',

  },

  likesCountBadge: {

    backgroundColor: '#E91E63',

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

  },

  likesCountText: {

    fontFamily: Fonts.bold,

    fontSize: 13,

    color: '#FFFFFF',

  },

  friendsCountBadge: {

    backgroundColor: '#4CAF50',

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

  },

  friendsCountText: {

    fontFamily: Fonts.bold,

    fontSize: 13,

    color: '#FFFFFF',

  },

  tabTitle: {

    fontFamily: Fonts.bold,

    fontSize: 20,

    color: '#1A1A1A',

  },

  tabSubtitle: {

    fontFamily: Fonts.regular,

    fontSize: 14,

    color: '#6C757D',

    marginTop: 4,

  },

  // Modern Event Tickets

  ticketCard: {

    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    marginBottom: 16,

    overflow: 'hidden',

    borderWidth: 1,

    borderColor: '#F0F0F0',

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.06,

    shadowRadius: 8,

    elevation: 4,

  },

  ticketHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: 16,

    backgroundColor: Colors.primary,

  },

  ticketLeft: {

    backgroundColor: Colors.primary,

    padding: 16,

    justifyContent: 'center',

    alignItems: 'center',

    minWidth: 120,

  },

  ticketLogo: {

    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: 'rgba(255, 255, 255, 0.25)',

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: 12,

  },

  ticketHeaderInfo: {

    flex: 1,

  },

  ticketInfo: {

    alignItems: 'center',

  },

  ticketTitle: {

    fontFamily: Fonts.bold,

    fontSize: 14,

    color: '#FFFFFF',

    marginBottom: 4,

  },

  ticketSubtitle: {

    fontFamily: Fonts.regular,

    fontSize: 12,

    color: '#FFFFFF',

    opacity: 0.85,

  },

  ticketRight: {

    flex: 1,

    padding: 16,

  },

  ticketBody: {

    padding: 16,

  },

  eventTitle: {

    fontFamily: Fonts.bold,

    fontSize: 16,

    color: '#1A1A1A',

    marginBottom: 12,

    lineHeight: 24,

  },

  ticketStatus: {

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 12,

    paddingVertical: 6,

    paddingHorizontal: 12,

    backgroundColor: '#E8F5E9',

    borderRadius: 12,

    alignSelf: 'flex-start',

  },

  statusDot: {

    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: '#4CAF50',

    marginRight: 8,

  },

  statusText: {

    fontFamily: Fonts.medium,

    fontSize: 12,

    color: '#2E7D32',

  },

  ticketDetails: {

    marginTop: 8,

  },

  ticketDetailRow: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    marginBottom: 10,

  },

  ticketDetailIcon: {

    fontSize: 16,

    marginRight: 10,

    marginTop: 2,

  },

  ticketDetailText: {

    fontFamily: Fonts.regular,

    fontSize: 14,

    color: '#495057',

    flex: 1,

    lineHeight: 20,

    marginLeft: 6,

  },

  ticketActions: {

    flexDirection: 'row',

    marginTop: 16,

    paddingTop: 16,

    borderTopWidth: 1,

    borderTopColor: '#F0F0F0',

    gap: 10,

  },

  ticketActionButton: {

    flex: 1,

    paddingVertical: 12,

    borderRadius: 12,

    borderWidth: 1.5,

    borderColor: Colors.primary,

    backgroundColor: 'transparent',

    alignItems: 'center',

  },

  ticketActionButtonText: {

    fontFamily: Fonts.semibold,

    fontSize: 14,

    color: Colors.primary,

  },

  ticketActionButtonPrimary: {

    backgroundColor: Colors.primary,

    borderColor: Colors.primary,

  },

  ticketActionButtonPrimaryText: {

    color: '#FFFFFF',

  },

  // Modern Empty State

  emptyState: {

    alignItems: 'center',

    paddingVertical: 60,

    paddingHorizontal: 24,

  },

  emptyStateIcon: {

    width: 100,

    height: 100,

    borderRadius: 50,

    backgroundColor: '#F8F9FA',

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 24,

  },

  emptyStateIconText: {

    fontSize: 48,

  },

  emptyStateTitle: {

    fontFamily: Fonts.bold,

    fontSize: 20,

    marginBottom: 12,

    textAlign: 'center',

    color: '#1A1A1A',

  },

  emptyStateDescription: {

    fontFamily: Fonts.regular,

    fontSize: 15,

    textAlign: 'center',

    lineHeight: 24,

    marginBottom: 32,

    color: '#6C757D',

  },

  emptyStateButton: {

    backgroundColor: Colors.primary,

    paddingHorizontal: 32,

    paddingVertical: 14,

    borderRadius: 24,

    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.3,

    shadowRadius: 8,

    elevation: 6,

  },

  emptyStateButtonText: {

    fontFamily: Fonts.semibold,

    fontSize: 15,

    color: '#FFFFFF',

    letterSpacing: 0.3,

  },

  // Lists

  likesList: {

    paddingVertical: 16,

  },

  friendsList: {

    paddingVertical: 16,

  },

  // Modern Settings Design

  settingsHeader: {

    marginBottom: 28,

    paddingBottom: 20,

    borderBottomWidth: 1,

    borderBottomColor: '#F0F0F0',

  },

  settingsTitle: {

    fontFamily: Fonts.bold,

    fontSize: 24,

    marginBottom: 6,

    color: '#1A1A1A',

  },

  settingsSubtitle: {

    fontFamily: Fonts.regular,

    fontSize: 14,

    color: '#6C757D',

  },

  settingsSection: {

    marginBottom: 32,

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

  // Modal Styles

  modalContainer: {

    flex: 1,

    backgroundColor: '#F8F9FA',

  },

  modalHeader: {

    padding: 20,

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 1,

    borderBottomColor: '#E9ECEF',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.05,

    shadowRadius: 4,

    elevation: 3,

  },

  modalHeaderTitle: {

    fontFamily: Fonts.bold,

    fontSize: 20,

    color: '#1A1A1A',

  },

  modalCloseButton: {

    width: 36,

    height: 36,

    borderRadius: 18,

    backgroundColor: '#F8F9FA',

    justifyContent: 'center',

    alignItems: 'center',

  },

  modalContent: {

    flex: 1,

  },

  sidebar: {

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 1,

    borderBottomColor: '#E9ECEF',

    paddingVertical: 12,

    paddingHorizontal: 8,

  },

  sidebarItem: {

    paddingVertical: 12,

    paddingHorizontal: 16,

    borderRadius: 12,

    marginHorizontal: 6,

    marginBottom: 4,

    minWidth: 120,

    alignItems: 'center',

    backgroundColor: 'transparent',

  },

  activeSidebarItem: {

    backgroundColor: Colors.primary,

    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.25,

    shadowRadius: 4,

    elevation: 3,

  },

  sidebarItemText: {

    fontFamily: Fonts.medium,

    fontSize: 13,

    color: '#6C757D',

  },

  activeSidebarItemText: {

    color: '#FFFFFF',

    fontFamily: Fonts.bold,

  },

  contentArea: {

    flex: 1,

    backgroundColor: '#F8F9FA',

  },

  contentHeader: {

    padding: 20,

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 1,

    borderBottomColor: '#E9ECEF',

  },

  contentHeaderTitle: {

    fontFamily: Fonts.bold,

    fontSize: 22,

    color: '#1A1A1A',

    marginBottom: 6,

  },

  contentHeaderSubtitle: {

    fontFamily: Fonts.regular,

    fontSize: 14,

    color: '#6C757D',

  },

  editSection: {

    padding: 20,

    backgroundColor: '#FFFFFF',

    margin: 16,

    borderRadius: 16,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.06,

    shadowRadius: 8,

    elevation: 4,

  },

  formGroup: {

    marginBottom: 20,

  },

  label: {

    fontFamily: Fonts.semibold,

    fontSize: 14,

    marginBottom: 10,

    color: '#1A1A1A',

  },

  input: {

    borderWidth: 1.5,

    borderColor: '#E9ECEF',

    borderRadius: 12,

    paddingHorizontal: 16,

    paddingVertical: 14,

    fontFamily: Fonts.regular,

    backgroundColor: '#FFFFFF',

    fontSize: 15,

    color: '#1A1A1A',

  },

  disabledInput: {

    backgroundColor: '#F8F9FA',

    color: '#ADB5BD',

  },

  textArea: {

    height: 120,

    textAlignVertical: 'top',

    paddingTop: 14,

  },

  pickerContainer: {

    borderWidth: 1.5,

    borderColor: '#E9ECEF',

    borderRadius: 12,

    paddingHorizontal: 16,

    paddingVertical: 14,

    backgroundColor: '#FFFFFF',

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

  },

  addSkillContainer: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 12,

  },

  addSkillInput: {

    flex: 1,

    borderWidth: 1.5,

    borderColor: '#E9ECEF',

    borderRadius: 12,

    paddingHorizontal: 16,

    paddingVertical: 12,

    fontFamily: Fonts.regular,

    backgroundColor: '#FFFFFF',

    marginRight: 10,

    fontSize: 14,

  },

  addButton: {

    backgroundColor: Colors.primary,

    paddingHorizontal: 20,

    paddingVertical: 12,

    borderRadius: 12,

    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.25,

    shadowRadius: 4,

    elevation: 3,

  },

  addButtonText: {

    fontFamily: Fonts.semibold,

    fontSize: 14,

    color: '#FFFFFF',

  },

  removeButton: {

    marginLeft: 8,

    paddingHorizontal: 8,

    paddingVertical: 4,

    backgroundColor: 'rgba(255, 255, 255, 0.3)',

    borderRadius: 12,

    minWidth: 24,

    alignItems: 'center',

    justifyContent: 'center',

  },

  editRemoveButton: {

    marginLeft: 8,

    paddingHorizontal: 8,

    paddingVertical: 4,

    backgroundColor: 'rgba(255, 255, 255, 0.3)',

    borderRadius: 12,

    minWidth: 24,

    alignItems: 'center',

    justifyContent: 'center',

  },

  editSkillsContainer: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    marginTop: 8,

    marginBottom: 8,

    gap: 8,

  },

  editSkillTag: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: Colors.primary,

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

  },

  editSkillTagText: {

    fontFamily: Fonts.medium,

    fontSize: 13,

    color: '#FFFFFF',

  },

  dropdown: {

    backgroundColor: '#FFFFFF',

    borderWidth: 1.5,

    borderColor: '#E9ECEF',

    borderRadius: 12,

    marginTop: 8,

    maxHeight: 250,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.1,

    shadowRadius: 8,

    elevation: 6,

  },

  dropdownItem: {

    paddingHorizontal: 16,

    paddingVertical: 12,

  },

  dropdownItemWithBorder: {

    paddingHorizontal: 16,

    paddingVertical: 12,

    borderBottomWidth: 1,

    borderBottomColor: '#F0F0F0',

  },

  selectedDropdownItem: {

    backgroundColor: Colors.primary,

  },

  modalFooter: {

    padding: 12,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,

    borderTopColor: '#E9ECEF',

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

    borderColor: '#E9ECEF',

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

    backgroundColor: Colors.textLight,

    opacity: 0.7,

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

    borderRadius: 65,

    borderWidth: 3,

    borderColor: Colors.primary,

  },

  avatarEditPlaceholder: {

    width: 130,

    height: 130,

    borderRadius: 65,

    backgroundColor: '#F8F9FA',

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

    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.25,

    shadowRadius: 4,

    elevation: 3,

  },

  // Legacy styles for backward compatibility

  profileHeader: {

    alignItems: 'center',

    paddingVertical: 32,

    paddingHorizontal: 24,

    backgroundColor: Colors.white,

    marginBottom: 16,

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

  // Settings items (for backward compatibility)

  settingsItem: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    paddingVertical: 12,

    borderBottomWidth: 1,

    borderBottomColor: Colors.borderLight,

  },

  settingsButton: {

    backgroundColor: Colors.primary,

    paddingHorizontal: 16,

    paddingVertical: 6,

    borderRadius: 16,

  },

  sidebarTitle: {

    fontFamily: Fonts.bold,

    marginBottom: 4,

    textAlign: 'center',

    color: '#1A1A1A',

  },

  sidebarSubtitle: {

    marginBottom: 8,

    textAlign: 'center',

    color: '#6C757D',

  },

  // Menu Grid Styles
  menuGridContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  menuItem: {
    width: '30%', // Approximately 1/3 of container width
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
    marginBottom: 16,
  },

  menuIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  menuIcon: {
    fontSize: 32,
  },

  menuLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textAlign: 'center',
    color: '#1A1A1A',
    marginTop: 4,
  },

});

export { styles };
