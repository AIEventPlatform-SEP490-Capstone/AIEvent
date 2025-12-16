import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { styles } from './styles';
import CustomText from '../../common/customTextRN';
import SaleStatusBadge from '../SaleStatusBadge';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';
import { addFavoriteEvent, removeFavoriteEvent, selectFavoriteEvents } from '../../../redux/slices/favoriteEventsSlice';

const EventCardWithFavorite = ({ event, onPress, isRecommended = false, isStaff = false }) => {
  const dispatch = useDispatch();
  const favoriteEvents = useSelector(selectFavoriteEvents);

  const eventId = event.eventId || event.EventId || event.id;
  const isInFavoriteList = favoriteEvents.some(
    fav => fav.eventId === eventId || fav.id === eventId
  );

  const [isFavorite, setIsFavorite] = useState(isInFavoriteList);

  useEffect(() => {
    setIsFavorite(isInFavoriteList);
  }, [isInFavoriteList]);

  const getEventImage = () => {
    if (event.image && typeof event.image === 'object' && event.image.uri) {
      return { uri: event.image.uri };
    }

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

    return Images.event1;
  };

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

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime) return 'Chưa xác định';

    const format = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const start = format(startTime);
    const end = format(endTime);

    if (start && end) {
      return `${start} - ${end}`;
    }
    return start || end || 'Chưa xác định';
  };

  const { day, month } = getDateInfo();

  const toggleFavorite = async () => {
    try {
      const eventId = event.eventId || event.EventId || event.id;

      if (!eventId) {
        throw new Error('Event ID is required');
      }

      if (typeof eventId !== 'string') {
        console.warn('Event ID is not a string:', eventId, typeof eventId);
      }

      const guidRegex = /^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$/;
      if (!guidRegex.test(eventId)) {
        console.warn(`Event ID '${eventId}' may not be in valid GUID format, but continuing anyway`);
      }

      setIsFavorite(!isFavorite);

      if (isFavorite) {
        await dispatch(removeFavoriteEvent(eventId)).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Event removed from favorites',
        });
      } else {
        await dispatch(addFavoriteEvent(eventId)).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Event added to favorites',
        });
      }
    } catch (err) {
      setIsFavorite(isFavorite);
      console.error('Error toggling favorite:', err);

      let errorMessage = 'Failed to update favorite status';
      if (err.message) {
        errorMessage = err.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });

      console.log('Favorite toggle error:', errorMessage);
    }
  };

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
      activeOpacity={0.9}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={getEventImage()} style={styles.eventImage} />

        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />

        {/* Top Row Badges */}
        <View style={styles.topBadgesRow}>
          {/* AI Recommendation Badge */}
          {isRecommended && (
            <View style={styles.aiRecommendationBadge}>
              <View style={styles.aiIconContainer}>
                <CustomText variant="caption" style={styles.aiIcon}>✨</CustomText>
              </View>
              <CustomText variant="caption" style={styles.aiRecommendationText}>
                Gợi ý cho bạn
              </CustomText>
            </View>
          )}

          {/* Sale Status Badge */}
          {event.saleStartTime && event.saleEndTime && event.startTime && event.endTime && (
            <View style={styles.saleStatusContainer}>
              <SaleStatusBadge
                saleStartTime={event.saleStartTime}
                saleEndTime={event.saleEndTime}
                startTime={event.startTime}
                endTime={event.endTime}
                onImage={true}
              />
            </View>
          )}
        </View>

        {/* Favorite Button */}
        {!isStaff && (
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
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Category Badge */}
        {event.category && (
          <View style={styles.categoryBadge}>
            <CustomText variant="caption" style={styles.categoryText}>
              {event.category}
            </CustomText>
          </View>
        )}

        {/* Title */}
        <CustomText variant="h3" style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </CustomText>

        {/* Description */}
        {event.description && (
          <CustomText variant="body" style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </CustomText>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Location */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconWrapper}>
              <Image source={Images.location} style={styles.detailIcon} />
            </View>
            <CustomText variant="caption" style={styles.detailText} numberOfLines={1}>
              {event.location || 'Chưa xác định'}
            </CustomText>
          </View>

          {/* Time Range - Bắt đầu & Kết thúc */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconWrapper}>
              <Image source={Images.clock} style={styles.detailIcon} />
            </View>
            <CustomText variant="caption" style={styles.detailText} numberOfLines={1}>
              {formatTimeRange(event.startTime || event.StartTime, event.endTime || event.EndTime)}
            </CustomText>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Image source={Images.star} style={styles.starIcon} />
            <CustomText variant="caption" style={styles.ratingText}>
              {event.rating}
            </CustomText>
            <CustomText variant="caption" style={styles.attendeesText}>
              · {event.attendees} người tham gia
            </CustomText>
          </View>

          {/* Price */}
          {!isStaff && (
            <View style={styles.priceTag}>
              <CustomText variant="button" style={styles.priceText}>
                {formatPrice(event.price)}
              </CustomText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EventCardWithFavorite;