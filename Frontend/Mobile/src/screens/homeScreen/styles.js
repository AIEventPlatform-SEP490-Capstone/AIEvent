import { StyleSheet, Dimensions, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = width * 0.85;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },

  // ===== HEADER SECTION =====
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // ===== SEARCH SECTION =====
  searchWrapper: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#94A3B8',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: '#1E293B',
    padding: 0,
  },
  aiButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  aiButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  aiButtonDisabled: {
    opacity: 0.4,
  },
  aiButtonIcon: {
    width: 22,
    height: 22,
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },

  // ===== CATEGORY SECTION =====
  categorySection: {
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 7,
  },
  categoryChipSelected: {
    backgroundColor: '#F8FAFC',
    borderColor: '#64748B',
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#64748B',
    letterSpacing: 0.1,
  },
  categoryChipTextSelected: {
    color: '#1E293B',
    fontFamily: Fonts.semiBold,
  },

  // ===== CONTENT SECTION =====
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // ===== FEATURED SECTION =====
  featuredSection: {
    marginTop: 24,
    marginBottom: 28,
  },
  featuredList: {
    paddingLeft: 0,
    paddingRight: 10,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  featuredBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featuredContent: {
    gap: 10,
  },
  featuredTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    lineHeight: 23,
  },
  featuredInfo: {
    gap: 7,
  },
  featuredInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  featuredIcon: {
    width: 13,
    height: 13,
    tintColor: '#FFFFFF',
    marginRight: 6,
    resizeMode: 'contain',
  },
  featuredText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#FFFFFF',
  },

  // ===== SECTION COMMON =====
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    tintColor: '#64748B',
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: Fonts.bold,
    color: '#343b1eff',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#94A3B8',
  },

  // ===== EVENTS LIST =====
  eventsList: {
    gap: 14,
  },

  // ===== LOADING & EMPTY STATES =====
  loadingState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    tintColor: '#CBD5E1',
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: '#475569',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 21,
  },

  // ===== LEGACY SUPPORT =====
  latestEventsSection: {
    marginBottom: 32,
  },
  latestEventsList: {
    paddingHorizontal: 20,
    paddingRight: 8,
  },
  latestEventCard: {
    width: FEATURED_CARD_WIDTH,
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
  eventsListSection: {
    paddingHorizontal: 20,
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
  categoryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.medium,
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  featuredLocationBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255, 255, 255, 0.75)', // mờ hơn
    paddingHorizontal: 8,
    paddingVertical: 4, // giảm để icon không bị đụng
    borderRadius: 10,
    gap: 4,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  featuredDateBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featuredIcon: {
    width: 12,
    height: 12,
    tintColor: '#64748B',
    resizeMode: 'contain',
    opacity: 0.8, // mềm hơn
  },
  featuredBadgeText: {
    fontSize: 11, // nhỏ hơn
    fontFamily: Fonts.medium,
    color: '#334155',
    opacity: 0.9,
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

  // ===== LOAD MORE =====
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#94A3B8',
  },
});

export { styles };