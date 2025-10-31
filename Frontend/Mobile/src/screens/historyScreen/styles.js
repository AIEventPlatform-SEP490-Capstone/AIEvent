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
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    marginBottom: 8,
    color: '#1A1A1A',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#6C757D',
  },
  content: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  emptyStateDescription: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    color: '#6C757D',
  },
});

export { styles };

