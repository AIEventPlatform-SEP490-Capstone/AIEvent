import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.textLight,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  aiIconButton: {
    padding: 8,
    marginLeft: 8,
  },
  aiIcon: {
    left: 10,
    width: 35,
    height: 35,
  },
  aiIconActive: {
    opacity: 1,
  },
  aiIconDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.medium,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  categoryButton: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 24,
    height: 24,
  },
  categoryButtonText: {
    fontSize: Fonts.xs,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  categoryButtonTextSelected: {
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  latestEventsSection: {
    marginBottom: 30,
  },
  aiEventsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  aiSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSectionIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  eventsListSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  latestEventsList: {
    paddingHorizontal: 20,
    paddingRight: 5,
  },
  latestEventCard: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    height: '60%',
    justifyContent: 'flex-end',
  },
  latestEventContent: {
    padding: 16,
  },
  latestEventTitle: {
    fontSize: Fonts.lg,
    fontFamily: Fonts.bold,
    color: Colors.white,
    marginBottom: 12,
    lineHeight: 24,
  },
  latestEventInfo: {
    // gap: 8, // Using marginBottom on children instead for compatibility
  },
  latestEventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestEventIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.white,
    marginRight: 8,
    opacity: 0.9,
  },
  latestEventText: {
    fontSize: Fonts.xs,
    fontFamily: Fonts.regular,
    color: Colors.white,
    opacity: 0.95,
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: Colors.textLight,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: Fonts.lg,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  // Featured Events Section
  featuredEventsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  // New modern UI elements
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginRight: 8,
  },
  userName: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },


  // Enhanced category chips based on web version
  categoryChipWebStyle: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipWebStyleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryTextWebStyle: {
    fontSize: Fonts.md,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 12,
  },
  filterButtonText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  filterIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.textSecondary,
  },
  // Section header with divider
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleWithDivider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginRight: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
});

export { styles };