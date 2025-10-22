import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: Fonts.xxl,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  notificationButton: {
    position: 'absolute',
    right: 20,
    padding: 8,
  },
  notificationIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.textPrimary,
  },

  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 0,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.textLight,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
  },


  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    paddingVertical: 20,
  },
  welcomeTitle: {
    fontSize: Fonts.title,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: Fonts.md,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Events section styles
  eventsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: Fonts.xl,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 15,
  },

  // Loading styles
  loadingContainer: {
    paddingVertical: 40,
  },
});

export { styles };