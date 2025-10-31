import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { styles } from './styles';
import CustomText from '../../common/customTextRN';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

const EventCard = ({ event, onPress }) => {
  const getEventImage = () => {
    const imageMap = {
      card1: Images.event1,
      card2: Images.event2,
      card3: Images.event3,
      card4: Images.event4,
      card5: Images.event5,
    };
    return imageMap[event.image] || Images.event1;
  };

  return (
    <TouchableOpacity 
      style={styles.eventCard} 
      onPress={() => onPress(event)}
      activeOpacity={0.85}
    >
      <Image source={getEventImage()} style={styles.eventImage} />
      <View style={styles.eventInfo}>
        <CustomText variant="h3" style={styles.eventTitle}>
          {event.title}
        </CustomText>
        
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <View style={styles.iconBadgeCalendar}>
              <Image source={Images.calendar} style={[styles.detailIcon, { tintColor: '#4CAF50' }]} />
            </View>
            <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.sm, fontFamily: Fonts.medium }}>
              {event.date}
            </CustomText>
          </View>
          
          <View style={styles.eventDetailRow}>
            <View style={styles.iconBadgeClock}>
              <Image source={Images.clock} style={[styles.detailIcon, { tintColor: '#FF9800' }]} />
            </View>
            <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.sm, fontFamily: Fonts.medium }}>
              {event.time}
            </CustomText>
          </View>
          
          <View style={styles.eventDetailRow}>
            <View style={styles.iconBadgeLocation}>
              <Image source={Images.location} style={[styles.detailIcon, { tintColor: '#9C27B0' }]} />
            </View>
            <CustomText variant="caption" color="secondary" numberOfLines={1} style={{ fontSize: Fonts.sm, fontFamily: Fonts.medium, flex: 1 }}>
              {event.location}
            </CustomText>
          </View>
        </View>
        
        <View style={styles.eventFooter}>
          <View style={styles.ratingContainer}>
            <Image source={Images.star} style={styles.starIcon} />
            <CustomText variant="caption" color="primary" style={{ fontSize: Fonts.sm, fontWeight: '700', marginRight: 4 }}>
              {event.rating}
            </CustomText>
            <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.xs }}>
              ({event.attendees})
            </CustomText>
          </View>
          
          <View style={styles.priceContainer}>
            <CustomText variant="button" color="white" style={{ fontSize: Fonts.md, fontWeight: '700', fontFamily: Fonts.bold }}>
              {event.price}
            </CustomText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EventCard;
