import { StyleSheet, Dimensions, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  // Premium Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: Fonts.xxl,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  notificationButton: {
    position: 'absolute',
    right: 24,
    padding: 10,
    backgroundColor: '#F0F3F7',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationIcon: {
    width: 22,
    height: 22,
    tintColor: Colors.primary,
  },

  // Modern Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#F0F3F7',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.primary,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: Fonts.md,
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },

  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    paddingVertical: 24,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },

  // Events section styles
  eventsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Loading styles
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: Colors.textLight,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: Fonts.lg,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
});

export { styles };