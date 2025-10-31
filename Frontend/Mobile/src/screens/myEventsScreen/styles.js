import { StyleSheet, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // Premium Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },

  filterButton: {
    padding: 10,
    backgroundColor: '#F0F3F7',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  filterIcon: {
    width: 22,
    height: 22,
    tintColor: Colors.primary,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  eventsList: {
    paddingTop: 20,
  },

  // Premium Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
    backgroundColor: Colors.white,
    borderRadius: 28,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    tintColor: Colors.textLight,
    marginBottom: 24,
    opacity: 0.4,
  },

  emptyTitle: {
    marginBottom: 12,
    fontSize: Fonts.xxl,
    fontFamily: Fonts.bold,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  emptySubtitle: {
    marginBottom: 32,
    lineHeight: 24,
    fontSize: Fonts.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

export { styles };
