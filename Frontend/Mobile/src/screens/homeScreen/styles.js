import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.medium,
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  categoryTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },

  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginBottom: 15,
    color: Colors.textPrimary,
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