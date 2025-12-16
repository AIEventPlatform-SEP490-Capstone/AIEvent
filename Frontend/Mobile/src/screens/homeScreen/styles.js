import { StyleSheet, Dimensions, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Modern Header with glassmorphism effect
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notificationIcon: {
    width: 22,
    height: 22,
    tintColor: Colors.white,
  },

  // Modern Search Bar with floating effect
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.08)',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.primary,
    marginRight: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    paddingVertical: 16,
  },
  aiIconButton: {
    padding: 10,
    marginLeft: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    borderRadius: 12,
  },
  aiIcon: {
    width: 28,
    height: 28,
  },
  aiIconActive: {
    opacity: 1,
  },
  aiIconDisabled: {
    opacity: 0.4,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.medium,
  },

  // Modern Category Section with pill design
  categorySection: {
    marginBottom: 24,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  categoryButton: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  categoryButtonSelected: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  categoryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    width: 26,
    height: 26,
  },
  categoryButtonText: {
    fontSize: Fonts.xs,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  categoryButtonTextSelected: {
    color: Colors.white,
  },

  // Content Area
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // Modern Latest Events Section
  latestEventsSection: {
    marginBottom: 32,
  },
  aiEventsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
    backgroundColor: 'rgba(33, 150, 243, 0.04)',
    paddingVertical: 20,
    marginHorizontal: 0,
    borderRadius: 0,
  },
  aiSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSectionIcon: {
    width: 26,
    height: 26,
    marginRight: 10,
  },
  eventsListSection: {
    paddingHorizontal: 20,
  },

  // Modern Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  viewAllText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },

  // Modern Latest Event Cards with glassmorphism
  latestEventsList: {
    paddingHorizontal: 20,
    paddingRight: 8,
  },
  latestEventCard: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  latestEventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  latestEventGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
  },
  latestEventContent: {
    padding: 20,
  },
  latestEventTitle: {
    fontSize: Fonts.xl,
    fontFamily: Fonts.bold,
    color: Colors.white,
    marginBottom: 14,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  latestEventInfo: {},
  latestEventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  latestEventIcon: {
    width: 14,
    height: 14,
    tintColor: Colors.white,
    marginRight: 8,
  },
  latestEventText: {
    fontSize: Fonts.xs,
    fontFamily: Fonts.medium,
    color: Colors.white,
    flex: 1,
  },

  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    tintColor: '#CBD5E1',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: Fonts.lg,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },

  // Featured Events Section
  featuredEventsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  // Greeting Section
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#1E293B',
    marginRight: 8,
  },
  userName: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },

  // Enhanced category chips
  categoryChipWebStyle: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryChipWebStyleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryTextWebStyle: {
    fontSize: Fonts.md,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
  categoryTextWebStyleSelected: {
    color: Colors.white,
    fontWeight: '600',
  },

  // Filter button
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginLeft: 12,
  },
  filterButtonText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.medium,
    color: '#64748B',
    marginLeft: 8,
  },
  filterIcon: {
    width: 18,
    height: 18,
    tintColor: '#64748B',
  },

  // Section header with divider
  sectionTitleWithDivider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#1E293B',
    marginRight: 14,
  },
  divider: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
  },
});

export { styles };
