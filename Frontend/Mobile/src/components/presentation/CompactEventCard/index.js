import React, { useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { styles } from './styles';
import CustomText from '../../common/customTextRN';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';

const CompactEventCard = ({ event, onPress, isRecommended = false }) => {
  const [isFavorite, setIsFavorite] = useState(event.isFavorite || false);

  const getEventImage = () => {
    // If event has an image URI, use it
    if (event.image && typeof event.image === 'object' && event.image.uri) {
      return { uri: event.image.uri };
    }
    
    // If event.image is a string identifier, use the image map
    if (typeof event.image === 'string') {
      const imageMap = {
        card1: Images.event1,
        card2: Images.event2,
        card3: Images.event3,
        card4: Images.event4,
        card5: Images.event5,
      };
      return imageMap[event.image] || Images.event1;
    }
    
    // Default fallback
    return Images.event1;
  };

  // Extract day and month from date
  const getDateInfo = () => {
    if (event.date) {
      const date = new Date(event.date);
      if (!isNaN(date.getTime())) {
        const day = date.getDate();
        const month = date.toLocaleString('vi-VN', { month: 'short' });
        return { day, month };
      }
    }
    return { day: '?', month: '?' };
  };

  const { day, month } = getDateInfo();

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, you would call an API to update the favorite status
  };

  // Format price display
  const formatPrice = (price) => {
    if (!price || price === 'Miễn phí') {
      return 'Miễn phí';
    }
    return price;
  };

  return (
    <TouchableOpacity 
      style={styles.eventCard} 
      onPress={() => onPress(event)}
      activeOpacity={0.85}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={getEventImage()} style={styles.eventImage} />
        
        {/* Date Badge
        <View style={styles.dateBadge}>
          <CustomText variant="caption" color="primary" style={styles.dateBadgeText}>
            {day}
          </CustomText>
          <CustomText variant="caption" color="secondary" style={styles.dateBadgeSubtext}>
            {month}
          </CustomText>
        </View> */}
        
        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={toggleFavorite}
          activeOpacity={0.7}
        >
          <Image 
            source={isFavorite ? Images.heartFilled : Images.heart} 
            style={[styles.favoriteIcon, isFavorite && { tintColor: Colors.error }]} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Information Section */}
      <View style={styles.eventInfo}>
        <View style={{ marginTop: 8 }}>
          <CustomText variant="h3" style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </CustomText>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
              <CustomText variant="caption" color="secondary" style={styles.eventDetailText} numberOfLines={1}>
                {event.date}
              </CustomText>
            </View>
          </View>
        </View>
        
        <View style={styles.eventFooter}>
          {/* AI Recommendation Badge */}
          {isRecommended && (
            <View style={styles.aiRecommendationBadge}>
              <Image source={Images.sparkles} style={styles.aiIcon} />
              <CustomText variant="caption" color="white" style={styles.aiRecommendationText}>
                GỢI Ý
              </CustomText>
            </View>
          )}
          
          <View style={styles.priceContainer}>
            <CustomText variant="button" color="white" style={styles.priceText}>
              {formatPrice(event.price)}
            </CustomText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CompactEventCard;