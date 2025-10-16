import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { styles } from './styles';
import CustomText from '../../common/customTextRN';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';

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
    <TouchableOpacity style={styles.eventCard} onPress={() => onPress(event)}>
      <Image source={getEventImage()} style={styles.eventImage} />
      <View style={styles.eventInfo}>
        <CustomText variant="h3" style={styles.eventTitle}>
          {event.title}
        </CustomText>
        
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Image source={Images.calendar} style={styles.detailIcon} />
            <CustomText variant="caption" color="secondary">
              {event.date}
            </CustomText>
          </View>
          
          <View style={styles.eventDetailRow}>
            <Image source={Images.clock} style={styles.detailIcon} />
            <CustomText variant="caption" color="secondary">
              {event.time}
            </CustomText>
          </View>
          
          <View style={styles.eventDetailRow}>
            <Image source={Images.location} style={styles.detailIcon} />
            <CustomText variant="caption" color="secondary">
              {event.location}
            </CustomText>
          </View>
        </View>
        
        <View style={styles.eventFooter}>
          <View style={styles.ratingContainer}>
            <Image source={Images.star} style={styles.starIcon} />
            <CustomText variant="caption" color="primary">
              {event.rating}
            </CustomText>
            <CustomText variant="caption" color="light">
              ({event.attendees} attendees)
            </CustomText>
          </View>
          
          <View style={styles.priceContainer}>
            <CustomText variant="button" color="white">
              {event.price}
            </CustomText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EventCard;
