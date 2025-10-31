import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  eventImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  eventInfo: {
    padding: 20,
  },
  eventTitle: {
    marginBottom: 14,
    fontSize: Fonts.xl,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  eventDetails: {
    marginBottom: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F7',
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
  },
  detailIcon: {
    width: 16,
    height: 16,
  },
  iconBadgeCalendar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBadgeClock: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBadgeLocation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F7',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  starIcon: {
    width: 18,
    height: 18,
    tintColor: '#FF9800',
    marginRight: 6,
  },
  priceContainer: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export { styles };
