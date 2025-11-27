import React, { useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { styles } from '../EventCard/styles';
import CustomText from '../../common/customTextRN';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';
import Fonts from '../../../constants/Fonts';
import { addFavoriteEvent, removeFavoriteEvent } from '../../../redux/slices/favoriteEventsSlice';

const EventCardWithFavorite = ({ event, onPress, isRecommended = false }) => {
  const dispatch = useDispatch();
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

  const toggleFavorite = async () => {
    try {
      // Get the event ID
      const eventId = event.eventId || event.EventId || event.id;
      
      // Log detailed event information for debugging
      console.log('Event object details:', {
        event: event,
        eventId: eventId,
        eventIdType: typeof eventId,
        hasEventId: !!eventId,
        eventIdLength: eventId ? eventId.length : 0
      });
      
      // Validate eventId before making the request
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      // Additional validation for debugging
      if (typeof eventId !== 'string') {
        console.warn('Event ID is not a string:', eventId, typeof eventId);
      }
      
      // Validate that eventId is a valid GUID format (more lenient)
      // Allow both uppercase and lowercase, with or without braces
      const guidRegex = /^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$/;
      if (!guidRegex.test(eventId)) {
        console.warn(`Event ID '${eventId}' may not be in valid GUID format, but continuing anyway`);
        // Don't throw error, just log warning as some events might have different formats
      }
      
      // Update UI immediately for better UX
      setIsFavorite(!isFavorite);
      
      // Call API to update server
      if (isFavorite) {
        // Remove from favorites
        await dispatch(removeFavoriteEvent(eventId)).unwrap();
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Event removed from favorites',
        });
      } else {
        // Add to favorites
        await dispatch(addFavoriteEvent(eventId)).unwrap();
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Event added to favorites',
        });
      }
    } catch (err) {
      // Revert UI change if API call fails
      setIsFavorite(isFavorite);
      console.error('Error toggling favorite:', err);
      
      // Show a more user-friendly error message
      let errorMessage = 'Failed to update favorite status';
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Show toast notification
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      
      console.log('Favorite toggle error:', errorMessage);
    }
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
      {/* Image Section with Overlay */}
      <View style={styles.imageContainer}>
        <Image source={getEventImage()} style={styles.eventImage} />
        
        {/* AI Recommendation Badge */}
        {isRecommended && (
          <View style={styles.aiRecommendationBadge}>
            <CustomText variant="caption" color="white" style={styles.aiRecommendationText}>
              GỢI Ý
            </CustomText>
          </View>
        )}
        
        {/* Category Badge on Image */}
        {event.category && (
          <View style={styles.categoryBadgeOnImage}>
            <CustomText variant="caption" color="white" style={styles.categoryTextOnImage}>
              {event.category}
            </CustomText>
          </View>
        )}
        
        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={toggleFavorite}
          activeOpacity={0.7}
        >
          <Image 
            source={isFavorite ? Images.heart : Images.heartOutline} 
            style={[styles.favoriteIcon, isFavorite && { tintColor: Colors.error }]} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Information Section */}
      <View style={styles.eventInfo}>
        <View style={styles.titleRow}>
          <CustomText variant="h3" style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </CustomText>
        </View>
        
        {/* Event Description */}
        {event.description && (
          <CustomText variant="body" color="secondary" style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </CustomText>
        )}
        
        {/* Event Details Grid */}
        <View style={styles.eventDetailsGrid}>
          <View style={styles.eventDetailItem}>
            <View style={styles.iconBadgeCalendar}>
              <Image source={Images.calendar} style={[styles.detailIcon, { tintColor: '#4CAF50' }]} />
            </View>
            <View style={styles.detailTextContainer}>
              <CustomText variant="caption" color="secondary" style={styles.detailLabel}>
                Ngày
              </CustomText>
              <CustomText variant="caption" color="primary" style={styles.detailValue} numberOfLines={1}>
                {event.date}
              </CustomText>
            </View>
          </View>
          
          <View style={styles.eventDetailItem}>
            <View style={styles.iconBadgeClock}>
              <Image source={Images.clock} style={[styles.detailIcon, { tintColor: '#FF9800' }]} />
            </View>
            <View style={styles.detailTextContainer}>
              <CustomText variant="caption" color="secondary" style={styles.detailLabel}>
                Giờ
              </CustomText>
              <CustomText variant="caption" color="primary" style={styles.detailValue} numberOfLines={1}>
                {event.time}
              </CustomText>
            </View>
          </View>
          
          <View style={styles.eventDetailItem}>
            <View style={styles.iconBadgeLocation}>
              <Image source={Images.location} style={[styles.detailIcon, { tintColor: '#9C27B0' }]} />
            </View>
            <View style={styles.detailTextContainer}>
              <CustomText variant="caption" color="secondary" style={styles.detailLabel}>
                Địa điểm
              </CustomText>
              <CustomText variant="caption" color="primary" numberOfLines={1} style={styles.detailValue}>
                {event.location}
              </CustomText>
            </View>
          </View>
        </View>
        
        {/* Footer with Rating and Price */}
        <View style={styles.eventFooter}>
          <View style={styles.ratingContainer}>
            <Image source={Images.star} style={styles.starIcon} />
            <CustomText variant="caption" color="primary" style={styles.ratingText}>
              {event.rating}
            </CustomText>
            <CustomText variant="caption" color="secondary" style={styles.ratingCount}>
              ({event.attendees})
            </CustomText>
          </View>
          
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

export default EventCardWithFavorite;