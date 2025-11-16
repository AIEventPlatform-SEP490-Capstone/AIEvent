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
  
  // Header
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  headerRightPlaceholder: {
    width: 40,
    height: 40,
  },
  
  // Loading & Error
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
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Fonts.regular,
  },
  retryButton: {
    minWidth: 120,
  },
  
  // Profile Header
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
    position: 'relative',
  },
  
  // Profile Menu Button
  profileMenuButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  menuIcon: {
    fontSize: 24,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  
  // Avatar Section
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
  userName: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    marginBottom: 8,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  userLocation: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    marginBottom: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  userBio: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  
  // Content
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  
  // Info Content
  infoContent: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    flex: 1,
  },
  infoValue: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
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
  
  // Interests
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  interestTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  // Social Links
  socialLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  socialLink: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  // Events Content
  eventsContent: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginBottom: 8,
  },
  eventsGrid: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  eventInfo: {
    padding: 16,
  },
  eventName: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  eventDetailText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    flex: 1,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: Colors.textLight,
  },
  
  // Events List (New Design)
  eventsList: {
    gap: 12,
  },
  eventListItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  eventListImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
  },
  eventListImage: {
    width: '100%',
    height: '100%',
  },
  eventListImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
  },
  eventListInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventListName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginBottom: 8,
    color: Colors.textSecondary,
  },
  eventListDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventListIcon: {
    marginRight: 6,
    fontSize: 12,
  },
  eventListDetailText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    flex: 1,
    color: Colors.textLight,
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
});

export { styles };

