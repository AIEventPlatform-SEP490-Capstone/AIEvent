import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  filterButton: {
    padding: 8,
  },

  filterIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.primary,
  },

  // Content
  content: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  eventsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: Colors.textLight,
    marginBottom: 24,
  },

  emptyTitle: {
    marginBottom: 12,
    fontFamily: Fonts.bold,
  },

  emptySubtitle: {
    marginBottom: 32,
    lineHeight: 22,
  },

  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});

export { styles };
