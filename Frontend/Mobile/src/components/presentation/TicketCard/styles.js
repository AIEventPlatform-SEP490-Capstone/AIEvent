import {StyleSheet} from 'react-native';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

export const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  /** Header gradient + image */
  ticketHeader: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eventImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  /** Ticket body */
  ticketBody: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  ticketType: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 6,
  },
  status: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    marginTop: 6,
  },

  /** Action buttons */
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 3,
  },
  actionText: {
    fontFamily: Fonts.regular,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.primary,
  },
});
