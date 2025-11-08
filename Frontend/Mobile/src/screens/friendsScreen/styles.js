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
  header: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    marginBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  
  // Content
  content: {
    padding: 16,
  },
  
  // Search
  searchWrapper: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.textLight,
    marginRight: 10,
    resizeMode: 'contain',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchButton: {
    minWidth: 80,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginLeft: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  searchButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultCountTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  resultBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  resultBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  resultCount: {
    marginBottom: 12,
    fontFamily: Fonts.regular,
  },
  
  // Friend Card
  friendCard: {
    backgroundColor: Colors.white,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  friendCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  friendAvatarContainer: {
    marginRight: 12,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  friendAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  friendInfo: {
    flex: 1,
    marginRight: 12,
  },
  friendName: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    marginBottom: 5,
    color: Colors.textSecondary,
  },
  friendSubtext: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
  },
  friendActions: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  moreButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIcon: {
    fontSize: 24,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  
  // Request Card
  requestCard: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  requestCardGradient: {
    borderRadius: 20,
  },
  requestCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  requestAvatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  requestAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  requestAvatar: {
    width: '100%',
    height: '100%',
  },
  requestAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestAvatarText: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: Colors.white,
  },
  requestAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  requestAvatarBadgeText: {
    fontSize: 10,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestName: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    marginBottom: 6,
    color: Colors.textSecondary,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDate: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
  },
  requestActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 120,
    height: 40,
    marginBottom: 8,
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 16,
  },
  acceptButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  acceptButtonLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  rejectButton: {
    width: 120,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonDisabled: {
    opacity: 0.5,
  },
  rejectButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  
  // Loading & Error
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: Fonts.regular,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Fonts.regular,
  },
  retryButton: {
    minWidth: 120,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
  },
  emptyStateIcon: {
    fontSize: 64,
    lineHeight: 80,
    textAlign: 'center',
    includeFontPadding: false,
    height: 80,
  },
  emptyStateTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    color: Colors.textLight,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 200,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.white,
  },
  
  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 16,
  },
  paginationText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  
  // Action Menu Modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});

export { styles };
