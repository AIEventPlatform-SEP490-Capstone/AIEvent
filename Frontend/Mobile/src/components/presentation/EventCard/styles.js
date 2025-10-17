import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  eventInfo: {
    padding: 15,
  },
  eventTitle: {
    marginBottom: 10,
  },
  eventDetails: {
    marginBottom: 15,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.textSecondary,
    marginRight: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.warning,
    marginRight: 4,
  },
  priceContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
});

export { styles };
