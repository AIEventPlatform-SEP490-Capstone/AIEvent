import { StyleSheet, Dimensions, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  
  // Premium Image section
  imageContainer: {
    position: 'relative',
    height: height * 0.45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.primary,
  },
  
  // Premium Content
  content: {
    padding: 24,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    minHeight: height * 0.65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  
  // Title section
  titleSection: {
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  starIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.warning,
    marginRight: 8,
  },
  
  // Premium Price badge
  priceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Premium Details section
  detailsSection: {
    marginBottom: 28,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 22,
    fontFamily: Fonts.bold,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  detailIcon: {
    width: 28,
    height: 28,
    tintColor: Colors.primary,
    marginRight: 16,
    marginTop: 2,
  },
  detailInfo: {
    flex: 1,
  },
  
  // Description section
  descriptionSection: {
    marginBottom: 32,
    backgroundColor: '#FAFBFC',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  
  // Premium Actions section
  actionsSection: {
    marginBottom: 24,
  },
  joinButton: {
    marginBottom: 16,
    borderRadius: 20,
    paddingVertical: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});

export { styles };