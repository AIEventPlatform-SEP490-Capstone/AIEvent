import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  
  // Image section
  imageContainer: {
    position: 'relative',
    height: height * 0.4,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.white,
  },
  
  // Content
  content: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    minHeight: height * 0.6,
  },
  
  // Title section
  titleSection: {
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  starIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.warning,
    marginRight: 8,
  },
  
  // Price badge
  priceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  
  // Details section
  detailsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
    fontFamily: Fonts.bold,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  detailIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.primary,
    marginRight: 15,
  },
  detailInfo: {
    flex: 1,
  },
  
  // Description section
  descriptionSection: {
    marginBottom: 30,
  },
  
  // Actions section
  actionsSection: {
    marginBottom: 20,
  },
  joinButton: {
    marginBottom: 15,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export { styles };