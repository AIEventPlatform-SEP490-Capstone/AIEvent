import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: Fonts.lg,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  eventCategory: {
    fontSize: Fonts.xs,
    fontFamily: Fonts.medium,
    color: Colors.primary,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBadgeCalendar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconBadgeClock: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconBadgeLocation: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailIcon: {
    width: 16,
    height: 16,
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
    borderRadius: 16,
  },
});

export { styles };